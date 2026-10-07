"""Contrato do simulador do guia da China.

O texto do guia não é contrato (o que é volátil está no CLAIMS.md, com data
de revisão). Aqui só fica a ligação entre a página e o script: as tarifas
vêm dos atributos data-* e todo cartão comparado tem linha e fórmula.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "guias" / "pagamentos-china"
CARDS = ("etherfi", "arq", "revolut", "wise", "nomad", "bank")


class CalculatorAttrs(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.attrs: dict[str, str] | None = None
        self.rows: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: v or "" for k, v in attrs}
        if "data-china-calculator" in a:
            self.attrs = a
        if "data-calc-row" in a:
            self.rows.add(a["data-calc-row"])


class ChinaGuideSimulatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = (GUIDE / "index.html").read_text(encoding="utf-8")
        cls.script = (GUIDE / "js" / "china-calculator.js").read_text(encoding="utf-8")
        parser = CalculatorAttrs()
        parser.feed(cls.html)
        cls.calc = parser.attrs
        cls.rows = parser.rows

    def test_maintenance_files_exist(self) -> None:
        for name in ("CLAIMS.md", "og-image.svg", "og-image.png"):
            with self.subTest(file=name):
                self.assertTrue((GUIDE / name).is_file())

    def test_rates_come_from_dated_numeric_data_attributes(self) -> None:
        self.assertIsNotNone(self.calc, "bloco do simulador ausente")
        self.assertRegex(self.calc.get("data-verified-at", ""), r"^\d{4}-\d{2}-\d{2}$")
        numeric = {k: v for k, v in self.calc.items() if k.startswith("data-") and not k.endswith(("perks", "verified-at"))}
        self.assertTrue(numeric)
        for name, value in numeric.items():
            if name == "data-china-calculator":
                continue
            with self.subTest(attr=name):
                for part in value.split(","):
                    self.assertRegex(part.strip(), r"^\d+(\.\d+)?$", "tarifa deve ser número")

    def test_every_compared_card_has_a_row_and_a_formula(self) -> None:
        self.assertEqual(set(CARDS), self.rows & set(CARDS))
        for key in CARDS:
            with self.subTest(card=key):
                self.assertRegex(self.script, rf"\b{key}\s*:")

    def test_script_is_loaded_and_offers_a_copyable_result(self) -> None:
        model_tag = '<script src="/guias/pagamentos-china/js/china-model.js"></script>'
        self.assertIn(model_tag, self.html)
        self.assertLess(self.html.index(model_tag), self.html.index('src="/guias/pagamentos-china/js/china-calculator.js"'))
        target = re.search(r'data-copy-result="#([\w-]+)"', self.html)
        self.assertIsNotNone(target)
        self.assertIn(f'id="{target.group(1)}"', self.html)



def br_money(value: float) -> str:
    text = f"{abs(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if value < 0 else "") + "R$ " + text


def br_pct(value: float) -> str:
    text = f"{abs(value):.2f}".replace(".", ",") + "%"
    return ("−" if value < -0.005 else "+") + text


@unittest.skipUnless(shutil.which("node"), "node indisponível")
class ChinaGuideNumbersTests(unittest.TestCase):
    """Os números escritos na página saem da mesma fórmula do simulador."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.html = (GUIDE / "index.html").read_text(encoding="utf-8")
        parser = CalculatorAttrs()
        parser.feed(cls.html)
        a = parser.attrs
        num = lambda name: float(a[f"data-{name}"])
        pair = lambda name: [float(v) for v in a[f"data-{name}"].split(",")]
        cls.P = {
            "iof": num("iof") / 100, "pix": num("etherfi-pix") / 100, "pixFlat": num("etherfi-pix-flat"),
            "tier1": num("etherfi-tier1"), "tier2": num("etherfi-tier2"),
            "rates": [v / 100 for v in pair("etherfi-rates")],
            "luxePoints": num("etherfi-luxe-points"), "luxeCaps": pair("etherfi-luxe-caps"), "luxeFxMax": num("etherfi-luxe-fx-max") / 100,
            "pinnaclePoints": num("etherfi-pinnacle-points"), "pinnacleCaps": pair("etherfi-pinnacle-caps"), "pinnacleFxMax": num("etherfi-pinnacle-fx-max") / 100,
            "arqFunding": num("arq-funding") / 100, "revolutQuota": num("revolut-quota"), "revolutFee": num("revolut-fee") / 100,
            "alipayFee": num("alipay-fee") / 100, "walletFree": num("wallet-free"),
        }
        value = lambda id_: float(re.search(rf'id="{id_}"[^>]*value="([^"]+)"', cls.html).group(1))
        cls.defaults = {
            "reservas": value("china-reservas"), "diario": value("china-diario"), "qrAlto": value("china-qr-alto"),
            "usdbrl": value("china-usdbrl"), "usdcny": value("china-usdcny"), "etherfiLevel": "core",
            "etherfiPrior": value("china-etherfi-prior"), "revolutUsed": value("china-revolut-used"),
            "etherfiFx": value("china-etherfi-fx") / 100, "arqFx": value("china-arq-fx") / 100,
            "wiseFee": value("china-wise-fee") / 100, "nomadConv": value("china-nomad-conv") / 100,
            "bankSpread": value("china-bank-spread") / 100,
        }

    def run_model(self, overrides: dict) -> dict:
        script = (
            "const m=require(process.argv[1]);const a=JSON.parse(process.argv[2]);"
            "process.stdout.write(JSON.stringify(m.cost(a.o,a.P)));"
        )
        payload = json.dumps({"o": {**self.defaults, **overrides}, "P": self.P})
        out = subprocess.run(["node", "-e", script, str(GUIDE / "js" / "china-model.js"), payload],
                             capture_output=True, text=True, check=True)
        return json.loads(out.stdout)

    def test_prefilled_simulator_matches_the_formula(self) -> None:
        result = self.run_model({})
        for key, card in result["cards"].items():
            with self.subTest(card=key):
                expected = f"{br_money(card['total'])} · {br_pct(card['pct'])}"
                row = re.search(rf'data-calc-row="{key}".*?data-calc-total>([^<]+)<', self.html, re.DOTALL)
                self.assertEqual(expected, row.group(1))
        self.assertIn(f"custam {br_money(result['base'])} no câmbio comercial", self.html)

    def test_cost_table_matches_the_formula(self) -> None:
        table = re.search(r'id="china-custo-titulo".*?</table>', self.html, re.DOTALL).group(0)
        cheap = self.run_model({"reservas": 1000, "diario": 0, "qrAlto": 0})
        walleted = self.run_model({"reservas": 0, "diario": 0, "qrAlto": 1000})
        for key in ("etherfi", "arq", "wise", "nomad", "bank"):
            with self.subTest(card=key):
                self.assertIn(br_pct(cheap["cards"][key]["pct"]), table)
                self.assertIn(br_pct(walleted["cards"][key]["pct"]), table)


if __name__ == "__main__":
    unittest.main()

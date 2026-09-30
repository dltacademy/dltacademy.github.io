"""Contrato do simulador do guia da China.

O texto do guia não é contrato (o que é volátil está no CLAIMS.md, com data
de revisão). Aqui só fica a ligação entre a página e o script: as tarifas
vêm dos atributos data-* e todo cartão comparado tem linha e fórmula.
"""
from __future__ import annotations

import re
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
        self.assertIn('src="/guias/pagamentos-china/js/china-calculator.js"', self.html)
        target = re.search(r'data-copy-result="#([\w-]+)"', self.html)
        self.assertIsNotNone(target)
        self.assertIn(f'id="{target.group(1)}"', self.html)


if __name__ == "__main__":
    unittest.main()

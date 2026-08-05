from __future__ import annotations

import json
import re
import unittest
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "arq-saques-exterior" / "index.html"
REGISTRY = ROOT / "js" / "content-registry.js"
SITEMAP = ROOT / "sitemap.xml"
ETHERFI_PAGE = ROOT / "guias" / "etherfi-cash-viagem" / "index.html"
CONTENT_ID = "article-arq-saques-exterior"
URL = "https://dlt.academy/blog/arq-saques-exterior/"
REFERRAL_URL = (
    "https://www.arqfinance.com/referrals/general?"
    "referralCode=tiagohyd_I6p&amp;pid=referral&amp;c=general&amp;is_retargeting=true"
)


class ArqAtmArticleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = PAGE.read_text(encoding="utf-8")
        cls.etherfi_html = ETHERFI_PAGE.read_text(encoding="utf-8")
        source = REGISTRY.read_text(encoding="utf-8")
        start = source.index("const CONTENT = ") + len("const CONTENT = ")
        end = source.rindex("];") + 1
        cls.registry = json.loads(source[start:end])

    def test_page_social_asset_and_maintenance_docs_exist(self) -> None:
        self.assertTrue(PAGE.is_file())
        self.assertTrue((PAGE.parent / "og-image.svg").is_file())
        self.assertTrue((PAGE.parent / "CLAIMS.md").is_file())
        self.assertTrue((PAGE.parent / "PUBLISHING.md").is_file())
        self.assertIn("/blog/arq-saques-exterior/og-image.svg", self.html)

    def test_metadata_dates_title_and_mount_match(self) -> None:
        self.assertIn(f'<link rel="canonical" href="{URL}">', self.html)
        self.assertIn(f'data-content-id="{CONTENT_ID}"', self.html)
        self.assertIn('"datePublished": "2026-07-29"', self.html)
        self.assertIn('"dateModified": "2026-08-05"', self.html)
        self.assertIn("Atualizado em 5 de agosto de 2026", self.html)
        self.assertIn("ARQ para saques no exterior", self.html)

    def test_current_fees_and_total_cost_are_explicit(self) -> None:
        required = (
            "ARQ Global: 0% de IOF",
            "aproximadamente 0,5%",
            "1% sobre o valor retirado",
            "3,5% de IOF",
            "a partir de 0,78%",
            "R$ 20 por operação",
            "1,4%",
            "<strong>1%</strong> para câmbio entre moedas estrangeiras no fim de semana",
            "<strong>0,5%</strong> sobre o volume acima de R$ 10.000",
            "2% ou R$ 6",
            "tarifa do operador do ATM",
            "Escolha a moeda local e recuse a conversão do caixa",
        )
        for text in required:
            with self.subTest(text=text):
                self.assertIn(text, self.html)

        self.assertNotIn("0,5% já incluindo IOF", self.html)
        self.assertNotIn("0,5% no total de IOF", self.html)

    def test_free_basic_scope_is_explicit(self) -> None:
        for marker in (
            "apenas as opções básicas gratuitas",
            "sem mensalidade, anuidade ou assinatura paga",
            "ARQ Standard Global",
            "Wise padrão gratuito",
            "Revolut Standard Brasil",
            "Nenhum plano pago entra nesta tabela",
            "Nenhum plano pago entra no cálculo",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)

    def test_calculator_includes_all_standard_components(self) -> None:
        required = (
            'data-arq-calculator',
            'id="arq-balance-source"',
            'id="arq-conversion-rate"',
            'id="arq-wise-iof-rate"',
            'id="arq-wise-conversion-rate"',
            'id="arq-revolut-iof-rate"',
            'id="arq-revolut-brl-fee-rate"',
            'id="arq-revolut-extra-fx-rate"',
            'id="arq-revolut-spread-rate"',
            'id="arq-atm-fee"',
            'id="arq-dcc-rate"',
            "Já tenho a moeda local do saque",
            "Tenho outra moeda estrangeira",
            "ATM e DCC são editáveis",
            "blog/js/arq-calculator.js",
        )
        for marker in required:
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)

        script = (PAGE.parent / ".." / "js" / "arq-calculator.js").resolve()
        source = script.read_text(encoding="utf-8")
        for marker in (
            "arqConversion",
            "wiseIof",
            "wiseConversion",
            "revolutIof",
            "revolutBrlFee",
            "revolutExtraFx",
            "revolutSpread",
            "atmTotal",
            "dccTotal",
            "revolutWithdrawalFee",
            "0.02",
        ):
            with self.subTest(script_marker=marker):
                self.assertIn(marker, source)

    def test_referral_is_dated_but_not_promised_indefinitely(self) -> None:
        self.assertEqual(self.html.count("<!-- PROMO_ATUAL -->"), 1)
        self.assertEqual(self.html.count("<!-- /PROMO_ATUAL -->"), 1)
        self.assertIn('data-verified-at="2026-07-29"', self.html)
        self.assertIn("Condição vista em 29/07/2026", self.html)
        self.assertIn("Confirme no link", self.html)
        self.assertNotIn("por tempo indeterminado", self.html.lower())
        match = re.search(rf'<a href="{re.escape(REFERRAL_URL)}"([^>]*)>', self.html)
        self.assertIsNotNone(match)
        attrs = match.group(1)
        self.assertIn('rel="sponsored nofollow noopener noreferrer"', attrs)

    def test_editorial_links_and_registry_connection(self) -> None:
        for href in (
            "/guias/etherfi-cash-viagem/",
            "/guias/bybit-pay-vietqr/",
            "/guias/abastecer-moreta-usdt/",
            "/guias/conta-binance/",
            "/pagamentos-no-exterior/",
        ):
            self.assertIn(f'href="{href}"', self.html)

        by_id = {item["id"]: item for item in self.registry}
        entry = by_id[CONTENT_ID]
        self.assertEqual(entry["url"], "/blog/arq-saques-exterior/")
        self.assertIn(CONTENT_ID, by_id["guide-pagamentos-no-exterior"]["related"])
        self.assertIn('/blog/arq-saques-exterior/', self.etherfi_html)

        root = ElementTree.parse(SITEMAP).getroot()
        urls = [
            node.text.strip()
            for node in root.iter()
            if node.tag.rsplit("}", 1)[-1] == "loc" and node.text
        ]
        self.assertEqual(urls.count(URL), 1)


if __name__ == "__main__":
    unittest.main()

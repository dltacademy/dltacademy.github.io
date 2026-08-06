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
WISE_REFERRAL_URL = "https://wise.com/invite/irhc/tiagon100"
REVOLUT_REFERRAL_URL = (
    "https://revolut.com/referral/?"
    "referral-code=tiago327k!AUG1-26-AR-BR-H3&amp;geo-redirect"
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
        self.assertIn("ARQ Global para saques", self.html)

    def test_current_fees_and_total_cost_are_explicit(self) -> None:
        required = (
            "ARQ Global: 0% de IOF",
            "aproximadamente 0,5%",
            "1% sobre o valor retirado",
            "ajuste cambial até a moeda do saque",
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
            "opções básicas gratuitas",
            "ARQ Standard Global",
            "Wise padrão gratuito",
            "Revolut Standard Brasil",
            "A tabela usa somente os cartões básicos gratuitos",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)

    def test_calculator_includes_the_brl_route_and_local_fx_adjustment(self) -> None:
        required = (
            'data-arq-calculator',
            'id="arq-conversion-rate"',
            'id="arq-local-fx-rate"',
            'id="arq-wise-iof-rate"',
            'id="arq-wise-conversion-rate"',
            'id="arq-revolut-iof-rate"',
            'id="arq-revolut-brl-fee-rate"',
            'id="arq-revolut-extra-fx-rate"',
            'id="arq-revolut-spread-rate"',
            'id="arq-atm-fee"',
            'id="arq-dcc-rate"',
            "BRL → saldo internacional → saque",
            "ATM e DCC são editáveis",
            "blog/js/arq-calculator.js",
        )
        for marker in required:
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)
        self.assertNotIn('id="arq-balance-source"', self.html)

        script = (PAGE.parent / ".." / "js" / "arq-calculator.js").resolve()
        source = script.read_text(encoding="utf-8")
        for marker in (
            "arqConversion",
            "arqLocalFx",
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

    def test_referral_is_dated_and_contextual_links_are_protected(self) -> None:
        self.assertEqual(self.html.count("<!-- PROMO_ATUAL -->"), 1)
        self.assertEqual(self.html.count("<!-- /PROMO_ATUAL -->"), 1)
        self.assertIn('data-verified-at="2026-07-29"', self.html)
        self.assertIn("Condição vista em 29/07/2026", self.html)
        self.assertIn("Criar conta no ARQ e conferir os US$ 10", self.html)
        self.assertIn("Criar conta na Revolut e conferir os planos", self.html)
        self.assertNotIn("por tempo indeterminado", self.html.lower())

        for url in (REFERRAL_URL, WISE_REFERRAL_URL, REVOLUT_REFERRAL_URL):
            match = re.search(rf'<a href="{re.escape(url)}"([^>]*)>', self.html)
            self.assertIsNotNone(match)
            self.assertIn('rel="sponsored nofollow noopener noreferrer"', match.group(1))

    def test_revolut_paid_plan_positioning_is_conditional_and_sourced(self) -> None:
        self.assertIn("segunda alternativa mais forte para saques", self.html)
        self.assertIn("pode virar a melhor para quem já paga um plano", self.html)
        self.assertIn("R$ 2.000 no Plus até R$ 14.000 no exterior no Ultra", self.html)
        self.assertIn("https://www.revolut.com/pt-BR/our-pricing-plans/", self.html)
        self.assertIn("Nenhum plano pago entra no cálculo", self.html)

    def test_editorial_links_and_registry_connection(self) -> None:
        for href in (
            "/guias/etherfi-cash-viagem/",
            "/guias/bybit-pay-vietqr/",
            "/guias/abastecer-moreta-usdt/",
        ):
            self.assertIn(f'href="{href}"', self.html)

        by_id = {item["id"]: item for item in self.registry}
        entry = by_id[CONTENT_ID]
        self.assertEqual(entry["title"], "ARQ Global para saques: custos reais contra Wise e Revolut")
        self.assertEqual(entry["effort"], "10 min de leitura")
        self.assertEqual(entry["url"], "/blog/arq-saques-exterior/")
        self.assertEqual(entry["primaryNext"], "guide-pagamentos-no-exterior")
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

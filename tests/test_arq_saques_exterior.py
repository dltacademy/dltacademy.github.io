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
        self.assertIn('<meta property="og:image:type" content="image/svg+xml">', self.html)

    def test_canonical_metadata_dates_and_mount_match(self) -> None:
        self.assertIn(f'<link rel="canonical" href="{URL}">', self.html)
        self.assertIn(f'<meta property="og:url" content="{URL}">', self.html)
        self.assertIn(f'data-content-id="{CONTENT_ID}"', self.html)
        self.assertIn('"mainEntityOfPage": "' + URL + '"', self.html)
        self.assertIn('"datePublished": "2026-07-29"', self.html)
        self.assertIn('"dateModified": "2026-07-29"', self.html)

    def test_current_fee_is_presented_without_an_unverified_history(self) -> None:
        required = (
            "A tarifa do saque no ARQ Standard é de 1%",
            "1% sobre o valor retirado",
            "Tarifa do dono do ATM",
            "não encontrei um teto oficial por número de saques",
            "Escolha a moeda local e recuse a conversão do caixa",
        )
        for text in required:
            with self.subTest(text=text):
                self.assertIn(text, self.html)
        self.assertNotIn("Minha referência inicial para o ARQ era", self.html)

    def test_personal_setup_and_revolut_backup_are_explicit(self) -> None:
        required = (
            "já foi meu cartão principal para praticamente tudo na América Latina",
            "ether.fi para pagar; ARQ para sacar.",
            "Dinheiro físico:</strong> ARQ",
            "Primeira retirada ou franquias:</strong> Wise e Revolut",
            "R$ 1.600 ou cinco saques por mês",
        )
        for text in required:
            with self.subTest(text=text):
                self.assertIn(text, self.html)

    def test_referral_offer_is_isolated_dated_and_protected(self) -> None:
        self.assertEqual(self.html.count("<!-- PROMO_ATUAL -->"), 1)
        self.assertEqual(self.html.count("<!-- /PROMO_ATUAL -->"), 1)
        self.assertIn('data-promotion="arq-referral"', self.html)
        self.assertIn('data-verified-at="2026-07-29"', self.html)
        self.assertIn("US$ 10 depois de fazer US$ 150", self.html)
        match = re.search(
            rf'<a href="{re.escape(REFERRAL_URL)}"([^>]*)>',
            self.html,
        )
        self.assertIsNotNone(match)
        attrs = match.group(1)
        self.assertIn('target="_blank"', attrs)
        self.assertIn('rel="sponsored nofollow noopener noreferrer"', attrs)
        self.assertIn('referrerpolicy="no-referrer"', attrs)

    def test_offer_follows_the_educational_content(self) -> None:
        self.assertLess(
            self.html.index("O custo real tem quatro partes"),
            self.html.index("A oferta de indicação"),
        )
        self.assertIn("Não gaste US$ 150 apenas para buscar US$ 10", self.html)

    def test_registry_sitemap_and_etherfi_connection(self) -> None:
        by_id = {item["id"]: item for item in self.registry}
        entry = by_id[CONTENT_ID]
        self.assertEqual(entry["url"], "/blog/arq-saques-exterior/")
        self.assertEqual(entry["primaryNext"], "guide-pagamentos-no-exterior")
        self.assertEqual(
            entry["related"],
            [
                "guide-bybit-pay-vietqr",
                "guide-abastecer-moreta-usdt",
                "guide-etherfi-cash-viagem",
            ],
        )
        self.assertIn(CONTENT_ID, by_id["guide-pagamentos-no-exterior"]["related"])
        self.assertIn(CONTENT_ID, by_id["guide-etherfi-cash-viagem"]["related"])
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

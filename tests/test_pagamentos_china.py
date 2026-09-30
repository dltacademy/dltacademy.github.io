from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "guias" / "pagamentos-china" / "index.html"
CLAIMS = ROOT / "guias" / "pagamentos-china" / "CLAIMS.md"
REGISTRY = ROOT / "js" / "content-registry.js"
SITEMAP = ROOT / "sitemap.xml"
CONTENT_ID = "guide-pagamentos-china"
URL = "https://dlt.academy/guias/pagamentos-china/"


class ChinaPaymentsGuideTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = PAGE.read_text(encoding="utf-8")
        source = REGISTRY.read_text(encoding="utf-8")
        start = source.index("const CONTENT = ") + len("const CONTENT = ")
        end = source.rindex("];") + 1
        cls.registry = {entry["id"]: entry for entry in json.loads(source[start:end])}

    def test_page_claims_and_social_assets_exist(self) -> None:
        self.assertTrue(PAGE.is_file())
        self.assertTrue(CLAIMS.is_file())
        self.assertTrue((PAGE.parent / "og-image.svg").is_file())
        png = PAGE.parent / "og-image.png"
        self.assertTrue(png.is_file())
        self.assertEqual(png.read_bytes()[16:24], (1200).to_bytes(4, "big") + (630).to_bytes(4, "big"))

    def test_canonical_metadata_and_mount_match(self) -> None:
        self.assertIn(f'<link rel="canonical" href="{URL}">', self.html)
        self.assertIn(f'<meta property="og:url" content="{URL}">', self.html)
        self.assertIn('"mainEntityOfPage": "' + URL + '"', self.html)
        self.assertIn(f'data-content-id="{CONTENT_ID}"', self.html)
        self.assertIn('data-guide-progress="pagamentos-china"', self.html)
        self.assertEqual(4, self.html.count("data-guide-check="))

    def test_registry_and_sitemap(self) -> None:
        entry = self.registry[CONTENT_ID]
        self.assertEqual(entry["type"], "guide")
        self.assertEqual(entry["url"], "/guias/pagamentos-china/")
        self.assertIn("viagem", entry["sit"])
        self.assertEqual(entry["primaryNext"], "guide-etherfi-cash-viagem")
        self.assertIn(URL, SITEMAP.read_text(encoding="utf-8"))

    def test_guide_anatomy(self) -> None:
        for marker in (
            "key-points", "piece-toc", "guide-step", "verificacao-final", "guide-final-check",
            "Quando dá errado", "plan-b", "verdict", "faq", "sources", "share-row",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)

    def test_core_rule_and_numbers_are_scoped(self) -> None:
        required = (
            "¥200",
            "3% sobre o valor inteiro",
            "¥7,71",
            "¥6,7128",
            "US$ 38,83",
            "US$ 24,79",
            "(pendente)",
            "7372",
            "0,5% + R$ 0,10",
            "ETHFI",
            "US$ 5.000",
            "US$ 50.000",
            "Consultadas em 30/09/2026",
        )
        for text in required:
            with self.subTest(text=text):
                self.assertIn(text, self.html)

    def test_no_sensitive_receipt_data(self) -> None:
        for leaked in ("0787", "4318", "c1145301", "e9ce1ece", "476c5927", "0x038e", "0xc423", "0x11dc", "02161686888"):
            with self.subTest(leaked=leaked):
                self.assertNotIn(leaked, self.html)

    def test_affiliate_flow_stays_in_the_etherfi_guide(self) -> None:
        self.assertNotIn("PROMO_ATUAL", self.html)
        self.assertNotIn("ether.fi/@", self.html)
        self.assertIn('/guias/etherfi-cash-viagem/#como-pedir', self.html)

    def test_single_primary_cta_in_hero(self) -> None:
        match = re.search(r'<section class="guide-hero piece-head">(.*?)</section>', self.html, re.DOTALL)
        self.assertIsNotNone(match)
        self.assertEqual(1, match.group(1).count("btn-primary"))

    def test_external_links_are_protected(self) -> None:
        for match in re.finditer(r'<a [^>]*href="https://(?!dlt\.academy|[a-z-]+\.dlt\.academy)[^"]+"[^>]*>', self.html):
            tag = match.group(0)
            with self.subTest(tag=tag[:80]):
                self.assertIn('rel="noopener noreferrer"', tag)
                self.assertIn('referrerpolicy="no-referrer"', tag)


if __name__ == "__main__":
    unittest.main()

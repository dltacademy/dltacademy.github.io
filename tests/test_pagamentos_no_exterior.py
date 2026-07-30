from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "pagamentos-no-exterior" / "index.html"
OG_IMAGE = ROOT / "pagamentos-no-exterior" / "og-image.svg"
REGISTRY = ROOT / "js" / "content-registry.js"


def load_registry() -> list[dict]:
    source = REGISTRY.read_text(encoding="utf-8")
    payload = source.split("const CONTENT = ", 1)[1].rsplit(";", 1)[0]
    return json.loads(payload)


class PagamentosNoExteriorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = PAGE.read_text(encoding="utf-8")
        cls.og_svg = OG_IMAGE.read_text(encoding="utf-8")
        cls.entries = load_registry()

    def test_page_has_canonical_social_metadata_and_json_ld(self) -> None:
        expected = "https://dlt.academy/pagamentos-no-exterior/"
        self.assertIn(f'<link rel="canonical" href="{expected}">', self.html)
        self.assertIn(f'<meta property="og:url" content="{expected}">', self.html)
        self.assertIn('property="og:image:width" content="1200"', self.html)
        self.assertIn('property="og:image:height" content="630"', self.html)
        match = re.search(
            r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(match)
        self.assertEqual(expected, json.loads(match.group(1))["url"])

    def test_social_image_matches_the_five_operational_layers(self) -> None:
        self.assertIn("CARTÃO", self.og_svg)
        self.assertIn("QR", self.og_svg)
        self.assertIn("SAQUE", self.og_svg)
        self.assertIn("BACKUP", self.og_svg)
        self.assertIn("FUNDING", self.og_svg)
        self.assertNotIn(">CASHBACK<", self.og_svg)

    def test_page_links_every_published_part_of_the_setup(self) -> None:
        for href in (
            "/guias/etherfi-cash-viagem/",
            "/guias/bybit-pay-vietqr/",
            "/blog/bybit-pay-vs-moreta-vietqr/",
            "/guias/abastecer-moreta-usdt/",
            "/guias/assinaturas-ia-bybit/",
            "/blog/topcashback-economia-viagem/",
            "/blog/arq-saques-exterior/",
        ):
            with self.subTest(href=href):
                self.assertIn(f'href="{href}"', self.html)

    def test_arq_article_replaces_the_old_future_slot(self) -> None:
        self.assertGreaterEqual(self.html.count('href="/blog/arq-saques-exterior/"'), 2)
        self.assertNotIn('data-future-guide="arq-bank-saques"', self.html)
        self.assertNotIn("Guia do ARQ Bank em preparação", self.html)
        self.assertNotIn("ARQ · guia chegando", self.html)

    def test_registry_routes_cluster_to_the_pillar(self) -> None:
        by_id = {entry["id"]: entry for entry in self.entries}
        pillar = by_id["guide-pagamentos-no-exterior"]
        self.assertEqual("/pagamentos-no-exterior/", pillar["url"])
        for entry_id in (
            "guide-bybit-pay-vietqr",
            "guide-etherfi-cash-viagem",
            "article-topcashback-economia-viagem",
            "article-arq-saques-exterior",
        ):
            with self.subTest(entry_id=entry_id):
                self.assertEqual(
                    "guide-pagamentos-no-exterior",
                    by_id[entry_id]["primaryNext"],
                )

    def test_page_ends_in_registry_driven_next_step(self) -> None:
        self.assertIn(
            'id="next-step-mount" data-content-id="guide-pagamentos-no-exterior"',
            self.html,
        )
        self.assertIn('<script src="/js/content-registry.js"></script>', self.html)
        self.assertIn('<script src="/js/next-step.js"></script>', self.html)


if __name__ == "__main__":
    unittest.main()

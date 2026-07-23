from __future__ import annotations

import json
import re
import unittest
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "guias" / "etherfi-cash-viagem" / "index.html"
REGISTRY = ROOT / "js" / "content-registry.js"
SITEMAP = ROOT / "sitemap.xml"
CONTENT_ID = "guide-etherfi-cash-viagem"
URL = "https://dlt.academy/guias/etherfi-cash-viagem/"


class EtherfiCashTravelGuideTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = PAGE.read_text(encoding="utf-8")
        source = REGISTRY.read_text(encoding="utf-8")
        start = source.index("const CONTENT = ") + len("const CONTENT = ")
        end = source.rindex("];") + 1
        cls.registry = json.loads(source[start:end])

    def test_page_and_social_assets_exist(self) -> None:
        self.assertTrue(PAGE.is_file())
        self.assertTrue((PAGE.parent / "og-image.svg").is_file())
        self.assertTrue((PAGE.parent / "og-image.png").is_file())
        self.assertIn('/guias/etherfi-cash-viagem/og-image.png', self.html)
        self.assertIn('<meta property="og:image:type" content="image/png">', self.html)

    def test_canonical_metadata_and_mount_match(self) -> None:
        self.assertIn(f'<link rel="canonical" href="{URL}">', self.html)
        self.assertIn(f'<meta property="og:url" content="{URL}">', self.html)
        self.assertIn(f'data-content-id="{CONTENT_ID}"', self.html)
        self.assertIn('"mainEntityOfPage": "' + URL + '"', self.html)

    def test_affiliate_link_is_disclosed_and_protected(self) -> None:
        match = re.search(r'<a class="btn btn-primary" href="https://www\.ether\.fi/@e155ee95"([^>]*)>', self.html)
        self.assertIsNotNone(match)
        attrs = match.group(1)
        self.assertIn('target="_blank"', attrs)
        self.assertIn('rel="sponsored nofollow noopener noreferrer"', attrs)
        self.assertIn('referrerpolicy="no-referrer"', attrs)
        self.assertIn("Transparência: este é um link de afiliado", self.html)

    def test_internal_next_step_precedes_affiliate_offer(self) -> None:
        internal_position = self.html.index("Continue pelo método que o comerciante aceita")
        affiliate_position = self.html.index("Se você ainda não tem ether.fi")
        self.assertLess(internal_position, affiliate_position)

    def test_protection_and_neutral_comparison_are_present(self) -> None:
        required = (
            "Direct Pay",
            "Borrow Mode",
            "não recomendamos Borrow Mode",
            "Wise",
            "Revolut",
            "Não abrir outra conta também é um resultado válido",
            "residência não é o país da viagem",
        )
        for text in required:
            with self.subTest(text=text):
                self.assertIn(text, self.html)

    def test_registry_entry_and_edge_limits(self) -> None:
        entry = next(item for item in self.registry if item["id"] == CONTENT_ID)
        self.assertEqual(entry["url"], "/guias/etherfi-cash-viagem/")
        self.assertLessEqual(len(entry.get("related", [])), 3)
        for item in self.registry:
            self.assertLessEqual(len(item.get("related", [])), 3, item["id"])

    def test_sitemap_contains_the_guide_once(self) -> None:
        root = ElementTree.parse(SITEMAP).getroot()
        urls = [node.text.strip() for node in root.iter() if node.tag.rsplit("}", 1)[-1] == "loc" and node.text]
        self.assertEqual(urls.count(URL), 1)


if __name__ == "__main__":
    unittest.main()

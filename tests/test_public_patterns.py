from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublicPatternTests(unittest.TestCase):
    def read(self, relative: str) -> str:
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_public_catalog_pages_are_real_and_registry_driven(self) -> None:
        for page, types in (
            ("ferramentas/index.html", "tool protocolo"),
            ("guias/index.html", "guide"),
        ):
            with self.subTest(page=page):
                html = self.read(page)
                self.assertIn(f'data-catalog-types="{types}"', html)
                self.assertIn('src="/js/content-registry.js"', html)
                self.assertIn('src="/js/catalog.js"', html)
                self.assertIn('href="/dlt-patterns.css"', html)

    def test_blog_index_uses_the_public_catalog_pattern(self) -> None:
        html = self.read("blog/index.html")
        script = self.read("blog/js/blog.js")
        self.assertIn("Decisões, custos e experiências reais", html)
        self.assertIn("data-filter-group", html)
        self.assertIn('card.className = "entry-card"', script)
        self.assertIn("entry.effort", script)

    def test_public_examples_load_the_component_library(self) -> None:
        pages = (
            "blog/arq-saques-exterior/index.html",
            "guias/bybit-pay-vietqr/index.html",
            "protocolos/medo-de-ficar-de-fora/index.html",
            "comunidade/index.html",
            "sobre/index.html",
            "transparencia/index.html",
        )
        for page in pages:
            with self.subTest(page=page):
                self.assertIn('href="/dlt-patterns.css"', self.read(page))

    def test_arq_is_the_live_article_model(self) -> None:
        html = self.read("blog/arq-saques-exterior/index.html")
        for marker in (
            'class="read-progress"',
            'class="piece-head"',
            'class="key-points"',
            'class="piece-toc"',
            'class="offer"',
            'class="faq"',
            'class="share-row"',
            'class="sources"',
            "Confirme no link",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, html)
        self.assertNotIn("Por tempo indeterminado", html)

    def test_qr_guide_has_persistent_four_step_checklist(self) -> None:
        html = self.read("guias/bybit-pay-vietqr/index.html")
        interactions = self.read("js/dlt-interactions.js")
        self.assertEqual(4, html.count("data-guide-check="))
        self.assertIn('data-guide-progress="bybit-pay-vietqr"', html)
        self.assertIn("initGuideProgress", interactions)
        self.assertIn("window.localStorage", interactions)

    def test_protocol_result_uses_standard_aliases_and_svg_og(self) -> None:
        html = self.read("protocolos/medo-de-ficar-de-fora/index.html")
        engine = self.read("js/protocol-engine.js")
        protocol = self.read("protocolos/medo-de-ficar-de-fora/js/protocol.js")
        self.assertIn("og-image.svg", html)
        for marker in ("flow-card", "flow-result", "answer-record", "result-actions", "cta-verdict"):
            with self.subTest(marker=marker):
                self.assertIn(marker, engine)
        for tone in ('tone: "bad"', 'tone: "mixed"', 'tone: "good"'):
            self.assertIn(tone, protocol)

    def test_community_and_institutional_models_are_public(self) -> None:
        community = self.read("comunidade/index.html")
        self.assertIn('class="channel-grid"', community)
        self.assertIn('class="scam-note"', community)
        for page in ("sobre/index.html", "transparencia/index.html"):
            html = self.read(page)
            self.assertIn('class="page-hero piece-head"', html)
            self.assertIn('class="key-points"', html)


if __name__ == "__main__":
    unittest.main()

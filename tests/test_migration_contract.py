from __future__ import annotations

import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

ARTICLES = {
    "article-bem-vindo": "blog/bem-vindo/index.html",
    "article-bybit-pay-vs-moreta-vietqr": "blog/bybit-pay-vs-moreta-vietqr/index.html",
    "article-topcashback-economia-viagem": "blog/topcashback-economia-viagem/index.html",
    "article-fomo-investimentos-depois-da-alta": "blog/fomo-investimentos-depois-da-alta/index.html",
    "article-arq-saques-exterior": "blog/arq-saques-exterior/index.html",
}

GUIDES = {
    "guide-pagamentos-no-exterior": "pagamentos-no-exterior/index.html",
    "guide-conta-binance": "guias/conta-binance/index.html",
    "guide-assinaturas-ia-bybit": "guias/assinaturas-ia-bybit/index.html",
    "guide-abastecer-moreta-usdt": "guias/abastecer-moreta-usdt/index.html",
    "guide-etherfi-cash-viagem": "guias/etherfi-cash-viagem/index.html",
    "guide-bybit-pay-vietqr": "guias/bybit-pay-vietqr/index.html",
}


class InlineScriptParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.executable_inline: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "script":
            return
        values = {name.lower(): value or "" for name, value in attrs}
        if not values.get("src") and values.get("type", "").lower() != "application/ld+json":
            self.executable_inline.append(values.get("type", ""))


class ArchiveMigrationContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        source = (ROOT / "js/content-registry.js").read_text(encoding="utf-8")
        start = source.index("const CONTENT = ") + len("const CONTENT = ")
        end = source.rindex("];" ) + 1
        cls.registry = {entry["id"]: entry for entry in json.loads(source[start:end])}

    def read(self, relative: str) -> str:
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_every_remaining_article_has_the_article_anatomy(self) -> None:
        for content_id, relative in ARTICLES.items():
            with self.subTest(page=relative):
                html = self.read(relative)
                self.assertIn('href="/dlt-patterns.css"', html)
                self.assertIn('src="/js/dlt-interactions.js"', html)
                for marker in (
                    'class="piece-head"',
                    'class="piece-lede"',
                    'class="key-points',
                    'class="verdict"',
                    'class="faq"',
                    'class="sources"',
                    'class="share-row"',
                    f'data-content-id="{content_id}"',
                ):
                    self.assertIn(marker, html)
                if len(re.findall(r"<h2(?:\s|>)", html)) >= 5:
                    self.assertIn('class="piece-toc"', html)

    def test_every_remaining_guide_has_the_guide_anatomy_and_real_steps(self) -> None:
        for content_id, relative in GUIDES.items():
            with self.subTest(page=relative):
                html = self.read(relative)
                for marker in (
                    'href="/dlt-patterns.css"',
                    'src="/js/dlt-interactions.js"',
                    'class="key-points',
                    'class="guide-step"',
                    'class="sources"',
                    f'data-content-id="{content_id}"',
                ):
                    self.assertIn(marker, html)
                self.assertRegex(html, r'class="[^"]*\bpiece-head\b[^"]*"')
                self.assertRegex(html, r'class="[^"]*\bpiece-lede\b[^"]*"')
                self.assertRegex(html, r'class="[^"]*\bfaq\b[^"]*"')
                self.assertIn('class="piece-toc"', html)

    def test_registry_canonical_sitemap_and_promotion_contracts_match(self) -> None:
        sitemap = self.read("sitemap.xml")
        for content_id, relative in {**ARTICLES, **GUIDES}.items():
            with self.subTest(page=relative):
                html = self.read(relative)
                entry = self.registry[content_id]
                self.assertIn(entry["url"], html)
                self.assertIn(f'data-content-id="{content_id}"', html)
                self.assertIn(f"https://dlt.academy{entry['url']}", html)
                self.assertIn(f"https://dlt.academy{entry['url']}", sitemap)
                if "data-promotion=" in html:
                    self.assertIn("data-verified-at=", html)
                    self.assertIn("PROMO_ATUAL", html)

    def test_public_pages_have_no_private_references_or_executable_inline_js(self) -> None:
        private_markers = ("Dknowledger", "project-management", "TaskNotes", "/Users/", "ferramenta-kit")
        for relative in (*ARTICLES.values(), *GUIDES.values()):
            with self.subTest(page=relative):
                html = self.read(relative)
                self.assertFalse(any(marker.lower() in html.lower() for marker in private_markers))
                parser = InlineScriptParser()
                parser.feed(html)
                self.assertEqual([], parser.executable_inline)
                self.assertNotIn('name="keywords"', html)

    def test_redirect_slug_remains_compatible(self) -> None:
        html = self.read("blog/bybit-pay-vs-moneta-vietqr/index.html")
        self.assertIn('http-equiv="refresh"', html)
        self.assertIn("/blog/bybit-pay-vs-moreta-vietqr/", html)

    def test_each_primary_screen_has_at_most_one_primary_cta(self) -> None:
        for relative in (*ARTICLES.values(), *GUIDES.values()):
            with self.subTest(page=relative):
                html = self.read(relative)
                for selector in ("piece-head", "guide-hero", "payment-hero"):
                    match = re.search(
                        rf'<[^>]+class="[^"]*{selector}[^"]*"[^>]*>(.*?)</(?:section|div)>',
                        html,
                        re.DOTALL,
                    )
                    if match:
                        self.assertLessEqual(match.group(1).count("btn-primary"), 1)


if __name__ == "__main__":
    unittest.main()

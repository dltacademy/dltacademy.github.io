from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

PRIMARY_ROUTES = {
    "/": "index.html",
    "/blog/": "blog/index.html",
    "/ferramentas/": "ferramentas/index.html",
    "/guias/": "guias/index.html",
    "/comunidade/": "comunidade/index.html",
    "/sobre/": "sobre/index.html",
    "/transparencia/": "transparencia/index.html",
    "/blog/arq-saques-exterior/": "blog/arq-saques-exterior/index.html",
    "/guias/bybit-pay-vietqr/": "guias/bybit-pay-vietqr/index.html",
    "/protocolos/medo-de-ficar-de-fora/": "protocolos/medo-de-ficar-de-fora/index.html",
}

ARTICLES = {
    "blog/bem-vindo/index.html",
    "blog/bybit-pay-vs-moreta-vietqr/index.html",
    "blog/topcashback-economia-viagem/index.html",
    "blog/fomo-investimentos-depois-da-alta/index.html",
    "blog/arq-saques-exterior/index.html",
}

GUIDES = {
    "pagamentos-no-exterior/index.html",
    "guias/conta-binance/index.html",
    "guias/assinaturas-ia-bybit/index.html",
    "guias/abastecer-moreta-usdt/index.html",
    "guias/etherfi-cash-viagem/index.html",
    "guias/bybit-pay-vietqr/index.html",
}


def has_class(html: str, class_name: str) -> bool:
    return bool(re.search(rf'class="[^"]*\b{re.escape(class_name)}\b[^"]*"', html))


class FullScopeContractTests(unittest.TestCase):
    def read(self, relative: str) -> str:
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_requested_public_routes_exist(self) -> None:
        for route, relative in PRIMARY_ROUTES.items():
            with self.subTest(route=route):
                self.assertTrue((ROOT / relative).is_file())
                self.assertIn(f'<link rel="canonical" href="https://dlt.academy{route}">', self.read(relative))

    def test_every_primary_screen_has_specific_svg_og_metadata_and_asset(self) -> None:
        for route, relative in PRIMARY_ROUTES.items():
            with self.subTest(route=route):
                html = self.read(relative)
                image_match = re.search(r'<meta property="og:image" content="([^"]+\.svg)">', html)
                self.assertIsNotNone(image_match)
                image_url = image_match.group(1)
                asset = ROOT / image_url.removeprefix("https://dlt.academy/")
                self.assertTrue(asset.is_file(), image_url)
                self.assertIn('<meta property="og:image:type" content="image/svg+xml">', html)
                self.assertIn('<meta property="og:image:width" content="1200">', html)
                self.assertIn('<meta property="og:image:height" content="630">', html)
                self.assertRegex(html, r'<meta property="og:image:alt" content="[^"]+">')
                self.assertRegex(html, r'<meta name="twitter:image" content="[^"]+\.svg">')
                svg = asset.read_text(encoding="utf-8")
                self.assertRegex(svg, r'<svg[^>]+width="1200"[^>]+height="630"')
                self.assertNotRegex(svg, r'\{\{|\}\}|PLACEHOLDER|TODO|VOLATILE')

    def test_public_routes_load_the_canonical_system_and_have_no_private_leaks(self) -> None:
        private_markers = ("Dknowledger", "project-management", "TaskNotes", "/Users/", "ferramenta-kit")
        for relative in set(PRIMARY_ROUTES.values()) | ARTICLES | GUIDES:
            with self.subTest(page=relative):
                html = self.read(relative)
                self.assertIn('dlt-patterns.css', html)
                self.assertIn('dlt-interactions.js', html)
                self.assertFalse(any(marker.lower() in html.lower() for marker in private_markers))
                self.assertNotIn('og-image.png', html)
                self.assertNotIn('name="keywords"', html)

    def test_retired_png_og_assets_are_not_tracked(self) -> None:
        retired = sorted(ROOT.rglob("og-image.png"))
        self.assertEqual([], retired, "OG PNG antigo ainda presente: " + ", ".join(str(path.relative_to(ROOT)) for path in retired))

    def test_home_and_catalogs_cover_the_portal_hub_model(self) -> None:
        home = self.read("index.html")
        for marker in ("home-hero", "hub-pillars", "tools-grid", "latest-posts-grid", "principles"):
            self.assertTrue(has_class(home, marker) or marker in home, marker)

        for relative in ("blog/index.html", "ferramentas/index.html", "guias/index.html"):
            with self.subTest(page=relative):
                html = self.read(relative)
                for marker in ("page-hero", "situation-chips", "entry-grid", "principles"):
                    self.assertTrue(has_class(html, marker), f"{relative}: {marker}")
                self.assertIn('content-registry.js', html)

    def test_community_and_institutional_screens_are_closed_models(self) -> None:
        community = self.read("comunidade/index.html")
        for marker in ("page-hero", "channel-grid", "scam-note", "page-actions", "share-row"):
            self.assertTrue(has_class(community, marker), marker)

        for relative in ("sobre/index.html", "transparencia/index.html"):
            with self.subTest(page=relative):
                html = self.read(relative)
                for marker in ("page-hero", "piece-head", "key-points", "value-grid", "page-actions", "verdict", "share-row"):
                    self.assertTrue(has_class(html, marker), f"{relative}: {marker}")

    def test_arq_article_implements_the_full_article_model(self) -> None:
        html = self.read("blog/arq-saques-exterior/index.html")
        for marker in (
            "read-progress", "piece-head", "key-points", "piece-toc", "figure-row", "figure-cell",
            "calc", "calc-controls", "calc-rows", "calc-verdict", "compare", "compare-scroll",
            "note is-risk", "steps", "verdict", "offer", "faq", "sources", "share-row",
        ):
            self.assertTrue(has_class(html, marker) or marker in html, marker)
        self.assertIn('src="/blog/js/arq-calculator.js"', html)
        self.assertEqual(10, len(re.findall(r'<input[^>]+type="range"', html)))
        self.assertEqual(1, len(re.findall(r'<select[^>]+id="arq-balance-source"', html)))
        self.assertEqual(3, len(re.findall(r'data-calc-row="(?:arq|wise|revolut)"', html)))
        self.assertEqual(4, len(re.findall(r'class="figure-cell"', html)))
        self.assertEqual(3, len(re.findall(r'class="step"', html)))
        self.assertIn("Wise", html)
        self.assertIn("Revolut", html)
        self.assertIn("DCC", html)
        self.assertIn("05/08/2026", html)
        self.assertIn("Já tenho a moeda local do saque", html)
        self.assertIn("Tenho outra moeda estrangeira", html)
        self.assertIn("opções básicas gratuitas", html)
        self.assertIn("Nenhum plano pago entra no cálculo", html)

    def test_vietqr_guide_implements_the_full_guide_model(self) -> None:
        html = self.read("guias/bybit-pay-vietqr/index.html")
        for marker in (
            "guide-hero", "guide-reference", "compare", "compare-scroll", "Quando dá errado",
            "plan-b", "verificacao-final", "guide-final-check", "guide-progress-bar", "privacy-line",
            "offer", "share-row", "sources", "next-step",
        ):
            self.assertTrue(has_class(html, marker) or marker in html, marker)
        self.assertEqual(4, html.count("data-guide-check="))
        self.assertIn('data-guide-progress="bybit-pay-vietqr"', html)
        self.assertIn("PROMO_ATUAL", html)
        self.assertIn("Plano B", html)

    def test_fomo_protocol_has_the_complete_result_and_pdf_contract(self) -> None:
        html = self.read("protocolos/medo-de-ficar-de-fora/index.html")
        engine = self.read("js/protocol-engine.js")
        protocol = self.read("protocolos/medo-de-ficar-de-fora/js/protocol.js")
        for marker in ("protocol-mount", "tool-facts", "flow-card", "flow-result", "result-hero", "answer-record", "result-actions"):
            self.assertTrue(marker in html or marker in engine, marker)
        for marker in ("protocol-progress", "aria-disabled", "protocol-result-stats", "protocol-plan", "localStorage", "result-actions", "downloadProtocolPdf", "buildMarkdown", "Refazer o protocolo", "share-row", "cta-verdict"):
            self.assertIn(marker, engine, marker)
        for tone in ('tone: "bad"', 'tone: "mixed"', 'tone: "good"'):
            self.assertIn(tone, protocol)
        self.assertIn("stats:", protocol)
        self.assertIn("Gerado em", engine)
        self.assertIn("Conteúdo educacional", engine)
        self.assertIn("window.location.origin + window.location.pathname", engine)
        self.assertLess(engine.index("// Registro pessoal"), engine.index("if (result.plan"))
        self.assertLess(engine.index("id = \"next-step-mount\""), engine.index("const cta = result.cta"))


if __name__ == "__main__":
    unittest.main()

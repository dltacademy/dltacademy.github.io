import json
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "pagamentos-no-exterior" / "index.html"
REGISTRY = ROOT / "js" / "content-registry.js"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])


def load_registry():
    raw = REGISTRY.read_text(encoding="utf-8")
    items = json.loads(raw[raw.index("["):raw.rindex("]") + 1])
    return {item["id"]: item for item in items}


def internal_target(href):
    path = urlsplit(href).path
    if not path or not path.startswith("/"):
        return None
    if path == "/":
        return ROOT / "index.html"
    relative = path.lstrip("/")
    target = ROOT / relative
    return target / "index.html" if path.endswith("/") else target


class PagamentosNoExteriorArqTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        parser = LinkParser()
        parser.feed(cls.html)
        cls.links = parser.links
        cls.registry = load_registry()

    def test_arq_article_is_linked_without_placeholders(self):
        self.assertGreaterEqual(self.links.count("/blog/arq-saques-exterior/"), 2)
        for old in (
            "Guia do ARQ Bank em preparação",
            "ARQ · guia chegando",
            'data-future-guide="arq-bank-saques"',
        ):
            self.assertNotIn(old, self.html)

    def test_funding_is_the_fifth_operational_layer(self):
        start = self.html.index('<span class="layer-index">05</span>')
        end = self.html.index("</article>", start)
        layer = self.html[start:end]
        self.assertIn("Formação do saldo", layer)
        self.assertIn("Funding compatível e barato", layer)
        self.assertIn("Uma recarga cara pode apagar a economia", layer)
        self.assertIn('href="/guias/abastecer-moreta-usdt/"', layer)
        self.assertNotIn("TopCashback", layer)

    def test_topcashback_remains_an_optimisation(self):
        start = self.html.index('<section class="cashback-section"')
        end = self.html.index("</section>", start)
        section = self.html[start:end]
        self.assertIn("Economia antes do pagamento", section)
        self.assertIn("TopCashback", section)
        self.assertIn('href="/blog/topcashback-economia-viagem/"', section)

    def test_finder_copy_distinguishes_editorial_map(self):
        self.assertIn("Esta página entrega o mapa editorial base", self.html)
        self.assertIn("A recomendação personalizada é gerada no seu navegador", self.html)
        self.assertIn("https://setup-nomade.dlt.academy/", self.html)
        self.assertNotIn("entrega o mesmo mapa", self.html)
        self.assertNotIn("futuro Descobridor", self.html)

    def test_arq_article_points_to_complete_system(self):
        arq = self.registry["article-arq-saques-exterior"]
        self.assertEqual(arq["primaryNext"], "guide-pagamentos-no-exterior")
        self.assertEqual(
            arq["related"],
            [
                "guide-bybit-pay-vietqr",
                "guide-abastecer-moreta-usdt",
                "guide-etherfi-cash-viagem",
            ],
        )
        pillar = self.registry["guide-pagamentos-no-exterior"]
        self.assertIn("article-arq-saques-exterior", pillar["related"])

    def test_all_internal_links_resolve_in_repository(self):
        for href in self.links:
            target = internal_target(href)
            if target is None:
                continue
            with self.subTest(href=href):
                self.assertTrue(target.is_file(), f"Destino interno ausente: {href}")


if __name__ == "__main__":
    unittest.main()

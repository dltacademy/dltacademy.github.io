"""Contrato estrutural de todas as páginas públicas.

As páginas são descobertas no disco, então uma peça nova é coberta sem editar
teste. Aqui só entra o que quebra o site, o SEO, o compartilhamento ou a
navegação. Texto, número, título e ordem das frases não são contrato: quem
guarda o que é volátil é o CLAIMS.md de cada peça.
"""
from __future__ import annotations

import json
import re
import unittest
from datetime import date, timedelta
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = "https://dlt.academy"
SKIP_DIRS = {".git", "node_modules", "tests", "_site"}
TEMPLATES = {"blog/template-post.html"}
PRIVATE_MARKERS = ("Dknowledger", "project-management", "TaskNotes", "/Users/", "ferramenta-kit")
# TODO em maiúsculas: "todo" minúsculo é português para "tudo".
PLACEHOLDERS = ((r"\{\{", 0), (r"\bTODO\b", 0), (r"\[(?:a confirmar|placeholder)\]", re.IGNORECASE), (r"data-future-guide", 0), (r"lorem ipsum", re.IGNORECASE))
VOID_ATTR_LINKS = {"a": "href", "link": "href", "img": "src", "script": "src", "source": "src"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[tuple[str, str]] = []
        self.images_without_alt: list[str] = []
        self.handlers: list[str] = []
        self.h1 = 0
        self.title = ""
        self._in_title = False
        self.meta: dict[str, str] = {}
        self.canonical = ""
        self.lang = ""
        self.refresh = False
        self.json_ld: list[str] = []
        self._ld: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k.lower(): (v or "") for k, v in attrs}
        if a.get("id"):
            self.ids.append(a["id"])
        for name in a:
            if name.startswith("on"):
                self.handlers.append(f"<{tag} {name}>")
        if tag == "html":
            self.lang = a.get("lang", "")
        elif tag == "h1":
            self.h1 += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "img" and "alt" not in a:
            self.images_without_alt.append(a.get("src", "?"))
        elif tag == "meta":
            key = a.get("property") or a.get("name") or a.get("http-equiv", "").lower()
            self.meta[key] = a.get("content", "")
            if a.get("http-equiv", "").lower() == "refresh":
                self.refresh = True
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._ld = []
        attr = VOID_ATTR_LINKS.get(tag)
        if attr and a.get(attr):
            self.links.append((tag, a[attr]))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._ld is not None:
            self.json_ld.append("".join(self._ld))
            self._ld = None

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._ld is not None:
            self._ld.append(data)


def parse(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def all_pages() -> list[Path]:
    pages = []
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT)
        if SKIP_DIRS & set(rel.parts) or rel.as_posix() in TEMPLATES:
            continue
        pages.append(path)
    return sorted(pages)


def expected_canonical(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return SITE + "/"
    return f"{SITE}/{rel.removesuffix('index.html')}"


def resolve(page: Path, href: str) -> Path | None:
    """Arquivo local para o qual o link aponta, ou None se for externo."""
    parts = urlsplit(href)
    if parts.scheme or parts.netloc:
        if parts.netloc == "dlt.academy":
            target = parts.path
        else:
            return None
    else:
        target = parts.path
    if not target:
        return page
    base = ROOT if target.startswith("/") else page.parent
    candidate = (base / target.lstrip("/")).resolve() if target.startswith("/") else (base / target).resolve()
    if target.endswith("/") or candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate


PAGES = all_pages()
PARSED = {path: parse(path) for path in PAGES}
TEXT = {path: path.read_text(encoding="utf-8") for path in PAGES}


def registry() -> list[dict]:
    source = (ROOT / "js" / "content-registry.js").read_text(encoding="utf-8")
    start = source.index("const CONTENT = ") + len("const CONTENT = ")
    return json.loads(source[start : source.rindex("];") + 1])


class PageContractTests(unittest.TestCase):
    def label(self, path: Path) -> str:
        return path.relative_to(ROOT).as_posix()

    def real_pages(self) -> list[Path]:
        return [p for p in PAGES if not PARSED[p].refresh]

    def test_pages_are_discovered(self) -> None:
        self.assertGreaterEqual(len(self.real_pages()), 15)

    def test_metadata_and_share_image(self) -> None:
        for path in self.real_pages():
            page = PARSED[path]
            with self.subTest(page=self.label(path)):
                self.assertTrue(page.title.strip(), "sem <title>")
                self.assertTrue(page.meta.get("description", "").strip(), "sem meta description")
                self.assertTrue(page.lang, "html sem lang")
                self.assertEqual(1, page.h1, "deve haver exatamente um <h1>")
                self.assertEqual(expected_canonical(path), page.canonical)
                self.assertEqual(page.canonical, page.meta.get("og:url"))
                self.assertNotIn("keywords", page.meta)
                image = page.meta.get("og:image", "")
                self.assertRegex(image, r"\.png$", "og:image deve ser PNG (WhatsApp, X e Facebook ignoram SVG)")
                png = ROOT / image.removeprefix(SITE + "/")
                self.assertTrue(png.is_file(), f"og:image ausente: {image}")
                self.assertEqual(
                    (1200).to_bytes(4, "big") + (630).to_bytes(4, "big"),
                    png.read_bytes()[16:24],
                    "og:image deve medir 1200x630",
                )
                self.assertTrue(page.meta.get("og:image:alt", "").strip(), "sem og:image:alt")
                self.assertRegex(page.meta.get("twitter:image", ""), r"\.png$")

    def test_every_og_svg_source_has_a_rendered_png(self) -> None:
        missing = [
            svg.relative_to(ROOT).as_posix()
            for svg in ROOT.rglob("og-image.svg")
            if not SKIP_DIRS & set(svg.relative_to(ROOT).parts) and not svg.with_suffix(".png").is_file()
        ]
        self.assertEqual([], missing)

    def test_ids_are_unique_and_images_have_alt(self) -> None:
        for path in self.real_pages():
            page = PARSED[path]
            with self.subTest(page=self.label(path)):
                duplicated = sorted({i for i in page.ids if page.ids.count(i) > 1})
                self.assertEqual([], duplicated, "ids duplicados")
                self.assertEqual([], page.images_without_alt, "imagem sem atributo alt")

    def test_internal_links_and_anchors_resolve(self) -> None:
        for path in self.real_pages():
            for tag, href in PARSED[path].links:
                target = resolve(path, href)
                if target is None or href.startswith(("mailto:", "tel:", "data:", "javascript:")):
                    continue
                with self.subTest(page=self.label(path), href=href):
                    self.assertTrue(target.is_file(), f"destino inexistente: {href}")
                    fragment = urlsplit(href).fragment
                    if fragment and tag == "a" and target.suffix == ".html":
                        ids = PARSED[target].ids if target in PARSED else parse(target).ids
                        self.assertIn(fragment, ids, f"âncora #{fragment} não existe em {target.name}")

    def test_no_inline_handlers_private_references_or_placeholders(self) -> None:
        for path in self.real_pages():
            text = TEXT[path]
            with self.subTest(page=self.label(path)):
                self.assertEqual([], PARSED[path].handlers, "handler inline (a CSP bloqueia)")
                self.assertFalse([m for m in PRIVATE_MARKERS if m.lower() in text.lower()], "referência privada")
                for pattern, flags in PLACEHOLDERS:
                    self.assertIsNone(re.search(pattern, text, flags), f"sobrou placeholder: {pattern}")

    def test_promotions_are_isolated_and_dated(self) -> None:
        today = date.today() + timedelta(days=1)
        for path in self.real_pages():
            text = TEXT[path]
            with self.subTest(page=self.label(path)):
                self.assertEqual(text.count("<!-- PROMO_ATUAL -->"), text.count("<!-- /PROMO_ATUAL -->"))
                if "data-promotion=" in text:
                    self.assertIn("<!-- PROMO_ATUAL -->", text, "promoção fora do bloco PROMO_ATUAL")
                for stamp in re.findall(r'data-verified-at="([^"]*)"', text):
                    self.assertRegex(stamp, r"^\d{4}-\d{2}-\d{2}$")
                    self.assertLessEqual(date.fromisoformat(stamp), today, "data de verificação no futuro")
                if "data-promotion=" in text:
                    self.assertIn("data-verified-at=", text)

    def test_json_ld_is_consistent_with_the_page(self) -> None:
        for path in self.real_pages():
            page = PARSED[path]
            for block in page.json_ld:
                data = json.loads(block)
                for item in data if isinstance(data, list) else [data]:
                    with self.subTest(page=self.label(path), type=str(item.get("@type"))):
                        published, modified = item.get("datePublished"), item.get("dateModified")
                        if published and modified:
                            self.assertLessEqual(date.fromisoformat(published[:10]), date.fromisoformat(modified[:10]))
                        for key in ("url", "mainEntityOfPage"):
                            if isinstance(item.get(key), str):
                                self.assertEqual(page.canonical, item[key])

    def test_pages_load_the_component_system(self) -> None:
        for path in self.real_pages():
            hrefs = " ".join(href for _, href in PARSED[path].links)
            with self.subTest(page=self.label(path)):
                self.assertIn("dlt-patterns.css", hrefs)
                self.assertIn("dlt-interactions.js", hrefs)

    def test_each_offer_has_at_most_one_primary_action(self) -> None:
        for path in self.real_pages():
            for block in re.findall(r'<div class="offer[^"]*"[^>]*>(.*?)</div>', TEXT[path], re.DOTALL):
                with self.subTest(page=self.label(path)):
                    self.assertLessEqual(block.count("btn-primary"), 1)

    def test_sitemap_lists_each_public_page_once(self) -> None:
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", sitemap)
        for path in self.real_pages():
            with self.subTest(page=self.label(path)):
                self.assertEqual(1, locs.count(PARSED[path].canonical))

    def test_redirect_pages_point_somewhere_real(self) -> None:
        for path in PAGES:
            if not PARSED[path].refresh:
                continue
            with self.subTest(page=self.label(path)):
                target = re.search(r"url=([^\"'>\s]+)", TEXT[path], re.IGNORECASE)
                self.assertIsNotNone(target)
                self.assertTrue(resolve(path, target.group(1)).is_file())


class RegistryContractTests(unittest.TestCase):
    def test_related_edges_stay_small(self) -> None:
        for entry in registry():
            with self.subTest(entry=entry["id"]):
                self.assertLessEqual(len(entry.get("related", [])), 3)

    def test_catalog_entries_have_situations_and_monograms(self) -> None:
        for entry in registry():
            if entry["type"] not in {"tool", "guide", "protocolo", "article"}:
                continue
            with self.subTest(entry=entry["id"]):
                self.assertTrue(entry.get("sit"))
                self.assertRegex(entry.get("mark", ""), r"^[A-Z0-9]{1,2}$")
                self.assertNotIn("icon", entry)


class ArticleAndGuideAnatomyTests(unittest.TestCase):
    """AGENTS.md, seção Anatomia: os componentes que dão ao leitor o mesmo caminho em toda peça."""

    ARTICLE = ("piece-head", "piece-lede", "key-points", "verdict", "faq", "sources", "share-row")
    GUIDE = ("piece-head", "piece-lede", "key-points", "guide-step", "faq", "sources", "piece-toc")

    def pages_of(self, kind: str) -> list[tuple[str, Path]]:
        found = []
        for entry in registry():
            if entry["type"] != kind or not entry["url"].startswith("/"):
                continue
            path = ROOT / entry["url"].lstrip("/") / "index.html"
            if path.is_file():
                found.append((entry["id"], path))
        return found

    def has_class(self, text: str, name: str) -> bool:
        return bool(re.search(rf'class="[^"]*\b{re.escape(name)}\b[^"]*"', text))

    def test_articles_have_the_article_anatomy(self) -> None:
        for content_id, path in self.pages_of("article"):
            text = path.read_text(encoding="utf-8")
            with self.subTest(page=content_id):
                for marker in self.ARTICLE:
                    self.assertTrue(self.has_class(text, marker), f"falta {marker}")
                if len(re.findall(r"<h2(?:\s|>)", text)) >= 5:
                    self.assertTrue(self.has_class(text, "piece-toc"), "artigo longo sem sumário")

    def test_guides_have_the_guide_anatomy(self) -> None:
        for content_id, path in self.pages_of("guide"):
            text = path.read_text(encoding="utf-8")
            with self.subTest(page=content_id):
                for marker in self.GUIDE:
                    self.assertTrue(self.has_class(text, marker), f"falta {marker}")

    def test_one_primary_action_in_each_hero(self) -> None:
        for path in PAGES:
            text = TEXT[path]
            for selector in ("piece-head", "guide-hero", "payment-hero"):
                match = re.search(rf'<[^>]+class="[^"]*{selector}[^"]*"[^>]*>(.*?)</(?:section|div)>', text, re.DOTALL)
                if match:
                    with self.subTest(page=path.relative_to(ROOT).as_posix(), hero=selector):
                        self.assertLessEqual(match.group(1).count("btn-primary"), 1)


class ScriptContractTests(unittest.TestCase):
    """Todo id que um script local procura na página precisa existir nela."""

    LOOKUPS = (
        re.compile(r"getElementById\(\s*[\"']([\w-]+)[\"']\s*\)"),
        re.compile(r"querySelector(?:All)?\(\s*[\"']#([\w-]+)[\"']\s*\)"),
        re.compile(r"(?<![\w.])\$\(\s*[\"']([\w-]+)[\"']\s*\)"),  # helper $("id") das calculadoras
    )

    def test_ids_used_by_local_scripts_exist_in_the_page(self) -> None:
        for path in PAGES:
            if PARSED[path].refresh:
                continue
            page_ids = set(PARSED[path].ids)
            for tag, src in PARSED[path].links:
                if tag != "script":
                    continue
                script = resolve(path, src)
                if script is None or not script.is_file() or "vendor" in script.parts:
                    continue
                if src.startswith("/js/") and not path.parent.samefile(ROOT):
                    continue  # scripts compartilhados servem várias páginas
                source = script.read_text(encoding="utf-8")
                wanted = {m for pattern in self.LOOKUPS for m in pattern.findall(source)}
                # ids montados por template ("x-" + nome) não entram; só literais.
                missing = sorted(wanted - page_ids)
                with self.subTest(page=path.relative_to(ROOT).as_posix(), script=src):
                    self.assertEqual([], missing, "id procurado pelo script e ausente na página")


if __name__ == "__main__":
    unittest.main()

import json
import tempfile
import unittest
from pathlib import Path

from validate_registry import validate_repository


class ValidateRegistryTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / "js").mkdir()

    def tearDown(self):
        self.tempdir.cleanup()

    @staticmethod
    def valid_tool(**changes):
        entry = {
            "id": "tool-exemplo",
            "type": "tool",
            "title": "Ferramenta exemplo",
            "description": "Descrição objetiva.",
            "url": "https://exemplo.dlt.academy/",
            "tag": "Exemplo",
            "tone": "green",
            "icon": "✦",
        }
        entry.update(changes)
        return entry

    def write_fixture(self, entries, sitemap_urls=None, raw_registry=None):
        if raw_registry is None:
            raw_registry = json.dumps(entries, ensure_ascii=False, indent=2)
        (self.root / "js" / "content-registry.js").write_text(
            f"const CONTENT = {raw_registry};\n", encoding="utf-8"
        )
        if sitemap_urls is None:
            sitemap_urls = [
                ("https://dlt.academy" + entry["url"])
                if entry.get("url", "").startswith("/")
                else entry.get("url", "")
                for entry in entries
                if isinstance(entry, dict) and entry.get("url")
            ]
        locs = "".join(f"<url><loc>{url}</loc></url>" for url in sitemap_urls)
        (self.root / "sitemap.xml").write_text(
            f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{locs}</urlset>',
            encoding="utf-8",
        )

    def assert_has_error(self, errors, fragment):
        self.assertTrue(
            any(fragment in error for error in errors),
            f"fragmento {fragment!r} ausente em {errors!r}",
        )

    def test_repositorio_real_e_valido(self):
        repo = Path(__file__).resolve().parents[1]
        self.assertEqual([], validate_repository(repo))

    def test_id_duplicado_reprova(self):
        entries = [self.valid_tool(), self.valid_tool(url="https://outro.dlt.academy/")]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "valor duplicado")

    def test_campo_desconhecido_reprova(self):
        self.write_fixture([self.valid_tool(status="published")])
        self.assert_has_error(validate_repository(self.root), "campo desconhecido")

    def test_tipo_invalido_reprova(self):
        self.write_fixture([self.valid_tool(type="video")])
        self.assert_has_error(validate_repository(self.root), "tool, guide ou article")

    def test_artigo_sem_published_at_reprova(self):
        entry = self.valid_tool(type="article")
        entry.pop("tone")
        entry.pop("icon")
        self.write_fixture([entry])
        self.assert_has_error(validate_repository(self.root), "campo 'publishedAt': obrigatório")

    def test_data_impossivel_reprova(self):
        entry = self.valid_tool(type="article", publishedAt="2026-02-30")
        entry.pop("tone")
        entry.pop("icon")
        self.write_fixture([entry])
        self.assert_has_error(validate_repository(self.root), "data real obrigatória")

    def test_tone_fora_da_allowlist_reprova(self):
        self.write_fixture([self.valid_tool(tone="red")])
        self.assert_has_error(validate_repository(self.root), "'green' ou 'blue'")

    def test_url_interna_sem_index_reprova(self):
        self.write_fixture([self.valid_tool(type="guide", url="/guias/exemplo/")])
        self.assert_has_error(validate_repository(self.root), "sem index.html")

    def test_url_interna_com_index_e_valida(self):
        page = self.root / "guias" / "exemplo"
        page.mkdir(parents=True)
        (page / "index.html").write_text("<!doctype html>", encoding="utf-8")
        self.write_fixture([self.valid_tool(type="guide", url="/guias/exemplo/")])
        self.assertEqual([], validate_repository(self.root))

    def test_url_externa_fora_do_dominio_reprova(self):
        self.write_fixture([self.valid_tool(url="https://example.com/")])
        self.assert_has_error(validate_repository(self.root), "subdomínio .dlt.academy")

    def test_url_do_registry_ausente_do_sitemap_reprova(self):
        self.write_fixture([self.valid_tool()], sitemap_urls=[])
        self.assert_has_error(validate_repository(self.root), "URL do registry ausente")

    def test_url_orfa_no_sitemap_reprova(self):
        self.write_fixture(
            [self.valid_tool()],
            sitemap_urls=[
                "https://exemplo.dlt.academy/",
                "https://dlt.academy/pagina-morta/",
            ],
        )
        self.assert_has_error(validate_repository(self.root), "URL órfã")

    def test_url_institucional_da_allowlist_e_aceita(self):
        self.write_fixture(
            [self.valid_tool()],
            sitemap_urls=["https://exemplo.dlt.academy/", "https://dlt.academy/sobre/"],
        )
        self.assertEqual([], validate_repository(self.root))

    def test_json_nao_finito_reprova(self):
        raw = json.dumps([self.valid_tool(extra=float("nan"))], allow_nan=True)
        self.write_fixture([], raw_registry=raw)
        self.assert_has_error(validate_repository(self.root), "constante não permitida")

    def test_registry_sem_marcador_reprova(self):
        self.write_fixture([], raw_registry="[]")
        path = self.root / "js" / "content-registry.js"
        path.write_text("const OUTRO = [];\n", encoding="utf-8")
        self.assert_has_error(validate_repository(self.root), "não foi possível extrair")


if __name__ == "__main__":
    unittest.main()

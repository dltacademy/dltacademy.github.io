import json
import sys
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlparse

# validate_registry.py vive na raiz do repo. Sem isto o import falha quando o
# teste roda direto (sys.path[0] vira tests/) ou via unittest discover.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

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
        todas_urls = [
            ("https://dlt.academy" + entry["url"])
            if entry.get("url", "").startswith("/")
            else entry.get("url", "")
            for entry in entries
            if isinstance(entry, dict) and entry.get("url")
        ]
        if sitemap_urls is None:
            # O sitemap do portal só declara o próprio host: URL de subdomínio
            # vive no sitemap dele, e o índice é quem reúne os dois.
            sitemap_urls = [
                url for url in todas_urls if urlparse(url).hostname == "dlt.academy"
            ]
        locs = "".join(f"<url><loc>{url}</loc></url>" for url in sitemap_urls)
        (self.root / "sitemap.xml").write_text(
            f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{locs}</urlset>',
            encoding="utf-8",
        )
        self.write_sitemap_index(todas_urls)

    def write_sitemap_index(self, urls, extra_hosts=()):
        hosts = {"dlt.academy"}
        for url in urls:
            host = (urlparse(url).hostname or "").lower()
            if host:
                hosts.add(host)
        hosts.update(extra_hosts)
        locs = "".join(
            f"<sitemap><loc>https://{host}/sitemap.xml</loc></sitemap>"
            for host in sorted(hosts)
        )
        (self.root / "sitemap-index.xml").write_text(
            f'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{locs}</sitemapindex>',
            encoding="utf-8",
        )

    @staticmethod
    def pagina_de_conteudo(content_id, com_mount=True, com_script=True):
        mount = f'<div id="next-step-mount" data-content-id="{content_id}"></div>' if com_mount else ""
        script = '<script src="/js/next-step.js"></script>' if com_script else ""
        return f"<!doctype html><html><body>{mount}{script}</body></html>"

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
        self.assert_has_error(validate_repository(self.root), "tool, guide, protocolo ou article")

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
        (page / "index.html").write_text(self.pagina_de_conteudo("tool-exemplo"), encoding="utf-8")
        self.write_fixture([self.valid_tool(type="guide", url="/guias/exemplo/")])
        self.assertEqual([], validate_repository(self.root))

    def test_url_externa_fora_do_dominio_reprova(self):
        self.write_fixture([self.valid_tool(url="https://example.com/")])
        self.assert_has_error(validate_repository(self.root), "subdomínio .dlt.academy")

    def test_url_do_registry_ausente_do_sitemap_reprova(self):
        # Só URL do próprio host é exigida no sitemap do portal, então o caso
        # precisa de uma peça interna — subdomínio vive no sitemap dele.
        page = self.root / "guias" / "exemplo"
        page.mkdir(parents=True)
        (page / "index.html").write_text(self.pagina_de_conteudo("tool-exemplo"), encoding="utf-8")
        self.write_fixture(
            [self.valid_tool(type="guide", url="/guias/exemplo/")], sitemap_urls=[]
        )
        self.assert_has_error(validate_repository(self.root), "URL do registry ausente")

    def test_url_de_subdominio_no_sitemap_do_portal_reprova(self):
        # Protocolo de sitemaps: host único por arquivo. Era o defeito real —
        # o portal declarava as quatro ferramentas, que vivem em subdomínios.
        self.write_fixture(
            [self.valid_tool()],
            sitemap_urls=["https://exemplo.dlt.academy/"],
        )
        self.assert_has_error(validate_repository(self.root), "URL de outro host")

    def test_subdominio_ausente_do_indice_reprova(self):
        # Sem esta checagem, lançar uma ferramenta nova a deixaria invisível:
        # fora do sitemap do portal (host diferente) e fora do índice.
        self.write_fixture([self.valid_tool()])
        self.write_sitemap_index([])
        self.assert_has_error(
            validate_repository(self.root), "sitemap ausente do índice"
        )

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
            sitemap_urls=["https://dlt.academy/sobre/"],
        )
        self.assertEqual([], validate_repository(self.root))

    def test_pagina_de_conteudo_sem_mount_reprova(self):
        # Beco sem saída silencioso: nada quebra, o leitor simplesmente acaba ali.
        page = self.root / "guias" / "exemplo"
        page.mkdir(parents=True)
        (page / "index.html").write_text(
            self.pagina_de_conteudo("tool-exemplo", com_mount=False), encoding="utf-8"
        )
        self.write_fixture([self.valid_tool(type="guide", url="/guias/exemplo/")])
        self.assert_has_error(validate_repository(self.root), "next-step-mount")

    def test_pagina_de_conteudo_sem_script_reprova(self):
        page = self.root / "guias" / "exemplo"
        page.mkdir(parents=True)
        (page / "index.html").write_text(
            self.pagina_de_conteudo("tool-exemplo", com_script=False), encoding="utf-8"
        )
        self.write_fixture([self.valid_tool(type="guide", url="/guias/exemplo/")])
        self.assert_has_error(validate_repository(self.root), "next-step.js")

    def test_data_content_id_divergente_reprova(self):
        # Se o id não bate, o bloco não renderiza — e o erro é invisível.
        page = self.root / "guias" / "exemplo"
        page.mkdir(parents=True)
        (page / "index.html").write_text(
            self.pagina_de_conteudo("id-errado"), encoding="utf-8"
        )
        self.write_fixture([self.valid_tool(type="guide", url="/guias/exemplo/")])
        self.assert_has_error(validate_repository(self.root), "data-content-id")

    def test_protocolo_pode_montar_por_js(self):
        # O motor de protocolo cria o mount depois do resultado; basta o script.
        page = self.root / "protocolos" / "exemplo"
        page.mkdir(parents=True)
        (page / "index.html").write_text(
            self.pagina_de_conteudo("tool-exemplo", com_mount=False), encoding="utf-8"
        )
        self.write_fixture([self.valid_tool(type="protocolo", url="/protocolos/exemplo/")])
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

    def test_primary_next_para_destino_inexistente_reprova(self):
        entries = [self.valid_tool(primaryNext="tool-fantasma")]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "destino inexistente")

    def test_primary_next_autorreferencia_reprova(self):
        entries = [self.valid_tool(id="tool-a", primaryNext="tool-a")]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "autorreferenciar")

    def test_related_acima_do_limite_reprova(self):
        entries = [
            self.valid_tool(
                id="tool-a",
                url="https://a.dlt.academy/",
                related=["tool-b", "tool-c", "tool-d", "tool-e"],
            ),
            self.valid_tool(id="tool-b", url="https://b.dlt.academy/"),
            self.valid_tool(id="tool-c", url="https://c.dlt.academy/"),
            self.valid_tool(id="tool-d", url="https://d.dlt.academy/"),
            self.valid_tool(id="tool-e", url="https://e.dlt.academy/"),
        ]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "máximo de 3")

    def test_related_duplicado_reprova(self):
        entries = [
            self.valid_tool(id="tool-a", url="https://a.dlt.academy/", related=["tool-b", "tool-b"]),
            self.valid_tool(id="tool-b", url="https://b.dlt.academy/"),
        ]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "valor duplicado")

    def test_related_autorreferencia_reprova(self):
        entries = [self.valid_tool(id="tool-a", related=["tool-a"])]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "autorreferenciar")

    def test_related_para_destino_inexistente_reprova(self):
        entries = [self.valid_tool(id="tool-a", related=["tool-fantasma"])]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "destino inexistente")

    def test_primary_next_ciclo_reprova(self):
        entries = [
            self.valid_tool(id="tool-a", url="https://a.dlt.academy/", primaryNext="tool-b"),
            self.valid_tool(id="tool-b", url="https://b.dlt.academy/", primaryNext="tool-a"),
        ]
        self.write_fixture(entries)
        self.assert_has_error(validate_repository(self.root), "ciclo")

    def test_arestas_validas_nao_reprovam(self):
        entries = [
            self.valid_tool(
                id="tool-a", url="https://a.dlt.academy/", primaryNext="tool-b", related=["tool-b"]
            ),
            self.valid_tool(id="tool-b", url="https://b.dlt.academy/"),
        ]
        self.write_fixture(entries)
        self.assertEqual([], validate_repository(self.root))


if __name__ == "__main__":
    unittest.main()

"""Guardas de regressão: erros que já saíram publicados ou vazaram uma vez.

Regra da casa: entra aqui só um erro factual, de privacidade ou de jargão
interno que já aconteceu, sempre com o motivo. Frase certa não é contrato,
porque texto bom precisa poder mudar sem editar teste.
"""
from __future__ import annotations

import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from security_check import parse_csp  # noqa: E402

SKIP_DIRS = {".git", "node_modules", "tests", "_site", "scripts"}
SERVED_SUFFIXES = {".html", ".css", ".js", ".xml", ".txt", ".webmanifest"}
THIRD_PARTY_HOSTS = ("fonts.googleapis.com", "fonts.gstatic.com", "gc.zgo.at", "goatcounter.com")


def served_files() -> list[Path]:
    return sorted(
        path for path in ROOT.rglob("*")
        if path.is_file() and path.suffix in SERVED_SUFFIXES
        and not SKIP_DIRS & set(path.relative_to(ROOT).parts)
        and not any(part.startswith(".") for part in path.relative_to(ROOT).parts)
    )


def html_pages() -> list[Path]:
    return [path for path in served_files() if path.suffix == ".html"]

# (arquivo, trecho proibido, por quê)
FORBIDDEN = (
    ("blog/arq-saques-exterior/index.html", "0,5% já incluindo IOF",
     "O ARQ Global tem 0% de IOF; os 0,5% são a formação do saldo, não IOF."),
    ("blog/arq-saques-exterior/index.html", "0,5% no total de IOF",
     "O ARQ Global tem 0% de IOF; os 0,5% são a formação do saldo, não IOF."),
    ("guias/pagamentos-china/index.html", "o ARQ passa na frente",
     "No mês inteiro o cashback de 3% deixa o ether.fi à frente do ARQ; a conclusão inversa já foi publicada por engano."),
    ("pagamentos-no-exterior/index.html", "Guia do ARQ Bank em preparação",
     "O artigo do ARQ já está no ar; o espaço de 'em breve' não pode voltar."),
    ("pagamentos-no-exterior/index.html", "ARQ · guia chegando",
     "O artigo do ARQ já está no ar; o espaço de 'em breve' não pode voltar."),
    ("pagamentos-no-exterior/index.html", "página-pilar",
     "Jargão interno de planejamento; o leitor não sabe o que é."),
    ("pagamentos-no-exterior/index.html", "entrega o mesmo mapa",
     "Prometia a ferramenta como igual à página; a página é o mapa geral e a ferramenta personaliza."),
    ("pagamentos-no-exterior/index.html", "futuro Descobridor",
     "Nome interno de ferramenta que não existe para o leitor."),
)

# Trechos de comprovantes (fim de cartão, hashes, IDs) removidos do guia da China.
RECEIPT_FRAGMENTS = (
    "0787", "4318", "c1145301", "e9ce1ece", "476c5927", "0x038e", "0xc423", "0x11dc", "02161686888", "9036",
)

# A divulgação é global (rodapé e /transparencia/); não se repete dentro de guia ou artigo.
PER_PAGE_DISCLOSURE = ("A DLT Academy pode receber uma recompensa", "Essa própria explicação é a transparência sobre o link")


class RegressionGuards(unittest.TestCase):
    def test_known_wrong_claims_and_internal_jargon_stay_out(self) -> None:
        for relative, phrase, why in FORBIDDEN:
            with self.subTest(page=relative, phrase=phrase):
                self.assertNotIn(phrase, (ROOT / relative).read_text(encoding="utf-8"), why)

    def test_china_guide_carries_no_receipt_identifiers(self) -> None:
        html = (ROOT / "guias/pagamentos-china/index.html").read_text(encoding="utf-8")
        for fragment in RECEIPT_FRAGMENTS:
            with self.subTest(fragment=fragment):
                self.assertNotIn(fragment, html, "dado de comprovante (cartão, hash ou ID) no texto público")

    def test_guides_and_articles_do_not_repeat_the_global_disclosure(self) -> None:
        pages = [*(ROOT / "guias").glob("*/index.html"), *(ROOT / "blog").glob("*/index.html")]
        for page in pages:
            text = page.read_text(encoding="utf-8")
            for phrase in PER_PAGE_DISCLOSURE:
                with self.subTest(page=page.relative_to(ROOT).as_posix(), phrase=phrase):
                    self.assertNotIn(phrase, text)



class PrivacyAndPublishingGuards(unittest.TestCase):
    def test_served_files_load_nothing_from_third_party_font_or_analytics_hosts(self) -> None:
        # O @import do Google Fonts mandou o IP de todo visitante ao Google; a CSP liberava analytics que não existia.
        for path in served_files():
            text = path.read_text(encoding="utf-8", errors="ignore")
            for host in THIRD_PARTY_HOSTS:
                with self.subTest(file=path.relative_to(ROOT).as_posix(), host=host):
                    self.assertNotIn(host, text)

    def test_every_page_csp_allows_only_the_site_itself(self) -> None:
        # A CSP aceitou gc.zgo.at, *.goatcounter.com e Google Fonts sem que o portal usasse nenhum deles.
        for path in html_pages():
            match = re.search(r'http-equiv="Content-Security-Policy"\s+content="([^"]+)"', path.read_text(encoding="utf-8"))
            with self.subTest(page=path.relative_to(ROOT).as_posix()):
                self.assertIsNotNone(match, "página sem CSP")
                csp = parse_csp(match.group(1))
                for directive in ("script-src", "style-src", "font-src", "connect-src"):
                    self.assertEqual("'self'", csp.get(directive), directive)

    def test_deploy_publishes_only_the_built_site(self) -> None:
        # O deploy com path: . publicou AGENTS.md, README.md, os .py, tests/ e .claude/launch.json.
        workflow = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
        self.assertRegex(workflow, r"(?m)^\s*path:\s*_site\s*$")
        self.assertNotRegex(workflow, r"(?m)^\s*path:\s*\.\s*$")
        self.assertIn("scripts/montar_site.sh", workflow)
        with tempfile.TemporaryDirectory() as tmp:
            site = Path(tmp) / "_site"
            result = subprocess.run(
                ["bash", str(ROOT / "scripts/montar_site.sh"), str(site)],
                capture_output=True, text=True,
            )
            self.assertEqual(0, result.returncode, result.stdout + result.stderr)
            published = [p.relative_to(site) for p in site.rglob("*")]
            self.assertTrue((site / "index.html").is_file())
            self.assertEqual([], [p.as_posix() for p in published if p.suffix in {".md", ".py"}])
            self.assertEqual([], [p.as_posix() for p in published if {"tests", ".claude", ".github"} & set(p.parts)])
            self.assertEqual([], [p.as_posix() for p in published if any(part.startswith(".") for part in p.parts)])

    def test_protocol_engine_can_erase_what_it_stored(self) -> None:
        # O plano ficava no localStorage para sempre, com o texto do veredito na chave, sem como apagar.
        engine = (ROOT / "js/protocol-engine.js").read_text(encoding="utf-8")
        self.assertIn("localStorage.removeItem(", engine)
        self.assertNotRegex(engine, r"key\s*=\s*result\.(?:tone|verdict)")
        self.assertNotRegex(engine, r"result\.verdict\s*\+\s*\"?:")
        self.assertNotIn("confirm(", engine)

    def test_privacy_page_is_published_and_linked_from_every_footer(self) -> None:
        # O site não tinha página de privacidade; ela só serve se for achada de qualquer página.
        self.assertTrue((ROOT / "privacidade/index.html").is_file())
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("<loc>https://dlt.academy/privacidade/</loc>", sitemap)
        for path in html_pages():
            footer = re.search(r"<footer.*?</footer>", path.read_text(encoding="utf-8"), re.DOTALL)
            if footer is None:
                continue  # página de redirecionamento, sem rodapé
            with self.subTest(page=path.relative_to(ROOT).as_posix()):
                self.assertIn('href="/privacidade/"', footer.group(0))


if __name__ == "__main__":
    unittest.main()

"""Página do Protocolo do Teto Financeiro (protocolos/teto-financeiro/).

Confere o contrato da página e do código que ela carrega: a ordem dos scripts, a CSP, a abertura
estática igual à da biblioteca, as palavras proibidas, nada de rede nem de HTML montado por texto,
e o gate de publicação (com rascunho na biblioteca a página fica noindex, fora do sitemap e do
registry). O que a página faz com as respostas (cuidado sem guardar, "nenhum" sem oferta, o .md,
o .ics) é conferido em tests/js/teto-ato1.test.mjs, no motor com DOM falso. Os testes não fixam
prosa: o texto vem da biblioteca e aqui só se compara com ela.
"""
from __future__ import annotations

import html
import json
import re
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from security_check import REQUIRED_CSP, parse_csp  # noqa: E402

PAGINA = ROOT / "protocolos" / "teto-financeiro" / "index.html"
ARQUIVOS = {
    "index.html": PAGINA,
    "biblioteca-teto.js": ROOT / "js" / "biblioteca-teto.js",
    "teto-regras.js": ROOT / "protocolos" / "teto-financeiro" / "js" / "teto-regras.js",
    "protocol.js": ROOT / "protocolos" / "teto-financeiro" / "js" / "protocol.js",
}
CANONICA = "https://dlt.academy/protocolos/teto-financeiro/"

# A ordem em que a página carrega os scripts: dados e funções puras antes do motor, o motor
# antes do protocolo que o chama.
SCRIPTS_EM_ORDEM = [
    "/js/content-registry.js",
    "/js/next-step.js",
    "/js/vendor/jspdf.umd.min.js",
    "/js/paid-reports.js",
    "/js/protocol-kit.js",
    "/js/biblioteca-teto.js",
    "/protocolos/teto-financeiro/js/teto-regras.js",
    "/js/protocol-engine.js",
    "/protocolos/teto-financeiro/js/protocol.js",
    "/blog/js/canvas-cards.js",
    "/js/dlt-interactions.js",
]

PROIBIDAS = [r"terapi", r"psicoterapi", r"tratamento", r"\blaudo", r"diagn[óo]stico psicol", r"teste psicol", r"reprograma[çc]"]
# Nada interno entra no código ou na página: o cofre, a ficha ou as notas de projeto.
MARCAS_PRIVADAS = ["Dknowledger", "project-management", "TaskNotes", "ferramenta-kit", "/Users/", "cofre", "ficha de arquitetura", "ARQUITETURA -"]


def texto(nome: str) -> str:
    return ARQUIVOS[nome].read_text(encoding="utf-8")


def biblioteca() -> dict:
    fonte = texto("biblioteca-teto.js")
    inicio = fonte.index("var BIBLIOTECA = ") + len("var BIBLIOTECA = ")
    fim = fonte.index(";\n\n  if (typeof module")
    return json.loads(fonte[inicio:fim])


class Pagina(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.scripts: list[dict[str, str]] = []
        self.ids: dict[str, dict[str, str]] = {}
        self.h1 = ""
        self.canonical = ""
        self.handlers: list[str] = []
        self._h1 = False
        self._abertura = 0
        self.abertura: list[str] = []
        self._buffer = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k.lower(): (v if v is not None else "") for k, v in attrs}
        self.handlers += [f"<{tag} {k}>" for k in a if k.startswith("on")]
        if a.get("id"):
            self.ids[a["id"]] = {"tag": tag, **a}
        if tag == "meta":
            self.meta[a.get("property") or a.get("name") or a.get("http-equiv", "").lower()] = a.get("content", "")
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        elif tag == "script":
            self.scripts.append(a)
        elif tag == "h1":
            self._h1 = True
        elif tag == "div" and a.get("id") == "protocol-abertura":
            self._abertura = 1
        elif tag == "p" and self._abertura:
            self._buffer = ""

    def handle_endtag(self, tag: str) -> None:
        if tag == "h1":
            self._h1 = False
        elif tag == "p" and self._abertura and self._buffer.strip():
            self.abertura.append(self._buffer.strip())
            self._buffer = ""
        elif tag == "div" and self._abertura:
            self._abertura = 0

    def handle_data(self, data: str) -> None:
        if self._h1:
            self.h1 += data
        if self._abertura:
            self._buffer += data


def pagina() -> Pagina:
    parser = Pagina()
    parser.feed(texto("index.html"))
    parser.close()
    return parser


def sitemap_locs() -> list[str]:
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))


def registry() -> list[dict]:
    fonte = (ROOT / "js" / "content-registry.js").read_text(encoding="utf-8")
    inicio = fonte.index("const CONTENT = ") + len("const CONTENT = ")
    return json.loads(fonte[inicio : fonte.rindex("];") + 1])


class PaginaDoTetoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.pagina = pagina()
        cls.bib = biblioteca()

    def test_scripts_na_ordem_certa_e_so_do_proprio_site(self) -> None:
        srcs = [s["src"] for s in self.pagina.scripts if s.get("src")]
        self.assertEqual(SCRIPTS_EM_ORDEM, srcs)
        for src in srcs:
            self.assertTrue(src.startswith("/"), f"script fora do site: {src}")
            self.assertTrue((ROOT / src.lstrip("/")).is_file(), f"script sem arquivo: {src}")
            self.assertNotRegex(src, r"^(?:https?:)?//")

    def test_so_o_json_ld_fica_inline_e_nao_ha_manipulador_inline(self) -> None:
        inline = [s for s in self.pagina.scripts if not s.get("src")]
        self.assertTrue(all(s.get("type") == "application/ld+json" for s in inline), "JavaScript inline")
        self.assertEqual([], self.pagina.handlers)

    def test_csp_so_deixa_o_proprio_site(self) -> None:
        csp = parse_csp(self.pagina.meta["content-security-policy"])
        for diretiva, valor in REQUIRED_CSP.items():
            self.assertEqual(valor, csp.get(diretiva), diretiva)
        self.assertNotIn("unsafe", self.pagina.meta["content-security-policy"])
        self.assertEqual("no-referrer", self.pagina.meta["referrer"])

    def test_a_pagina_tem_o_ponto_de_montagem_e_o_aviso_de_aplicativo_escondido(self) -> None:
        self.assertIn("protocol-mount", self.pagina.ids)
        aviso = self.pagina.ids["protocol-aviso-app"]
        self.assertIn("hidden", aviso, "o aviso só aparece quando o protocolo o liga")
        self.assertEqual("note", aviso.get("role"))
        self.assertTrue(
            re.search(r'id="protocol-aviso-app"[^>]*\bhidden\b', texto("index.html")),
            "o aviso começa escondido no HTML, para quem está sem JavaScript",
        )

    def test_abertura_estatica_e_a_da_biblioteca(self) -> None:
        abertura = self.bib["textos"]["abertura"]
        self.assertEqual(abertura["titulo"], self.pagina.h1.strip())
        self.assertEqual(abertura["paragrafos"], self.pagina.abertura)

    def test_canonica_e_og_provisoria(self) -> None:
        self.assertEqual(CANONICA, self.pagina.canonical)
        self.assertEqual(CANONICA, self.pagina.meta["og:url"])
        self.assertEqual(CANONICA + "og-image.png", self.pagina.meta["og:image"])
        self.assertTrue((ARQUIVOS["index.html"].parent / "og-image.png").is_file())
        self.assertTrue((ARQUIVOS["index.html"].parent / "og-image.svg").is_file())

    def test_palavras_proibidas_nem_negadas_so_diagnostico_em_nao_e_diagnostico(self) -> None:
        for nome, caminho in {**ARQUIVOS, "og-image.svg": ARQUIVOS["index.html"].parent / "og-image.svg"}.items():
            conteudo = html.unescape(caminho.read_text(encoding="utf-8"))
            for padrao in PROIBIDAS:
                with self.subTest(arquivo=nome, padrao=padrao):
                    self.assertIsNone(re.search(padrao, conteudo, re.IGNORECASE))
            with self.subTest(arquivo=nome, padrao="diagnóstico"):
                resto = re.sub(r"não é diagnóstico", "", conteudo, flags=re.IGNORECASE)
                self.assertIsNone(re.search(r"diagn[óo]stic", resto, re.IGNORECASE), '"diagnóstico" só em "não é diagnóstico"')

    def test_nada_interno_no_codigo_nem_na_pagina(self) -> None:
        for nome, caminho in ARQUIVOS.items():
            conteudo = caminho.read_text(encoding="utf-8")
            for marca in MARCAS_PRIVADAS:
                with self.subTest(arquivo=nome, marca=marca):
                    self.assertNotIn(marca.lower(), conteudo.lower())

    def test_o_protocolo_nao_monta_html_por_texto_nem_fala_com_a_rede(self) -> None:
        codigo = texto("protocol.js")
        proibidos = ("innerHTML", "outerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function", "confirm(", "alert(", "prompt(")
        for trecho in proibidos:
            with self.subTest(trecho=trecho):
                self.assertNotIn(trecho, codigo)
        for trecho in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "location.search", "location.href", "location.assign", "document.cookie"):
            with self.subTest(trecho=trecho):
                self.assertNotIn(trecho, codigo)

    def test_o_ato_1_nao_tem_oferta_nem_cria_endereco_com_resposta(self) -> None:
        codigo = texto("protocol.js")
        for trecho in ("relatorio", "PAID_REPORTS", "buildPaidReportOffer", "checkout", "#c=", "encodeURIComponent"):
            with self.subTest(trecho=trecho):
                self.assertNotIn(trecho, codigo)
        # O único endereço que o protocolo escreve é o da própria página, com o marco do retorno.
        enderecos = re.findall(r"https?://[^\s\"'`]+", codigo)
        self.assertEqual({"https://dlt.academy/protocolos/teto-financeiro/"}, set(enderecos))


class PublicacaoDoTetoTests(unittest.TestCase):
    """Com rascunho na biblioteca, a página anda no ar para o piloto, mas não aparece em lugar nenhum."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.bib = biblioteca()
        cls.pagina = pagina()

    def test_noindex_enquanto_a_biblioteca_for_rascunho(self) -> None:
        robots = self.pagina.meta.get("robots", "").lower()
        if self.bib["rascunho"] is True:
            self.assertIn("noindex", robots)
            self.assertIn("nofollow", robots)
        else:
            self.assertNotIn("noindex", robots, "sem rascunho, a página sai do noindex")

    def test_fora_do_sitemap_e_do_registry_enquanto_for_rascunho(self) -> None:
        if self.bib["rascunho"] is not True:
            self.skipTest("sem rascunho a publicação (sitemap e registry) é outra etapa")
        self.assertNotIn(CANONICA, sitemap_locs())
        for entrada in registry():
            with self.subTest(entrada=entrada["id"]):
                self.assertNotIn("teto", entrada["id"])
                self.assertNotEqual("/protocolos/teto-financeiro/", entrada["url"])

    def test_nenhuma_pagina_do_portal_aponta_para_o_piloto(self) -> None:
        if self.bib["rascunho"] is not True:
            self.skipTest("sem rascunho o piloto pode ter links")
        for caminho in ROOT.rglob("*.html"):
            relativo = caminho.relative_to(ROOT)
            if {"tests", "_site", ".git"} & set(relativo.parts) or relativo.as_posix() == "protocolos/teto-financeiro/index.html":
                continue
            with self.subTest(pagina=relativo.as_posix()):
                self.assertNotIn("protocolos/teto-financeiro", caminho.read_text(encoding="utf-8"))

    def test_o_piloto_avisa_que_e_versao_de_teste_enquanto_for_rascunho(self) -> None:
        if self.bib["rascunho"] is not True:
            self.skipTest("sem rascunho não há aviso de teste")
        self.assertRegex(texto("index.html"), r"versão de teste")


if __name__ == "__main__":
    unittest.main()

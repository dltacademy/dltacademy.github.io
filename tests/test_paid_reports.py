"""Contrato dos relatórios pagos.

O resultado gratuito é completo; o relatório pago é um bloco à parte, no
fim da página, que só aparece com checkout do Stripe. Nada
das respostas viaja para o provedor, e a oferta nunca entra no arquivo
pessoal (PDF/.md).
"""

import json
import re
import subprocess
import sys
import unittest
import zlib
from pathlib import Path

TESTS_DIR = Path(__file__).resolve().parent
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

from test_site_contract import PRIVATE_MARKERS  # noqa: E402


UTM_CHECKOUT_RE = (
    r"^https://relatorio\.dlt\.academy/comprar/[a-z0-9-]+"
    r"(?:\?utm_[a-z0-9_]+=[a-z0-9_-]+(?:&utm_[a-z0-9_]+=[a-z0-9_-]+)*)?$"
)


class PaidReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parents[1]
        cls.engine = (cls.root / "js/protocol-engine.js").read_text(encoding="utf-8")
        cls.catalog = (cls.root / "js/paid-reports.js").read_text(encoding="utf-8")
        cls.index = (cls.root / "protocolos/decisao-fria/index.html").read_text(encoding="utf-8")
        cls.protocol = (cls.root / "protocolos/decisao-fria/js/protocol.js").read_text(encoding="utf-8")
        cls.sales_page = (cls.root / "produtos/decisao-fria/index.html").read_text(encoding="utf-8")

    def test_catalogo_usa_link_curto_oficial_de_compra(self):
        hosts = re.search(r"PAID_REPORT_HOSTS = \[([^\]]*)\]", self.catalog)
        self.assertIsNotNone(hosts)
        self.assertEqual(
            sorted(re.findall(r'"([^"]+)"', hosts.group(1))),
            ["relatorio.dlt.academy"],
        )
        for url in re.findall(r'checkoutUrl: "([^"]*)"', self.catalog):
            with self.subTest(url=url):
                if url:
                    self.assertRegex(url, UTM_CHECKOUT_RE)
        ctas = re.findall(r'<a[^>]*class="sp-cta"[^>]*>', self.sales_page)
        self.assertEqual(3, len(ctas))
        for tag in ctas:
            href = re.search(r'href="([^"]+)"', tag)
            self.assertIsNotNone(href)
            self.assertRegex(href.group(1).replace("&amp;", "&"), UTM_CHECKOUT_RE)
            self.assertIn('rel="noopener noreferrer"', tag)
            self.assertIn('referrerpolicy="no-referrer"', tag)

    def test_motor_valida_https_e_host_antes_de_mostrar_oferta(self):
        start = self.engine.index("function paidReportCheckoutUrl")
        end = self.engine.index("function prepareProtocolPdfBrand")
        validator = self.engine[start:end]
        self.assertIn('url.protocol !== "https:"', validator)
        self.assertIn("PAID_REPORT_HOSTS", validator)
        self.assertIn("/^\\/comprar\\/[a-z0-9-]+$/", validator)
        self.assertIn("function paidReportPageUrl", validator)
        self.assertIn("/^\\/produtos\\/[a-z0-9-]+\\/$/", validator)
        builder = self.engine[self.engine.index("function buildPaidReportOffer"):start]
        self.assertIn("if (!checkout) return null", builder)
        self.assertIn("paidReportPageUrl(product.paginaUrl)", builder)
        self.assertIn('referrerpolicy", "no-referrer"', builder)
        self.assertIn("noopener noreferrer", builder)
        self.assertNotIn("innerHTML", builder)
        # Link próprio, não afiliado: sem sponsored.
        self.assertNotIn("sponsored", builder)

    def test_validadores_rejeitam_entradas_hostis(self):
        start = self.engine.index("function paidReportCheckoutUrl")
        end = self.engine.index("function prepareProtocolPdfBrand")
        validators_js = self.engine[start:end]
        script = (
            'const PAID_REPORT_HOSTS = ["relatorio.dlt.academy"];\n'
            + validators_js
            + """
const okCheckout = [
  "https://relatorio.dlt.academy/comprar/decisao-fria",
  "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=portal&utm_medium=protocolo",
];
const badCheckout = [
  "",
  "http://relatorio.dlt.academy/comprar/decisao-fria",
  "https://buy.stripe.com/8x25kF3zrcKPdvighW38400",
  "https://outro.exemplo/comprar/decisao-fria",
  "https://relatorio.dlt.academy/decisao-fria/",
  "https://relatorio.dlt.academy/comprar/decisao-fria?client_reference_id=x",
  "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=portal&resposta=segredo",
  "https://relatorio.dlt.academy/comprar/decisao-fria#frag",
  "https://user@relatorio.dlt.academy/comprar/decisao-fria",
  "https://relatorio.dlt.academy:8443/comprar/decisao-fria",
];
const okPage = ["/produtos/decisao-fria/"];
const badPage = ["", "/produtos/decisao-fria", "/produtos/../sobre/", "https://dlt.academy/produtos/decisao-fria/", "//evil.com/", "javascript:alert(1)", "/produtos/decisao-fria/?x=1", "/produtos/decisao-fria/#topo"];
console.log(JSON.stringify({
  okCheckout: okCheckout.every((u) => paidReportCheckoutUrl(u) === u),
  badCheckout: badCheckout.every((u) => paidReportCheckoutUrl(u) === null),
  okPage: okPage.every((u) => paidReportPageUrl(u) === u),
  badPage: badPage.every((u) => paidReportPageUrl(u) === null),
}));
"""
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        self.assertEqual(
            {"okCheckout": True, "badCheckout": True, "okPage": True, "badPage": True},
            json.loads(proc.stdout),
        )

    def test_botoes_de_compra_herdam_utm_da_visita(self):
        produtos_js = str(self.root / "produtos/produtos.js")
        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(produtos_js)}, "utf8");
const PORTAL = "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=portal&utm_medium=pagina-de-vendas&utm_content=topo";
function rodar(search, href = PORTAL) {{
  const link = {{ href, getAttribute() {{ return this.href; }}, setAttribute(k, v) {{ this[k] = v; }} }};
  global.window = {{ location: {{ search }} }};
  global.requestAnimationFrame = (fn) => fn();
  global.document = {{
    body: {{ onbeforematch: null }},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll(sel) {{ return sel.startsWith('a[href^="https://relatorio.dlt.academy/comprar/"]') ? [link] : []; }},
  }};
  eval(codigo);
  return link.href;
}}
console.log(JSON.stringify({{
  doVideo: rodar("?utm_source=video&utm_medium=short&utm_campaign=decisao-fria&utm_content=v1-obvia&foo=bar"),
  semUtm: rodar("?foo=bar"),
  vazio: rodar(""),
  controle: rodar("?utm_source=a%00b"),
  longo: rodar("?utm_source=" + "x".repeat(201)),
  outroHost: rodar("?utm_source=video", "https://evil.example/comprar/x?utm_source=portal"),
}}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual(
            "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=video&utm_medium=short&utm_campaign=decisao-fria&utm_content=v1-obvia&utm_term=topo",
            out["doVideo"],
        )
        portal = "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=portal&utm_medium=pagina-de-vendas&utm_content=topo"
        for caso in ("semUtm", "vazio", "controle", "longo"):
            self.assertEqual(portal, out[caso], caso)
        self.assertEqual("https://evil.example/comprar/x?utm_source=portal", out["outroHost"])

    def test_meta_pixel_inerte_sem_id_e_dispara_eventos_com_id(self):
        pixel_js = str(self.root / "produtos/meta-pixel.js")
        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(pixel_js)}, "utf8");
function rodar(pixelId) {{
  const scripts = [];
  const cliques = [];
  const link = {{ addEventListener(ev, fn) {{ if (ev === "click") cliques.push(fn); }} }};
  const main = {{
    getAttribute(k) {{
      if (k === "data-meta-pixel") return pixelId;
      if (k === "data-produto") return "decisao-fria";
      if (k === "data-preco") return "47";
      return null;
    }},
  }};
  global.window = {{}};
  global.document = {{
    head: {{ appendChild(el) {{ scripts.push(el); }} }},
    createElement(tag) {{ return {{ tag, async: false, src: "" }}; }},
    getElementsByTagName() {{ return []; }},
    querySelector(sel) {{ return sel === "main[data-produto]" ? main : null; }},
    querySelectorAll(sel) {{ return sel.startsWith('a[href^="https://relatorio.dlt.academy/comprar/"]') ? [link] : []; }},
  }};
  eval(codigo);
  cliques.forEach((fn) => fn());
  return {{
    scripts: scripts.map((s) => s.src),
    eventos: window.fbq ? window.fbq.queue.map((a) => Array.from(a)) : [],
  }};
}}
console.log(JSON.stringify({{
  vazio: rodar(""),
  invalido: rodar("abc123"),
  valido: rodar("123456789012345"),
}}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual({"scripts": [], "eventos": []}, out["vazio"])
        self.assertEqual({"scripts": [], "eventos": []}, out["invalido"])
        self.assertEqual(["https://connect.facebook.net/en_US/fbevents.js"], out["valido"]["scripts"])
        self.assertEqual(
            [
                ["init", "123456789012345"],
                ["track", "PageView"],
                ["track", "ViewContent", {"content_ids": ["decisao-fria"], "content_type": "product", "value": 47, "currency": "BRL"}],
                ["track", "InitiateCheckout", {"content_ids": ["decisao-fria"], "content_type": "product", "value": 47, "currency": "BRL"}],
            ],
            out["valido"]["eventos"],
        )

    def test_calculadora_da_pagina_de_vendas_ignora_vazio_e_bloqueia_submit(self):
        produtos_js = str(self.root / "produtos/produtos.js")
        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(produtos_js)}, "utf8");
function criarEl(extra = {{}}) {{
  const listeners = {{}};
  return Object.assign({{
    value: "", checked: false, hidden: false, textContent: "", className: "",
    dataset: {{}}, style: {{}}, validity: {{ badInput: false }},
    classList: {{ toggle() {{}} }},
    getAttribute(k) {{ return this[k] || null; }},
    setAttribute(k, v) {{ this[k] = v; }},
    removeAttribute(k) {{ delete this[k]; }},
    querySelector() {{ return null; }},
    querySelectorAll() {{ return []; }},
    closest() {{ return null; }},
    addEventListener(ev, fn) {{ (listeners[ev] ||= []).push(fn); }},
    dispatch(ev, obj = {{}}) {{ (listeners[ev] || []).forEach((fn) => fn(obj)); }},
  }}, extra);
}}
const valor = criarEl();
const perda = criarEl();
const alav = criarEl();
const saida = criarEl({{ hidden: true }});
const limite = criarEl();
const barraI = criarEl();
const barra = criarEl({{ querySelector: () => barraI }});
const msg = criarEl();
const resto = criarEl();
const ancora = criarEl({{ textContent: "Texto padrão", "data-preco": "47" }});
const form = criarEl({{
  querySelector(sel) {{
    return ({{ "[data-valor]": valor, "[data-perda]": perda, "[data-alavancagem]": alav,
      "[data-saida]": saida, "[data-limite]": limite, "[data-barra]": barra,
      "[data-msg]": msg, "[data-resto]": resto }})[sel] || null;
  }},
}});
global.window = {{}};
global.requestAnimationFrame = (fn) => fn();
global.document = {{
  body: {{ onbeforematch: null }},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll(sel) {{
    if (sel === "[data-calc-limite]") return [form];
    if (sel === "[data-ancora]") return [ancora];
    return [];
  }},
}};
eval(codigo);
// 1) Só valor preenchido e perda vazia: saída continua recolhida, âncora mantém padrão.
valor.value = "5000";
valor.dispatch("input");
const estadoPerdaVazia = {{ hidden: saida.hidden, ancora: ancora.textContent }};
// 2) Perda = 0 explícito: calcula limite R$ 0.
perda.value = "0";
perda.dispatch("input");
const estadoPerdaZero = {{ hidden: saida.hidden, limite: limite.textContent, ancora: ancora.textContent }};
// 3) Perda = 1500: calcula limite R$ 2.142 e atualiza âncora.
perda.value = "1500";
perda.dispatch("input");
const estadoPerdaPositiva = {{ hidden: saida.hidden, limite: limite.textContent, ancoraMudou: ancora.textContent !== "Texto padrão" }};
// 4) Submit bloqueado.
let bloqueouSubmit = false;
form.dispatch("submit", {{ preventDefault() {{ bloqueouSubmit = true; }} }});
console.log(JSON.stringify({{ estadoPerdaVazia, estadoPerdaZero, estadoPerdaPositiva, bloqueouSubmit }}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual({"hidden": True, "ancora": "Texto padrão"}, out["estadoPerdaVazia"])
        self.assertEqual({"hidden": False, "limite": "R$ 0", "ancora": "Texto padrão"}, out["estadoPerdaZero"])
        self.assertEqual({"hidden": False, "limite": "R$ 2.142", "ancoraMudou": True}, out["estadoPerdaPositiva"])
        self.assertTrue(out["bloqueouSubmit"])

    def test_teste_de_queda_da_pagina_de_vendas(self):
        produtos_js = str(self.root / "produtos/produtos.js")
        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(produtos_js)}, "utf8");
function criarEl(extra = {{}}) {{
  const listeners = {{}};
  return Object.assign({{
    value: "", checked: false, hidden: false, textContent: "", className: "",
    dataset: {{}}, style: {{}}, validity: {{ badInput: false }},
    classList: {{ toggle() {{}} }},
    getAttribute(k) {{ return this[k] || null; }},
    querySelector() {{ return null; }},
    querySelectorAll() {{ return []; }},
    closest() {{ return null; }},
    addEventListener(ev, fn) {{ (listeners[ev] ||= []).push(fn); }},
    dispatch(ev, obj = {{}}) {{ (listeners[ev] || []).forEach((fn) => fn(obj)); }},
  }}, extra);
}}
const segura = criarEl(), divers = criarEl(), alto = criarEl(), gasto = criarEl();
const saida = criarEl({{ hidden: true }}), perda = criarEl(), barraI = criarEl();
const barra = criarEl({{ querySelector: () => barraI }}), msg = criarEl(), resto = criarEl();
const ancora = criarEl({{ textContent: "Texto padrão", "data-preco": "47", "data-ancora-base": "queda" }});
const form = criarEl({{
  querySelector(sel) {{
    return ({{ "[data-segura]": segura, "[data-diversificada]": divers, "[data-alto]": alto, "[data-gasto]": gasto,
      "[data-saida]": saida, "[data-perda-teste]": perda, "[data-barra]": barra,
      "[data-msg]": msg, "[data-resto]": resto }})[sel] || null;
  }},
}});
global.window = {{}};
global.requestAnimationFrame = (fn) => fn();
global.document = {{
  body: {{ onbeforematch: null }},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll(sel) {{
    if (sel === "[data-calc-queda]") return [form];
    if (sel === "[data-ancora]") return [ancora];
    return [];
  }},
}};
eval(codigo);
const vazio = {{ hidden: saida.hidden, ancora: ancora.textContent }};
segura.value = "30000"; segura.dispatch("input");
const soSegura = {{ hidden: saida.hidden, perda: perda.textContent, barra: barraI.style.width }};
divers.value = "20000"; alto.value = "50000"; gasto.value = "5000"; alto.dispatch("input");
const fragil = {{ perda: perda.textContent, barra: barraI.style.width, msg: msg.textContent, ancoraMudou: ancora.textContent !== "Texto padrão" }};
alto.value = "-5"; alto.dispatch("input");
const negativo = {{ perda: perda.textContent }};
let bloqueou = false;
form.dispatch("submit", {{ preventDefault() {{ bloqueou = true; }} }});
console.log(JSON.stringify({{ vazio, soSegura, fragil, negativo, bloqueou }}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual({"hidden": True, "ancora": "Texto padrão"}, out["vazio"])
        self.assertEqual({"hidden": False, "perda": "R$ 0", "barra": "100%"}, out["soSegura"])
        # 30% de 20.000 + 80% de 50.000 = 46.000, 46% de 100.000: mais de um terço.
        self.assertEqual("R$ 46.000", out["fragil"]["perda"])
        self.assertEqual("54%", out["fragil"]["barra"])
        self.assertIn("mais de um terço", out["fragil"]["msg"])
        self.assertIn("9,2 meses", out["fragil"]["msg"])
        self.assertTrue(out["fragil"]["ancoraMudou"])
        # Valor negativo conta como zero: sobra só a parte diversificada.
        self.assertEqual("R$ 6.000", out["negativo"]["perda"])
        self.assertTrue(out["bloqueou"])

    def test_pagina_da_carteira_aponta_para_o_link_curto_e_nao_prescreve(self):
        html = (self.root / "produtos/carteira-aguenta/index.html").read_text(encoding="utf-8")
        self.assertNotIn("buy.stripe.com", html)
        ctas = re.findall(r'<a[^>]*class="sp-cta"[^>]*>', html)
        self.assertEqual(3, len(ctas))
        for content in ("topo", "oferta", "barra-celular"):
            self.assertIn("https://relatorio.dlt.academy/comprar/carteira-aguenta?utm_source=portal&amp;utm_medium=pagina-de-vendas&amp;utm_content=" + content, html)
        self.assertIn("data-calc-queda", html)
        self.assertIn("CVV", html)
        self.assertIn("não diz o que", html)
        self.assertIn("descreve a exposição real da carteira", html)
        self.assertIn("simula cenários de queda e estresse", html)

    def test_ctas_da_calculadora_herdam_utm_e_mantem_contrato(self):
        produtos_js = str(self.root / "produtos/produtos.js")
        for slug in ("decisao-fria", "carteira-aguenta"):
            html = (self.root / f"produtos/{slug}/index.html").read_text(encoding="utf-8")
            with self.subTest(produto=slug):
                calc_ctas = re.findall(r'<a[^>]*class="sp-calc-cta"[^>]*>', html)
                self.assertEqual(1, len(calc_ctas))
                tag = calc_ctas[0]
                href_match = re.search(r'href="([^"]+)"', tag)
                self.assertIsNotNone(href_match)
                raw_href = href_match.group(1).replace("&amp;", "&")
                self.assertRegex(raw_href, UTM_CHECKOUT_RE)
                self.assertTrue(raw_href.startswith(f"https://relatorio.dlt.academy/comprar/{slug}"))
                self.assertIn('rel="noopener noreferrer"', tag)
                self.assertIn('referrerpolicy="no-referrer"', tag)
                self.assertIn("data-saida hidden", html)
                saida_match = re.search(r'<div[^>]*data-saida hidden[^>]*>(.*?)</div>\s*</div>', html, re.S)
                self.assertIsNotNone(saida_match)
                self.assertIn('class="sp-calc-cta"', saida_match.group(1))

                script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(produtos_js)}, "utf8");
const link = {{
  href: {json.dumps(raw_href)},
  getAttribute() {{ return this.href; }},
  setAttribute(k, v) {{ this[k] = v; }}
}};
global.window = {{ location: {{ search: "?utm_source=yt&utm_medium=video&utm_campaign={slug}&utm_content=hook1" }} }};
global.requestAnimationFrame = (fn) => fn();
global.document = {{
  body: {{ onbeforematch: null }},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll(sel) {{ return sel.startsWith('a[href^="https://relatorio.dlt.academy/comprar/"]') ? [link] : []; }},
}};
eval(codigo);
console.log(link.href);
"""
                proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
                self.assertEqual(
                    f"https://relatorio.dlt.academy/comprar/{slug}?utm_source=yt&utm_medium=video&utm_campaign={slug}&utm_content=hook1&utm_term=calculadora",
                    proc.stdout.strip(),
                )

    def test_exemplos_pdf_existem_limpos_e_links_sao_seguros(self):
        specs = (
            ("decisao-fria", "exemplo-relatorio-decisao-fria.pdf", 7),
            ("carteira-aguenta", "exemplo-relatorio-carteira-aguenta.pdf", 6),
            ("mapa-do-seu-teto", "exemplo-relatorio-mapa-do-seu-teto.pdf", 8),
        )
        for slug, filename, expected_pages in specs:
            pdf_path = self.root / "produtos" / slug / filename
            html = (self.root / f"produtos/{slug}/index.html").read_text(encoding="utf-8")
            with self.subTest(produto=slug):
                self.assertTrue(pdf_path.is_file(), f"PDF ausente: {pdf_path}")
                raw = pdf_path.read_bytes()
                self.assertTrue(raw.startswith(b"%PDF-"))
                self.assertIn(b"%%EOF", raw[-64:])
                self.assertIn(b"/Producer (jsPDF", raw)
                pages = len(re.findall(rb"/Type\s*/Page\b(?!s)", raw))
                self.assertEqual(expected_pages, pages)
                chunks = [raw]
                for m in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", raw, re.S):
                    try:
                        chunks.append(zlib.decompress(m.group(1)))
                    except zlib.error:
                        pass
                decoded = b"\n".join(chunks).decode("latin1", errors="ignore").lower()
                for marker in PRIVATE_MARKERS:
                    self.assertNotIn(marker.lower(), decoded, f"marcador proibido no PDF: {marker}")

                links = re.findall(r'<a[^>]*class="sp-pdf-exemplo"[^>]*>', html)
                self.assertEqual(1, len(links))
                tag = links[0]
                self.assertIn(f'href="/produtos/{slug}/{filename}"', tag)
                self.assertIn('target="_blank"', tag)
                self.assertIn('rel="noopener noreferrer"', tag)
                self.assertIn('referrerpolicy="no-referrer"', tag)

    def test_pix_biografia_entregas_e_datas_alinhadas(self):
        # Datas atualizadas em 2026-11-26 para home, paginas de vendas e legais.
        datas_por_arquivo = {
            "index.html": "2026-11-26",
            "termos/index.html": "2027-01-01",
            "privacidade/index.html": "2027-01-01",
            "js/paid-reports.js": None,
            "produtos/decisao-fria/index.html": "2026-11-26",
            "produtos/carteira-aguenta/index.html": "2026-11-26",
            "produtos/mapa-do-seu-teto/index.html": "2026-11-27",
            "produtos/mapa-do-seu-teto-vsl/index.html": "2026-11-27",
            "produtos/mapa-do-seu-teto-video/index.html": "2026-11-27",
        }
        for rel, expected_date in datas_por_arquivo.items():
            with self.subTest(arquivo=rel):
                text = (self.root / rel).read_text(encoding="utf-8")
                self.assertIn("Pix", text)
                self.assertIn("Stripe", text)
                if rel.endswith(".html") and expected_date:
                    self.assertIn(f'"dateModified": "{expected_date}"', text)
        for legal in ("termos/index.html", "privacidade/index.html"):
            text = (self.root / legal).read_text(encoding="utf-8")
            self.assertIn('<time datetime="2027-01-01">1 de janeiro de 2027</time>', text)
        for slug in ("decisao-fria", "carteira-aguenta", "mapa-do-seu-teto"):
            html = (self.root / f"produtos/{slug}/index.html").read_text(encoding="utf-8")
            with self.subTest(sales_page=slug):
                self.assertIn("<strong>Tiago · Fundador da DLT Academy</strong>", html)
                bio_links = re.findall(r'<a[^>]*href="https://tiago\.dlt\.academy/"[^>]*>', html)
                self.assertEqual(1, len(bio_links))
                self.assertIn('target="_blank"', bio_links[0])
                self.assertIn('rel="noopener noreferrer"', bio_links[0])
                self.assertIn('referrerpolicy="no-referrer"', bio_links[0])
                if slug in ("decisao-fria", "carteira-aguenta"):
                    self.assertIn("simulador interativo", html.lower())
                    self.assertIn(".ics", html)

    def test_pagina_de_vendas_nao_fica_orfa_no_portal(self):
        self.assertIn('paginaUrl: "/produtos/decisao-fria/"', self.catalog)
        self.assertIn('paginaUrl: "/produtos/mapa-do-seu-teto/"', self.catalog)
        for rel in (
            "index.html",
            "blog/fomo-investimentos-depois-da-alta/index.html",
            "transparencia/index.html",
        ):
            with self.subTest(page=rel):
                html = (self.root / rel).read_text(encoding="utf-8")
                self.assertIn('href="/produtos/decisao-fria/"', html)
        self.assertIn('href="/produtos/mapa-do-seu-teto/"', (self.root / "transparencia/index.html").read_text(encoding="utf-8"))

    def test_oferta_nao_carrega_respostas_nem_entra_no_arquivo(self):
        builder = self.engine[
            self.engine.index("function buildPaidReportOffer"):self.engine.index("function paidReportCheckoutUrl")
        ]
        self.assertNotIn("answers", builder)
        self.assertNotIn("searchParams", builder)
        self.assertIn("suas respostas continuam só no seu navegador", builder)
        self.assertIn("7 dias para pedir reembolso", builder)
        pdf = self.engine[self.engine.index("function downloadProtocolPdf"):self.engine.index("function safePdfText")]
        markdown = self.engine[self.engine.index("function buildMarkdown"):self.engine.index("function downloadTextFile")]
        for part in (pdf, markdown):
            self.assertNotIn("relatorio", part)
            self.assertNotIn("PAID_REPORTS", part)

    def test_oferta_e_o_ultimo_bloco_depois_do_proximo_passo_e_do_cta(self):
        self.assertLess(self.engine.index('id = "next-step-mount"'), self.engine.index("const cta = result.cta"))
        self.assertLess(self.engine.index("const cta = result.cta"), self.engine.index("buildPaidReportOffer(ref, el)"))

    def test_catalogo_carrega_antes_do_motor(self):
        catalog = '<script src="/js/paid-reports.js"></script>'
        engine = '<script src="/js/protocol-engine.js"></script>'
        self.assertIn(catalog, self.index)
        self.assertLess(self.index.index(catalog), self.index.index(engine))

    def test_perfis_do_protocolo_existem_no_catalogo(self):
        perfis_usados = set()
        for expr in re.findall(r"relatorio: ofertas\((.+)\),\n", self.protocol):
            perfis_usados |= set(re.findall(r'"([a-z]+)"', expr)) - {"aumentar", "semana"}
        self.assertEqual(perfis_usados, {"recuperacao", "alavancagem", "pressa", "metodo"})
        for perfil in perfis_usados:
            with self.subTest(perfil=perfil):
                self.assertIn(f"      {perfil}: {{", self.catalog)

    def test_ramo_de_vulnerabilidade_nao_tem_oferta_paga(self):
        start = self.protocol.index('if (a.impacto === "compromete")')
        end = self.protocol.index('if (a.intencao === "recuperar")')
        self.assertNotIn("relatorio", self.protocol[start:end])
        self.assertEqual(5, self.protocol.count("relatorio: ofertas("))

    def test_decisao_fria_tem_uma_oferta_so(self):
        # Relatório do caso + Dossiê numa compra só: o protocolo aponta para
        # uma entrada, e o catálogo não tem outra do mesmo protocolo.
        self.assertEqual(1, self.protocol.count("produto: "))
        self.assertIn('return { produto: "decisao-fria", perfil };', self.protocol)
        # O catálogo pode ter outras entradas (de outros protocolos); a Decisão fria tem uma só.
        self.assertEqual(1, len(re.findall(r'^  "decisao-fria": \{', self.catalog, re.M)))

    def test_personalizado_declara_aviso_de_envio_das_respostas(self):
        oferta = self.catalog[self.catalog.index('"decisao-fria"'):]
        self.assertIn('plataforma: "Stripe"', oferta)
        self.assertIn("as respostas são enviadas uma vez", oferta.lower())
        self.assertIn("7 dias para pedir reembolso", oferta)
        self.assertIn("não recomendação de investimento", oferta)
        self.assertIn("product.aviso ||", self.engine)

    def test_decisao_fria_segue_a_regra_dos_verbos_ativos(self):
        self.assertEqual(7, len(re.findall(r'eyebrow: "\d de 7', self.protocol)))
        self.assertEqual(3, self.protocol.count('type: "write"'))
        for tone in ('tone: "bad"', 'tone: "mixed"', 'tone: "good"'):
            self.assertIn(tone, self.protocol)
        self.assertIn("safety: safetyNote", self.protocol)
        self.assertIn('pdfSubject:', self.protocol)

    def test_oferta_propaga_utms_para_checkout_e_pagina(self):
        engine_js = str(self.root / "js/protocol-engine.js")
        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(engine_js)}, "utf8");
const trecho = codigo.slice(codigo.indexOf("function appendPaidOfferUtms"), codigo.indexOf("function prepareProtocolPdfBrand"));
const stub = `
function paidReportCheckoutUrl(v) {{
  const u = new URL(v);
  return /^\\\\?utm_[a-z0-9_]+=[a-z0-9_-]+(?:&utm_[a-z0-9_]+=[a-z0-9_-]+)*$/.test(u.search) ? u.href : null;
}}
global.window = {{ location: {{ search: "?utm_source=Meta&utm_medium=pago&utm_campaign=teto&utm_content=TF-HIST&foo=ignored" }} }};
`;
eval(stub + trecho);
console.log(JSON.stringify({{
  checkout: appendPaidOfferUtms("https://relatorio.dlt.academy/comprar/teto-avancado?utm_source=portal&utm_content=oferta", true),
  pagina: appendPaidOfferUtms("/produtos/mapa-do-seu-teto/", false),
}}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual(
            "https://relatorio.dlt.academy/comprar/teto-avancado?utm_source=meta&utm_medium=pago&utm_campaign=teto&utm_content=tf-hist&utm_term=oferta",
            out["checkout"],
        )
        self.assertEqual(
            "/produtos/mapa-do-seu-teto/?utm_source=meta&utm_medium=pago&utm_campaign=teto&utm_content=tf-hist",
            out["pagina"],
        )

    def test_graficos_resistencia_no_mapa_do_teto(self):
        html = (self.root / "produtos/mapa-do-seu-teto/index.html").read_text(encoding="utf-8")
        proto_html = (self.root / "protocolos/teto-financeiro/index.html").read_text(encoding="utf-8")
        css = (self.root / "produtos/produtos.css").read_text(encoding="utf-8")
        produtos_js = str(self.root / "produtos/produtos.js")
        self.assertIn("data-teto-graficos", html)
        self.assertIn("data-teto-blindagem", html)
        self.assertEqual(2, html.count('<figure class="sp-graf-card'))
        self.assertIn('id="graf-estagna-titulo"', html)
        self.assertIn('id="graf-queda-titulo"', html)
        self.assertIn('id="graf-blindagem-titulo"', html)
        self.assertIn("data-graf-repetir", html)
        self.assertIn("data-graf-pausar", html)
        self.assertIn("Reflexo de Retorno ao Patamar", html)
        self.assertIn("Garantia do Espelho Real", html)
        self.assertIn('id="funciona-mesmo"', html)
        self.assertNotIn("—", html)
        self.assertNotIn(" style=", html)
        self.assertIn("@media (prefers-reduced-motion: no-preference)", css)
        # Metadados do protocolo gratuito alinhados à linha de resistência.
        self.assertNotIn("o que segura o seu dinheiro", proto_html)
        self.assertIn("mesmo patamar", proto_html)

        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(produtos_js)}, "utf8");
function rodar(reduzido) {{
  let cbObs = null;
  let cliqueRep = null;
  let cliquePausa = null;
  let timersAtivos = 0;
  const classes = new Set();
  const botaoRep = {{ addEventListener(ev, fn) {{ if (ev === "click") cliqueRep = fn; }} }};
  const botaoPausa = {{ textContent: "Pausar animação", addEventListener(ev, fn) {{ if (ev === "click") cliquePausa = fn; }} }};
  const raiz = {{
    dataset: {{}},
    offsetWidth: 0,
    hasAttribute(k) {{ return k === "data-teto-graficos"; }},
    classList: {{
      add(c) {{ classes.add(c); }},
      remove(c) {{ classes.delete(c); }},
      has(c) {{ return classes.has(c); }},
    }},
    querySelector(sel) {{
      if (sel === "[data-graf-repetir]") return botaoRep;
      if (sel === "[data-graf-pausar]") return botaoPausa;
      return null;
    }},
  }};
  global.setTimeout = () => {{ timersAtivos += 1; return timersAtivos; }};
  global.clearTimeout = () => {{ if (timersAtivos > 0) timersAtivos -= 1; }};
  global.window = {{
    matchMedia: () => ({{ matches: reduzido }}),
    IntersectionObserver: class {{
      constructor(fn) {{ cbObs = fn; }}
      observe() {{}}
      disconnect() {{}}
    }},
  }};
  global.IntersectionObserver = global.window.IntersectionObserver;
  global.requestAnimationFrame = (fn) => fn();
  global.document = {{
    body: {{ onbeforematch: null }},
    visibilityState: "visible",
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll(sel) {{ return sel.includes("[data-teto-graficos]") ? [raiz] : []; }},
  }};
  eval(codigo);
  const antes = {{ pronto: raiz.dataset.grafPronto || null, tocando: classes.has("tocando") }};
  if (cbObs) cbObs([{{ isIntersecting: true }}]);
  const aposEntrar = {{ tocando: classes.has("tocando"), agendou: timersAtivos > 0 }};
  if (cliquePausa) cliquePausa();
  const aposPausar = {{ tocando: classes.has("tocando"), texto: botaoPausa.textContent, timers: timersAtivos }};
  if (cliqueRep) cliqueRep();
  const aposRepetir = {{ tocando: classes.has("tocando"), texto: botaoPausa.textContent }};
  return {{ antes, aposEntrar, aposPausar, aposRepetir }};
}}
console.log(JSON.stringify({{ normal: rodar(false), reduzido: rodar(true) }}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual({"pronto": "1", "tocando": False}, out["normal"]["antes"])
        self.assertEqual({"tocando": True, "agendou": True}, out["normal"]["aposEntrar"])
        self.assertEqual({"tocando": False, "texto": "Reproduzir animação", "timers": 0}, out["normal"]["aposPausar"])
        self.assertEqual({"tocando": True, "texto": "Pausar animação"}, out["normal"]["aposRepetir"])
        self.assertEqual({"pronto": None, "tocando": False}, out["reduzido"]["antes"])
        self.assertEqual({"tocando": False, "texto": "Pausar animação"}, out["reduzido"]["aposRepetir"])

    def test_decisao_fria_alinhamento_mecanismo_e_funil(self):
        html = self.sales_page
        mapa_html = (self.root / "produtos/mapa-do-seu-teto/index.html").read_text(encoding="utf-8")
        home_html = (self.root / "index.html").read_text(encoding="utf-8")
        proto_html = self.index
        proto_js = self.protocol

        # Mecanismo, prova visual, comparativo, kit, objecoes e garantia nomeada na LP do Decisao Fria
        self.assertIn("Ilusão da Certeza no Calor", html)
        self.assertIn("data-df-limites", html)
        self.assertIn('id="graf-df-limites-titulo"', html)
        self.assertIn('id="diferenca"', html)
        self.assertIn("sp-kit-bloco", html)
        self.assertIn('id="funciona-mesmo"', html)
        self.assertIn("Garantia da Cabeça Fria", html)
        self.assertNotIn("—", html)
        self.assertNotIn("!", html.replace("<!DOCTYPE html>", "", 1))
        self.assertNotIn(" style=", html)
        self.assertNotIn("um a dois minutos", html.lower())
        self.assertNotIn("1 a 2 minutos", html.lower())

        # Limpeza de gatilhos de cripto na LP e no protocolo gratuito do Decisao Fria
        for texto in (html.lower(), proto_html.lower(), proto_js.lower()):
            self.assertNotIn("cripto", texto)
        self.assertNotIn("gema", html.lower())
        self.assertNotIn("primeiros-passos-cripto", proto_js.lower())

        # Alinhamento bidirecional do funil Teto <-> Decisao Fria e home atualizada
        self.assertIn('href="/produtos/decisao-fria/"', mapa_html)
        self.assertIn('href="/produtos/mapa-do-seu-teto/"', html)
        self.assertIn("por que o crescimento trava ou devolve?", home_html)
        self.assertIn("(R$ 47 e R$ 148)", home_html)

    def test_calculadora_pico_media_do_mapa_do_teto(self):
        html = (self.root / "produtos/mapa-do-seu-teto/index.html").read_text(encoding="utf-8")
        produtos_js = str(self.root / "produtos/produtos.js")
        self.assertIn("data-calc-teto", html)
        self.assertIn('data-ancora-base="teto"', html)
        self.assertIn("sp-kit-bloco", html)
        self.assertIn("sp-kit-grid-2", html)
        self.assertIn("Distância acumulada em 12 meses", html)
        # A partir de 01/01/2027 o Mapa tem valor regular único: sem campanha, sem prazo de lançamento e sem bônus de preço travado.
        self.assertIn("R$ 148", html)
        self.assertIn('data-preco="148"', html)
        for ausente in ("Ciclo de Virada", "31/12", "31 de dezembro", "R$ 97", "lançamento", "Preço travado"):
            self.assertNotIn(ausente, html)
        self.assertNotIn("Isso tem nome.", html)
        self.assertNotIn("data-vsl-slot", html)
        self.assertNotIn("—", html)
        self.assertNotIn("!", html.replace("<!DOCTYPE html>", "", 1))
        self.assertNotIn(" style=", html)

        script = f"""
const fs = require("node:fs");
const codigo = fs.readFileSync({json.dumps(produtos_js)}, "utf8");
function criarEl(extra = {{}}) {{
  const listeners = {{}};
  return Object.assign({{
    value: "", checked: false, hidden: false, textContent: "", className: "",
    dataset: {{}}, style: {{}}, validity: {{ badInput: false }},
    classList: {{ toggle() {{}} }},
    getAttribute(k) {{ return this[k] || null; }},
    querySelector() {{ return null; }},
    querySelectorAll() {{ return []; }},
    closest() {{ return null; }},
    addEventListener(ev, fn) {{ (listeners[ev] ||= []).push(fn); }},
    dispatch(ev, obj = {{}}) {{ (listeners[ev] || []).forEach((fn) => fn(obj)); }},
  }}, extra);
}}
const pico = criarEl(), media = criarEl();
const saida = criarEl({{ hidden: true }}), gapEl = criarEl(), anualEl = criarEl();
const barraI = criarEl(), barra = criarEl({{ querySelector: () => barraI }}), msg = criarEl(), resto = criarEl();
const ancora = criarEl({{ textContent: "Texto padrão", "data-preco": "148", "data-ancora-base": "teto" }});
const form = criarEl({{
  querySelector(sel) {{
    return ({{ "[data-pico]": pico, "[data-media]": media, "[data-saida]": saida,
      "[data-gap]": gapEl, "[data-gap-anual]": anualEl, "[data-barra]": barra,
      "[data-msg]": msg, "[data-resto]": resto }})[sel] || null;
  }},
}});
global.window = {{}};
global.requestAnimationFrame = (fn) => fn();
global.document = {{
  body: {{ onbeforematch: null }},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll(sel) {{
    if (sel === "[data-calc-teto]") return [form];
    if (sel === "[data-ancora]") return [ancora];
    return [];
  }},
}};
eval(codigo);
// 1) Só pico preenchido: saída continua recolhida, âncora padrão.
pico.value = "15000";
pico.dispatch("input");
const estadoVazio = {{ hidden: saida.hidden, ancora: ancora.textContent }};
// 2) Pico igual à média: mostra R$ 0/mês sem alterar a âncora padrão.
media.value = "15000";
media.dispatch("input");
const estadoIgual = {{ hidden: saida.hidden, gap: gapEl.textContent, ancora: ancora.textContent }};
// 3) Pico 15000 e média 9000: mostra distância de R$ 6.000/mês, R$ 72.000/ano e 2,5% na âncora.
media.value = "9000";
media.dispatch("input");
const estadoGap = {{ hidden: saida.hidden, gap: gapEl.textContent, anual: anualEl.textContent, largura: barraI.style.width, ancora: ancora.textContent }};
// 4) Submit bloqueado.
let bloqueouSubmit = false;
form.dispatch("submit", {{ preventDefault() {{ bloqueouSubmit = true; }} }});
console.log(JSON.stringify({{ estadoVazio, estadoIgual, estadoGap, bloqueouSubmit }}));
"""
        proc = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
        out = json.loads(proc.stdout)
        self.assertEqual({"hidden": True, "ancora": "Texto padrão"}, out["estadoVazio"])
        self.assertEqual({"hidden": False, "gap": "R$ 0/mês", "ancora": "Texto padrão"}, out["estadoIgual"])
        self.assertEqual("R$ 6.000/mês", out["estadoGap"]["gap"])
        self.assertEqual("R$ 72.000/ano", out["estadoGap"]["anual"])
        self.assertEqual("60%", out["estadoGap"]["largura"])
        self.assertIn("2,5%", out["estadoGap"]["ancora"])
        self.assertTrue(out["bloqueouSubmit"])

    def test_tres_paginas_do_mapa_alinhadas_a_definicao_canonica_e_vsl(self):
        texto = (self.root / "produtos/mapa-do-seu-teto/index.html").read_text(encoding="utf-8")
        vsl = (self.root / "produtos/mapa-do-seu-teto-vsl/index.html").read_text(encoding="utf-8")
        hibrida = (self.root / "produtos/mapa-do-seu-teto-video/index.html").read_text(encoding="utf-8")

        # LP só-texto: conceito canônico (termostato, porta de mola, autoverificação, 4 razões do externo, motor 3 camadas, sem Hendricks).
        self.assertIn("termostato", texto.lower())
        self.assertIn("porta de mola", texto.lower())
        self.assertIn("autoverificação", texto.lower())
        self.assertIn("sp-externo-grid", texto)
        self.assertIn("sp-leituras-3", texto)
        self.assertIn("sistema proprietário de agentes especializados", texto.lower())
        self.assertNotIn("Gay Hendricks", texto)

        # Páginas com vídeo: noindex enquanto o MP4 não está publicado, sem ID interno nem "2 min", com o valor regular de R$ 148 e Garantia do Espelho Real.
        for nome, html in (("vsl", vsl), ("hibrida", hibrida)):
            with self.subTest(pagina=nome):
                self.assertIn('content="noindex, follow"', html)
                self.assertIn("R$ 148", html)
                self.assertIn('data-preco="148"', html)
                for ausente in ("Ciclo de Virada", "31/12", "31 de dezembro", "R$ 97", "lançamento", "Preço travado"):
                    self.assertNotIn(ausente, html)
                self.assertIn("Garantia do Espelho Real", html)
                self.assertIn("Quero o Mapa do meu Teto", html)
                self.assertNotIn("TETO-VSL-01", html)
                self.assertNotIn("vídeo de 2 min", html.lower())
                self.assertNotIn("duração: ~2 min", html.lower())
                self.assertNotIn("—", html)
                self.assertNotIn("!", html.replace("<!DOCTYPE html>", "", 1))
                self.assertNotIn(" style=", html)
                ctas = re.findall(r'<a[^>]*class="sp-cta"[^>]*>', html)
                self.assertEqual(3, len(ctas))
                for tag in ctas:
                    href = re.search(r'href="([^"]+)"', tag)
                    self.assertIsNotNone(href)
                    self.assertRegex(href.group(1).replace("&amp;", "&"), UTM_CHECKOUT_RE)

        # Híbrida traz Kit 2x2 (4 ferramentas), motor 3 camadas e 4 casos de exemplo.
        self.assertIn("sp-kit-grid-2", hibrida)
        self.assertIn("sp-leituras-3", hibrida)
        self.assertIn("FALTA REAL DE CAIXA", hibrida)

        # Catálogo sem travessão e com o 8º padrão delegar-sem-olhar.
        self.assertIn('"delegar-sem-olhar"', self.catalog)
        self.assertNotIn("—", self.catalog.split("const PAID_REPORTS")[1])


if __name__ == "__main__":
    unittest.main()

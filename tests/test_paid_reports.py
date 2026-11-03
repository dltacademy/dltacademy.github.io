"""Contrato dos relatórios pagos.

O resultado gratuito é completo; o relatório pago é um bloco à parte, no
fim da página, que só aparece com checkout do Stripe. Nada
das respostas viaja para o provedor, e a oferta nunca entra no arquivo
pessoal (PDF/.md).
"""

import json
import re
import subprocess
import unittest
from pathlib import Path


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

    def test_pagina_de_vendas_nao_fica_orfa_no_portal(self):
        self.assertIn('paginaUrl: "/produtos/decisao-fria/"', self.catalog)
        for rel in (
            "index.html",
            "blog/fomo-investimentos-depois-da-alta/index.html",
            "transparencia/index.html",
        ):
            with self.subTest(page=rel):
                html = (self.root / rel).read_text(encoding="utf-8")
                self.assertIn('href="/produtos/decisao-fria/"', html)

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
        self.assertEqual(["decisao-fria"], re.findall(r'^  "([a-z-]+)": \{', self.catalog, re.M))

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


if __name__ == "__main__":
    unittest.main()

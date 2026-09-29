"""Contrato dos relatórios pagos.

O resultado gratuito é completo; o relatório pago é um bloco à parte, no
fim da página, que só aparece com checkout de um provedor permitido. Nada
das respostas viaja para o provedor, e a oferta nunca entra no arquivo
pessoal (PDF/.md).
"""

import re
import unittest
from pathlib import Path


class PaidReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parents[1]
        cls.engine = (cls.root / "js/protocol-engine.js").read_text(encoding="utf-8")
        cls.catalog = (cls.root / "js/paid-reports.js").read_text(encoding="utf-8")
        cls.index = (cls.root / "protocolos/decisao-fria/index.html").read_text(encoding="utf-8")
        cls.protocol = (cls.root / "protocolos/decisao-fria/js/protocol.js").read_text(encoding="utf-8")

    def test_catalogo_so_aceita_checkout_de_provedor_gerenciado(self):
        hosts = re.search(r"PAID_REPORT_HOSTS = \[([^\]]*)\]", self.catalog)
        self.assertIsNotNone(hosts)
        self.assertEqual(
            sorted(re.findall(r'"([^"]+)"', hosts.group(1))),
            ["pay.hotmart.com"],
        )
        for url in re.findall(r'checkoutUrl: "([^"]*)"', self.catalog):
            with self.subTest(url=url):
                if url:
                    self.assertRegex(url, r"^https://pay\.hotmart\.com/")

    def test_motor_valida_https_e_host_antes_de_mostrar_oferta(self):
        start = self.engine.index("function paidReportCheckoutUrl")
        end = self.engine.index("function prepareProtocolPdfBrand")
        validator = self.engine[start:end]
        self.assertIn('url.protocol !== "https:"', validator)
        self.assertIn("PAID_REPORT_HOSTS", validator)
        builder = self.engine[self.engine.index("function buildPaidReportOffer"):start]
        self.assertIn("if (!checkout) return null", builder)
        self.assertIn('referrerpolicy", "no-referrer"', builder)
        self.assertIn("noopener noreferrer", builder)
        self.assertNotIn("innerHTML", builder)
        # Link próprio, não afiliado: sem sponsored.
        self.assertNotIn("sponsored", builder)

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
        self.assertLess(self.engine.index("const cta = result.cta"), self.engine.index("buildPaidReportOffer(result.relatorio"))

    def test_catalogo_carrega_antes_do_motor(self):
        catalog = '<script src="/js/paid-reports.js"></script>'
        engine = '<script src="/js/protocol-engine.js"></script>'
        self.assertIn(catalog, self.index)
        self.assertLess(self.index.index(catalog), self.index.index(engine))

    def test_perfis_do_protocolo_existem_no_catalogo(self):
        perfis_usados = set()
        for expr in re.findall(r"perfil: ([^}]+)\}", self.protocol):
            perfis_usados |= set(re.findall(r'"(recuperacao|alavancagem|pressa|metodo|[a-z]+)"', expr)) - {"aumentar", "semana"}
        self.assertEqual(perfis_usados, {"recuperacao", "alavancagem", "pressa", "metodo"})
        for perfil in perfis_usados:
            with self.subTest(perfil=perfil):
                self.assertIn(f"      {perfil}: {{", self.catalog)

    def test_ramo_de_vulnerabilidade_nao_tem_oferta_paga(self):
        start = self.protocol.index('if (a.impacto === "compromete")')
        end = self.protocol.index('if (a.intencao === "recuperar")')
        self.assertNotIn("relatorio", self.protocol[start:end])
        self.assertEqual(5, self.protocol.count('relatorio: { produto: "decisao-fria"'))

    def test_decisao_fria_segue_a_regra_dos_verbos_ativos(self):
        self.assertEqual(7, len(re.findall(r'eyebrow: "\d de 7', self.protocol)))
        self.assertEqual(3, self.protocol.count('type: "write"'))
        for tone in ('tone: "bad"', 'tone: "mixed"', 'tone: "good"'):
            self.assertIn(tone, self.protocol)
        self.assertIn("safety: safetyNote", self.protocol)
        self.assertIn('pdfSubject:', self.protocol)


if __name__ == "__main__":
    unittest.main()

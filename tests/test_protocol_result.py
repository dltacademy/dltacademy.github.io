import unittest
from pathlib import Path


class ProtocolResultTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parents[1]
        cls.index = (cls.root / "protocolos/medo-de-ficar-de-fora/index.html").read_text(encoding="utf-8")
        cls.engine = (cls.root / "js/protocol-engine.js").read_text(encoding="utf-8")
        cls.protocol = (
            cls.root / "protocolos/medo-de-ficar-de-fora/js/protocol.js"
        ).read_text(encoding="utf-8")
        cls.styles = (cls.root / "protocolos/styles-protocols.css").read_text(encoding="utf-8")

    def test_jspdf_e_auto_hospedado_e_carregado_antes_do_motor(self):
        vendor_src = '<script src="/js/vendor/jspdf.umd.min.js"></script>'
        engine_src = '<script src="/js/protocol-engine.js"></script>'
        self.assertIn(vendor_src, self.index)
        self.assertLess(self.index.index(vendor_src), self.index.index(engine_src))
        self.assertNotIn("unpkg.com", self.index)
        self.assertNotIn("cdnjs.cloudflare.com", self.index)
        self.assertIn("script-src 'self' https://gc.zgo.at", self.index)

    def test_botao_pdf_nao_usa_impressao(self):
        self.assertNotIn("window.print", self.engine)
        self.assertIn('"Baixar meu resultado em PDF"', self.engine)
        self.assertIn("doc.save(protocol.slug + \"-resultado.pdf\")", self.engine)
        self.assertIn('loadLocalImageAsDataUrl("/assets/dlt-logo.png")', self.engine)

    def test_pdf_inclui_resultado_registro_aviso_e_rodape_sem_cta(self):
        start = self.engine.index("function downloadProtocolPdf")
        end = self.engine.index("function safePdfText")
        pdf_builder = self.engine[start:end]
        for field in ("result.verdict", "result.body", "result.record", "result.safety"):
            self.assertIn(field, pdf_builder)
        self.assertIn("dlt.academy/protocolos/medo-de-ficar-de-fora", pdf_builder)
        self.assertIn("Reflexão estruturada — não é terapia nem recomendação de investimento", pdf_builder)
        self.assertNotIn("result.cta", pdf_builder)
        self.assertNotIn("cta.href", pdf_builder)
        self.assertNotIn("disclosure", pdf_builder)

    def test_todos_os_quatro_vereditos_tem_proximo_passo_util(self):
        self.assertEqual(4, self.protocol.count('tipo: "artigo"'))
        self.assertNotIn('tipo: "none"', self.protocol)
        self.assertNotIn('tipo: "presente"', self.protocol)
        self.assertIn("https://primeiros-passos-cripto.dlt.academy/", self.protocol)
        self.assertIn("https://sobrevive-ou-quebra.dlt.academy/", self.protocol)

    def test_resultado_tem_hierarquia_e_mobile_sem_estouro(self):
        self.assertIn(".protocol-verdict-panel", self.styles)
        self.assertIn("grid-template-columns: minmax(140px, .72fr) minmax(0, 1.28fr)", self.styles)
        self.assertIn("overflow-wrap: anywhere", self.styles)
        self.assertIn(".protocol-actions .btn,", self.styles)
        self.assertIn("width: 100%", self.styles)
        self.assertIn("padding: 24px 0 0", self.styles)

    def test_vendor_e_build_umd_min_licenciada(self):
        vendor = self.root / "js/vendor/jspdf.umd.min.js"
        license_file = self.root / "js/vendor/jspdf.LICENSE.txt"
        self.assertTrue(vendor.is_file())
        self.assertGreater(vendor.stat().st_size, 300_000)
        head = vendor.read_text(encoding="utf-8")[:2500]
        self.assertIn("jsPDF - PDF Document creation from JavaScript", head)
        self.assertIn("Version 4.2.1", head)
        self.assertIn("Permission is hereby granted", head)
        self.assertTrue(license_file.is_file())
        self.assertIn("Permission is hereby granted", license_file.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()

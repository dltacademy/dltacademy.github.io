"""Protocolos interativos: PDF, privacidade do resultado e licença do vendor.

Não trava rótulos de botão, nomes de classe nem valores de CSS. O que fica é
comportamento e decisão de produto: o PDF é gerado no navegador (sem CDN e sem
impressão), não leva CTA nem divulgação e todo veredito termina em um próximo passo.
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ProtocolResultTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.index = (ROOT / "protocolos/medo-de-ficar-de-fora/index.html").read_text(encoding="utf-8")
        cls.engine = (ROOT / "js/protocol-engine.js").read_text(encoding="utf-8")
        cls.protocol = (ROOT / "protocolos/medo-de-ficar-de-fora/js/protocol.js").read_text(encoding="utf-8")

    def test_jspdf_is_self_hosted_and_loaded_before_the_engine(self) -> None:
        vendor = '<script src="/js/vendor/jspdf.umd.min.js"></script>'
        engine = '<script src="/js/protocol-engine.js"></script>'
        self.assertIn(vendor, self.index)
        self.assertLess(self.index.index(vendor), self.index.index(engine))
        for cdn in ("unpkg.com", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"):
            self.assertNotIn(cdn, self.index)

    def test_pdf_is_generated_not_printed(self) -> None:
        self.assertNotIn("window.print", self.engine)
        self.assertIn("doc.save(", self.engine)

    def test_pdf_has_the_result_and_no_sales_content(self) -> None:
        start = self.engine.index("function downloadProtocolPdf")
        end = self.engine.index("function safePdfText")
        builder = self.engine[start:end]
        for field in ("result.verdict", "result.body", "result.record", "result.plan", "result.safety"):
            with self.subTest(field=field):
                self.assertIn(field, builder)
        for banned in ("result.cta", "cta.href", "disclosure"):
            with self.subTest(banned=banned):
                self.assertNotIn(banned, builder)

    def test_share_never_carries_the_answers(self) -> None:
        self.assertIn("window.location.origin + window.location.pathname", self.engine)

    def test_every_verdict_ends_in_a_next_step(self) -> None:
        self.assertNotIn('tipo: "none"', self.protocol)

    def test_vendor_build_ships_its_license(self) -> None:
        vendor = ROOT / "js/vendor/jspdf.umd.min.js"
        license_file = ROOT / "js/vendor/jspdf.LICENSE.txt"
        self.assertTrue(vendor.is_file())
        self.assertIn("jsPDF", vendor.read_text(encoding="utf-8")[:2500])
        self.assertTrue(license_file.is_file())
        self.assertIn("Permission is hereby granted", license_file.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()

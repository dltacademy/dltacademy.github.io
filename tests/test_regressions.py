"""Guardas de regressão: erros que já saíram publicados ou vazaram uma vez.

Regra da casa: entra aqui só um erro factual, de privacidade ou de jargão
interno que já aconteceu, sempre com o motivo. Frase certa não é contrato,
porque texto bom precisa poder mudar sem editar teste.
"""
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

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


if __name__ == "__main__":
    unittest.main()

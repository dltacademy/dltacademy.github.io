"""A página de privacidade diz o que o Protocolo do Teto guarda, por quanto tempo e como apagar."""

import re
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]


class PrivacidadeDoTetoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        html = (RAIZ / "privacidade" / "index.html").read_text(encoding="utf-8")
        achado = re.search(r'<section class="page-section" aria-labelledby="teto-financeiro">(.*?)</section>', html, re.S)
        cls.secao = achado.group(1) if achado else ""
        cls.html = html

    def test_a_secao_do_teto_existe_e_cobre_o_que_a_ficha_pede(self) -> None:
        self.assertTrue(self.secao, "seção do Teto")
        for trecho in ("só na aba", "120 dias", "Apagar minhas respostas", ".ics", ".md", "Copiar o link do meu registro", "nunca são guardadas"):
            with self.subTest(trecho=trecho):
                self.assertIn(trecho, self.secao)

    def test_diz_que_nada_vai_para_nos_e_que_a_contagem_esta_desligada(self) -> None:
        self.assertIn("não é enviado para nós nem para ninguém", self.secao)
        self.assertIn("não conta visitas nem cliques por enquanto", self.secao)

    def test_sem_palavra_proibida(self) -> None:
        for padrao in (r"terapi", r"psicoterapi", r"tratamento", r"\blaudo", r"diagn[óo]stico", r"teste psicol", r"reprograma[çc]"):
            with self.subTest(padrao=padrao):
                self.assertIsNone(re.search(padrao, self.secao, re.I))

    def test_a_secao_tem_titulo_unico(self) -> None:
        self.assertEqual(1, self.html.count('id="teto-financeiro"'))


if __name__ == "__main__":
    unittest.main()

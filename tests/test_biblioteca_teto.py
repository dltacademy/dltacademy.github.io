"""Confere a estrutura de js/biblioteca-teto.js lendo o arquivo como o navegador o recebe.

O objeto fica em JSON estrito dentro do arquivo; aqui ele é lido com json.loads, sem
Node, e as regras de forma são conferidas de novo (referências entre as peças, escadas,
tríades equilibradas, opções "contra" e palavras proibidas). Os testes não fixam prosa.
"""
from __future__ import annotations

import json
import re
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARQUIVO = ROOT / "js" / "biblioteca-teto.js"

PADROES = [
    "ganho-que-escorre", "freio-na-cobranca", "passo-que-nao-sai", "decisao-no-calor",
    "progresso-sem-trilho", "dinheiro-nao-combina", "caixa-da-familia",
]
VARIANTES = {"passo-que-nao-sai": ["medo-de-errar", "nao-estou-pronto"], "decisao-no-calor": ["emocao-do-momento", "virar-o-jogo"]}
FAMILIAS = ["evitar", "idolatrar", "status", "vigilancia", "lealdade"]
PROIBIDAS = [r"terapi", r"tratamento", r"\blaudo", r"diagn[óo]stico psicol", r"teste psicol", r"reprograma[çc]"]


def ler_biblioteca() -> dict:
    fonte = ARQUIVO.read_text(encoding="utf-8")
    inicio = fonte.index("var BIBLIOTECA = ") + len("var BIBLIOTECA = ")
    fim = fonte.index(";\n\n  if (typeof module")
    return json.loads(fonte[inicio:fim])


def textos(valor) -> list[str]:
    if isinstance(valor, str):
        return [valor]
    if isinstance(valor, list):
        return [t for v in valor for t in textos(v)]
    if isinstance(valor, dict):
        return [t for v in valor.values() for t in textos(v)]
    return []


def escadas(padrao: dict) -> list[dict]:
    return [padrao["escada"]] if "escada" in padrao else list(padrao.get("escada_por_variante", {}).values())


class BibliotecaTetoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bib = ler_biblioteca()

    def test_json_estrito_com_versao_e_rascunho(self) -> None:
        fonte = ARQUIVO.read_text(encoding="utf-8")
        inicio = fonte.index("var BIBLIOTECA = ") + len("var BIBLIOTECA = ")
        fim = fonte.index(";\n\n  if (typeof module")

        def sem_constantes(nome: str):
            raise ValueError(f"constante fora do JSON estrito: {nome}")

        json.loads(fonte[inicio:fim], parse_constant=sem_constantes)
        self.assertEqual("2026.11-1", self.bib["versao"])
        self.assertIs(True, self.bib["rascunho"])
        self.assertIn("root.BIBLIOTECA_TETO", fonte)
        self.assertIn("module.exports", fonte)

    def test_sete_padroes_e_variantes_so_nos_padroes_3_e_4(self) -> None:
        self.assertEqual(sorted(PADROES), sorted(self.bib["padroes"]))
        for pid in PADROES:
            self.assertEqual(VARIANTES.get(pid, []), self.bib["padroes"][pid]["variantes"], pid)

    def test_cada_padrao_tem_degraus_se_entao_metrica_sinais_leitura_e_trava(self) -> None:
        for pid in PADROES:
            p = self.bib["padroes"][pid]
            with self.subTest(padrao=pid):
                self.assertTrue(p["sinais_opcoes"])
                self.assertTrue(p["leitura"]["base"])
                self.assertTrue(p["trava"]["texto"])
                lista = escadas(p)
                self.assertTrue(lista)
                for e in lista:
                    for chave in ("degrau0", "degrau2", "degrau3", "se_entao_exemplo", "metrica"):
                        self.assertTrue(e[chave], chave)
                    self.assertTrue(e["degrau1"])

    def test_padroes_3_e_4_tem_escada_propria_por_variante(self) -> None:
        for pid, variantes in VARIANTES.items():
            p = self.bib["padroes"][pid]
            self.assertNotIn("escada", p)
            self.assertEqual(sorted(variantes), sorted(p["escada_por_variante"]))
            self.assertEqual(sorted(variantes), sorted(p["leitura"]["por_variante"]))

    def test_toda_opcao_de_cena_aponta_para_padrao_e_variante_validos(self) -> None:
        self.assertEqual(8, len(self.bib["cenas"]))
        vistos: set[str] = set()
        for cena in self.bib["cenas"]:
            self.assertIn(cena["padrao_principal"], PADROES)
            self.assertEqual("nao_acontece", cena["nao_acontece"]["value"])
            for o in cena["opcoes"]:
                self.assertNotIn(o["value"], vistos)
                vistos.add(o["value"])
                self.assertIn(o["padrao"], PADROES, o["value"])
                self.assertIn(o["tipo"], ("sinal", "contra"), o["value"])
                if "variante" in o:
                    self.assertIn(o["variante"], VARIANTES.get(o["padrao"], []), o["value"])

    def test_cada_padrao_tem_opcao_contra_e_sinal(self) -> None:
        todas = [o for c in self.bib["cenas"] for o in c["opcoes"]]
        for pid in PADROES:
            with self.subTest(padrao=pid):
                self.assertTrue([o for o in todas if o["padrao"] == pid and o["tipo"] == "contra"])
                self.assertTrue([o for o in todas if o["padrao"] == pid and o["tipo"] == "sinal"])

    def test_quinze_itens_cinco_triades_com_tres_familias_diferentes(self) -> None:
        itens = self.bib["itens"]
        self.assertEqual(15, len(itens))
        self.assertEqual({f: 3 for f in FAMILIAS}, dict(Counter(i["familia"] for i in itens.values())))
        triades = self.bib["triades"]
        self.assertEqual(5, len(triades))
        aparicoes: Counter[str] = Counter()
        for t in triades:
            familias = [itens[i]["familia"] for i in t["itens"]]
            self.assertEqual(3, len(set(familias)), t["id"])
            aparicoes.update(familias)
        self.assertEqual({f: 3 for f in FAMILIAS}, dict(aparicoes))
        self.assertEqual(sorted(itens), sorted(i for t in triades for i in t["itens"]))

    def test_ids_no_formato(self) -> None:
        for pid in PADROES:
            self.assertRegex(pid, r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")
        for iid in self.bib["itens"]:
            self.assertRegex(iid, r"^(evitar|idolatrar|status|vigilancia|lealdade)_[1-9]$")
        for cena in self.bib["cenas"]:
            self.assertRegex(cena["id"], r"^cena_[a-z]+$")
            for o in cena["opcoes"]:
                self.assertRegex(o["value"], r"^[a-z][a-z0-9]*(_[a-z0-9]+)*$")
        self.assertEqual(["olhou", "preco_cheio", "extra", "pedido_amanha", "sobrou"], [f["id"] for f in self.bib["fatos"]])

    def test_nenhuma_palavra_proibida_em_nenhum_texto(self) -> None:
        todos = textos(self.bib)
        self.assertGreater(len(todos), 300)
        for texto in todos:
            for padrao in PROIBIDAS:
                self.assertIsNone(re.search(padrao, texto, re.IGNORECASE), f"{padrao}: {texto}")
            resto = re.sub(r"não é diagnóstico", "", texto, flags=re.IGNORECASE)
            self.assertIsNone(re.search(r"diagn[óo]stic", resto, re.IGNORECASE), f"diagnóstico solto: {texto}")

    def test_arquivo_sem_referencia_privada(self) -> None:
        fonte = ARQUIVO.read_text(encoding="utf-8").lower()
        for marca in ("dknowledger", "project-management", "tasknotes", "/users/", "ferramenta-kit"):
            self.assertNotIn(marca, fonte)


if __name__ == "__main__":
    unittest.main()

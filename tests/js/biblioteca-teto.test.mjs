// Estrutura de js/biblioteca-teto.js: JSON estrito, referências entre as peças,
// escadas, tríades equilibradas, opções "contra" e palavras proibidas.
// Os testes conferem a forma, não a prosa.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const caminho = fileURLToPath(new URL("../../js/biblioteca-teto.js", import.meta.url));
const bib = require("../../js/biblioteca-teto.js");

const PADROES = [
  "ganho-que-escorre", "freio-na-cobranca", "passo-que-nao-sai", "decisao-no-calor",
  "progresso-sem-trilho", "dinheiro-nao-combina", "caixa-da-familia",
];
const VARIANTES = ["medo-de-errar", "nao-estou-pronto", "emocao-do-momento", "virar-o-jogo"];
const FAMILIAS = ["evitar", "idolatrar", "status", "vigilancia", "lealdade"];
const AREAS = ["ganhar", "guardar", "decidir", "dar"];
const RE_KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const RE_SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

const PROIBIDAS = [/terapi/i, /psicoterapi/i, /tratamento/i, /\blaudo/i, /diagn[óo]stico psicol/i, /teste psicol/i, /reprograma[çc]/i];

function textos(valor, saida = []) {
  if (typeof valor === "string") saida.push(valor);
  else if (Array.isArray(valor)) valor.forEach((v) => textos(v, saida));
  else if (valor && typeof valor === "object") Object.values(valor).forEach((v) => textos(v, saida));
  return saida;
}

function todasAsEscadas(padrao) {
  return padrao.escada ? [padrao.escada] : Object.values(padrao.escada_por_variante || {});
}

test("o arquivo guarda o objeto em JSON estrito e é o mesmo que o require devolve", () => {
  const fonte = fs.readFileSync(caminho, "utf8");
  const inicio = fonte.indexOf("var BIBLIOTECA = ") + "var BIBLIOTECA = ".length;
  const fim = fonte.indexOf(";\n\n  if (typeof module");
  assert.ok(inicio > 20 && fim > inicio);
  const lido = JSON.parse(fonte.slice(inicio, fim));
  assert.deepEqual(lido, bib);
});

test("a raiz traz a versão, o rascunho e as constantes da regra", () => {
  assert.equal(bib.versao, "2026.11-1");
  assert.equal(bib.rascunho, true);
  const esperadas = [
    "PESO_CUSTO", "LIMIAR_TETO", "MIN_MARCAS", "LIMIAR_VAZAMENTO", "DELTA_TRILHAS", "LIMIAR_FAMILIA",
    "LIMIAR_FAMILIA_GRADE", "LIMIAR_FRACA", "LIMIAR_FRACA_GRADE", "CONFIANCA_MINIMA", "HUMOR_AVISO",
  ];
  assert.deepEqual(Object.keys(bib.regras).sort(), esperadas.slice().sort());
  assert.equal(bib.regras.CONFIANCA_MINIMA, 6);
  assert.equal(bib.regras.HUMOR_AVISO, 3);
  assert.equal(bib.regras.LIMIAR_TETO, 0.34);
});

test("rascunho verdadeiro em qualquer objeto exige rascunho verdadeiro na raiz", () => {
  let achou = false;
  (function andar(v) {
    if (v && typeof v === "object") {
      if (v.rascunho === true) achou = true;
      Object.values(v).forEach(andar);
    }
  })(bib);
  assert.ok(achou);
  assert.equal(bib.rascunho, true);
});

test("os sete padrões, as quatro variantes, as cinco famílias e os ids no formato da ficha", () => {
  assert.deepEqual(Object.keys(bib.padroes).sort(), PADROES.slice().sort());
  assert.deepEqual(Object.keys(bib.variantes).sort(), VARIANTES.slice().sort());
  assert.deepEqual(Object.keys(bib.familias), FAMILIAS);
  PADROES.forEach((id) => assert.match(id, RE_KEBAB));
  VARIANTES.forEach((id) => assert.match(id, RE_KEBAB));
  Object.keys(bib.itens).forEach((id) => assert.match(id, /^(evitar|idolatrar|status|vigilancia|lealdade)_[1-9]$/));
  bib.triades.forEach((t) => assert.match(t.id, /^triade_[1-9]$/));
  bib.cenas.forEach((c) => {
    assert.match(c.id, /^cena_[a-z]+$/);
    c.opcoes.forEach((o) => assert.match(o.value, RE_SNAKE));
  });
  bib.fatos.forEach((f) => assert.match(f.id, RE_SNAKE));
  const ordens = PADROES.map((id) => bib.padroes[id].ordem);
  assert.deepEqual(ordens, [1, 2, 3, 4, 5, 6, 7]);
  PADROES.forEach((id) => {
    const p = bib.padroes[id];
    assert.ok(["ganho", "retencao"].includes(p.trilha), id);
    assert.ok(AREAS.includes(p.area), id);
    p.familias_ligadas.forEach((f) => assert.ok(FAMILIAS.includes(f), id + " " + f));
  });
  const ganho = PADROES.filter((id) => bib.padroes[id].trilha === "ganho").map((id) => bib.padroes[id].ordem);
  assert.deepEqual(ganho, [2, 3, 6]);
  AREAS.forEach((a) => assert.ok(PADROES.some((id) => bib.padroes[id].area === a), a));
});

test("só os padrões 3 e 4 têm variantes, e cada variante aponta para o padrão certo", () => {
  PADROES.forEach((id) => {
    const p = bib.padroes[id];
    const esperadas = id === "passo-que-nao-sai" ? ["medo-de-errar", "nao-estou-pronto"] : id === "decisao-no-calor" ? ["emocao-do-momento", "virar-o-jogo"] : [];
    assert.deepEqual(p.variantes, esperadas, id);
    p.variantes.forEach((v) => assert.equal(bib.variantes[v].padrao, id));
  });
});

test("todo padrão tem degraus 0 a 3, se-então, métrica, sinais, leitura e trava", () => {
  PADROES.forEach((id) => {
    const p = bib.padroes[id];
    assert.ok(p.nome && p.empurrao && p.protege, id);
    assert.ok(p.frase_tipica.length >= 1, id);
    assert.ok(p.regra_trabalho_exemplo, id);
    assert.ok(p.sinais_gerais.length >= 1, id);
    assert.ok(p.sinais_opcoes.length >= 3, id);
    p.sinais_opcoes.forEach((o) => {
      assert.match(o.value, RE_SNAKE);
      assert.ok(o.label, id);
    });
    assert.equal(new Set(p.sinais_opcoes.map((o) => o.value)).size, p.sinais_opcoes.length, id);
    assert.ok(p.leitura.base, id);
    assert.ok(p.trava.texto, id);
    const escadas = todasAsEscadas(p);
    assert.ok(escadas.length >= 1, id);
    escadas.forEach((e) => {
      ["degrau0", "degrau2", "degrau3", "se_entao_exemplo", "metrica"].forEach((k) => assert.ok(typeof e[k] === "string" && e[k], id + "." + k));
      assert.ok(Array.isArray(e.degrau1) && e.degrau1.length >= 1, id);
      e.degrau1.forEach((o) => {
        assert.match(o.value, RE_SNAKE);
        assert.ok(o.label);
      });
    });
  });
});

test("os padrões 3 e 4 têm as duas variantes, cada uma com escada, leitura e se-então próprios", () => {
  ["passo-que-nao-sai", "decisao-no-calor"].forEach((id) => {
    const p = bib.padroes[id];
    assert.equal(p.escada, undefined, id);
    assert.deepEqual(Object.keys(p.escada_por_variante).sort(), p.variantes.slice().sort(), id);
    p.variantes.forEach((v) => assert.ok(p.leitura.por_variante[v], v));
    const [a, b] = p.variantes.map((v) => p.escada_por_variante[v]);
    assert.notEqual(a.degrau1[0].label, b.degrau1[0].label);
    assert.notEqual(a.se_entao_exemplo, b.se_entao_exemplo);
    assert.notEqual(a.degrau0, b.degrau0);
  });
  ["ganho-que-escorre", "freio-na-cobranca", "progresso-sem-trilho", "dinheiro-nao-combina", "caixa-da-familia"].forEach((id) => {
    assert.ok(bib.padroes[id].escada, id);
    assert.equal(bib.padroes[id].escada_por_variante, undefined, id);
  });
});

test("a trava por renda existe nos padrões 1 e 5 com as três rendas", () => {
  ["ganho-que-escorre", "progresso-sem-trilho"].forEach((id) => {
    const por = bib.padroes[id].trava.por_renda;
    assert.deepEqual(Object.keys(por).sort(), ["fixa", "mista", "variavel"], id);
  });
  assert.deepEqual(bib.telas.renda.opcoes.map((o) => o.value).sort(), ["fixa", "mista", "variavel"]);
});

test("as oito cenas: toda opção aponta para um padrão (e uma variante) que existe", () => {
  assert.deepEqual(bib.cenas.map((c) => c.id), [
    "cena_extra", "cena_cobrar", "cena_risco", "cena_emocao", "cena_plano", "cena_semanas", "cena_circulo", "cena_pedido",
  ]);
  const vistos = new Set();
  bib.cenas.forEach((c) => {
    assert.ok(PADROES.includes(c.padrao_principal), c.id);
    assert.ok(c.prompt && c.empurrao, c.id);
    assert.deepEqual(c.nao_acontece, { value: "nao_acontece", label: "Isso não acontece comigo" });
    assert.ok(c.opcoes.length >= 4 && c.opcoes.length <= 6, c.id);
    c.opcoes.forEach((o) => {
      assert.ok(!vistos.has(o.value), "valor repetido " + o.value);
      vistos.add(o.value);
      assert.ok(PADROES.includes(o.padrao), o.value);
      assert.ok(["sinal", "contra"].includes(o.tipo), o.value);
      assert.ok(o.label, o.value);
      if (o.variante !== undefined) {
        assert.equal(o.tipo, "sinal", o.value);
        assert.ok(VARIANTES.includes(o.variante), o.value);
        assert.equal(bib.variantes[o.variante].padrao, o.padrao, o.value);
      }
    });
  });
  assert.ok(!vistos.has("nao_acontece"));
});

test("a contagem de sinais por padrão e por variante é a do esqueleto aprovado", () => {
  const sinais = {};
  const porVariante = {};
  bib.cenas.forEach((c) => c.opcoes.filter((o) => o.tipo === "sinal").forEach((o) => {
    sinais[o.padrao] = (sinais[o.padrao] || 0) + 1;
    if (o.variante) porVariante[o.variante] = (porVariante[o.variante] || 0) + 1;
  }));
  assert.deepEqual(sinais, {
    "ganho-que-escorre": 4, "freio-na-cobranca": 4, "passo-que-nao-sai": 6, "decisao-no-calor": 5,
    "progresso-sem-trilho": 4, "dinheiro-nao-combina": 4, "caixa-da-familia": 5,
  });
  assert.deepEqual(porVariante, { "medo-de-errar": 3, "nao-estou-pronto": 3, "emocao-do-momento": 2, "virar-o-jogo": 3 });
});

test("cada padrão tem pelo menos uma opção contra, e todo padrão tem sinais", () => {
  PADROES.forEach((id) => {
    const todas = bib.cenas.flatMap((c) => c.opcoes).filter((o) => o.padrao === id);
    assert.ok(todas.some((o) => o.tipo === "contra"), "sem contra: " + id);
    assert.ok(todas.some((o) => o.tipo === "sinal"), "sem sinal: " + id);
  });
});

test("os itens: 15, três por família, cada um em uma só tríade", () => {
  const ids = Object.keys(bib.itens);
  assert.equal(ids.length, 15);
  FAMILIAS.forEach((f) => {
    assert.equal(ids.filter((i) => bib.itens[i].familia === f).length, 3, f);
    assert.deepEqual(bib.familias[f].itens.slice().sort(), ids.filter((i) => bib.itens[i].familia === f).sort(), f);
    assert.ok(bib.familias[f].nome && bib.familias[f].leitura, f);
  });
  ids.forEach((i) => assert.ok(bib.itens[i].texto, i));
  const usados = bib.triades.flatMap((t) => t.itens);
  assert.deepEqual(usados.slice().sort(), ids.slice().sort());
});

test("as cinco tríades: três famílias diferentes em cada, e cada família exatamente três vezes", () => {
  assert.equal(bib.triades.length, 5);
  const contagem = {};
  bib.triades.forEach((t) => {
    assert.equal(t.itens.length, 3, t.id);
    t.itens.forEach((i) => assert.ok(bib.itens[i], i));
    const familias = t.itens.map((i) => bib.itens[i].familia);
    assert.equal(new Set(familias).size, 3, t.id);
    familias.forEach((f) => { contagem[f] = (contagem[f] || 0) + 1; });
  });
  assert.deepEqual(contagem, { evitar: 3, idolatrar: 3, status: 3, vigilancia: 3, lealdade: 3 });
});

test("as opções das telas e os fatos têm ids e rótulos", () => {
  const t = bib.telas;
  ["clima_casa", "terreno", "alivio", "para_que", "desconforto", "desgrudar", "renda"].forEach((k) => {
    assert.ok(t[k].opcoes.length >= 3, k);
    t[k].opcoes.forEach((o) => {
      assert.match(o.value, RE_SNAKE);
      assert.ok(o.label, k);
    });
  });
  assert.ok(t.terreno.opcoes.some((o) => o.value === t.terreno.exclusiva));
  assert.deepEqual(t.desconforto.opcoes.map((o) => o.value), ["sim", "em_parte", "nao"]);
  assert.deepEqual(t.variante["passo-que-nao-sai"].opcoes.map((o) => o.value), ["medo-de-errar", "nao-estou-pronto"]);
  assert.deepEqual(t.variante["decisao-no-calor"].opcoes.map((o) => o.value), ["emocao-do-momento", "virar-o-jogo"]);
  assert.deepEqual(t.frases_grade.opcoes.map((o) => o.value), [0, 1, 2, 3]);
  assert.deepEqual(bib.fatos.map((f) => f.id), ["olhou", "preco_cheio", "extra", "pedido_amanha", "sobrou"]);
  bib.fatos.forEach((f) => {
    assert.equal(f.direcao, 1);
    assert.deepEqual(f.opcoes.map((o) => o.value), [0, 1, 2, 3, 4]);
    assert.equal(f.na.value, "na");
  });
});

test("o cuidado: chão, humor ativo, sinais de risco com exclusiva e os cinco que levam à ajuda", () => {
  const c = bib.cuidado;
  assert.deepEqual(c.chao.itens.map((i) => i.id), ["contas", "divida", "risco"]);
  assert.equal(c.humor.ativo, true);
  assert.deepEqual(c.humor.itens.map((i) => i.id), ["interesse", "animo"]);
  assert.deepEqual(c.humor.opcoes.map((o) => o.value), [0, 1, 2, 3]);
  const valores = c.sinais_risco.opcoes.map((o) => o.value);
  assert.ok(valores.includes(c.sinais_risco.exclusiva));
  assert.deepEqual(c.sinais_risco.ajuda, ["apostar_sem_parar", "recuperar_perda", "esconder", "comprar_sem_parar", "nada_vai_melhorar"]);
  c.sinais_risco.ajuda.forEach((v) => assert.ok(valores.includes(v), v));
  const texto = textos(c.textos).join(" ");
  assert.match(texto, /188/);
  assert.match(texto, /192/);
  assert.match(texto, /CAPS/);
});

test("os retornos e os planos existem, com as sete datas-chave do arco de 7 dias", () => {
  ["dia3", "dia7", "dia30", "dia90", "sinais", "semana", "continuar"].forEach((m) => assert.ok(bib.retornos[m], m));
  assert.deepEqual(bib.planos.arco7.map((d) => d.dia), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(bib.planos.deslize.noventa_segundos.length === 3);
  assert.deepEqual(bib.planos.noventa.revisoes.map((r) => r.dia), [30, 60, 90]);
});

test("nenhuma palavra proibida em nenhum texto; diagnóstico só em \"não é diagnóstico\"", () => {
  const todos = textos(bib);
  assert.ok(todos.length > 300);
  todos.forEach((t) => {
    PROIBIDAS.forEach((re) => assert.ok(!re.test(t), re + " em: " + t));
    const resto = t.replace(/não é diagnóstico/gi, "");
    assert.ok(!/diagn[óo]stic/i.test(resto), "diagnóstico solto em: " + t);
  });
});

test("nenhum texto cita o cofre, a ficha ou caminhos locais", () => {
  const fonte = fs.readFileSync(caminho, "utf8");
  ["Dknowledger", "project-management", "TaskNotes", "/Users/", "ferramenta-kit", "ficha"].forEach((m) => {
    assert.ok(!fonte.toLowerCase().includes(m.toLowerCase()), m);
  });
});

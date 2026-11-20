// Funções puras de js/protocol-kit.js: próximo passo, visibilidade, limpeza do
// que ficou fora do caminho e validação de cada tipo de resposta.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");

// Referência: o `nextIndex` que o motor tinha antes do kit.
function proximoAntigo(steps, index, answers) {
  const step = steps[index];
  if (typeof step.next === "function") {
    const target = step.next(answers);
    if (target === null) return steps.length;
    if (typeof target === "string") {
      const i = steps.findIndex((s) => s.id === target);
      return i === -1 ? index + 1 : i;
    }
  }
  return index + 1;
}

test("proximoIndice sem showIf é igual ao nextIndex de antes, em todas as respostas", () => {
  const steps = [
    { id: "a", next: (r) => (r.a === "pular" ? "d" : r.a === "fim" ? null : undefined) },
    { id: "b" },
    { id: "c", next: (r) => (r.c === "x" ? "nao-existe" : undefined) },
    { id: "d" },
  ];
  ["ordem", "pular", "fim", "x", undefined].forEach((a) => {
    ["x", "y"].forEach((c) => {
      const respostas = { a, c };
      for (let i = 0; i < steps.length; i += 1) {
        assert.equal(kit.proximoIndice(steps, i, respostas), proximoAntigo(steps, i, respostas), JSON.stringify({ a, c, i }));
      }
    });
  });
});

test("proximoIndice pula passos ocultos, inclusive o alvo de next()", () => {
  const steps = [
    { id: "a", next: () => "c" },
    { id: "b" },
    { id: "c", showIf: (r) => r.mostrar === true },
    { id: "d", showIf: () => false },
    { id: "e" },
  ];
  assert.equal(kit.proximoIndice(steps, 0, {}), 4, "c oculto, d oculto: vai para e");
  assert.equal(kit.proximoIndice(steps, 0, { mostrar: true }), 2);
  assert.equal(kit.proximoIndice(steps, 1, { mostrar: true }), 2);
  assert.equal(kit.proximoIndice(steps, 1, {}), 4);
  assert.equal(kit.proximoIndice(steps, 4, {}), 5, "depois do último, o fim");
  assert.equal(kit.proximoIndice(steps, -1, {}), 0, "o primeiro passo visível");
  assert.equal(kit.proximoIndice([{ id: "a", showIf: () => false }, { id: "b" }], -1, {}), 1);
  assert.equal(kit.proximoIndice([{ id: "a", showIf: () => false }], -1, {}), 1, "nenhum visível: o fim");
});

test("passosVisiveis e posicaoNoGrupo contam só o que aparece", () => {
  const steps = [
    { id: "a", grupo: "Ato 1" },
    { id: "b", grupo: "Ato 1", showIf: (r) => r.b === 1 },
    { id: "c", grupo: "Ato 1" },
    { id: "d", grupo: "Ato 2" },
    { id: "e" },
  ];
  assert.deepEqual(kit.passosVisiveis(steps, {}), ["a", "c", "d", "e"]);
  assert.deepEqual(kit.passosVisiveis(steps, { b: 1 }, "Ato 1"), ["a", "b", "c"]);
  assert.deepEqual(kit.passosVisiveis(steps, {}, "Ato 2"), ["d"]);
  assert.deepEqual(kit.posicaoNoGrupo(steps, 2, {}), { grupo: "Ato 1", posicao: 2, total: 2 });
  assert.deepEqual(kit.posicaoNoGrupo(steps, 2, { b: 1 }), { grupo: "Ato 1", posicao: 3, total: 3 });
  assert.deepEqual(kit.posicaoNoProtocolo(steps, 3, {}), { grupo: undefined, posicao: 3, total: 4 });
  // passo oculto aberto pela volta: a posição não passa do total
  assert.deepEqual(kit.posicaoNoGrupo(steps, 1, {}), { grupo: "Ato 1", posicao: 2, total: 2 });
});

test("limparForaDoCaminho tira as respostas de passos que não estão no caminho", () => {
  const steps = [
    { id: "a", type: "choice" },
    { id: "b", type: "multi" },
    { id: "c", type: "choice", followUp: { id: "c_peso", type: "scale" } },
    { id: "d", type: "write" },
  ];
  const respostas = {
    a: "x", a__label: "X", b: ["p"], b__labels: ["P"], c: "y", c__label: "Y", c_peso: 5, d: "texto", fora_de_passo: "fica",
  };
  const copia = JSON.stringify(respostas);
  assert.deepEqual(kit.limparForaDoCaminho(steps, [0, 3], respostas), { a: "x", a__label: "X", d: "texto", fora_de_passo: "fica" });
  assert.deepEqual(kit.limparForaDoCaminho(steps, ["a", "c"], respostas), { a: "x", a__label: "X", c: "y", c__label: "Y", c_peso: 5, fora_de_passo: "fica" });
  assert.deepEqual(kit.limparForaDoCaminho(steps, [], { a: 1 }), {});
  assert.equal(JSON.stringify(respostas), copia, "não altera o original");
});

test("validarResposta: escolha e escrita", () => {
  const escolha = { type: "choice", options: [{ value: "a", label: "A" }, { value: 2, label: "dois" }] };
  assert.deepEqual(kit.validarResposta(escolha, "a"), { ok: true, valor: "a" });
  assert.deepEqual(kit.validarResposta(escolha, 2), { ok: true, valor: 2 });
  assert.equal(kit.validarResposta(escolha, "z").ok, false);
  assert.equal(kit.validarResposta(escolha, "2").ok, false, "sem coerção de tipo");
  const dinamica = { type: "choice", options: (r) => (r.x ? [{ value: "k", label: "K" }] : []) };
  assert.equal(kit.validarResposta(dinamica, "k", { x: 1 }).ok, true);
  assert.equal(kit.validarResposta(dinamica, "k", {}).ok, false);

  const texto = { type: "write", maxLength: 5 };
  assert.deepEqual(kit.validarResposta(texto, "  abcdefgh  "), { ok: true, valor: "abcde" });
  assert.deepEqual(kit.validarResposta({ type: "write" }, "  oi  "), { ok: true, valor: "oi" });
  assert.deepEqual(kit.validarResposta({ type: "write" }, ""), { ok: true, valor: "" });
  assert.equal(kit.validarResposta(texto, 12).ok, false);
  assert.equal(kit.validarResposta(texto, null).ok, false);
  assert.equal(kit.validarResposta({ type: "write", maxLength: 2 }, "a😀b").valor, "a", "não deixa meio par substituto");
  assert.equal(kit.validarResposta({ type: "inexistente" }, "a").ok, false);
});

test("validarResposta: vários, com exclusiva e mínimo", () => {
  const passo = {
    type: "multi", exclusive: "nada", min: 1,
    options: [{ value: "a" }, { value: "b" }, { value: "c" }, { value: "nada" }],
  };
  assert.deepEqual(kit.validarResposta(passo, ["c", "a"]), { ok: true, valor: ["a", "c"] }, "na ordem das opções");
  assert.deepEqual(kit.validarResposta(passo, ["nada"]), { ok: true, valor: ["nada"] });
  assert.equal(kit.validarResposta(passo, ["nada", "a"]).erro, "exclusivo");
  assert.equal(kit.validarResposta(passo, []).erro, "poucas");
  assert.equal(kit.validarResposta({ ...passo, min: 0 }, []).ok, true);
  assert.equal(kit.validarResposta(passo, ["a", "a"]).erro, "repetida");
  assert.equal(kit.validarResposta(passo, ["z"]).erro, "opcao");
  assert.equal(kit.validarResposta(passo, "a").erro, "tipo");
  assert.equal(kit.validarResposta({ ...passo, max: 2 }, ["a", "b", "c"]).erro, "muitas");
  assert.equal(kit.validarResposta({ type: "multi", options: (r) => r.o }, ["q"], { o: [{ value: "q" }] }).ok, true);
});

test("validarResposta: régua dentro dos limites e do passo", () => {
  const regua = { type: "scale", min: 0, max: 100, step: 10 };
  assert.equal(kit.validarResposta(regua, 0).ok, true);
  assert.equal(kit.validarResposta(regua, 100).ok, true);
  assert.equal(kit.validarResposta(regua, 70).valor, 70);
  assert.equal(kit.validarResposta(regua, 105).erro, "faixa");
  assert.equal(kit.validarResposta(regua, -10).erro, "faixa");
  assert.equal(kit.validarResposta(regua, 35).erro, "passo");
  assert.equal(kit.validarResposta(regua, "70").erro, "tipo");
  assert.equal(kit.validarResposta(regua, NaN).erro, "tipo");
  assert.equal(kit.validarResposta(regua, Infinity).erro, "tipo");
  assert.equal(kit.validarResposta({ type: "scale" }, 7).ok, true, "padrão: 0 a 10 de 1 em 1");
  assert.equal(kit.validarResposta({ type: "scale" }, 11).ok, false);
  assert.equal(kit.validarResposta({ type: "scale", min: 0, max: 1, step: 0.1 }, 0.3).ok, true, "passo decimal");
  assert.equal(kit.validarResposta({ type: "scale", min: 1, max: 5 }, 0).ok, false);
});

test("validarResposta: grade completa, com opções comuns ou do item", () => {
  const passo = {
    type: "grade",
    items: [{ id: "a", label: "A" }, { id: "b", label: "B", options: [{ value: "sim" }, { value: "nao" }] }],
    options: [{ value: 0 }, { value: 1 }],
  };
  assert.deepEqual(kit.validarResposta(passo, { a: 1, b: "sim" }), { ok: true, valor: { a: 1, b: "sim" } });
  assert.equal(kit.validarResposta(passo, { a: 1 }).erro, "incompleto");
  assert.equal(kit.validarResposta(passo, { a: 1, b: 1 }).erro, "opcao", "o item b tem as próprias opções");
  assert.equal(kit.validarResposta(passo, { a: 5, b: "sim" }).erro, "opcao");
  assert.equal(kit.validarResposta(passo, { a: 1, b: "sim", c: 1 }).erro, "item");
  assert.equal(kit.validarResposta(passo, [1, 2]).erro, "tipo");
  assert.equal(kit.validarResposta(passo, null).erro, "tipo");
  assert.equal(kit.validarResposta(passo, JSON.parse('{"__proto__": 1, "a": 1, "b": "sim"}')).erro, "item", "chave de protótipo não passa");
  const normalizada = kit.validarResposta(passo, { b: "nao", a: 0 }).valor;
  assert.deepEqual(Object.keys(normalizada), ["a", "b"], "só as chaves dos itens, na ordem dos itens");
});

test("validarResposta: tríade só com itens diferentes", () => {
  const passo = { type: "triad", items: [{ id: "x" }, { id: "y" }, { id: "z" }] };
  assert.deepEqual(kit.validarResposta(passo, { mais: "x", menos: "z" }), { ok: true, valor: { mais: "x", menos: "z" } });
  assert.equal(kit.validarResposta(passo, { mais: "x", menos: "x" }).erro, "igual");
  assert.equal(kit.validarResposta(passo, { mais: "x", menos: "w" }).erro, "item");
  assert.equal(kit.validarResposta(passo, { mais: "x" }).erro, "item");
  assert.equal(kit.validarResposta(passo, { mais: null, menos: null }).erro, "item");
  assert.equal(kit.validarResposta(passo, ["x", "y"]).erro, "tipo");
  assert.deepEqual(kit.validarResposta(passo, { mais: "x", menos: "y", extra: 1 }).valor, { mais: "x", menos: "y" }, "descarta o que sobra");
});

test("validarComplemento: escrito só fica em branco se for opcional", () => {
  assert.equal(kit.validarComplemento({ type: "write" }, "").erro, "vazio");
  assert.equal(kit.validarComplemento({ type: "write" }, "   ").erro, "vazio");
  assert.equal(kit.validarComplemento({ type: "write", optional: true }, "").ok, true);
  assert.equal(kit.validarComplemento({ type: "write" }, "oi").valor, "oi");
  assert.equal(kit.validarComplemento({ type: "write", maxLength: 3 }, "abcdef").valor, "abc");
  assert.equal(kit.validarComplemento({ type: "scale", min: 0, max: 10 }, 4).ok, true);
  assert.equal(kit.validarComplemento({ type: "scale", min: 0, max: 10 }, 40).ok, false);
});

test("cortarTexto tira as pontas e respeita o limite", () => {
  assert.equal(kit.cortarTexto("  oi  ", 10), "oi");
  assert.equal(kit.cortarTexto("abcdef", 3), "abc");
  assert.equal(kit.cortarTexto("abcdef", 0), "abcdef");
  assert.equal(kit.cortarTexto("abcdef"), "abcdef");
});


// ---- F2: estado guardado, marcos e datas ------------------------------------

const normal = (x) => JSON.parse(JSON.stringify(x));
const ESQUEMA = { protocolo: "protocolo-x", versao: 2, migracoes: {} };
function estadoBase(extra = {}) {
  return {
    esquema: "dlt.protocolo.estado",
    v: 2,
    protocolo: "protocolo-x",
    bib: "2026.11-1",
    ciclo: "k3f9x2qa",
    criado: "2026-11-20",
    atualizado: "2026-11-20T21:03:00.000Z",
    expira: "2027-03-20",
    fluxo: "principal",
    etapa: "pausa",
    passo: "c",
    caminho: ["a", "b"],
    respostas: { a: "x", b: ["p"] },
    volta: null,
    historico: [],
    lembrete: "20:00",
    ...extra,
  };
}

test("somarDias e datasDoCiclo: data civil, na virada de mês, de ano e no bissexto", () => {
  assert.equal(kit.somarDias("2026-11-20", 120), "2027-03-20");
  assert.equal(kit.somarDias("2026-11-28", 3), "2026-12-01");
  assert.equal(kit.somarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(kit.somarDias("2028-02-28", 1), "2028-02-29");
  assert.equal(kit.somarDias("2027-02-28", 1), "2027-03-01");
  assert.equal(kit.somarDias("2026-03-01", -1), "2026-02-28");
  assert.equal(kit.somarDias("2026-02-30", 1), null, "data que não existe");
  assert.equal(kit.somarDias("20/11/2026", 1), null);
  assert.equal(kit.somarDias("2026-11-20", 1.5), null);
  assert.deepEqual(kit.datasDoCiclo("2026-11-20", [7, 30, 60, 90]), {
    d0: "2026-11-20", d7: "2026-11-27", d30: "2026-12-20", d60: "2027-01-19", d90: "2027-02-18",
  });
  assert.equal(kit.datasDoCiclo("nada", [7]), null);
  assert.equal(kit.diasEntre("2026-11-20", "2026-12-01"), 11);
  assert.equal(kit.diasEntre("2026-12-01", "2026-11-20"), -11);
  assert.equal(kit.diasEntre("x", "2026-11-20"), null);
  assert.equal(kit.dataISO(new Date(2026, 0, 5, 23, 59)), "2026-01-05", "dia local, não UTC");
});

test("lerEstado: aceita o estado válido e devolve só os campos conhecidos", () => {
  const texto = JSON.stringify(estadoBase({ intruso: "x", respostas: { a: "x", "__proto__": { polui: 1 }, "id com espaço": 1, ok_1: [1, 2] } }));
  const r = kit.lerEstado(texto, ESQUEMA, "2026-12-01");
  assert.ok(r.estado, JSON.stringify(r));
  assert.equal(r.estado.intruso, undefined);
  assert.deepEqual(Object.keys(r.estado.respostas).sort(), ["a", "ok_1"]);
  assert.equal(({}).polui, undefined, "o protótipo não foi poluído");
  assert.equal(Object.getPrototypeOf(r.estado.respostas), null, "mapa sem protótipo");
  assert.deepEqual(normal(r.estado).caminho, ["a", "b"]);
  assert.equal(r.estado.volta, null);
  assert.deepEqual(r.estado.historico, []);
  assert.equal(r.estado.lembrete, "20:00");
});

test("lerEstado: recusa JSON inválido, outro protocolo, campo fora do formato e texto grande demais", () => {
  const l = (obj) => kit.lerEstado(typeof obj === "string" ? obj : JSON.stringify(obj), ESQUEMA, "2026-12-01");
  assert.equal(l("{não é json").erro, "invalido");
  assert.equal(l("").erro, "invalido");
  assert.equal(l("[1,2]").erro, "invalido");
  assert.equal(l("null").erro, "invalido");
  assert.equal(kit.lerEstado(null, ESQUEMA, "2026-12-01").erro, "invalido");
  assert.equal(l(estadoBase({ protocolo: "outro" })).erro, "invalido");
  assert.equal(l(estadoBase({ esquema: "outro" })).erro, "invalido");
  assert.equal(l(estadoBase({ etapa: "fim" })).erro, "invalido");
  assert.equal(l(estadoBase({ ciclo: "curto" })).erro, "invalido");
  assert.equal(l(estadoBase({ atualizado: "ontem" })).erro, "invalido");
  assert.equal(l(estadoBase({ expira: "2027-02-31" })).erro, "invalido");
  assert.equal(l(estadoBase({ fluxo: "retorno:DIA7" })).erro, "invalido");
  assert.equal(l(estadoBase({ lembrete: "25:99" })).erro, "invalido");
  assert.equal(l(estadoBase({ caminho: ["a", 3] })).erro, "invalido");
  assert.equal(l(estadoBase({ caminho: "a" })).erro, "invalido");
  assert.equal(l(estadoBase({ respostas: [] })).erro, "invalido");
  assert.equal(l(estadoBase({ historico: new Array(25).fill({}) })).erro, "invalido", "no máximo 24 voltas");
  assert.equal(l(estadoBase({ volta: { n: 0 } })).erro, "invalido");
  assert.equal(l(estadoBase({ volta: { n: 1, retornos: { DIA3: { em: "2026-11-23" } } } })).erro, "invalido");
  assert.equal(l(estadoBase({ respostas: { a: "x".repeat(200 * 1024) } })).erro, "invalido", "acima de 100 KB");
});

test("lerEstado: expirado só depois do dia de validade, e versão maior é recusada", () => {
  const texto = JSON.stringify(estadoBase());
  assert.ok(kit.lerEstado(texto, ESQUEMA, "2027-03-20").estado, "no último dia ainda vale");
  assert.equal(kit.lerEstado(texto, ESQUEMA, "2027-03-21").erro, "expirado");
  assert.equal(kit.lerEstado(JSON.stringify(estadoBase({ v: 3 })), ESQUEMA, "2026-12-01").erro, "versao");
  assert.equal(kit.lerEstado(JSON.stringify(estadoBase({ v: 0 })), ESQUEMA, "2026-12-01").erro, "invalido");
  assert.equal(kit.lerEstado(JSON.stringify(estadoBase({ v: 1.5 })), ESQUEMA, "2026-12-01").erro, "invalido");
});

test("lerEstado: guarda o ciclo de voltas só com o formato certo", () => {
  const volta = {
    n: 2, dia0: "2026-11-20", registro: { v: 1, padrao: "x", "__proto__": { p: 1 } },
    retornos: { dia3: { em: "2026-11-23", r: { fez: "sim", crenca: 60 } } },
  };
  const r = kit.lerEstado(JSON.stringify(estadoBase({ volta, historico: [{ volta: 1 }] })), ESQUEMA, "2026-12-01");
  assert.ok(r.estado, JSON.stringify(r));
  assert.deepEqual(normal(r.estado.volta.retornos), { dia3: { em: "2026-11-23", r: { fez: "sim", crenca: 60 } } });
  assert.deepEqual(Object.keys(r.estado.volta.registro).sort(), ["padrao", "v"]);
  assert.equal(r.estado.volta.n, 2);
  assert.deepEqual(normal(r.estado.historico), [{ volta: 1 }]);
});

test("migrarEstado leva de versão em versão e para onde não há caminho", () => {
  const migracoes = {
    1: (e) => ({ ...e, respostas: { ...e.respostas, novo: "um" } }),
    2: (e) => ({ ...e, bib: "2027.01-1" }),
  };
  const m = kit.migrarEstado(estadoBase({ v: 1 }), migracoes, 3);
  assert.equal(m.estado.v, 3);
  assert.equal(m.estado.respostas.novo, "um");
  assert.equal(m.estado.bib, "2027.01-1");
  assert.equal(kit.migrarEstado(estadoBase({ v: 1 }), { 1: migracoes[1] }, 3).erro, "versao", "falta o degrau 2");
  assert.equal(kit.migrarEstado(estadoBase({ v: 1 }), { 1: () => { throw new Error("x"); } }, 2).erro, "versao");
  assert.equal(kit.migrarEstado(estadoBase({ v: 1 }), { 1: () => "texto" }, 2).erro, "versao");
  assert.equal(kit.migrarEstado(estadoBase({ v: 3 }), migracoes, 3).estado.v, 3, "já na versão atual");
  assert.equal(kit.migrarEstado(estadoBase({ v: 1 }), migracoes).estado.v, 3, "sem versão atual, segue enquanto houver migração");
  const original = estadoBase({ v: 1 });
  kit.migrarEstado(original, migracoes, 3);
  assert.equal(original.v, 1, "não altera o original");
});

test("lerEstado migra a versão antiga antes de validar", () => {
  const esquema = { protocolo: "protocolo-x", versao: 2, migracoes: { 1: (e) => ({ ...e, etapa: e.etapa === "meio" ? "ato1" : e.etapa }) } };
  const antigo = estadoBase({ v: 1, etapa: "meio" });
  const r = kit.lerEstado(JSON.stringify(antigo), esquema, "2026-12-01");
  assert.equal(r.estado.v, 2);
  assert.equal(r.estado.etapa, "ato1");
  assert.equal(kit.lerEstado(JSON.stringify(antigo), { ...esquema, migracoes: {} }, "2026-12-01").erro, "versao");
});

test("prepararParaGuardar tira os passos que nunca são guardados e os rótulos", () => {
  const steps = [
    { id: "chao", type: "grade" },
    { id: "risco", type: "multi" },
    { id: "a", type: "choice", followUp: { id: "a_peso", type: "scale" } },
  ];
  const estado = estadoBase({
    caminho: ["chao", "risco", "a"],
    respostas: { chao: { x: 1 }, risco: ["p"], risco__labels: ["P"], a: "x", a__label: "X", a_peso: 3 },
  });
  const copia = JSON.stringify(estado);
  const limpo = kit.prepararParaGuardar(estado, ["chao", "risco"], steps);
  assert.deepEqual(limpo.respostas, { a: "x", a_peso: 3 });
  assert.deepEqual(limpo.caminho, ["a"]);
  assert.equal(JSON.stringify(estado), copia, "não altera o original");
  assert.deepEqual(kit.prepararParaGuardar(estado, undefined).respostas, { chao: { x: 1 }, risco: ["p"], a: "x", a_peso: 3 }, "sem lista só tira os rótulos");
});

// Fluxo de teste: bloco de cuidado (nunca guardado), duas perguntas, checkpoint e uma pergunta.
const FLUXO = [
  { id: "chao", type: "choice", options: [{ value: "ok", label: "Ok" }, { value: "dificil", label: "Difícil" }] },
  { id: "risco", type: "multi", exclusive: "nada", options: [{ value: "a", label: "A" }, { value: "nada", label: "Nada" }] },
  { id: "p1", type: "choice", options: [{ value: "x", label: "X" }, { value: "y", label: "Y" }] },
  { id: "p2", type: "scale", min: 0, max: 10, followUp: { id: "p2_nota", type: "write", optional: true } },
  { id: "fim1", type: "checkpoint" },
  { id: "p3", type: "choice", showIf: (r) => r.p1 === "x", options: [{ value: "s", label: "S" }] },
  { id: "p4", type: "write" },
];
const NAO_GUARDAR = ["chao", "risco"];

test("restaurarProgresso: pula o bloco que nunca é guardado e para no primeiro passo sem resposta", () => {
  const estado = estadoBase({
    caminho: ["p1", "p2", "fim1"],
    respostas: { p1: "x", p2: 7, p2_nota: "ok", intruso: 1 },
  });
  const r = kit.restaurarProgresso(FLUXO, estado, NAO_GUARDAR);
  assert.equal(FLUXO[r.indice].id, "p3");
  assert.deepEqual(r.caminho.map((i) => FLUXO[i].id), ["p1", "p2", "fim1"]);
  assert.deepEqual(r.respostas, { p1: "x", p1__label: "X", p2: 7, p2_nota: "ok" });
  assert.equal(r.descartou, false);
});

test("restaurarProgresso: tudo respondido leva ao resultado; ramo oculto não conta", () => {
  const completo = estadoBase({
    caminho: ["p1", "p2", "fim1", "p4"],
    respostas: { p1: "y", p2: 3, p2_nota: "", p4: "fim" },
  });
  const r = kit.restaurarProgresso(FLUXO, completo, NAO_GUARDAR);
  assert.equal(r.indice, FLUXO.length);
  assert.deepEqual(r.caminho.map((i) => FLUXO[i].id), ["p1", "p2", "fim1", "p4"]);
});

test("restaurarProgresso: resposta que já não vale derruba o resto e volta a esse passo", () => {
  const estado = estadoBase({
    caminho: ["p1", "p2", "fim1"],
    respostas: { p1: "z", p2: 7, p2_nota: "" },
  });
  const r = kit.restaurarProgresso(FLUXO, estado, NAO_GUARDAR);
  assert.equal(FLUXO[r.indice].id, "p1");
  assert.deepEqual(r.respostas, {});
  assert.equal(r.descartou, true);
  const semComplemento = kit.restaurarProgresso(FLUXO, estadoBase({ caminho: ["p1", "p2"], respostas: { p1: "x", p2: 7 } }), NAO_GUARDAR);
  assert.equal(FLUXO[semComplemento.indice].id, "p2", "o complemento é parte do passo");
  assert.equal(semComplemento.respostas.p2, undefined);
});

test("restaurarProgresso: caminho que o fluxo não mostraria é recusado", () => {
  const forjado = estadoBase({ caminho: ["p2", "p1"], respostas: { p1: "x", p2: 7 } });
  const r = kit.restaurarProgresso(FLUXO, forjado, NAO_GUARDAR);
  assert.equal(FLUXO[r.indice].id, "p1");
  assert.deepEqual(r.respostas, {});
});

test("restaurarProgresso: quem parou dentro do bloco que não se guarda recomeça no começo dele", () => {
  const dentro = estadoBase({ etapa: "ato1", passo: "risco", caminho: [], respostas: {} });
  assert.equal(FLUXO[kit.restaurarProgresso(FLUXO, dentro, NAO_GUARDAR).indice].id, "chao");
  const antes = [{ id: "intro", type: "choice", options: [{ value: "a", label: "A" }] }, ...FLUXO];
  const r = kit.restaurarProgresso(antes, estadoBase({ caminho: ["intro"], respostas: { intro: "a" }, passo: "risco" }), NAO_GUARDAR);
  assert.equal(antes[r.indice].id, "chao");
  assert.deepEqual(r.caminho.map((i) => antes[i].id), ["intro"]);
  const sem = kit.restaurarProgresso(FLUXO, estadoBase({ caminho: [], respostas: {} }), []);
  assert.equal(FLUXO[sem.indice].id, "chao", "sem bloco declarado, é o primeiro passo");
});

test("restaurarProgresso: rótulos voltam a ser calculados, inclusive os de vários", () => {
  const passos = [
    { id: "m", type: "multi", options: [{ value: "a", label: "Alfa" }, { value: "b", label: "Beta" }] },
    { id: "d", type: "choice", options: (r) => r.m.map((v) => ({ value: v, label: "Opção " + v })) },
  ];
  const r = kit.restaurarProgresso(passos, estadoBase({ caminho: ["m", "d"], respostas: { m: ["a", "b"], d: "b" } }), []);
  assert.deepEqual(r.respostas, { m: ["a", "b"], m__labels: ["Alfa", "Beta"], d: "b", d__label: "Opção b" });
  assert.equal(r.indice, 2);
});

test("situacaoDoMarco: cedo, no dia, atrasado e feito", () => {
  const volta = { n: 1, dia0: "2026-11-20", retornos: { dia3: { em: "2026-11-23", r: {} } } };
  assert.deepEqual(kit.situacaoDoMarco(volta, "dia7", 7, "2026-11-26"), { situacao: "cedo", data: "2026-11-27", feitoEm: null });
  assert.equal(kit.situacaoDoMarco(volta, "dia7", 7, "2026-11-27").situacao, "no_dia");
  assert.equal(kit.situacaoDoMarco(volta, "dia7", 7, "2026-12-15").situacao, "atrasado");
  assert.deepEqual(kit.situacaoDoMarco(volta, "dia3", 3, "2026-11-30"), { situacao: "feito", data: "2026-11-23", feitoEm: "2026-11-23" });
  assert.equal(kit.situacaoDoMarco(volta, "semana", undefined, "2026-11-30").situacao, "no_dia", "sem data vale sempre");
  assert.equal(kit.situacaoDoMarco(null, "dia7", 7, "2026-11-30").situacao, "no_dia", "sem volta não há data");
});

test("lerMarco: só marcos da lista, e #c= dentro do limite", () => {
  const permitidos = ["dia3", "dia7", "continuar"];
  assert.deepEqual(kit.lerMarco("#volta=dia7", permitidos), { marco: "dia7" });
  assert.deepEqual(kit.lerMarco("volta=continuar", permitidos), { marco: "continuar" });
  assert.equal(kit.lerMarco("#volta=dia8", permitidos), null, "marco fora da lista");
  assert.equal(kit.lerMarco("#volta=constructor", permitidos), null);
  assert.equal(kit.lerMarco("#volta=dia7&x=1", permitidos), null, "só o fragmento inteiro");
  assert.equal(kit.lerMarco("#volta=", permitidos), null);
  assert.equal(kit.lerMarco("#volta=dia7", undefined), null);
  assert.equal(kit.lerMarco("#volta=DIA7", ["DIA7"]), null);
  assert.equal(kit.lerMarco("", permitidos), null);
  assert.equal(kit.lerMarco("#", permitidos), null);
  assert.equal(kit.lerMarco("#outra-coisa", permitidos), null);
  assert.equal(kit.lerMarco(undefined, permitidos), null);
  assert.deepEqual(kit.lerMarco("#c=abcDEF012_-", permitidos), { codigo: "abcDEF012_-" });
  assert.deepEqual(kit.lerMarco("#c=" + "a".repeat(2048), permitidos), { codigo: "a".repeat(2048) });
  assert.deepEqual(kit.lerMarco("#c=" + "a".repeat(2049), permitidos), { recusado: "codigo" }, "grande demais");
  assert.deepEqual(kit.lerMarco("#c=abc+def", permitidos), { recusado: "codigo" });
  assert.deepEqual(kit.lerMarco("#c=", permitidos), { recusado: "codigo" });
});

test("gerarCiclo faz 8 caracteres [a-z0-9]", () => {
  assert.match(kit.gerarCiclo([255, 0, 1, 35, 36, 200, 7, 99]), /^[a-z0-9]{8}$/);
  assert.match(kit.gerarCiclo(), /^[a-z0-9]{8}$/);
  assert.notEqual(kit.gerarCiclo([1, 2, 3, 4, 5, 6, 7, 8]), kit.gerarCiclo([8, 7, 6, 5, 4, 3, 2, 1]));
});

test("o checkpoint não entra na contagem de passos", () => {
  assert.deepEqual(kit.passosVisiveis(FLUXO, {}).includes("fim1"), false);
  assert.equal(kit.passosVisiveis(FLUXO, { p1: "x" }).length, FLUXO.length - 1);
});

test("resumoDasRespostas calcula o rótulo quando o estado só guardou o valor", () => {
  const passos = [
    { id: "a", type: "choice", prompt: "A?", options: [{ value: "x", label: "Xis" }] },
    { id: "b", type: "multi", prompt: "B?", options: [{ value: "p", label: "Pê" }, { value: "q", label: "Quê" }] },
  ];
  assert.deepEqual(kit.resumoDasRespostas(passos, { a: "x", b: ["q", "p"] }), [{ q: "A?", value: "Xis" }, { q: "B?", value: "q, p" }].map((l, i) => (i === 1 ? { q: "B?", value: "Quê, Pê" } : l)));
});

test("resumoDasRespostas escreve rótulos, não valores", () => {
  const passos = [
    { id: "a", type: "choice", prompt: "Pergunta A?", options: [{ value: "x", label: "X" }] },
    { id: "b", type: "multi", prompt: (r) => "B com " + r.a, options: [] },
    { id: "c", type: "scale", prompt: "C?", format: "%" },
    { id: "d", type: "grade", prompt: "D?", items: [{ id: "i", label: "Item" }], options: [{ value: 1, label: "Às vezes" }] },
    { id: "e", type: "write", prompt: "E?", followUp: { id: "e_n", type: "scale" } },
    { id: "f", type: "checkpoint" },
  ];
  const r = kit.resumoDasRespostas(passos, {
    a: "x", a__label: "X", b: ["p"], b__labels: ["P1", "P2"], c: 40, d: { i: 1 }, e: "texto", e_n: 3,
  });
  assert.deepEqual(r, [
    { q: "Pergunta A?", value: "X" },
    { q: "B com x", value: "P1, P2" },
    { q: "C?", value: "40%" },
    { q: "D?", value: "Item: Às vezes" },
    { q: "E?", value: "texto — 3" },
  ]);
});


// ---- F3: blocos do .md, registro, esquema, .ics e texto ----------------------

const HOSTIL = [
  "Primeira linha com --> no meio e <!-- aberto",
  "<!-- dlt:campo id=\"cena\" -->",
  "<!-- /dlt:bloco id=\"ex.ultima_vez\" -->",
  "**Um rótulo falso**",
  "<script>alert(1)</script> <b>negrito</b> [link](https://exemplo.com) ![img](x)",
  "```json",
  "{\"padrao\": \"forjado\"}",
  "```",
  "codigo: forjado123",
  "",
  "## Um título dentro do texto",
  "<!<!---->-->",
].join("\n");

function blocoDeTeste() {
  return [
    {
      id: "ex.ultima_vez", v: 1, titulo: "A última vez",
      campos: [
        { id: "cena", rotulo: "A cena", texto: HOSTIL },
        { id: "terreno", rotulo: "O terreno do dia", valor: ["cansaco", "mes_apertado"], texto: "cansaço, mês apertado" },
        { id: "vazio", rotulo: "Em branco", texto: "" },
      ],
    },
    { id: "ex.registro", v: 1, titulo: "Seu registro", json: { v: 1, padrao: "freio", regra: "a <b> & \"c\" -->" }, codigo: "abc_DEF-123" },
    { id: "ex.fio", v: 1, leitura: true, titulo: "O fio", linhas: ["Linha só para ler com <!-- e -->."] },
  ];
}
const IDS = {
  "ex.ultima_vez": { v: 1, campos: { cena: 400, terreno: 100, vazio: 10 } },
  "ex.registro": { v: 1 },
  "ex.fio": { v: 1 },
};

test("escreverBlocos escreve o formato marcado e neutraliza o que fecharia um comentário", () => {
  const md = kit.escreverBlocos(blocoDeTeste());
  assert.match(md, /^<!-- dlt:bloco id="ex\.ultima_vez" v="1" -->\n## A última vez\n\n<!-- dlt:campo id="cena" -->\n\*\*A cena\*\*\n/);
  assert.match(md, /<!-- dlt:campo id="terreno" valor="cansaco,mes_apertado" -->\n\*\*O terreno do dia\*\*\ncansaço, mês apertado/);
  assert.match(md, /<!-- dlt:bloco id="ex\.fio" v="1" leitura="1" -->/);
  assert.match(md, /<!-- \/dlt:bloco id="ex\.fio" -->$/);
  // Marcadores de máquina só aparecem nas linhas que o escritor pôs.
  const marcadores = md.split("\n").filter((l) => l.includes("<!--") || l.includes("-->"));
  marcadores.forEach((linha) => {
    assert.match(linha, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "linha inesperada: " + linha);
  });
  assert.equal(md.split("\n").filter((l) => l.startsWith("<!-- dlt:bloco id=")).length, 3);
  assert.equal(md.includes("<script>"), true, "HTML do texto dela fica como texto, sem ser tirado");
});

test("lerBlocos: ida e volta com texto hostil, sem marcador forjado", () => {
  const md = kit.escreverBlocos(blocoDeTeste());
  const lido = kit.lerBlocos(md, IDS);
  assert.deepEqual(Object.keys(lido).sort(), ["ex.registro", "ex.ultima_vez"], "bloco de leitura não é lido por máquina");
  const b = lido["ex.ultima_vez"];
  assert.equal(b.v, 1);
  assert.deepEqual(Object.keys(b.campos).sort(), ["cena", "terreno", "vazio"]);
  const esperadoCena = HOSTIL.replace(/<!--/g, "< !--").replace(/-->/g, "-- >");
  assert.equal(b.campos.cena.texto.replace(/<!<!---->-->/, "").length > 0, true);
  // Depois de neutralizar, o texto volta igual, linha por linha (inclusive a linha em negrito falsa).
  const neutra = (t) => { let x = t; while (/<!--|-->/.test(x)) x = x.replace(/<!--/g, "< !--").replace(/-->/g, "-- >"); return x; };
  assert.equal(b.campos.cena.texto, neutra(HOSTIL).trim());
  assert.ok(b.campos.cena.texto.includes("**Um rótulo falso**"));
  assert.ok(esperadoCena.length > 0);
  assert.equal(b.campos.cena.valor, null);
  assert.equal(b.campos.terreno.valor, "cansaco,mes_apertado");
  assert.equal(b.campos.terreno.texto, "cansaço, mês apertado");
  assert.equal(b.campos.vazio.texto, "");
  assert.equal(b.json, null);
  const r = lido["ex.registro"];
  assert.deepEqual(normal(r.json), { v: 1, padrao: "freio", regra: "a <b> & \"c\" -->" }, "o JSON volta exato, mesmo com < > e -->");
  assert.equal(r.codigo, "abc_DEF-123");
  assert.equal(r.json.padrao, "freio", "não foi trocado pelo JSON forjado dentro do texto");
});

test("lerBlocos: só ids conhecidos, na versão certa, e cada campo no limite", () => {
  const md = kit.escreverBlocos([
    { id: "ex.padrao", v: 1, campos: [{ id: "padrao", texto: "x" }] },
    { id: "ex.registro", v: 2, json: { a: 1 } },
    { id: "ex.fatos", v: 1, campos: [{ id: "olhou", texto: "abcdefghij" }, { id: "intruso", texto: "não" }] },
    { id: "ex.fatos", v: 1, campos: [{ id: "olhou", texto: "repetido" }] },
  ]);
  const lido = kit.lerBlocos(md, { "ex.registro": { v: 1 }, "ex.fatos": { v: 1, campos: { olhou: 4 } } });
  assert.deepEqual(Object.keys(lido), ["ex.fatos"], "padrao é desconhecido, registro está em outra versão");
  assert.deepEqual(Object.keys(lido["ex.fatos"].campos), ["olhou"], "campo desconhecido sai");
  assert.equal(lido["ex.fatos"].campos.olhou.texto, "abcd", "cortado no limite do passo");
  assert.deepEqual(Object.keys(kit.lerBlocos(md, ["ex.padrao"])), ["ex.padrao"], "lista simples vale como versão 1");
  assert.deepEqual(Object.keys(kit.lerBlocos(md, [])), []);
  assert.deepEqual(Object.keys(kit.lerBlocos(md)), []);
});

test("lerBlocos: arquivo adulterado não quebra nem polui", () => {
  const forjado = [
    '<!-- dlt:bloco id="__proto__" v="1" -->',
    '<!-- dlt:campo id="polui" -->',
    "**x**",
    "y",
    '<!-- /dlt:bloco id="__proto__" -->',
    '<!-- dlt:bloco id="ex.registro" v="1" -->',
    "<!-- dlt:json -->",
    "```json",
    '{"__proto__": {"polui": 1}, "constructor": 1, "ok": 2}',
    "```",
    "<!-- dlt:codigo -->",
    "codigo: não é base64!",
    '<!-- dlt:bloco id="ex.outro" v="1" -->',
    "sem fechar",
  ].join("\n");
  const lido = kit.lerBlocos(forjado, ["ex.registro", "__proto__", "ex.outro"]);
  assert.equal(({}).polui, undefined);
  assert.deepEqual(Object.keys(lido), [], "bloco aberto sem fechar não vale");
  const fechado = kit.lerBlocos(forjado.replace('<!-- dlt:bloco id="ex.outro" v="1" -->\nsem fechar', '<!-- /dlt:bloco id="ex.registro" -->'), ["ex.registro"]);
  assert.deepEqual(Object.keys(fechado["ex.registro"].json), ["ok"], "chaves de protótipo caem");
  assert.equal(fechado["ex.registro"].codigo, null, "código fora do formato");
  assert.deepEqual(Object.keys(kit.lerBlocos("x".repeat(300 * 1024), ["a"])), [], "arquivo grande demais");
  assert.deepEqual(Object.keys(kit.lerBlocos(null, ["a"])), []);
  assert.deepEqual(Object.keys(kit.lerBlocos("<!-- dlt:bloco id=\"a\" v=\"1\" -->\r\n<!-- /dlt:bloco id=\"a\" -->", ["a"])), ["a"], "aceita quebra de linha do Windows");
});

test("escreverBlocos ignora bloco e campo com id fora do formato e limpa o valor de máquina", () => {
  const md = kit.escreverBlocos([
    { id: "Ruim Id", v: 1 },
    { id: "ok", v: 1, campos: [{ id: "c d", texto: "x" }, { id: "k", valor: 'a"b<c>,D', texto: "t" }] },
    null,
  ]);
  assert.ok(!md.includes("Ruim"));
  assert.match(md, /<!-- dlt:campo id="k" valor="abc,"/);
  assert.equal(kit.escreverBlocos("não é lista"), "");
});

test("codificarRegistro e decodificarRegistro: ida e volta com acento e emoji", () => {
  const obj = { v: 1, tipo: "padrao", regra: "cobrar o justo é o que me deixa atender bem ✓ 😀", datas: { d0: "2026-11-20" } };
  const c = kit.codificarRegistro(obj, 2048);
  assert.equal(c.ok, true);
  assert.equal(c.cortado, false);
  assert.match(c.codigo, /^[A-Za-z0-9_-]+$/);
  const d = kit.decodificarRegistro(c.codigo);
  assert.equal(d.ok, true);
  assert.deepEqual(normal(d.objeto), obj);
  assert.equal(Object.getPrototypeOf(d.objeto), null);
  assert.equal(c.codigo, Buffer.from(JSON.stringify(obj), "utf8").toString("base64url"), "é base64url comum, sem preenchimento");
});

test("codificarRegistro: pior caso (textos no limite só com emoji de 4 bytes) cabe em 2048", () => {
  const emoji = (n) => "😀".repeat(n);
  const objeto = {
    v: 1, tipo: "padrao", produto: "exemplo", origem: "gratis", bib: "2026.11-1", data: "2026-11-20", volta: 1, ato: 2,
    padrao: "freio-na-cobranca", variante: null, trilha: "ganho", trilhas_perto: false, vazamento: "ganho-que-escorre",
    familia: "evitar", modo_crenca: "triade",
    notas: Object.fromEntries(["a", "b", "c", "d", "e", "f", "g"].map((k) => [k + "-padrao", { f: 0.67, c: 1 }])),
    itens: Object.fromEntries(Array.from({ length: 15 }, (_, i) => ["item_" + i, -1])),
    familias: { evitar: 0.67, idolatrar: -0.33, status: -0.67, vigilancia: 0, lealdade: 0.33 },
    areas: { ganhar: 3, guardar: 2, decidir: 0, dar: 0 },
    regra_trabalho: emoji(160), se_entao: emoji(200), previsao: emoji(140),
    datas: { d0: "2026-11-20", d7: "2026-11-27", d30: "2026-12-20", d60: "2027-01-19", d90: "2027-02-18" },
  };
  const c = kit.codificarRegistro(objeto, 2048, { cortar: ["regra_trabalho", "se_entao", "previsao"] });
  assert.equal(c.ok, true);
  assert.equal(c.cortado, true, "com tudo no limite, foi preciso cortar");
  assert.ok(c.codigo.length <= 2048, "tamanho " + c.codigo.length);
  assert.ok(c.codigo.length >= 2040, "aproveita o espaço: " + c.codigo.length);
  const volta = kit.decodificarRegistro(c.codigo).objeto;
  assert.deepEqual(normal(volta), normal(c.objeto));
  ["regra_trabalho", "se_entao", "previsao"].forEach((k) => {
    assert.match(volta[k], /^(?:😀)*$/u, k + " cortado sem partir o emoji");
    assert.ok(volta[k].length > 0, k + " não foi zerado");
  });
  assert.equal(volta.padrao, "freio-na-cobranca", "o que não é texto livre fica");
  assert.equal(objeto.regra_trabalho, emoji(160), "não altera o original");
  const nivelado = [volta.regra_trabalho, volta.se_entao, volta.previsao].map((t) => Buffer.byteLength(t));
  assert.ok(Math.max(...nivelado) - Math.min(...nivelado) <= 8, "corte nivelado: " + nivelado);
  // Sem a lista de chaves, também cabe.
  assert.ok(kit.codificarRegistro(objeto, 2048).codigo.length <= 2048);
});

test("codificarRegistro: sem texto para cortar, recusa; tamanho pedido é respeitado", () => {
  const grande = { lista: Array.from({ length: 800 }, (_, i) => i) };
  assert.deepEqual(kit.codificarRegistro(grande, 2048), { ok: false, erro: "grande" });
  assert.equal(kit.codificarRegistro([1], 2048).erro, "tipo");
  assert.equal(kit.codificarRegistro(null, 2048).erro, "tipo");
  const c = kit.codificarRegistro({ t: "x".repeat(500) }, 100);
  assert.ok(c.codigo.length <= 100);
  assert.ok(c.objeto.t.length > 0 && c.objeto.t.length < 500);
  assert.equal(kit.codificarRegistro({ t: "ab" }, 2).ok, false, "dois caracteres não guardam nada");
});

test("decodificarRegistro: leitura estrita", () => {
  const cod = (o) => kit.codificarRegistro(o, 2048).codigo;
  assert.equal(kit.decodificarRegistro(undefined).erro, "tipo");
  assert.equal(kit.decodificarRegistro("").erro, "vazio");
  assert.equal(kit.decodificarRegistro("a".repeat(2049)).erro, "grande", "código acima do limite é recusado");
  assert.notEqual(kit.decodificarRegistro("a".repeat(2048)).erro, "grande", "no limite ainda é lido");
  assert.equal(kit.decodificarRegistro("abc+/=").erro, "caracteres");
  assert.equal(kit.decodificarRegistro("abc def").erro, "caracteres");
  assert.equal(kit.decodificarRegistro("abcde").erro, "base64", "5 caracteres não fecham");
  assert.equal(kit.decodificarRegistro(Buffer.from([0xff, 0xfe, 0x7b, 0x7d]).toString("base64url")).erro, "utf8");
  assert.equal(kit.decodificarRegistro(Buffer.from([0xc0, 0x80]).toString("base64url")).erro, "utf8", "forma longa demais");
  assert.equal(kit.decodificarRegistro(Buffer.from([0xed, 0xa0, 0x80]).toString("base64url")).erro, "utf8", "par substituto solto");
  assert.equal(kit.decodificarRegistro(Buffer.from("não é json").toString("base64url")).erro, "json");
  assert.equal(kit.decodificarRegistro(Buffer.from("[1,2]").toString("base64url")).erro, "json", "tem de ser objeto");
  assert.equal(kit.decodificarRegistro(Buffer.from("42").toString("base64url")).erro, "json");
  assert.equal(kit.decodificarRegistro(Buffer.from("null").toString("base64url")).erro, "json");
  const comProto = kit.decodificarRegistro(Buffer.from('{"__proto__":{"polui":1},"a":1}').toString("base64url"));
  assert.deepEqual(Object.keys(comProto.objeto), ["a"]);
  assert.equal(({}).polui, undefined);
  assert.equal(kit.decodificarRegistro(cod({ a: 1 }), 5).erro, "grande", "limite pedido");
  assert.equal(kit.decodificarRegistro(Buffer.from('{"a":"\u00e9"}').toString("base64url")).objeto.a, "é");
});

test("validarEsquema: tipos, enum, faixas, tamanho e chave desconhecida", () => {
  const descritor = {
    tipo: "objeto",
    campos: {
      v: { tipo: "inteiro", enum: [1] },
      tipo: { tipo: "texto", enum: ["padrao"] },
      data: { tipo: "data" },
      ok: { tipo: "booleano" },
      variante: { tipo: "texto", enum: ["a", "b"], nulo: true },
      notas: { tipo: "mapa", chaves: ["x", "y"], valor: { tipo: "objeto", campos: { f: { tipo: "numero", min: 0, max: 1, casas: 2 }, c: { tipo: "inteiro", enum: [0, 1] } } } },
      itens: { tipo: "mapa", padraoChave: "^[a-z]+_[0-9]+$", valor: { tipo: "inteiro", min: -1, max: 3 }, max: 15 },
      regra: { tipo: "texto", max: 10, maxBytes: 20, opcional: true },
      lista: { tipo: "lista", item: { tipo: "texto" }, max: 2, opcional: true },
    },
  };
  const bom = { v: 1, tipo: "padrao", data: "2026-11-20", ok: true, variante: null, notas: { x: { f: 0.67, c: 1 } }, itens: { evitar_1: 1 } };
  assert.deepEqual(kit.validarEsquema(bom, descritor), { ok: true, erros: [] });
  assert.equal(kit.validarEsquema({ ...bom, regra: "curta", lista: ["a"] }, descritor).ok, true);
  const erro = (mudanca) => kit.validarEsquema({ ...bom, ...mudanca }, descritor);
  assert.match(erro({ v: 2 }).erros[0], /^v: valor fora da lista/);
  assert.match(erro({ v: "1" }).erros[0], /tem de ser número/);
  assert.match(erro({ v: 1.5 }).erros[0], /tem de ser inteiro/);
  assert.match(erro({ tipo: "outro" }).erros[0], /^tipo:/);
  assert.match(erro({ data: "2026-02-30" }).erros[0], /^data: não é uma data/);
  assert.match(erro({ ok: 1 }).erros[0], /verdadeiro ou falso/);
  assert.match(erro({ variante: "c" }).erros[0], /^variante:/);
  assert.match(erro({ tipo: null }).erros[0], /não pode ser nulo/);
  assert.match(erro({ notas: { z: { f: 0, c: 0 } } }).erros[0], /chave desconhecida "z"/);
  assert.match(erro({ notas: { x: { f: 1.5, c: 1 } } }).erros[0], /^notas\.x\.f: acima do máximo/);
  assert.match(erro({ notas: { x: { f: 0.123, c: 1 } } }).erros[0], /casas decimais/);
  assert.match(erro({ notas: { x: { f: 0.5, c: 2 } } }).erros[0], /^notas\.x\.c:/);
  assert.match(erro({ notas: { x: { f: 0.5 } } }).erros[0], /falta "c"/);
  assert.match(erro({ itens: { Evitar1: 1 } }).erros[0], /chave desconhecida/);
  assert.match(erro({ itens: { evitar_1: 4 } }).erros[0], /acima do máximo/);
  assert.match(erro({ regra: "x".repeat(11) }).erros[0], /passa de 10 caracteres/);
  assert.match(erro({ regra: "😀".repeat(8) }).erros[0], /passa de 20 bytes/);
  assert.match(erro({ lista: ["a", "b", "c"] }).erros[0], /mais de 2 itens/);
  assert.match(erro({ lista: [1] }).erros[0], /^lista\[0\]: tem de ser texto/);
  assert.match(kit.validarEsquema({ ...bom, intruso: 1 }, descritor).erros[0], /chave desconhecida "intruso"/);
  const semV = { ...bom };
  delete semV.v;
  assert.match(kit.validarEsquema(semV, descritor).erros[0], /falta "v"/);
  assert.equal(kit.validarEsquema(null, descritor).ok, false);
  assert.equal(kit.validarEsquema([], descritor).ok, false);
  assert.equal(kit.validarEsquema(new Date(), descritor).ok, false, "objeto com protótipo de outra classe");
  assert.equal(kit.validarEsquema(JSON.parse('{"__proto__": 1}'), { tipo: "objeto", campos: {} }).ok, false, "chave de protótipo não passa");
  assert.equal(kit.validarEsquema(Object.create(null), { tipo: "objeto", campos: {} }).ok, true, "objeto sem protótipo vale");
  assert.equal(kit.validarEsquema(1, null).ok, false);
});

function eventoDeTeste(extra = {}) {
  return {
    uid: "ex-dia7-k3f9x2qa@dlt.academy", inicio: "2026-11-27", hora: "20:00", duracaoMin: 3,
    resumo: "Exemplo: retorno do dia 7",
    descricao: "Três perguntas rápidas. Abra o link.",
    url: "https://dlt.academy/protocolos/exemplo/#volta=dia7",
    ...extra,
  };
}
const AGORA = new Date(Date.UTC(2026, 10, 20, 21, 3, 5));

test("montarIcs: estrutura, CRLF, UID estável, hora flutuante e alarme", () => {
  const ics = kit.montarIcs({ eventos: [eventoDeTeste(), eventoDeTeste({ uid: "ex-semana-k3f9x2qa@dlt.academy", inicio: "2026-11-27", resumo: "Revisão semanal", duracaoMin: 10, url: "https://dlt.academy/protocolos/exemplo/#volta=semana", repetir: { semanal: true, vezes: 13 } })], prodid: "-//DLT Academy//Exemplo//PT-BR", agora: AGORA });
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/[^\r]\n/.test(ics), "só CRLF");
  const linhas = ics.split("\r\n");
  assert.deepEqual(linhas.slice(0, 5), ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DLT Academy//Exemplo//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"]);
  assert.ok(linhas.includes("UID:ex-dia7-k3f9x2qa@dlt.academy"));
  assert.ok(linhas.includes("DTSTAMP:20261120T210305Z"));
  assert.ok(linhas.includes("DTSTART:20261127T200000"), "hora flutuante, sem fuso");
  assert.ok(linhas.includes("DURATION:PT3M"));
  assert.ok(linhas.includes("DURATION:PT10M"));
  assert.ok(linhas.includes("SUMMARY:Exemplo: retorno do dia 7"));
  assert.ok(linhas.includes("URL:https://dlt.academy/protocolos/exemplo/#volta=dia7"));
  assert.ok(linhas.includes("RRULE:FREQ=WEEKLY;COUNT=13"));
  assert.equal(linhas.filter((l) => l.startsWith("RRULE")).length, 1, "só a revisão semanal repete");
  assert.equal(linhas.filter((l) => l === "BEGIN:VALARM").length, 2);
  assert.equal(linhas.filter((l) => l === "TRIGGER:-PT0M").length, 2);
  assert.equal(linhas.filter((l) => l.startsWith("BEGIN:VEVENT")).length, 2);
  assert.equal(kit.montarIcs({ eventos: [eventoDeTeste()], agora: AGORA }), kit.montarIcs({ eventos: [eventoDeTeste()], agora: AGORA }), "mesma entrada, mesmo arquivo");
  assert.match(kit.montarIcs({ eventos: [], agora: AGORA }), /PRODID:-\/\/DLT Academy\/\/Protocolo\/\/PT-BR/, "prodid padrão");
});

test("montarIcs: dobra em 75 octetos sem partir caractere, e escapa o texto", () => {
  const longo = "Pergunta número um, com acentuação: ação, coração, não, é, à, ç; e emoji 😀 " + "ação ".repeat(40);
  const ics = kit.montarIcs({ eventos: [eventoDeTeste({ descricao: longo + "\\ fim", resumo: "Um; dois, três\nquatro" })], agora: AGORA });
  ics.split("\r\n").forEach((linha) => {
    assert.ok(Buffer.byteLength(linha, "utf8") <= 75, "linha de " + Buffer.byteLength(linha, "utf8") + " octetos: " + linha);
  });
  assert.ok(ics.split("\r\n").some((l) => l.startsWith(" ")), "há continuação com espaço");
  const desdobrado = ics.replace(/\r\n /g, "");
  assert.ok(desdobrado.includes("SUMMARY:Um\\; dois\\, três\\nquatro"));
  assert.ok(desdobrado.includes("DESCRIPTION:" + longo.replace(/,/g, "\\,").replace(/;/g, "\\;") + "\\\\ fim"), "desdobrar devolve o texto escapado inteiro");
  assert.ok(!ics.includes("\uFFFD"), "nenhum caractere partido");
  assert.ok(ics.includes("😀"));
});

test("montarIcs: datas na virada de mês, de ano e no bissexto", () => {
  const dtstart = (inicio) => kit.montarIcs({ eventos: [eventoDeTeste({ inicio })], agora: AGORA }).match(/DTSTART:(\S+)/)[1];
  assert.equal(dtstart(kit.somarDias("2026-11-28", 3)), "20261201T200000");
  assert.equal(dtstart(kit.somarDias("2026-12-29", 3)), "20270101T200000");
  assert.equal(dtstart(kit.somarDias("2028-02-27", 2)), "20280229T200000");
  assert.equal(dtstart(kit.somarDias("2026-11-20", 90)), "20270218T200000");
  assert.equal(kit.montarIcs({ eventos: [eventoDeTeste({ hora: "08:05" })], agora: "2027-01-01T00:00:00Z" }).match(/DTSTART:(\S+)/)[1], "20261127T080500");
  assert.ok(kit.montarIcs({ eventos: [eventoDeTeste()], agora: "2027-01-01T00:00:00Z" }).includes("DTSTAMP:20270101T000000Z"));
});

test("montarIcs: o link leva só o marco; nada de resposta, query ou código", () => {
  const ok = (url) => kit.montarIcs({ eventos: [eventoDeTeste({ url })], agora: AGORA });
  ok("https://dlt.academy/protocolos/exemplo/#volta=semana");
  ok("https://dlt.academy/protocolos/exemplo/");
  const ruins = [
    "https://dlt.academy/protocolos/exemplo/?padrao=freio",
    "https://dlt.academy/protocolos/exemplo/#c=abc123",
    "https://dlt.academy/protocolos/exemplo/#volta=dia7&x=1",
    "https://dlt.academy/protocolos/exemplo/#volta=DIA7",
    "http://dlt.academy/protocolos/exemplo/",
    "javascript:alert(1)",
    "https://dlt.academy/a b",
    "https://dlt.academy/\nBEGIN:VEVENT",
    "//dlt.academy/x",
  ];
  ruins.forEach((url) => assert.throws(() => ok(url), TypeError, url));
  assert.throws(() => kit.montarIcs({ eventos: [eventoDeTeste({ uid: "uid com espaço" })], agora: AGORA }), TypeError);
  assert.throws(() => kit.montarIcs({ eventos: [eventoDeTeste({ uid: "x\r\nBEGIN:VEVENT" })], agora: AGORA }), TypeError);
  assert.throws(() => kit.montarIcs({ eventos: [eventoDeTeste({ inicio: "2026-02-30" })], agora: AGORA }), TypeError);
  assert.throws(() => kit.montarIcs({ eventos: [eventoDeTeste({ hora: "25:00" })], agora: AGORA }), TypeError);
  assert.throws(() => kit.montarIcs({ eventos: [eventoDeTeste({ resumo: "" })], agora: AGORA }), TypeError);
  assert.throws(() => kit.montarIcs({ eventos: [eventoDeTeste()], agora: "ontem" }), TypeError);
  assert.equal(kit.montarIcs({ eventos: [eventoDeTeste()], prodid: "x\r\nBEGIN:VEVENT", agora: AGORA }).includes("BEGIN:VEVENT\r\nBEGIN:VEVENT"), false, "prodid inválido cai no padrão");
  const injetado = kit.montarIcs({ eventos: [eventoDeTeste({ descricao: "linha\r\nEND:VCALENDAR\r\nBEGIN:VEVENT" })], agora: AGORA });
  assert.equal(injetado.split("\r\n").filter((l) => l === "END:VCALENDAR").length, 1, "quebra de linha no texto vira \\n");
});

test("comporTexto: lacuna vazia tira o segmento inteiro", () => {
  const segmentos = [
    "Quando {gatilho:sp,min}, eu reajo.",
    "O que mais pesa é “{custo:sp}”.",
    "Isto sempre fica.",
    "A regra era “{regra}” e não “{outra}”.",
  ];
  assert.equal(
    kit.comporTexto(segmentos, { gatilho: "Chega a hora do preço.", custo: "perder o cliente!", regra: "x", outra: "y" }),
    "Quando chega a hora do preço, eu reajo. O que mais pesa é “perder o cliente”. Isto sempre fica. A regra era “x” e não “y”.",
  );
  assert.equal(kit.comporTexto(segmentos, { gatilho: "a", custo: "   ", regra: "x" }), "Quando a, eu reajo. Isto sempre fica.");
  assert.equal(kit.comporTexto(segmentos, {}), "Isto sempre fica.");
  assert.equal(kit.comporTexto(segmentos, { gatilho: null, custo: undefined, regra: "", outra: NaN }), "Isto sempre fica.");
  assert.equal(kit.comporTexto([{ texto: "Nota {n}." }], { n: 0 }), "Nota 0.", "zero é valor");
  assert.equal(kit.comporTexto(["{a} {b}"], { a: "x", b: ["lista"] }), "", "valor que não é texto nem número conta como vazio");
  assert.equal(kit.comporTexto(["{toString}"], {}), "", "não lê o protótipo");
  assert.equal(kit.comporTexto(null, {}), "");
  assert.ok(!/undefined|null|NaN|“”/.test(kit.comporTexto(segmentos, { gatilho: "a" })));
});

test("utilidades de texto: ponto final, minúscula, corte em bytes", () => {
  assert.equal(kit.semPontoFinal("  frase.  "), "frase");
  assert.equal(kit.semPontoFinal("frase?!…"), "frase");
  assert.equal(kit.semPontoFinal(null), "");
  assert.equal(kit.primeiraMinuscula("Olá Mundo"), "olá Mundo");
  assert.equal(kit.primeiraMinuscula(""), "");
  assert.equal(kit.cortarPorBytes("abc", 2), "ab");
  assert.equal(kit.cortarPorBytes("ação", 3), "aç", "ç tem 2 bytes: a(1)+ç(2)");
  assert.equal(kit.cortarPorBytes("😀😀", 5), "😀", "não parte o emoji");
  assert.equal(kit.cortarPorBytes("😀", 3), "");
  assert.equal(kit.cortarPorBytes("abc", 0), "");
  assert.equal(kit.cortarPorBytes("abc", 100), "abc");
  assert.equal(kit.bytesUtf8("😀ç"), 6);
});

test("textoSeguroPdf troca o que a fonte padrão não desenha, sem quebrar", () => {
  assert.equal(kit.textoSeguroPdf("Ação — “aspas” • 10% … ok"), "Ação — “aspas” • 10% … ok", "o que a fonte desenha fica");
  assert.equal(kit.textoSeguroPdf("Bom 😀 dia 👍🏽 ✓"), "Bom  dia  v");
  assert.equal(kit.textoSeguroPdf("a → b ≥ c"), "a -> b >= c");
  assert.equal(kit.textoSeguroPdf("中文 ok"), "?? ok");
  assert.equal(kit.textoSeguroPdf("a\u0000b\u200bc\r\nd"), "abc\nd");
  assert.equal(kit.textoSeguroPdf(null), "");
  assert.equal(kit.textoSeguroPdf("e\u0301"), "é", "normaliza a composição");
  assert.equal(kit.textoSeguroPdf("a\tb"), "a b");
  assert.equal(kit.textoSeguroPdf("❤️"), "");
});

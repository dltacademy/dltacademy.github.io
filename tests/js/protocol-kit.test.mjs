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

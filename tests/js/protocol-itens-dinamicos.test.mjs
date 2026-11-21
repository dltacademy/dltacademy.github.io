// A grade com `items` em função das respostas: o kit valida e resume com a lista do
// momento, e o motor desenha os itens que a pergunta anterior escolheu.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");

const OPCOES = [{ value: 0, label: "Não" }, { value: 1, label: "Um pouco" }, { value: 2, label: "Muito" }];
const TODOS = { a: "Item A", b: "Item B", c: "Item C" };
const grade = {
  id: "nivel",
  type: "grade",
  options: OPCOES,
  items: (r) => (Array.isArray(r.escolhas) ? r.escolhas : []).map((id) => ({ id, label: TODOS[id] })),
};

test("itensDoPasso devolve a lista fixa ou o que a função calcula das respostas", () => {
  assert.deepEqual(kit.itensDoPasso({ items: [{ id: "x", label: "X" }] }, {}), [{ id: "x", label: "X" }]);
  assert.deepEqual(kit.itensDoPasso(grade, { escolhas: ["b"] }), [{ id: "b", label: "Item B" }]);
  assert.deepEqual(kit.itensDoPasso(grade, {}), []);
  assert.deepEqual(kit.itensDoPasso({ items: () => "não é lista" }, {}), []);
  assert.deepEqual(kit.itensDoPasso({}, {}), []);
});

test("validarResposta confere a grade contra os itens do momento", () => {
  const r = { escolhas: ["a", "c"] };
  assert.deepEqual(kit.validarResposta(grade, { a: 1, c: 2 }, r), { ok: true, valor: { a: 1, c: 2 } });
  assert.equal(kit.validarResposta(grade, { a: 1 }, r).erro, "incompleto");
  assert.equal(kit.validarResposta(grade, { a: 1, c: 2, b: 0 }, r).erro, "item");
  assert.equal(kit.validarResposta(grade, { a: 1, c: 9 }, r).erro, "opcao");
  // Sem as respostas que definem os itens, nada vale: uma resposta guardada para outros itens cai.
  assert.equal(kit.validarResposta(grade, { a: 1, c: 2 }, {}).ok, false);
});

test("resumoDasRespostas usa os itens do momento", () => {
  const resumo = kit.resumoDasRespostas([grade], { escolhas: ["a", "b"], nivel: { a: 2, b: 0 } });
  assert.equal(resumo.length, 1);
  assert.match(resumo[0].value, /Item A: Muito; Item B: Não/);
});

test("restaurarProgresso refaz a grade dinâmica quando as respostas que a definem voltam antes", () => {
  const passos = [
    { id: "escolhas", type: "multi", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }, { value: "c", label: "C" }] },
    grade,
  ];
  const estado = { caminho: ["escolhas", "nivel"], respostas: { escolhas: ["b", "c"], nivel: { b: 1, c: 0 } }, passo: null };
  const volta = kit.restaurarProgresso(passos, estado, []);
  assert.deepEqual(volta.caminho, [0, 1]);
  assert.deepEqual(volta.respostas.nivel, { b: 1, c: 0 });
  const trocado = { ...estado, respostas: { escolhas: ["a", "c"], nivel: { b: 1, c: 0 } } };
  const parcial = kit.restaurarProgresso(passos, trocado, []);
  assert.deepEqual(parcial.caminho, [0], "a resposta de outros itens não vale");
  assert.equal(parcial.indice, 1);
});

const PAGINA = `
const PROTOCOL = {
  id: "protocolo-itens-dinamicos",
  slug: "itens-dinamicos",
  title: "Itens dinâmicos",
  path: "/tests/itens-dinamicos/",
  steps: [
    { id: "escolhas", type: "multi", prompt: "Quais?", options: [{ value: "a", label: "Item A" }, { value: "b", label: "Item B" }, { value: "c", label: "Item C" }] },
    {
      id: "nivel", type: "grade", prompt: "Quanto?",
      options: [{ value: 0, label: "Não" }, { value: 1, label: "Um pouco" }, { value: 2, label: "Muito" }],
      items: (r) => (r.escolhas || []).map((id) => ({ id, label: "Frase " + id })),
    },
  ],
  result: (a) => ({ id: 1, grade: 1, verdict: "Níveis: " + JSON.stringify(a.nivel), body: [] }),
};
runProtocol(PROTOCOL, "protocol-mount");
`;

test("o motor desenha na grade só os itens que a pergunta anterior escolheu", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.rodar(PAGINA, "pagina-itens.js");
  const p = piloto(env);
  const continuar = () => { p.botaoPor("Continuar").click(); env.rodarTimers(); };
  p.opcoes().find((r) => r.textContent.trim() === "Item B").click();
  p.opcoes().find((r) => r.textContent.trim() === "Item C").click();
  continuar();
  const rotulos = p.porClasse("protocol-grade-label").map((e) => e.textContent);
  assert.deepEqual(rotulos, ["Frase b", "Frase c"]);
  assert.equal(p.botaoPor("Continuar").hasAttribute("disabled"), true, "só habilita com todos os itens marcados");
  const marcar = (rotulo, opcao) => {
    const linha = p.porClasse("protocol-grade-item").find((i) => i.querySelector(".protocol-grade-label").textContent === rotulo);
    linha.querySelectorAll(".protocol-grade-btn").find((b) => b.textContent === opcao).click();
  };
  marcar("Frase b", "Muito");
  marcar("Frase c", "Não");
  continuar();
  assert.ok(p.noResultado());
  assert.match(p.porClasse("protocol-verdict")[0].textContent, /^Níveis: \{"b":2,"c":0\}$/);
});

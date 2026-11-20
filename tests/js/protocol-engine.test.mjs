// Testes do motor de protocolos (js/protocol-engine.js) com DOM falso.
//
// Esta primeira parte congela o comportamento dos protocolos que já estão no ar:
// o percurso passo a passo em todas as combinações de escolha, as telas, o
// resultado e o .md, comparados com os arquivos de golden/.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { PROTOCOLOS, gerarGolden } from "./golden/percurso.mjs";

const pasta = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

test("o motor exporta as funções puras para o Node", () => {
  const motor = require("../../js/protocol-engine.js");
  ["runProtocol", "resultGrade", "buildMarkdown", "safePdfText", "paidReportCheckoutUrl", "paidReportPageUrl"].forEach((nome) => {
    assert.equal(typeof motor[nome], "function", nome);
  });
  assert.equal(motor.resultGrade({ grade: 3 }), 3);
  assert.equal(motor.resultGrade({ tone: "good" }), 1);
  assert.equal(motor.resultGrade({ tone: "bad" }), 4);
  assert.equal(motor.resultGrade({}), 2);
});

for (const entrada of PROTOCOLOS) {
  test("referência do motor atual: " + entrada.slug, () => {
    const esperado = JSON.parse(fs.readFileSync(path.join(pasta, "golden", entrada.slug + ".json"), "utf8"));
    const obtido = JSON.parse(JSON.stringify(gerarGolden(entrada)));
    assert.deepEqual(Object.keys(obtido.texto.cheio), Object.keys(esperado.texto.cheio), "mesmas combinações com texto");
    assert.deepEqual(Object.keys(obtido.texto.vazio), Object.keys(esperado.texto.vazio), "mesmas combinações sem texto");
    assert.deepEqual(obtido.texto, esperado.texto);
    assert.deepEqual(obtido.roteiros, esperado.roteiros, "roteiros com voltar");
    assert.deepEqual(obtido.amostras, esperado.amostras, "arquivos .md");
  });
}

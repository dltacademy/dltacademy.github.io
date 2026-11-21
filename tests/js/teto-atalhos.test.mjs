// Os atalhos do console de tests/js/teto-casos.mjs (tocarCaso, semearCiclo, tocarRetorno) rodando como
// na página: o módulo é lido como script num contexto com o DOM falso, que é onde ele usa document,
// window e os globais do protocolo.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { RAIZ } from "./fake-dom.mjs";
import { CHAVE, abrir, lerLocal } from "./teto-ciclo-apoio.mjs";

function comAtalhos(pagina) {
  const { env } = pagina;
  env.contexto.setTimeout = (fn) => { env.rodarTimers(); return Promise.resolve().then(fn) && 0; };
  const fonte = fs.readFileSync(path.join(RAIZ, "tests/js/teto-casos.mjs"), "utf8").replace(/^export /gm, "");
  env.rodar(fonte + "\nglobalThis.__atalhos = { tocarCaso, semearCiclo, tocarRetorno, RETORNOS };", "teto-casos.js");
  return env.contexto.__atalhos;
}

test("semearCiclo guarda o Teto com o dia 0 para trás, e tocarRetorno responde cada marco no link dele", async () => {
  const a = abrir();
  const m = comAtalhos(a);
  const dados = await m.semearCiclo("A", { diasAtras: 7, espera: 0 });
  assert.equal(dados.dia0, "2026-11-13");
  const guardado = lerLocal(a.env);
  assert.equal(guardado.volta.dia0, "2026-11-13");
  assert.equal(guardado.volta.registro.data, "2026-11-13");
  assert.equal(guardado.volta.registro.datas.d7, "2026-11-20");
  for (const nome of ["dia3", "dia7", "dia7_travou", "dia30", "semana", "sinais", "dia90"]) {
    const marco = nome === "dia7_travou" ? "dia7" : nome;
    const b = abrir({ hash: "#volta=" + marco, local: { [CHAVE]: a.env.armazenamento[CHAVE] } });
    const atalhos = comAtalhos(b);
    await atalhos.tocarRetorno(nome, { espera: 0 });
    assert.ok(b.p.noResultado(), nome + ": " + b.p.mount.textContent.slice(0, 160));
  }
});

test("tocarRetorno explica o que fazer quando a página não está no link do marco ou não há Teto guardado", async () => {
  const m = comAtalhos(abrir());
  await assert.rejects(m.tocarRetorno("dia7", { espera: 0 }), /Abra a página no link do marco/);
  await assert.rejects(m.tocarRetorno("inexistente", { espera: 0 }), /Retorno desconhecido/);
});

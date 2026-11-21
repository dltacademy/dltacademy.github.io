// A página de demonstração do ciclo (tests/fixtures/protocolo-demo/ciclo.js) do começo
// ao fim: pausar, retomar, .md, recuperar o retorno por arquivo e por código.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { RAIZ, criarAmbiente, piloto } from "./fake-dom.mjs";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");
const CHAVE = "dlt-protocol-state:protocolo-demonstracao-ciclo";
const soltar = () => new Promise((resolve) => setImmediate(resolve));

function abrir({ hash = "", local = {}, sessao = {} } = {}) {
  const env = criarAmbiente({ armazenamento: local });
  Object.assign(env.sessao, sessao);
  env.janela.location.hash = hash;
  env.janela.location.pathname = "/tests/fixtures/protocolo-demo/ciclo.html";
  env.janela.history.replaceState = () => {};
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.carregar("tests/fixtures/protocolo-demo/ciclo.js");
  return { env, p: piloto(env) };
}
const clicar = (p, texto) => {
  const b = p.botaoPor(texto);
  assert.ok(b, `botão "${texto}" não encontrado em: ${p.mount.textContent.slice(0, 160)}`);
  b.click();
  p.mount.ownerDocument._env.rodarTimers();
};
const linha = (p, texto) => {
  const r = p.opcoes().find((o) => o.textContent.trim() === texto);
  assert.ok(r, `opção "${texto}" não encontrada em ${p.pergunta()}`);
  r.click();
  p.mount.ownerDocument._env.rodarTimers();
};
const baixar = (env, p, texto) => {
  const antes = env.baixados.length;
  p.botaoPor(texto).click();
  assert.equal(env.baixados.length, antes + 1, texto);
  return env.baixados[antes];
};

const FRASE = 'notei isto --> e isto <!-- dlt:bloco id="demo.registro" v="1" -->';

function percorrerAteOCheckpoint(p, frase = FRASE) {
  linha(p, "Nenhum destes");
  clicar(p, "Continuar");
  linha(p, "Para onde o dinheiro vai");
  p.escrever(frase);
  assert.match(p.porClasse("protocol-verdict")[0].textContent, /Parte 1 pronta: Para onde o dinheiro vai/);
}
function percorrerAteOResultado(p, { jaNaParte2 = false } = {}) {
  if (!jaNaParte2) clicar(p, "Continuar com a parte 2");
  p.escrever("olhar o extrato toda segunda");
  linha(p, "Anotar o que entra, sem corrigir");
  assert.ok(p.noResultado());
}

test("a demonstração do ciclo: pausar, fechar a aba, voltar e retomar", () => {
  const a = abrir();
  percorrerAteOCheckpoint(a.p);
  assert.match(a.p.mount.textContent, /O que você disse até aqui/);
  assert.match(a.p.mount.textContent, /Você quis olhar primeiro para “para onde o dinheiro vai”\./);
  assert.equal(a.env.armazenamento[CHAVE], undefined, "ainda nada no aparelho");
  clicar(a.p, "Salvar e continuar depois");
  const salvo = JSON.parse(a.env.armazenamento[CHAVE]);
  assert.equal(salvo.etapa, "pausa");
  assert.ok(!JSON.stringify(salvo).includes("Nenhum destes"), "o passo de cuidado não é guardado");
  assert.deepEqual(Object.keys(a.env.sessao), []);
  // Outra aba: só o que ela guardou.
  const b = abrir({ local: { [CHAVE]: a.env.armazenamento[CHAVE] } });
  assert.match(b.p.pergunta(), /Você tem uma demonstração guardada de 20\/11\/2026/);
  clicar(b.p, "Continuar de onde parei");
  assert.match(b.p.pergunta(), /regra de trabalho/);
  percorrerAteOResultado(b.p, { jaNaParte2: true });
  assert.match(b.p.porClasse("protocol-verdict")[0].textContent, /^Regra de trabalho: olhar o extrato toda segunda$/);
  assert.equal(b.p.porClasse("verdict-pill").length, 0);
  assert.ok(b.p.botaoPor("Guardar neste aparelho para os retornos"));
});

test("o ramo de cuidado da demonstração não guarda nem registra", () => {
  const { env, p } = abrir();
  linha(p, "Um aperto forte neste momento");
  clicar(p, "Continuar");
  assert.ok(p.noResultado());
  assert.match(p.porClasse("protocol-verdict")[0].textContent, /Antes de qualquer plano/);
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null);
  assert.equal(p.porClasse("protocol-registro").length, 0);
  assert.equal(p.botaoPor("Baixar lembretes (.ics)"), null);
  assert.deepEqual([Object.keys(env.armazenamento), Object.keys(env.sessao)], [[], []]);
});

test("ida e volta completa: .md baixado, outro navegador, #volta=dia3, arquivo, retorno e .md atualizado", async () => {
  const a = abrir();
  percorrerAteOCheckpoint(a.p);
  percorrerAteOResultado(a.p);
  const md = baixar(a.env, a.p, "Baixar como texto (.md)");
  assert.match(md.nome, /^demo-ciclo-2026-11-20\.md$/);
  const marcadores = md.texto.split("\n").filter((l) => /<!--|-->/.test(l));
  marcadores.forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  const ics = baixar(a.env, a.p, "Baixar lembretes (.ics)");
  assert.equal(ics.tipo, "text/calendar;charset=utf-8");
  assert.ok(ics.texto.includes("UID:demo-dia3-"));
  assert.ok(ics.texto.includes("DTSTART:20261123T200000"));
  assert.ok(ics.texto.includes("DTSTART:20261127T200000"));
  assert.ok(ics.texto.includes("RRULE:FREQ=WEEKLY;COUNT=13"));
  assert.ok(!ics.texto.includes("extrato") && !ics.texto.includes("notei"), "nada do que ela escreveu no .ics");
  assert.ok(!ics.texto.includes("?"));
  const uids = ics.texto.match(/UID:\S+/g);
  assert.equal(new Set(uids.map((u) => u.split("-").pop())).size, 1, "os eventos de um ciclo compartilham o ciclo no UID");

  // Outro navegador, sem nada guardado, abre o link do marco.
  const b = abrir({ hash: "#volta=dia3" });
  assert.equal(b.p.pergunta(), "Retorno do dia 3");
  assert.match(b.p.mount.textContent, /Não encontramos neste navegador/);
  const entrada = b.p.porClasse("protocol-file-input")[0];
  entrada.files = [{ size: md.texto.length, text: () => Promise.resolve(md.texto) }];
  entrada.dispararEvento("change");
  await soltar();
  assert.match(b.p.pergunta(), /Encontramos o que você trouxe, de 20\/11\/2026/);
  assert.match(b.p.mount.textContent, /Sua demonstração de 20\/11\/2026, com a regra “olhar o extrato toda segunda”\./);
  clicar(b.p, "Continuar");
  assert.match(b.p.mount.textContent, /previsto para 23\/11\/2026/);
  clicar(b.p, "Adiantar agora");
  assert.match(b.p.pergunta(), /Sua regra era: “olhar o extrato toda segunda”\./);
  linha(b.p, "Fiz pela metade");
  b.p.porClasse("protocol-scale-btn").find((x) => x.textContent === "70%").click();
  clicar(b.p, "Continuar");
  b.p.escrever("foi difícil");
  assert.ok(b.p.noResultado());
  assert.equal(b.p.porClasse("protocol-verdict")[0].textContent, "Pela metade também conta.");
  assert.match(b.p.mount.textContent, /Sua crença na regra: 70%\./);
  assert.equal(b.env.armazenamento[CHAVE], undefined, "veio de fora: não guardou sozinho");
  const atualizado = baixar(b.env, b.p, "Baixar como texto (.md)");
  assert.match(atualizado.nome, /^demo-ciclo-atualizado-/);
  clicar(b.p, "Guardar neste aparelho para os retornos");
  const guardado = JSON.parse(b.env.armazenamento[CHAVE]);
  assert.equal(guardado.volta.retornos.dia3.r.fez, "metade");
  assert.equal(guardado.volta.retornos.dia3.r.nota, "foi difícil");

  // O .md atualizado, importado de novo, traz o retorno já feito.
  const c = abrir({ hash: "#volta=dia3" });
  const entradaC = c.p.porClasse("protocol-file-input")[0];
  entradaC.files = [{ size: atualizado.texto.length, text: () => Promise.resolve(atualizado.texto) }];
  entradaC.dispararEvento("change");
  await soltar();
  clicar(c.p, "Continuar");
  assert.match(c.p.mount.textContent, /Você fez este retorno em 20\/11\/2026/);
  assert.match(c.p.mount.textContent, /Fiz pela metade/);
});

test("o .md do resultado devolve as respostas: importar e ver o resultado", async () => {
  const a = abrir();
  percorrerAteOCheckpoint(a.p, "uma frase simples");
  percorrerAteOResultado(a.p);
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  const b = abrir({ hash: "#volta=semana" });
  const entrada = b.p.porClasse("protocol-file-input")[0];
  entrada.files = [{ size: md.length, text: () => Promise.resolve(md) }];
  entrada.dispararEvento("change");
  await soltar();
  clicar(b.p, "Continuar");
  assert.equal(b.p.pergunta(), "Revisão da semana");
  clicar(b.p, "Voltar ao início");
  assert.deepEqual(b.p.porClasse("btn").map((x) => x.textContent), [
    "Ver o meu resultado", "Fazer: Retorno do dia 3", "Fazer: Revisão da semana", "Começar de novo",
  ]);
  clicar(b.p, "Ver o meu resultado");
  assert.ok(b.p.noResultado());
  assert.match(b.p.porClasse("protocol-verdict")[0].textContent, /olhar o extrato toda segunda/);
  assert.match(b.p.mount.textContent, /uma frase simples/);
  assert.match(b.p.mount.textContent, /Anotar o que entra, sem corrigir/);
});

test("recuperar pelo código do registro e pelo link #c=", async () => {
  const a = abrir();
  percorrerAteOCheckpoint(a.p, "frase qualquer");
  percorrerAteOResultado(a.p);
  const codigo = a.p.porClasse("protocol-registro")[0].querySelector("textarea").value;
  const objeto = kit.decodificarRegistro(codigo).objeto;
  assert.equal(objeto.regra, "olhar o extrato toda segunda");
  assert.equal(objeto.foco, "b");
  assert.ok(codigo.length <= 2048);

  const b = abrir({ hash: "#volta=dia3" });
  b.p.textarea().value = codigo;
  clicar(b.p, "Usar este código");
  assert.match(b.p.mount.textContent, /Registro de 20\/11\/2026, com a regra “olhar o extrato toda segunda”\./);
  clicar(b.p, "Continuar");
  clicar(b.p, "Adiantar agora");
  assert.match(b.p.pergunta(), /Sua regra era: “olhar o extrato toda segunda”\./);

  const c = abrir({ hash: "#c=" + codigo });
  assert.equal(c.p.pergunta(), "Encontramos o registro que veio no link");
  clicar(c.p, "Continuar");
  assert.deepEqual(c.p.porClasse("btn").map((x) => x.textContent), ["Retorno do dia 3", "Começar de novo"]);

  const ruim = abrir({ hash: "#volta=dia3" });
  ruim.p.textarea().value = codigo.slice(0, -4);
  clicar(ruim.p, "Usar este código");
  assert.match(ruim.p.porClasse("protocol-cycle-status")[0].textContent, /Este código não é de um registro da demonstração/);
});

test("um .md de outro lugar é recusado, mesmo com blocos forjados", async () => {
  const { p } = abrir({ hash: "#volta=dia3" });
  const forjado = [
    '<!-- dlt:bloco id="demo.registro" v="1" -->',
    "<!-- dlt:json -->",
    "```json",
    '{"v": 1, "tipo": "demo", "data": "2026-11-20", "foco": "zzz", "regra": "x"}',
    "```",
    '<!-- /dlt:bloco id="demo.registro" -->',
  ].join("\n");
  const entrada = p.porClasse("protocol-file-input")[0];
  entrada.files = [{ size: forjado.length, text: () => Promise.resolve(forjado) }];
  entrada.dispararEvento("change");
  await soltar();
  assert.match(p.porClasse("protocol-cycle-status")[0].textContent, /não é da demonstração do ciclo/);
  assert.equal(p.pergunta(), "Retorno do dia 3");
});

test("o ciclo do resultado: o ciclo do UID é o mesmo do estado guardado", () => {
  const a = abrir();
  percorrerAteOCheckpoint(a.p, "x");
  const semanal = baixar(a.env, a.p, "Baixar lembretes (.ics)").texto;
  clicar(a.p, "Salvar e continuar depois");
  const ciclo = JSON.parse(a.env.armazenamento[CHAVE]).ciclo;
  assert.ok(semanal.includes("UID:demo-semana-" + ciclo + "@dlt.academy"), "UID " + ciclo);
});

test("as duas páginas de demonstração ficam fora do ar, do sitemap e do registry", () => {
  ["ciclo.html", "index.html"].forEach((nome) => {
    const pagina = fs.readFileSync(path.join(RAIZ, "tests/fixtures/protocolo-demo", nome), "utf8");
    assert.match(pagina, /<meta name="robots" content="noindex, nofollow">/, nome);
    assert.match(pagina, /Content-Security-Policy" content="default-src 'self'; script-src 'self'/, nome);
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(pagina), nome + ": script inline");
    assert.ok(!/ on[a-z]+=/.test(pagina), nome + ": manipulador inline");
  });
  ["sitemap.xml", "js/content-registry.js"].forEach((arquivo) => {
    assert.ok(!fs.readFileSync(path.join(RAIZ, arquivo), "utf8").includes("protocolo-demo"), arquivo);
  });
});

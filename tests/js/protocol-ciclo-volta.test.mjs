// O ciclo de volta no motor (js/protocol-engine.js), com o protocolo de teste do ciclo: o prazo que
// volta a valer ao abrir, o pedido de armazenamento persistente, os valores derivados no lugar do que
// nunca se guarda, o retorno que decide o que grava, o retorno que se repete e o que um retorno
// nunca leva para o armazenamento.
import assert from "node:assert/strict";
import test from "node:test";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const CHAVE = "dlt-protocol-state:protocolo-ciclo-teste";

function abrir({ hash = "", local = {}, sessao = {}, ajuste, antes } = {}) {
  const env = criarAmbiente({ armazenamento: local });
  Object.assign(env.sessao, sessao);
  env.janela.location.hash = hash;
  env.janela.history.replaceState = () => {};
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.carregar("tests/js/fixtures/protocolo-ciclo.js");
  if (ajuste) env.rodar(ajuste);
  if (antes) antes(env);
  env.rodar('runProtocol(PROTOCOL, "protocol-mount")');
  return { env, p: piloto(env) };
}

const botao = (p, texto) => {
  const achado = p.botaoPor(texto);
  assert.ok(achado, `botão "${texto}" não encontrado; na tela: ${p.mount.textContent.slice(0, 200)}`);
  return achado;
};
const clicar = (p, texto) => { botao(p, texto).click(); p.mount.ownerDocument._env.rodarTimers(); };
const lerLocal = (env) => JSON.parse(env.armazenamento[CHAVE]);

function estadoSalvo(extra = {}) {
  return {
    esquema: "dlt.protocolo.estado",
    v: 1,
    protocolo: "protocolo-ciclo-teste",
    bib: "t-1",
    ciclo: "k3f9x2qa",
    criado: "2026-11-01",
    atualizado: "2026-11-01T15:00:00.000Z",
    expira: "2026-12-01",
    fluxo: "principal",
    etapa: "concluido",
    passo: null,
    caminho: ["foco", "frase", "meio", "regra", "passo"],
    respostas: { foco: "a", frase: "uma frase minha", regra: "minha regra", passo: "p1" },
    volta: { n: 1, dia0: "2026-11-18", registro: { v: 1 }, retornos: {} },
    historico: [],
    lembrete: null,
    ...extra,
  };
}
const guardado = (extra) => ({ [CHAVE]: JSON.stringify(estadoSalvo(extra)) });

// ---- o prazo volta a valer ao abrir ----------------------------------------------------------------

test("abrir a página com o que ela guardou renova o prazo para 120 dias a partir de hoje, sem mostrar resposta", () => {
  const { env, p } = abrir({ local: guardado() });
  assert.equal(lerLocal(env).expira, "2027-03-20");
  assert.equal(lerLocal(env).atualizado, "2026-11-01T15:00:00.000Z", "só o prazo muda");
  assert.deepEqual(lerLocal(env).respostas, estadoSalvo().respostas);
  assert.match(p.mount.textContent, /Você tem um teste guardado de 01\/11\/2026/);
  assert.ok(!p.mount.textContent.includes("minha regra"), "nenhuma resposta antes da escolha");
  assert.match(p.mount.textContent, /vale até 20\/03\/2027/);
});

test("o prazo renovado vale também ao abrir pelo marco, e um prazo mais longo não encurta", () => {
  const { env } = abrir({ hash: "#volta=dia3", local: guardado() });
  assert.equal(lerLocal(env).expira, "2027-03-20");
  const longe = abrir({ local: guardado({ expira: "2027-06-01" }) });
  assert.equal(lerLocal(longe.env).expira, "2027-06-01");
});

test("o que já passou do prazo continua sendo apagado, sem renovar", () => {
  const { env, p } = abrir({ local: guardado({ expira: "2026-11-19" }) });
  assert.equal(env.armazenamento[CHAVE], undefined);
  assert.match(p.mount.textContent, /passou do prazo/);
});

// ---- armazenamento persistente ------------------------------------------------------------------------

test("o pedido de armazenamento persistente só acontece quando ela guarda, e uma recusa não atrapalha", () => {
  let pedidos = 0;
  const { env, p } = abrir({
    antes: (e) => { e.janela.navigator.storage = { persist: () => { pedidos += 1; return Promise.resolve(false); } }; },
  });
  p.opcoes().find((r) => r.textContent.trim() === "Nenhum destes").click();
  clicar(p, "Continuar");
  p.opcoes()[0].click();
  env.rodarTimers();
  p.escrever("uma frase");
  assert.equal(pedidos, 0, "nada foi guardado ainda");
  clicar(p, "Salvar e continuar depois");
  assert.equal(pedidos, 1);
  assert.ok(env.armazenamento[CHAVE]);
});

test("sem a API de armazenamento persistente, guardar funciona do mesmo jeito", () => {
  const { env, p } = abrir({ local: guardado({ etapa: "concluido" }) });
  clicar(p, "Ver o meu resultado");
  clicar(p, "Guardar neste aparelho para os retornos");
  assert.ok(lerLocal(env));
  const quebrado = abrir({
    local: guardado(),
    antes: (e) => { e.janela.navigator.storage = { persist: () => { throw new Error("não"); } }; },
  });
  clicar(quebrado.p, "Ver o meu resultado");
  clicar(quebrado.p, "Guardar neste aparelho para os retornos");
  assert.match(quebrado.p.mount.textContent, /Guardado neste aparelho/);
});

// ---- valores derivados no lugar do que nunca se guarda ---------------------------------------------------

const DERIVAR = "PROTOCOL.persist.derivados = ['baixo']; PROTOCOL.persist.derivar = (a) => ({ baixo: (a.cuidado || []).indexOf('nenhum') !== -1 || a.baixo === true });";

test("o valor derivado é guardado como verdadeiro, sem a resposta que o gerou, e volta ao retomar", () => {
  const { env, p } = abrir({ ajuste: DERIVAR });
  p.opcoes().find((r) => r.textContent.trim() === "Nenhum destes").click();
  clicar(p, "Continuar");
  p.opcoes()[0].click();
  env.rodarTimers();
  const sessao = JSON.parse(env.sessao[CHAVE]);
  assert.equal(sessao.respostas.baixo, true);
  assert.ok(!("cuidado" in sessao.respostas));
  assert.ok(!JSON.stringify(sessao).includes("Nenhum destes"));
  const depois = abrir({ ajuste: DERIVAR, sessao: { ...env.sessao } });
  assert.equal(depois.p.pergunta(), "Escreva uma frase.");
  depois.p.escrever("minha frase");
  assert.equal(JSON.parse(depois.env.sessao[CHAVE]).respostas.baixo, true, "continua guardado depois de retomar");
});

test("o valor derivado falso não é guardado, e só verdadeiro volta", () => {
  const { env, p } = abrir({ ajuste: "PROTOCOL.persist.derivados = ['baixo']; PROTOCOL.persist.derivar = () => ({ baixo: false });" });
  p.opcoes().find((r) => r.textContent.trim() === "Nenhum destes").click();
  clicar(p, "Continuar");
  p.opcoes()[0].click();
  env.rodarTimers();
  assert.ok(!("baixo" in JSON.parse(env.sessao[CHAVE]).respostas));
  const solto = abrir({ local: guardado({ respostas: { ...estadoSalvo().respostas, baixo: "sim" }, etapa: "pausa", caminho: ["foco"], passo: "frase" }), ajuste: "PROTOCOL.persist.derivados = ['baixo'];" });
  clicar(solto.p, "Continuar de onde parei");
  assert.equal(solto.p.pergunta(), "Escreva uma frase.");
  solto.p.escrever("x");
  assert.ok(!("baixo" in JSON.parse(solto.env.sessao[CHAVE]).respostas), "texto no lugar do verdadeiro não volta");
});

// ---- o retorno que decide o que grava -------------------------------------------------------------------

const GRAVAR = `
PROTOCOL.retornos.dia3.gravar = (ctx) => ({
  volta: { n: ctx.estado.volta.n + 1, dia0: ctx.hoje, registro: { v: 1 }, retornos: {} },
  historico: ctx.estado.historico.concat([{ volta: ctx.estado.volta.n, nota: ctx.answers.nota }]),
  respostas: { foco: 'b', frase: 'nova frase', regra: 'nova regra', passo: 'p2' },
  caminho: ['foco', 'frase', 'meio', 'regra', 'passo'],
});`;

function fazerDia3(p) {
  clicar(p, "Adiantar agora");
  p.escolher(0);
  p.porClasse("protocol-scale-btn")[4].click();
  clicar(p, "Continuar");
}

test("um retorno com gravar troca a volta, o histórico e as respostas no estado guardado", () => {
  const { env, p } = abrir({ hash: "#volta=dia3", local: guardado(), ajuste: GRAVAR });
  fazerDia3(p);
  assert.ok(p.noResultado());
  const salvo = lerLocal(env);
  assert.equal(salvo.volta.n, 2);
  assert.equal(salvo.volta.dia0, "2026-11-20");
  assert.deepEqual(salvo.volta.retornos, {});
  assert.deepEqual(salvo.historico, [{ volta: 1, nota: 4 }]);
  assert.equal(salvo.respostas.regra, "nova regra");
  assert.deepEqual(salvo.caminho, ["foco", "frase", "meio", "regra", "passo"]);
  assert.equal(salvo.etapa, "concluido");
  assert.match(p.mount.textContent, /Este retorno ficou guardado neste aparelho/);
});

test("o gravar recebe uma cópia do estado: mexer nela não muda o que está guardado", () => {
  const { env, p } = abrir({
    hash: "#volta=dia3",
    local: guardado(),
    ajuste: "PROTOCOL.retornos.dia3.gravar = (ctx) => { ctx.estado.respostas.regra = 'estragada'; ctx.estado.volta.n = 9; return null; };",
  });
  fazerDia3(p);
  const salvo = lerLocal(env);
  assert.equal(salvo.respostas.regra, "minha regra");
  assert.equal(salvo.volta.n, 1);
});

test("gravar que devolve null não muda nada e não diz que guardou", () => {
  const { env, p } = abrir({ hash: "#volta=dia3", local: guardado(), ajuste: "PROTOCOL.retornos.dia3.gravar = () => null;" });
  fazerDia3(p);
  assert.ok(p.noResultado());
  assert.deepEqual(lerLocal(env).volta.retornos, {});
  assert.ok(!/ficou guardado/.test(p.mount.textContent));
});

test("o retorno de um estado trazido de fora só grava quando ela guarda, e guarda o que o gravar decidiu", async () => {
  const { env, p } = abrir({ hash: "#volta=dia3", ajuste: GRAVAR });
  const arquivo = { size: 40, text: () => Promise.resolve(JSON.stringify({ ok: true, regra: "a regra do arquivo", dia0: "2026-11-10" })) };
  const input = p.todos().find((e) => e.tagName === "INPUT" && e.getAttribute("type") === "file");
  input.files = [arquivo];
  input.dispararEvento("change");
  await new Promise((resolve) => setImmediate(resolve));
  clicar(p, "Continuar");
  clicar(p, "Começar");
  p.escolher(0);
  p.porClasse("protocol-scale-btn")[2].click();
  clicar(p, "Continuar");
  assert.equal(env.armazenamento[CHAVE], undefined, "nada gravado sem o toque");
  clicar(p, "Guardar neste aparelho para os retornos");
  const salvo = lerLocal(env);
  assert.equal(salvo.volta.n, 2);
  assert.equal(salvo.respostas.regra, "nova regra");
  assert.deepEqual(salvo.historico, [{ volta: 1, nota: 2 }]);
});

test("retorno que declara guardar falso não é gravado nem oferece guardar", () => {
  const { env, p } = abrir({
    hash: "#volta=dia3",
    local: guardado(),
    ajuste: "const antigo = PROTOCOL.retornos.dia3.result; PROTOCOL.retornos.dia3.result = (c) => Object.assign(antigo(c), { guardar: false });",
  });
  fazerDia3(p);
  assert.deepEqual(lerLocal(env).volta.retornos, {});
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null);
  const fora = abrir({
    hash: "#volta=dia3",
    ajuste: "const antigo = PROTOCOL.retornos.dia3.result; PROTOCOL.retornos.dia3.result = (c) => Object.assign(antigo(c), { guardar: false });",
  });
  assert.ok(fora.p.botaoPor("Fazer o protocolo do começo"));
});

test("o que o retorno grava nunca leva a resposta de um passo que não se guarda", () => {
  const ajuste = `PROTOCOL.retornos.dia3.steps.unshift({ id: 'cuidado', type: 'multi', exclusive: 'nenhum', prompt: 'Cuidado de novo?', options: [{ value: 'aperto', label: 'Aperto' }, { value: 'nenhum', label: 'Nenhum destes' }] });`;
  const { env, p } = abrir({ hash: "#volta=dia3", local: guardado(), ajuste });
  clicar(p, "Adiantar agora");
  p.opcoes().find((r) => r.textContent.trim() === "Nenhum destes").click();
  clicar(p, "Continuar");
  p.escolher(0);
  p.porClasse("protocol-scale-btn")[4].click();
  clicar(p, "Continuar");
  const r = lerLocal(env).volta.retornos.dia3.r;
  assert.equal(r.fez, "sim");
  assert.ok(!("cuidado" in r) && !("cuidado__labels" in r), JSON.stringify(r));
  assert.ok(!JSON.stringify(lerLocal(env)).includes("Nenhum destes"));
});

// ---- retorno que se repete e a introdução -----------------------------------------------------------------

test("o retorno que se repete nunca aparece como feito: diz quando foi a última e deixa fazer de novo", () => {
  const ajuste = "PROTOCOL.retornos.semana.recorrente = true;";
  const local = guardado({ volta: { n: 1, dia0: "2026-11-01", registro: { v: 1 }, retornos: { semana: { em: "2026-11-14", r: {} } } } });
  const { p } = abrir({ hash: "#volta=semana", local, ajuste });
  assert.ok(!/Você fez este retorno/.test(p.mount.textContent));
  assert.match(p.mount.textContent, /A última foi em 14\/11\/2026/);
  assert.ok(p.botaoPor("Começar"));
  const comum = abrir({ hash: "#volta=semana", local });
  assert.match(comum.p.mount.textContent, /Você fez este retorno em 14\/11\/2026/, "sem a marca, o comportamento de sempre");
});

test("o retorno pode acrescentar linhas à introdução com o que está guardado", () => {
  const ajuste = "PROTOCOL.retornos.dia3.intro = (est) => ['A última volta foi em ' + est.volta.dia0 + '.', 7, ''];";
  const { p } = abrir({ hash: "#volta=dia3", local: guardado(), ajuste });
  assert.match(p.mount.textContent, /A última volta foi em 2026-11-18\./);
  const quebrado = abrir({ hash: "#volta=dia3", local: guardado(), ajuste: "PROTOCOL.retornos.dia3.intro = () => { throw new Error('x'); };" });
  assert.ok(quebrado.p.botaoPor("Adiantar agora"), "erro na introdução não derruba a tela");
});

// ---- registro trazido só pelo código ----------------------------------------------------------------------

test("um estado sem respostas (só o registro) oferece os retornos e não finge ter um resultado", () => {
  const { p } = abrir({ local: guardado({ respostas: {}, caminho: [] }) });
  assert.equal(p.botaoPor("Ver o meu resultado"), null);
  assert.ok(p.botaoPor("Fazer: Retorno do dia 3"));
  assert.ok(p.botaoPor("Começar de novo"));
  assert.ok(p.botaoPor("Fazer: Retorno do dia 3").classList.contains("btn-primary"));
});

// ---- o kit: valores derivados ao restaurar -------------------------------------------------------------

test("restaurarProgresso devolve só os derivados verdadeiros que o protocolo declarou", async () => {
  const { createRequire } = await import("node:module");
  const kit = createRequire(import.meta.url)("../../js/protocol-kit.js");
  const passos = [{ id: "a", type: "write", maxLength: 20 }];
  const estado = { caminho: ["a"], respostas: { a: "x", baixo: true, outro: true, cru: "sim" } };
  assert.deepEqual(kit.restaurarProgresso(passos, estado, [], ["baixo", "cru", "ausente"]).respostas, { a: "x", baixo: true });
  assert.deepEqual(kit.restaurarProgresso(passos, estado, []).respostas, { a: "x" }, "sem a lista, nada volta");
});

test("a recuperação só oferece colar o código quando o retorno sabe usar só o registro", () => {
  const comCodigo = abrir({ hash: "#volta=dia3" });
  assert.ok(comCodigo.p.textarea(), "o retorno que declara codigo");
  const semCodigo = abrir({ hash: "#volta=semana" });
  assert.equal(semCodigo.p.textarea(), null, "o retorno que não declara");
  assert.ok(semCodigo.p.porClasse("protocol-file-input").length > 0, "o arquivo continua sendo oferecido");
  const geral = abrir({ local: { [CHAVE]: "{ não é json" } });
  assert.ok(geral.p.textarea(), "a recuperação sem marco oferece o código");
});

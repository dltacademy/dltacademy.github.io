// Estado guardado, retomada, retornos por marco e recuperação no motor
// (js/protocol-engine.js), com DOM falso e o protocolo de tests/js/fixtures/protocolo-ciclo.js.
import assert from "node:assert/strict";
import test from "node:test";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const CHAVE = "dlt-protocol-state:protocolo-ciclo-teste";
const CHAVE_PLANO = "dlt-protocol-plan:protocolo-ciclo-teste";

// Abre a página do protocolo de teste. `antes(env)` roda antes de o protocolo montar.
function abrir({ hash = "", local = {}, sessao = {}, antes, ajuste } = {}) {
  const env = criarAmbiente({ armazenamento: local });
  Object.assign(env.sessao, sessao);
  env.janela.location.hash = hash;
  env.chamadasReplaceState = [];
  env.janela.history.replaceState = (...args) => env.chamadasReplaceState.push(args);
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
const linha = (p, texto) => {
  const achada = p.opcoes().find((r) => r.textContent.trim() === texto);
  assert.ok(achada, `opção "${texto}" não encontrada em: ${p.pergunta()}`);
  return achada;
};
const soltar = () => new Promise((resolve) => setImmediate(resolve));

// Percorre a parte 1 até o checkpoint.
function ateOCheckpoint(p, { foco = "Foco A", frase = "uma frase minha" } = {}) {
  linha(p, "Nenhum destes").click();
  clicar(p, "Continuar");
  linha(p, foco).click();
  p.mount.ownerDocument._env.rodarTimers();
  p.escrever(frase);
}
function ateOResultado(p) {
  ateOCheckpoint(p);
  clicar(p, "Continuar a parte 2");
  p.escrever("minha regra");
  p.escolher(0);
}
const lerLocal = (env) => JSON.parse(env.armazenamento[CHAVE]);
const lerSessao = (env) => JSON.parse(env.sessao[CHAVE]);

function estadoSalvo(extra = {}) {
  return {
    esquema: "dlt.protocolo.estado",
    v: 1,
    protocolo: "protocolo-ciclo-teste",
    bib: "t-1",
    ciclo: "k3f9x2qa",
    criado: "2026-11-20",
    atualizado: "2026-11-20T15:00:00.000Z",
    expira: "2027-03-20",
    fluxo: "principal",
    etapa: "concluido",
    passo: null,
    caminho: ["foco", "frase", "meio", "regra", "passo"],
    respostas: { foco: "a", frase: "uma frase minha", regra: "minha regra", passo: "p1" },
    volta: { n: 1, dia0: "2026-11-20", registro: { v: 1 }, retornos: {} },
    historico: [],
    lembrete: null,
    ...extra,
  };
}

test("nada vai para o localStorage sem uma ação dela; a aba guarda o andamento sem o passo de cuidado", () => {
  const { env, p } = abrir();
  linha(p, "Nenhum destes").click();
  clicar(p, "Continuar");
  assert.equal(p.pergunta(), "O que você quer olhar primeiro?");
  linha(p, "Foco B").click();
  env.rodarTimers();
  assert.deepEqual(Object.keys(env.armazenamento), [], "o localStorage segue vazio");
  const sessao = lerSessao(env);
  assert.equal(sessao.etapa, "ato1");
  assert.equal(sessao.passo, "frase");
  assert.deepEqual(sessao.caminho, ["foco"]);
  assert.deepEqual(sessao.respostas, { foco: "b" });
  assert.ok(!("cuidado" in sessao.respostas), "o passo de cuidado nunca é gravado");
  assert.ok(!JSON.stringify(sessao).includes("Nenhum destes"));
  assert.equal(sessao.ciclo.length, 8);
  assert.equal(sessao.expira, "2027-03-20", "120 dias desde o último uso");
  p.escrever("minha frase");
  ateOCheckpointSemPrimeiro(p);
  assert.deepEqual(Object.keys(env.armazenamento), [], "até o resultado o localStorage não é tocado");
});

function ateOCheckpointSemPrimeiro(p) {
  clicar(p, "Continuar a parte 2");
  p.escrever("minha regra");
  p.escolher(0);
  assert.ok(p.noResultado());
}

test("recarregar a aba devolve a pessoa ao passo em que estava, sem perguntar nada", () => {
  const { env, p } = abrir();
  ateOCheckpoint(p);
  clicar(p, "Continuar a parte 2");
  assert.equal(p.pergunta(), "Escreva a sua regra.");
  const { p: depois } = abrir({ sessao: { ...env.sessao } });
  assert.equal(depois.pergunta(), "Escreva a sua regra.");
  assert.equal(depois.rotulo(), "Parte 2 · 1 de 2");
  depois.voltar().click();
  assert.match(depois.mount.textContent, /Mapa parcial: Foco A/, "voltar leva ao checkpoint com as respostas");
});

test("recarregar dentro do bloco de cuidado recomeça no cuidado", () => {
  const { env, p } = abrir({ ajuste: "PROTOCOL.steps.splice(1, 0, { id: 'cuidado2', grupo: 'Parte 1', type: 'choice', prompt: 'Outra pergunta de cuidado?', options: [{ value: 's', label: 'Sim' }, { value: 'n', label: 'Não' }] }); PROTOCOL.persist.naoGuardar = ['cuidado', 'cuidado2'];" });
  linha(p, "Nenhum destes").click();
  clicar(p, "Continuar");
  assert.equal(p.pergunta(), "Outra pergunta de cuidado?");
  p.escolher(0);
  assert.equal(p.pergunta(), "O que você quer olhar primeiro?");
  const meio = abrir({ sessao: { ...env.sessao }, ajuste: "PROTOCOL.steps.splice(1, 0, { id: 'cuidado2', grupo: 'Parte 1', type: 'choice', prompt: 'Outra pergunta de cuidado?', options: [{ value: 's', label: 'Sim' }, { value: 'n', label: 'Não' }] }); PROTOCOL.persist.naoGuardar = ['cuidado', 'cuidado2'];" });
  assert.equal(meio.p.pergunta(), "O que você quer olhar primeiro?", "já tinha passado do cuidado: segue");
});

test("o checkpoint tem resultado parcial, não conta como passo e só guarda quando ela toca em salvar", () => {
  const { env, p } = abrir();
  assert.equal(p.rotulo(), "Parte 1 · 1 de 3");
  ateOCheckpoint(p);
  assert.match(p.porClasse("protocol-verdict")[0].textContent, /Mapa parcial: Foco A/);
  assert.deepEqual(p.porClasse("protocol-actions")[0].children.map((b) => b.textContent), ["Continuar a parte 2", "Salvar e continuar depois"]);
  assert.match(p.mount.textContent, /por até 120 dias/);
  assert.equal(env.armazenamento[CHAVE], undefined, "mostrar o checkpoint não guarda");
  botao(p, "← Voltar").click();
  assert.equal(p.pergunta(), "Escreva uma frase.");
  assert.equal(p.textarea().value, "uma frase minha", "voltar do checkpoint mostra o que ela escreveu");
});

test("salvar e continuar depois grava o estado, sem o cuidado, e apaga o da aba", () => {
  const { env, p } = abrir();
  ateOCheckpoint(p);
  clicar(p, "Salvar e continuar depois");
  const salvo = lerLocal(env);
  assert.equal(salvo.etapa, "pausa");
  assert.equal(salvo.passo, "regra");
  assert.deepEqual(salvo.caminho, ["foco", "frase", "meio"]);
  assert.deepEqual(salvo.respostas, { foco: "a", frase: "uma frase minha" });
  assert.equal(salvo.v, 1);
  assert.equal(salvo.bib, "t-1");
  assert.equal(salvo.protocolo, "protocolo-ciclo-teste");
  assert.equal(env.sessao[CHAVE], undefined);
  assert.match(p.mount.textContent, /Guardado neste aparelho/);
  assert.match(p.mount.textContent, /até 20\/03\/2027/);
  clicar(p, "Continuar agora");
  assert.equal(p.pergunta(), "Escreva a sua regra.");
});

test("ao reabrir, mostra só que há algo guardado e espera ela escolher", () => {
  const primeira = abrir();
  ateOCheckpoint(primeira.p);
  clicar(primeira.p, "Salvar e continuar depois");
  const guardado = { [CHAVE]: primeira.env.armazenamento[CHAVE] };
  const { p } = abrir({ local: guardado });
  assert.match(p.pergunta(), /Você tem um teste guardado de 20\/11\/2026/);
  assert.ok(!p.mount.textContent.includes("uma frase minha"), "nenhuma resposta aparece antes da escolha");
  assert.ok(!p.mount.textContent.includes("Foco A"));
  assert.deepEqual(p.porClasse("btn").map((b) => b.textContent), ["Continuar de onde parei", "Começar de novo", "Apagar o que está guardado"]);
  clicar(p, "Continuar de onde parei");
  assert.equal(p.pergunta(), "Escreva a sua regra.");
  p.voltar().click();
  assert.match(p.mount.textContent, /Mapa parcial: Foco A/);
  p.voltar().click();
  assert.equal(p.textarea().value, "uma frase minha");
});

test("começar de novo não apaga o guardado; apagar apaga", () => {
  const guardado = { [CHAVE]: JSON.stringify(estadoSalvo({ etapa: "pausa", passo: "regra", caminho: ["foco", "frase", "meio"], respostas: { foco: "a", frase: "x" } })) };
  const a = abrir({ local: guardado });
  clicar(a.p, "Começar de novo");
  assert.equal(a.p.pergunta(), "Algum destes pontos aparece hoje?");
  assert.ok(a.env.armazenamento[CHAVE], "continua guardado");
  const b = abrir({ local: guardado });
  clicar(b.p, "Apagar o que está guardado");
  assert.equal(b.env.armazenamento[CHAVE], undefined);
  assert.match(b.p.mount.textContent, /foi apagado/);
  clicar(b.p, "Começar do início");
  assert.equal(b.p.pergunta(), "Algum destes pontos aparece hoje?");
});

test("estado concluído mostra o resultado e oferece os retornos", () => {
  const { p } = abrir({ local: { [CHAVE]: JSON.stringify(estadoSalvo()) } });
  assert.deepEqual(p.porClasse("btn").map((b) => b.textContent), [
    "Ver o meu resultado", "Fazer: Retorno do dia 3", "Fazer: Revisão da semana", "Começar de novo", "Apagar o que está guardado",
  ]);
  clicar(p, "Ver o meu resultado");
  assert.ok(p.noResultado());
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, "Fim do teste.");
  assert.match(p.mount.textContent, /minha regra/);
});

test("o resultado só guarda por ação dela, e o botão de guardar grava o ciclo", () => {
  const { env, p } = abrir();
  ateOResultado(p);
  assert.equal(env.armazenamento[CHAVE], undefined);
  const sessao = lerSessao(env);
  assert.equal(sessao.etapa, "concluido", "a aba guarda o resultado para sobreviver a recarregar");
  botao(p, "Guardar neste aparelho para os retornos").click();
  const salvo = lerLocal(env);
  assert.equal(salvo.etapa, "concluido");
  assert.equal(salvo.volta.n, 1);
  assert.equal(salvo.volta.dia0, "2026-11-20");
  assert.equal(salvo.respostas.regra, "minha regra");
  assert.ok(!("cuidado" in salvo.respostas));
  assert.match(p.mount.textContent, /Guardado só neste navegador, até 20\/03\/2027/);
  assert.equal(botao(p, "Guardado neste aparelho").hasAttribute("disabled"), true);
});

test("recarregar no resultado mostra o resultado de novo, a partir da aba", () => {
  const { env, p } = abrir();
  ateOResultado(p);
  const { p: depois } = abrir({ sessao: { ...env.sessao } });
  assert.ok(depois.noResultado());
  assert.equal(depois.porClasse("protocol-verdict")[0].textContent, "Fim do teste.");
});

test("o ramo de cuidado não guarda nada nem oferece guardar", () => {
  const { env, p } = abrir();
  linha(p, "Aperto no fim do mês").click();
  clicar(p, "Continuar");
  assert.ok(p.noResultado());
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, "Primeiro o chão.");
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null);
  assert.deepEqual(Object.keys(env.armazenamento), []);
  assert.deepEqual(Object.keys(env.sessao), [], "nem na aba");
  const depois = abrir({ sessao: { ...env.sessao } });
  assert.equal(depois.p.pergunta(), "Algum destes pontos aparece hoje?", "recarregar recomeça");
});

test("apagar minhas respostas remove as três chaves", () => {
  const { env, p } = abrir();
  ateOResultado(p);
  botao(p, "Guardar neste aparelho para os retornos").click();
  p.porClasse("protocol-plan-item")[0].querySelector("input").checked = true;
  p.porClasse("protocol-plan-item")[0].querySelector("input").dispararEvento("change");
  assert.ok(env.armazenamento[CHAVE], "estado local");
  assert.ok(env.armazenamento[CHAVE_PLANO], "plano");
  assert.ok(env.sessao[CHAVE], "aba");
  botao(p, "Apagar minhas respostas").click();
  assert.equal(env.armazenamento[CHAVE], undefined);
  assert.equal(env.armazenamento[CHAVE_PLANO], undefined);
  assert.equal(env.sessao[CHAVE], undefined);
  assert.equal(p.porClasse("protocol-erase-status")[0].textContent, "Respostas apagadas deste navegador.");
});

test("estado expirado, ilegível ou de versão futura é apagado na hora, com aviso", () => {
  const casos = {
    expirado: [JSON.stringify(estadoSalvo({ expira: "2026-11-19" })), /passou do prazo e foi apagado/],
    invalido: ["{isto não é json", /Não conseguimos ler o que estava guardado/],
    futura: [JSON.stringify(estadoSalvo({ v: 9 })), /Não conseguimos ler o que estava guardado/],
    outro: [JSON.stringify(estadoSalvo({ protocolo: "outro" })), /Não conseguimos ler o que estava guardado/],
  };
  Object.entries(casos).forEach(([nome, [texto, esperado]]) => {
    const { env, p } = abrir({ local: { [CHAVE]: texto } });
    assert.match(p.mount.textContent, esperado, nome);
    assert.equal(env.armazenamento[CHAVE], undefined, nome + ": apagado");
    assert.ok(p.botaoPor("Carregar o meu arquivo (.md)") || p.porClasse("protocol-file")[0], nome + ": oferece o arquivo");
    clicar(p, "Fazer o protocolo do começo");
    assert.equal(p.pergunta(), "Algum destes pontos aparece hoje?", nome);
  });
});

test("a migração leva o estado de uma versão antiga até a atual", () => {
  const ajuste = "PROTOCOL.persist.versao = 2; PROTOCOL.persist.migracoes = { 1: (e) => ({ ...e, respostas: { ...e.respostas, regra: e.respostas.regra + ' (migrada)' } }) };";
  const { p } = abrir({ local: { [CHAVE]: JSON.stringify(estadoSalvo()) }, ajuste });
  clicar(p, "Ver o meu resultado");
  assert.match(p.mount.textContent, /minha regra \(migrada\)/);
  const semMigracao = abrir({ local: { [CHAVE]: JSON.stringify(estadoSalvo()) }, ajuste: "PROTOCOL.persist.versao = 2;" });
  assert.match(semMigracao.p.mount.textContent, /Não conseguimos ler/);
});

test("a bib mudou e uma opção saiu: volta ao primeiro passo sem resposta", () => {
  const guardado = estadoSalvo({ etapa: "ato2", passo: "passo", caminho: ["foco", "frase", "meio", "regra"], respostas: { foco: "removida", frase: "x", regra: "y" } });
  const { p } = abrir({ local: { [CHAVE]: JSON.stringify(guardado) } });
  clicar(p, "Continuar de onde parei");
  assert.equal(p.pergunta(), "O que você quer olhar primeiro?");
  assert.equal(p.marcadas().length, 0);
});

// ---- retornos por marco ---------------------------------------------------

test("marco com estado: diz que é cedo e deixa adiantar; o retorno entra no ciclo e grava de volta", () => {
  const local = { [CHAVE]: JSON.stringify(estadoSalvo()) };
  const { env, p } = abrir({ hash: "#volta=dia3", local });
  assert.equal(p.pergunta(), "Retorno do dia 3");
  assert.match(p.mount.textContent, /previsto para 23\/11\/2026/);
  assert.deepEqual(env.chamadasReplaceState, [], "marco válido fica na barra");
  clicar(p, "Adiantar agora");
  assert.match(p.pergunta(), /Sua regra era: minha regra\./, "o retorno enxerga o que ela guardou");
  assert.equal(p.rotulo(), "Passo 1 de 2");
  p.escolher(0);
  const escalas = p.porClasse("protocol-scale-btn");
  escalas[4].click();
  clicar(p, "Continuar");
  assert.ok(p.noResultado());
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, "Retorno anotado: sim (cedo)");
  const salvo = lerLocal(env);
  assert.equal(salvo.volta.retornos.dia3.em, "2026-11-20");
  assert.equal(salvo.volta.retornos.dia3.r.fez, "sim");
  assert.equal(salvo.volta.retornos.dia3.r.nota, 4);
  assert.equal(salvo.respostas.regra, "minha regra", "o resto do estado fica");
  assert.match(p.mount.textContent, /Este retorno ficou guardado neste aparelho/);
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null, "já está guardado");
});

test("marco atrasado ou no dia roda direto; marco feito mostra o que ela respondeu e oferece refazer", () => {
  const atrasado = abrir({ hash: "#volta=dia3", local: { [CHAVE]: JSON.stringify(estadoSalvo({ volta: { n: 1, dia0: "2026-11-10", registro: null, retornos: {} } })) } });
  assert.match(atrasado.p.mount.textContent, /estava previsto para 13\/11\/2026/);
  assert.ok(atrasado.p.botaoPor("Começar"));
  const noDia = abrir({ hash: "#volta=dia3", local: { [CHAVE]: JSON.stringify(estadoSalvo({ volta: { n: 1, dia0: "2026-11-17", registro: null, retornos: {} } })) } });
  assert.match(noDia.p.mount.textContent, /é para hoje \(20\/11\/2026\)/);
  const feito = abrir({
    hash: "#volta=dia3",
    local: { [CHAVE]: JSON.stringify(estadoSalvo({ volta: { n: 1, dia0: "2026-11-10", registro: null, retornos: { dia3: { em: "2026-11-14", r: { fez: "nao", fez__label: "Não fiz", nota: 8 } } } } })) },
  });
  assert.match(feito.p.mount.textContent, /Você fez este retorno em 14\/11\/2026/);
  assert.match(feito.p.mount.textContent, /Não fiz/);
  assert.match(feito.p.mount.textContent, /De 0 a 10, quanto pesou\?/);
  clicar(feito.p, "Refazer este retorno");
  assert.match(feito.p.pergunta(), /Você fez o passo/);
});

test("marco sem data (semana) sempre pode ser feito", () => {
  const { p } = abrir({ hash: "#volta=semana", local: { [CHAVE]: JSON.stringify(estadoSalvo()) } });
  assert.equal(p.pergunta(), "Revisão da semana");
  assert.match(p.mount.textContent, /Pode começar quando quiser/);
  clicar(p, "Começar");
  p.escolher(0);
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, "Semana anotada: sim");
});

test("o marco 'continuar' retoma o fluxo principal sem tela de retorno", () => {
  const guardado = estadoSalvo({ etapa: "pausa", passo: "regra", caminho: ["foco", "frase", "meio"], respostas: { foco: "a", frase: "x" } });
  const { p } = abrir({ hash: "#volta=continuar", local: { [CHAVE]: JSON.stringify(guardado) } });
  assert.equal(p.pergunta(), "Escreva a sua regra.");
});

test("marco fora da lista é ignorado e some da barra; o protocolo começa normal", () => {
  const { env, p } = abrir({ hash: "#volta=dia99", local: { [CHAVE]: JSON.stringify(estadoSalvo()) } });
  assert.equal(env.chamadasReplaceState.length, 1);
  assert.deepEqual(env.chamadasReplaceState[0], [null, "", "/protocolos/teste/"]);
  assert.match(p.pergunta(), /Você tem um teste guardado/, "sem marco, vale o fluxo normal");
  const limpo = abrir({ hash: "#volta=__proto__" });
  assert.equal(limpo.p.pergunta(), "Algum destes pontos aparece hoje?");
  assert.equal(limpo.env.chamadasReplaceState.length, 1);
  const outro = abrir({ hash: "#secao" });
  assert.equal(outro.env.chamadasReplaceState.length, 0, "fragmento que não é nosso não é tocado");
});

test("o replaceState mantém o que vem depois do caminho", () => {
  const { env } = abrir({ hash: "#volta=nada", antes: (e) => { e.janela.location.search = "?utm_source=x"; } });
  assert.deepEqual(env.chamadasReplaceState[0], [null, "", "/protocolos/teste/?utm_source=x"]);
});

// ---- recuperação ----------------------------------------------------------

test("marco sem estado abre a recuperação, com o motivo e os três caminhos", () => {
  const { p } = abrir({ hash: "#volta=dia3" });
  assert.equal(p.pergunta(), "Retorno do dia 3");
  assert.match(p.mount.textContent, /Não encontramos neste navegador o que você guardou/);
  assert.ok(p.porClasse("protocol-file-input")[0], "arquivo");
  assert.equal(p.porClasse("protocol-file-input")[0].getAttribute("accept"), ".md,text/markdown,text/plain");
  assert.ok(p.textarea(), "código");
  assert.ok(p.botaoPor("Usar este código"));
  assert.ok(p.botaoPor("Fazer o protocolo do começo"));
});

test("recuperar pelo arquivo: lê no aparelho, confirma e roda o retorno; depois oferece guardar", async () => {
  const { env, p } = abrir({ hash: "#volta=dia3" });
  const entrada = p.porClasse("protocol-file-input")[0];
  entrada.files = [{ size: 200, text: () => Promise.resolve(JSON.stringify({ ok: true, regra: "regra do arquivo", dia0: "2026-11-17" })) }];
  entrada.dispararEvento("change");
  await soltar();
  assert.match(p.pergunta(), /Encontramos o que você trouxe, de 20\/11\/2026/);
  assert.match(p.mount.textContent, /Seu teste de 2026-11-17: regra “regra do arquivo”/);
  assert.equal(env.armazenamento[CHAVE], undefined, "ler o arquivo não guarda nada");
  clicar(p, "Continuar");
  assert.equal(p.pergunta(), "Retorno do dia 3");
  assert.match(p.mount.textContent, /é para hoje \(20\/11\/2026\)/);
  clicar(p, "Começar");
  assert.match(p.pergunta(), /Sua regra era: regra do arquivo\./);
  p.escolher(1);
  p.porClasse("protocol-scale-btn")[2].click();
  clicar(p, "Continuar");
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, "Retorno anotado: nao (no_dia)");
  assert.equal(env.armazenamento[CHAVE], undefined, "veio de fora: só guarda se ela escolher");
  botao(p, "Guardar neste aparelho para os retornos").click();
  const salvo = lerLocal(env);
  assert.equal(salvo.volta.retornos.dia3.r.fez, "nao");
  assert.equal(salvo.volta.dia0, "2026-11-17");
  assert.equal(salvo.respostas.regra, "regra do arquivo");
});

test("arquivo inválido, grande demais ou ilegível: mensagem simples e nada guardado", async () => {
  const { env, p } = abrir({ hash: "#volta=dia3" });
  const entrada = p.porClasse("protocol-file-input")[0];
  const enviar = async (arquivo) => { entrada.files = [arquivo]; entrada.dispararEvento("change"); await soltar(); };
  await enviar({ size: 10, text: () => Promise.resolve("isto não é o arquivo") });
  assert.match(p.porClasse("protocol-cycle-status")[0].textContent, /não é do protocolo de teste/);
  await enviar({ size: 256 * 1024 + 1, text: () => { throw new Error("não deveria ler"); } });
  assert.match(p.porClasse("protocol-cycle-status")[0].textContent, /passa de 256 KB/);
  await enviar({ size: 10, text: () => Promise.reject(new Error("falhou")) });
  assert.match(p.porClasse("protocol-cycle-status")[0].textContent, /Não conseguimos abrir este arquivo/);
  assert.equal(p.pergunta(), "Retorno do dia 3", "continua na recuperação");
  assert.deepEqual(Object.keys(env.armazenamento), []);
  assert.ok(!p.mount.textContent.includes("isto não é o arquivo"), "o conteúdo do arquivo não vai para a tela");
});

test("recuperar pelo código", () => {
  const { p } = abrir({ hash: "#volta=dia3" });
  p.textarea().value = "  codigoValido123 ";
  clicar(p, "Usar este código");
  assert.match(p.pergunta(), /Encontramos o que você trouxe/);
  clicar(p, "Continuar");
  clicar(p, "Adiantar agora");
  assert.match(p.pergunta(), /Sua regra era: regra do código\./);
  const ruim = abrir({ hash: "#volta=dia3" });
  ruim.p.textarea().value = "errado";
  clicar(ruim.p, "Usar este código");
  assert.match(ruim.p.porClasse("protocol-cycle-status")[0].textContent, /Este código não é válido/);
});

test("'não é este' volta à recuperação", async () => {
  const { p } = abrir({ hash: "#volta=dia3" });
  p.textarea().value = "codigoValido123";
  clicar(p, "Usar este código");
  clicar(p, "Não é este");
  assert.equal(p.pergunta(), "Retorno do dia 3");
});

test("#c= no endereço: valida, limpa a barra e oferece o retorno; grande demais é recusado", () => {
  const ok = abrir({ hash: "#c=codigoValido123" });
  assert.equal(ok.env.chamadasReplaceState.length, 1, "limpa o fragmento");
  assert.equal(ok.p.pergunta(), "Encontramos o registro que veio no link");
  clicar(ok.p, "Continuar");
  assert.equal(ok.p.pergunta(), "O que você quer fazer agora?");
  assert.deepEqual(ok.p.porClasse("btn").map((b) => b.textContent), ["Retorno do dia 3", "Começar de novo"]);
  clicar(ok.p, "Retorno do dia 3");
  assert.equal(ok.p.pergunta(), "Retorno do dia 3");

  const grande = abrir({ hash: "#c=" + "a".repeat(2049) });
  assert.equal(grande.env.chamadasReplaceState.length, 1);
  assert.equal(grande.p.pergunta(), "Algum destes pontos aparece hoje?", "recusado: segue o fluxo normal");
  const estranho = abrir({ hash: "#c=abc+def" });
  assert.equal(estranho.p.pergunta(), "Algum destes pontos aparece hoje?");
  const invalido = abrir({ hash: "#c=naoEhUmRegistro" });
  assert.match(invalido.p.mount.textContent, /Não foi possível ler o código do link/);
  assert.equal(invalido.env.chamadasReplaceState.length, 1);
});

// ---- janela privada e limites --------------------------------------------

function bloquearArmazenamento(env) {
  ["localStorage", "sessionStorage"].forEach((nome) => {
    Object.defineProperty(env.janela, nome, { get() { throw new Error("SecurityError"); } });
  });
}

test("sem armazenamento (janela privada): o protocolo segue em memória, sem erro, e avisa ao tentar guardar", () => {
  const { env, p } = abrir({ antes: bloquearArmazenamento });
  ateOCheckpoint(p);
  clicar(p, "Salvar e continuar depois");
  assert.match(p.pergunta(), /Não conseguimos guardar/);
  assert.match(p.mount.textContent, /janela privada/);
  clicar(p, "Continuar agora");
  assert.equal(p.pergunta(), "Escreva a sua regra.");
  p.escrever("minha regra");
  p.escolher(0);
  assert.ok(p.noResultado());
  botao(p, "Guardar neste aparelho para os retornos").click();
  assert.match(p.mount.textContent, /Neste navegador não conseguimos guardar/);
  botao(p, "Apagar minhas respostas").click();
  assert.equal(p.porClasse("protocol-erase-status")[0].textContent, "Respostas apagadas deste navegador.");
  assert.equal(env.baixados.length, 0);
});

test("sem armazenamento e com marco: cai na recuperação, sem erro", () => {
  const { p } = abrir({ hash: "#volta=dia3", antes: bloquearArmazenamento });
  assert.match(p.mount.textContent, /Não encontramos neste navegador/);
});

test("o estado acima de 100 KB não é gravado e avisa", () => {
  const { env, p } = abrir({ ajuste: "PROTOCOL.steps[2].maxLength = 200000;" });
  linha(p, "Nenhum destes").click();
  clicar(p, "Continuar");
  linha(p, "Foco A").click();
  env.rodarTimers();
  p.escrever("x".repeat(120 * 1024));
  clicar(p, "Salvar e continuar depois");
  assert.match(p.pergunta(), /Não conseguimos guardar/);
  assert.match(p.mount.textContent, /passou do limite/);
  assert.equal(env.armazenamento[CHAVE], undefined);
});

test("protocolo sem persist nem retornos não toca no armazenamento nem no endereço", () => {
  const env = criarAmbiente();
  env.janela.location.hash = "#volta=dia3";
  let chamadas = 0;
  env.janela.history.replaceState = () => { chamadas += 1; };
  env.carregar("js/protocol-engine.js");
  env.rodar(`
    const PROTOCOL = { id: "simples", slug: "simples", title: "S", path: "/s/",
      steps: [{ id: "a", type: "choice", prompt: "A?", options: [{ value: "x", label: "X" }] }],
      result: () => ({ id: 1, grade: 1, verdict: "Fim", body: [] }) };
    runProtocol(PROTOCOL, "protocol-mount");
  `);
  const p = piloto(env);
  p.escolher(0);
  assert.ok(p.noResultado());
  assert.deepEqual(Object.keys(env.armazenamento), []);
  assert.deepEqual(Object.keys(env.sessao), []);
  assert.equal(chamadas, 0);
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null);
});

test("protocolo com ciclo e sem o kit na página não monta nada", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-engine.js");
  const erros = [];
  env.contexto.console = { ...console, error: (m) => erros.push(m) };
  env.carregar("tests/js/fixtures/protocolo-ciclo.js");
  env.rodar('runProtocol(PROTOCOL, "protocol-mount")');
  assert.equal(env.mount.children.length, 0);
  assert.equal(erros.length, 1);
});

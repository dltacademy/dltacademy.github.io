// O Ato 1 do Protocolo do Teto (protocolos/teto-financeiro/js/protocol.js) no motor, com o DOM
// falso: os casos A a F até o checkpoint ou o fim, o ramo de cuidado sem guardar e sem registro,
// o resultado "nenhum" sem oferta, pausar e retomar, os arquivos (.md e .ics) e a ida e volta do
// .md do Ato 1 pelo importar. Os testes conferem estrutura e decisões, não a prosa.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { criarAmbiente, piloto } from "./fake-dom.mjs";
import { CASOS, percorrer } from "./teto-casos.mjs";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");
const bib = require("../../js/biblioteca-teto.js");
const R = require("../../protocolos/teto-financeiro/js/teto-regras.js");

const CHAVE = "dlt-protocol-state:protocolo-teto-financeiro";
const CHAVE_PLANO = "dlt-protocol-plan:protocolo-teto-financeiro";
const SCRIPTS = [
  "js/protocol-kit.js",
  "js/biblioteca-teto.js",
  "protocolos/teto-financeiro/js/teto-regras.js",
  "js/protocol-engine.js",
];
const soltar = () => new Promise((resolve) => setImmediate(resolve));
const clone = (v) => JSON.parse(JSON.stringify(v));

function abrir({ hash = "", local = {}, sessao = {}, userAgent, ajuste, comAviso = true } = {}) {
  const env = criarAmbiente({ armazenamento: local });
  Object.assign(env.sessao, sessao);
  env.janela.location.hash = hash;
  env.janela.location.pathname = "/protocolos/teto-financeiro/";
  env.chamadasReplaceState = [];
  env.janela.history.replaceState = (...args) => env.chamadasReplaceState.push(args);
  if (userAgent) env.janela.navigator.userAgent = userAgent;
  let aviso = null;
  if (comAviso) {
    aviso = env.doc.createElement("p");
    aviso.setAttribute("id", "protocol-aviso-app");
    aviso.hidden = true;
    env.doc.body.appendChild(aviso);
  }
  SCRIPTS.forEach((arquivo) => env.carregar(arquivo));
  if (ajuste) env.rodar(ajuste);
  env.carregar("protocolos/teto-financeiro/js/protocol.js");
  return { env, p: piloto(env), aviso, PROTOCOL: env.rodar("PROTOCOL") };
}

// Percorre o caso até o checkpoint (ou o fim) e devolve onde parou.
async function jogar(pagina, letra, extra = {}) {
  const respostas = clone(CASOS[letra]);
  Object.assign(respostas, extra);
  const parou = await percorrer({
    mount: pagina.env.mount,
    passos: pagina.PROTOCOL.steps,
    kit,
    respostas,
    esperar: async () => pagina.env.rodarTimers(),
  });
  return { parou, respostas };
}

const clicar = (p, texto) => {
  const b = p.botaoPor(texto);
  assert.ok(b, `botão "${texto}" não encontrado em: ${p.mount.textContent.slice(0, 200)}`);
  b.click();
  p.mount.ownerDocument._env.rodarTimers();
};
const baixar = (env, p, texto) => {
  const antes = env.baixados.length;
  p.botaoPor(texto).click();
  assert.equal(env.baixados.length, antes + 1, texto);
  return env.baixados[antes];
};
const veredito = (p) => p.porClasse("protocol-verdict")[0].textContent;
const secoes = (p) => p.porClasse("protocol-section").map((s) => s.dataset.kind || s.className);
const lerLocal = (env) => JSON.parse(env.armazenamento[CHAVE]);

const PROIBIDAS = [/terapi/i, /psicoterapi/i, /tratamento/i, /\blaudo/i, /diagn[óo]stico psicol/i, /teste psicol/i, /reprograma[çc]/i];
function textos(valor, saida = []) {
  if (typeof valor === "string") saida.push(valor);
  else if (Array.isArray(valor)) valor.forEach((v) => textos(v, saida));
  else if (valor && typeof valor === "object") Object.values(valor).forEach((v) => textos(v, saida));
  return saida;
}
function semProibidas(texto, onde) {
  PROIBIDAS.forEach((re) => assert.ok(!re.test(texto), `${re} em ${onde}`));
  assert.ok(!/diagn[óo]stic/i.test(texto.replace(/não é diagnóstico/gi, "")), `"diagnóstico" fora de "não é diagnóstico" em ${onde}`);
}

// ---- o caminho de cada caso -------------------------------------------------------------------

test("caso A: o mapa do freio na hora de cobrar, com o campo da trava e sem renda nem variante", async () => {
  const pagina = abrir();
  const { p, env, PROTOCOL } = pagina;
  assert.match(p.rotulo(), /^Ato 1 · 1 de \d+$/);
  const { parou } = await jogar(pagina, "A");
  assert.equal(parou, "fim_ato1");
  assert.equal(veredito(p), "Seu teto hoje: O freio na hora de cobrar");
  assert.deepEqual(secoes(p), ["teto", "familia", "nao-indica", "sessenta", "trava", "sinais"]);
  assert.equal(p.porClasse("verdict-pill").length, 0, "sem pílula de veredito");
  assert.deepEqual(p.porClasse("btn").map((b) => b.textContent).filter((t) => /Continuar agora|Salvar e continuar depois/.test(t)), ["Continuar agora", "Salvar e continuar depois"]);
  assert.match(p.mount.textContent, /mandar o preço cheio na sexta, por escrito/, "o que ela escreveu para a trava volta no mapa");
  assert.match(p.mount.textContent, /A crença que mais pesa: Evitar/);
  // Nenhum passo de renda nem de variante no caminho; o de trava só nos padrões de ganho.
  const ids = Array.from(PROTOCOL.steps, (s) => s.id);
  assert.deepEqual(ids.slice(0, 4), ["chao", "humor", "sinais_risco", "fatos"]);
  assert.deepEqual(ids.filter((i) => /^triade_/.test(i)), ["triade_1", "triade_2", "triade_3", "triade_4", "triade_5"]);
  assert.deepEqual(ids.slice(-6), ["frases_nivel", "espelho", "variante", "renda", "alvo", "fim_ato1"]);
  assert.equal(env.janela.location.hash, "");
});

test("caso B: ganho que escorre, com a pergunta da renda, o vazamento no freio e a trava no tipo certo", async () => {
  const pagina = abrir();
  const { p } = pagina;
  const { parou, respostas } = await jogar(pagina, "B");
  assert.equal(parou, "fim_ato1");
  assert.equal(veredito(p), "Seu teto hoje: O ganho que escorre");
  assert.deepEqual(secoes(p), ["teto", "familia", "vazamento", "nao-indica", "sessenta", "trava", "sinais"]);
  assert.ok(p.mount.textContent.includes(bib.padroes["ganho-que-escorre"].trava.por_renda[respostas.renda]), "a trava segue a renda");
  assert.match(p.mount.textContent, /É um teto de retenção/);
  assert.match(p.porClasse("protocol-section").find((s) => s.dataset.kind === "vazamento").textContent, /o freio na hora de cobrar/);
});

test("caso C: passo que não sai, com a variante escolhida e a trava do ganho", async () => {
  const pagina = abrir();
  const { p } = pagina;
  const { parou, respostas } = await jogar(pagina, "C");
  assert.equal(parou, "fim_ato1");
  assert.equal(veredito(p), "Seu teto hoje: O passo que não sai");
  assert.equal(respostas.variante, "nao-estou-pronto");
  assert.match(p.mount.textContent, /não estar pront/i, "a leitura traz a variante");
});

test("caso D: o chão primeiro, com plano e sem oferta, registro, lembrete nem guardar", async () => {
  const pagina = abrir();
  const { p, env } = pagina;
  const { parou } = await jogar(pagina, "D");
  assert.equal(parou, null);
  assert.ok(p.noResultado());
  assert.equal(veredito(p), bib.cuidado.textos.chao_primeiro.titulo);
  assert.equal(p.porClasse("protocol-plan-item").length, bib.planos.chao_primeiro.arco7.length);
  semCaminhoDeOferta(pagina);
});

test("caso F: ajuda humana (CVV 188, SAMU 192, CAPS), sem plano de romper nada nem nada guardado", async () => {
  const pagina = abrir();
  const { p } = pagina;
  const { parou } = await jogar(pagina, "F");
  assert.equal(parou, null);
  assert.equal(veredito(p), bib.cuidado.textos.ajuda.titulo);
  const texto = p.mount.textContent;
  assert.match(texto, /CVV/);
  assert.match(texto, /188/);
  assert.match(texto, /SAMU/);
  assert.match(texto, /192/);
  assert.match(texto, /CAPS/);
  assert.equal(p.porClasse("protocol-plan").length, 0, "sem plano");
  semCaminhoDeOferta(pagina);
});

test("caso E: nenhum padrão domina, um resultado honesto, sem oferta e sem registro", async () => {
  const pagina = abrir();
  const { p } = pagina;
  const { parou } = await jogar(pagina, "E");
  assert.equal(parou, null);
  assert.equal(veredito(p), bib.textos.nenhum.titulo);
  assert.match(p.mount.textContent, /não vamos inventar um teto/);
  assert.equal(p.botaoPor("Baixar os lembretes (.ics)"), null);
  semCaminhoDeOferta(pagina);
});

// O que o cuidado e o "nenhum" nunca têm na tela: oferta, registro, guardar, lembrete.
function semCaminhoDeOferta({ p, env }) {
  assert.equal(p.porClasse("protocol-paid-report").length, 0, "oferta paga");
  assert.equal(p.porClasse("protocol-cta").length, 0, "chamada para o próximo passo");
  assert.equal(p.porClasse("protocol-paid-offers").length, 0);
  assert.equal(p.porClasse("protocol-registro").length, 0, "registro em código");
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null, "guardar");
  assert.equal(p.botaoPor("Baixar os lembretes (.ics)"), null, "lembrete");
  assert.deepEqual([Object.keys(env.armazenamento), Object.keys(env.sessao)], [[], []], "nada no armazenamento, nem na aba");
}

// ---- o que cada resultado leva, sem prosa -------------------------------------------------------

for (const [letra, esperado] of Object.entries({ D: "chao", F: "ajuda", E: "nenhum" })) {
  test(`caso ${letra}: o resultado não carrega relatório, registro, blocos, lembretes nem guardar`, () => {
    const { env, PROTOCOL } = abrir();
    const respostas = clone(CASOS[letra]);
    const resultado = PROTOCOL.result(respostas, { hoje: "2026-11-20", ciclo: "abcd1234", lembrete: null, volta: null, historico: [] });
    ["relatorio", "registro", "guardar", "ics", "blocks", "cta", "volta"].forEach((chave) => {
      assert.equal(resultado[chave], undefined, `${esperado}: não deve ter "${chave}"`);
    });
    assert.equal(resultado.pill, false);
    const dados = R.calcular(respostas, bib);
    if (letra === "E") assert.equal(dados.padrao, null);
    else assert.equal(dados.cuidado.ramo, letra === "D" ? "chao" : "ajuda");
    assert.equal(env.baixados.length, 0);
  });
}

test("os resultados dos casos A a F não têm palavra proibida, na tela nem nos dados dos arquivos", async () => {
  for (const letra of Object.keys(CASOS)) {
    const pagina = abrir();
    const { parou } = await jogar(pagina, letra);
    semProibidas(pagina.p.mount.textContent, `tela do caso ${letra}`);
    if (parou === "fim_ato1") {
      const passo = pagina.PROTOCOL.steps.find((s) => s.id === "fim_ato1");
      const ctx = { hoje: "2026-11-20", ciclo: "abcd1234", lembrete: null, volta: null, historico: [] };
      const mapa = passo.render(clone(CASOS[letra]), ctx);
      semProibidas(textos(mapa).join("\n"), `dados do mapa do caso ${letra}`);
      const md = pagina.env.rodar("buildMarkdown")(pagina.PROTOCOL, mapa, {});
      semProibidas(md, `.md do caso ${letra}`);
    }
  }
  semProibidas(textos(bib.textos.disclaimer).join(" "), "aviso dos arquivos");
});

test("o aviso dos arquivos é o do Teto e não fala em terapia", async () => {
  const pagina = abrir();
  await jogar(pagina, "A");
  const md = baixar(pagina.env, pagina.p, "Baixar como texto (.md)").texto;
  assert.ok(md.includes(bib.textos.disclaimer));
  assert.ok(!/terapi/i.test(md));
  assert.ok(md.includes("dlt.academy/protocolos/teto-financeiro/"));
});

// ---- o cuidado nunca é guardado ----------------------------------------------------------------

test("os passos de cuidado nunca vão para o armazenamento, nem o da aba", async () => {
  const pagina = abrir();
  const { env } = pagina;
  const respostas = clone(CASOS.A);
  await percorrer({ mount: env.mount, passos: pagina.PROTOCOL.steps, kit, respostas, ate: "cena_risco", esperar: async () => env.rodarTimers() });
  assert.equal(env.armazenamento[CHAVE], undefined, "nada no localStorage sem uma ação dela");
  const sessao = JSON.parse(env.sessao[CHAVE]);
  ["chao", "humor", "sinais_risco"].forEach((id) => {
    assert.ok(!(id in sessao.respostas), id);
    assert.ok(!sessao.caminho.includes(id), id);
  });
  assert.ok("fatos" in sessao.respostas);
  assert.ok("cena_extra" in sessao.respostas);
});

test("o humor pesado não bloqueia: mostra o aviso calmo e o mapa sai com o aviso de segurança", async () => {
  const pagina = abrir();
  const { p } = pagina;
  const { parou } = await jogar(pagina, "A", { humor: { interesse: 2, animo: 2 } });
  assert.equal(parou, "fim_ato1");
  assert.ok(p.mount.textContent.includes(bib.cuidado.textos.aviso_humor), "o aviso do humor fica no mapa");
  assert.match(veredito(p), /^Seu teto hoje/);
  // E a pergunta seguinte ao humor traz o aviso, antes de qualquer coisa.
  const outra = abrir();
  const respostas = clone(CASOS.A);
  respostas.humor = { interesse: 2, animo: 2 };
  await percorrer({ mount: outra.env.mount, passos: outra.PROTOCOL.steps, kit, respostas, ate: "sinais_risco", esperar: async () => outra.env.rodarTimers() });
  assert.ok(outra.p.mount.textContent.includes(bib.cuidado.textos.aviso_humor));
});

test("o humor desligado na biblioteca tira a tela sem mexer no código", () => {
  const { PROTOCOL } = abrir({ ajuste: "BIBLIOTECA_TETO.cuidado.humor.ativo = false;" });
  assert.deepEqual(Array.from(PROTOCOL.steps.slice(0, 3), (s) => s.id), ["chao", "sinais_risco", "fatos"]);
});

// ---- a linha de base das frases (os dois itens mais verdadeiros) -----------------------------------

test("a tela das frases traz os dois itens mais verdadeiros, e a resposta vai para o estado guardado", async () => {
  const pagina = abrir();
  const { p, env } = pagina;
  await jogar(pagina, "A");
  clicar(p, "Salvar e continuar depois");
  const salvo = lerLocal(env);
  const niveis = salvo.respostas.frases_nivel;
  assert.equal(Object.keys(niveis).length, 2);
  const mais = bib.triades.map((t) => CASOS.A[t.id].mais);
  Object.keys(niveis).forEach((id) => assert.ok(mais.includes(id), `${id} foi marcado como o mais verdadeiro`));
  assert.ok(Object.values(niveis).every((n) => n >= 0 && n <= 3));
  // Os dois são os da família de maior nota (evitar, no caso A, que teve dois itens marcados).
  assert.equal(R.familiaForte(R.pontuarFamilias(CASOS.A, bib), bib), "evitar");
  assert.deepEqual(Object.keys(niveis).map((id) => bib.itens[id].familia), ["evitar", "evitar"]);
});

// ---- pausar e retomar ------------------------------------------------------------------------------

test("salvar e continuar depois guarda o Ato 1 sem o cuidado, por 120 dias, e retoma em outra aba", async () => {
  const a = abrir();
  await jogar(a, "A");
  assert.equal(a.env.armazenamento[CHAVE], undefined);
  clicar(a.p, "Salvar e continuar depois");
  const salvo = lerLocal(a.env);
  assert.equal(salvo.etapa, "pausa");
  assert.equal(salvo.bib, bib.versao);
  assert.equal(salvo.expira, "2027-03-20");
  assert.equal(salvo.caminho[salvo.caminho.length - 1], "fim_ato1");
  ["chao", "humor", "sinais_risco"].forEach((id) => assert.ok(!(id in salvo.respostas) && !salvo.caminho.includes(id), id));
  assert.equal(salvo.respostas.espelho, "freio-na-cobranca");
  assert.deepEqual(Object.keys(a.env.sessao), [], "a aba não guarda depois de salvar");

  // Outra aba: antes de mostrar qualquer resposta, só o que está guardado.
  const b = abrir({ local: { [CHAVE]: a.env.armazenamento[CHAVE] } });
  assert.match(b.p.pergunta(), /Você tem um Teto guardado de 20\/11\/2026/);
  assert.ok(!b.p.mount.textContent.includes("freio"), "nenhuma resposta antes da escolha");
  clicar(b.p, "Continuar de onde parei");
  assert.equal(veredito(b.p), "Seu teto hoje: O freio na hora de cobrar");
  assert.match(b.p.mount.textContent, /A parte 2 deste protocolo/);
});

test("o link do lembrete #volta=continuar abre o ponto em que parou, com ou sem o estado guardado", async () => {
  const a = abrir();
  await jogar(a, "B");
  clicar(a.p, "Salvar e continuar depois");
  const guardado = a.env.armazenamento[CHAVE];
  const com = abrir({ hash: "#volta=continuar", local: { [CHAVE]: guardado } });
  assert.equal(veredito(com.p), "Seu teto hoje: O ganho que escorre", "com o estado, retoma direto");
  const sem = abrir({ hash: "#volta=continuar" });
  assert.match(sem.p.mount.textContent, /Não encontramos neste navegador/);
  assert.ok(sem.p.porClasse("protocol-file-input").length > 0, "oferece carregar o .md");
  assert.equal(sem.p.textarea(), null, "ainda não há código do registro para colar");
});

test("o resultado depois do checkpoint avisa da parte 2 e oferece guardar para os retornos", async () => {
  const a = abrir();
  await jogar(a, "C");
  clicar(a.p, "Continuar agora");
  assert.ok(a.p.noResultado());
  assert.match(a.p.mount.textContent, /chega na próxima versão/);
  assert.ok(a.p.botaoPor("Guardar neste aparelho para os retornos"));
  assert.ok(a.p.porClasse("protocol-registro").length === 1, "o registro do Ato 1 fica à mão");
  assert.equal(a.p.porClasse("protocol-paid-report").length, 0, "sem oferta no Ato 1");
  assert.equal(a.env.armazenamento[CHAVE], undefined, "só guarda quando ela toca");
  clicar(a.p, "Guardar neste aparelho para os retornos");
  const salvo = lerLocal(a.env);
  assert.equal(salvo.etapa, "concluido");
  assert.equal(salvo.volta.n, 1);
  assert.equal(salvo.volta.dia0, "2026-11-20");
  assert.equal(salvo.volta.registro.padrao, "passo-que-nao-sai");
});

// ---- os arquivos ------------------------------------------------------------------------------------

test("o .ics do Ato 1 leva só a revisão semanal e o continuar, sem nada do que ela respondeu", async () => {
  const a = abrir();
  await jogar(a, "A");
  const ics = baixar(a.env, a.p, "Baixar os lembretes (.ics)");
  assert.equal(ics.tipo, "text/calendar;charset=utf-8");
  assert.equal(ics.nome, "teto-financeiro-lembretes.ics");
  const texto = ics.texto.replace(/\r\n /g, "");
  assert.equal((texto.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(texto.includes("DTSTART:20261127T200000"), "a revisão semanal, 7 dias depois");
  assert.ok(texto.includes("DTSTART:20261121T200000"), "o continuar, no dia seguinte");
  assert.ok(texto.includes("RRULE:FREQ=WEEKLY;COUNT=13"));
  assert.ok(texto.includes("URL:https://dlt.academy/protocolos/teto-financeiro/#volta=semana"));
  assert.ok(texto.includes("URL:https://dlt.academy/protocolos/teto-financeiro/#volta=continuar"));
  texto.split("\r\n").filter((l) => /^URL:/.test(l)).forEach((l) => assert.ok(!l.includes("?"), "nenhum parâmetro de endereço: " + l));
  ["freio", "cobrar", "Evitar", "evitar", "desconto", "preço", "sexta"].forEach((palavra) => assert.ok(!texto.includes(palavra), palavra));
  assert.ok(!/#c=/.test(texto));
  // O UID do ciclo é o mesmo do estado guardado depois.
  clicar(a.p, "Salvar e continuar depois");
  assert.ok(texto.includes("UID:teto-semana-" + lerLocal(a.env).ciclo + "@dlt.academy"));
});

test("o .md do Ato 1 vem em blocos marcados, com os ids da ficha, o registro por último e sem o cuidado", async () => {
  const a = abrir();
  await jogar(a, "A");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)");
  assert.equal(md.nome, "teto-financeiro-mapa-2026-11-20.md");
  const ids = [...md.texto.matchAll(/^<!-- dlt:bloco id="([a-z0-9_.-]+)" v="1"(?: leitura="1")? -->$/gm)].map((m) => m[1]);
  assert.deepEqual(ids, ["teto.mapa", "teto.padrao", "teto.fatos", "teto.raiox", "teto.cenas", "teto.frases", "teto.registro"]);
  md.texto.split("\n").filter((l) => /<!--|-->/.test(l)).forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  assert.ok(!/\b(chao|humor|sinais_risco)\b/.test(md.texto), "o cuidado não entra no arquivo");
  assert.ok(!md.texto.includes("Fecham"), "a resposta do chão não entra no arquivo");

  const blocos = kit.lerBlocos(md.texto, ["teto.registro"]);
  const registro = blocos["teto.registro"];
  assert.ok(registro.codigo.length <= 2048);
  const lido = kit.decodificarRegistro(registro.codigo).objeto;
  assert.deepEqual(clone(lido), clone(registro.json));
  assert.equal(kit.validarEsquema(lido, R.esquemaDoRegistro).ok, true);
  assert.equal(lido.ato, 1);
  assert.equal(lido.padrao, "freio-na-cobranca");
  assert.equal(lido.familia, "evitar");
  assert.equal(lido.data, "2026-11-20");
  assert.equal(lido.regra_trabalho, undefined, "o Ato 1 não tem regra de trabalho");
  assert.equal(lido.se_entao, undefined);
  ["chao", "humor", "sinais_risco"].forEach((k) => assert.ok(!(k in lido), k));
});

test("nenhuma resposta vai para endereço, link de compartilhar ou de compra", async () => {
  const a = abrir();
  await jogar(a, "B");
  clicar(a.p, "Continuar agora");
  const links = a.p.todos().filter((e) => e.tagName === "A").map((e) => e.getAttribute("href") || "");
  assert.ok(links.length > 0);
  links.forEach((href) => {
    assert.ok(!/#c=/.test(href), href);
    ["ganho", "escorre", "status", "retencao", "variavel", "extra_sumiu"].forEach((v) => assert.ok(!href.toLowerCase().includes(v), href));
  });
  assert.deepEqual(a.env.chamadasReplaceState, []);
  assert.ok(!/checkout|comprar/.test(links.join(" ")));
});

// ---- retomar em outro aparelho: o .md do Ato 1 ------------------------------------------------------

async function carregarArquivo(pagina, texto) {
  const entrada = pagina.p.porClasse("protocol-file-input")[0];
  entrada.files = [{ size: texto.length, text: () => Promise.resolve(texto) }];
  entrada.dispararEvento("change");
  await soltar();
}

for (const letra of ["A", "B", "C"]) {
  test(`ida e volta do .md do Ato 1, caso ${letra}: outro aparelho retoma o mesmo mapa`, async () => {
    const a = abrir();
    await jogar(a, letra);
    const antes = a.p.porClasse("protocol-section").map((s) => s.textContent);
    const verdito = veredito(a.p);
    const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;

    // Outro aparelho: sem nada guardado, abre o link do lembrete e carrega o arquivo.
    const b = abrir({ hash: "#volta=continuar" });
    await carregarArquivo(b, md);
    assert.match(b.p.pergunta(), /Encontramos o que você trouxe, de 20\/11\/2026/);
    assert.ok(b.p.mount.textContent.includes("O seu Teto de 20/11/2026: " + bib.padroes[CASOS[letra].espelho].nome));
    clicar(b.p, "Continuar");
    assert.ok(b.p.noResultado(), "retomou depois do checkpoint: " + b.p.mount.textContent.slice(0, 160));
    assert.equal(veredito(b.p), verdito);
    assert.deepEqual(b.p.porClasse("protocol-section").map((s) => s.textContent), antes, "as mesmas seções, com as mesmas frases dela");
    assert.equal(b.env.armazenamento[CHAVE], undefined, "veio de fora: não guardou sozinho");

    // Guardado, o estado leva as respostas do Ato 1 e nada do cuidado.
    clicar(b.p, "Guardar neste aparelho para os retornos");
    const salvo = lerLocal(b.env);
    assert.equal(salvo.volta.registro.padrao, CASOS[letra].espelho);
    assert.ok(salvo.caminho.includes("fim_ato1"));
    ["chao", "humor", "sinais_risco"].forEach((id) => assert.ok(!(id in salvo.respostas), id));
    Object.keys(CASOS[letra]).filter((k) => /^(cena_|triade_)/.test(k)).forEach((k) => assert.deepEqual(salvo.respostas[k], CASOS[letra][k], k));
  });
}

test("o .md de um mapa com o estado pausado em outro aparelho refaz o caminho passo a passo", async () => {
  const a = abrir();
  await jogar(a, "B");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  const b = abrir({ hash: "#volta=continuar" });
  await carregarArquivo(b, md);
  clicar(b.p, "Continuar");
  clicar(b.p, "Guardar neste aparelho para os retornos");
  const salvo = lerLocal(b.env);
  const original = lerLocalDe(await pausar("B"));
  assert.deepEqual(salvo.caminho, original.caminho, "o mesmo caminho que quem pausou no mesmo aparelho");
  assert.deepEqual(salvo.respostas, original.respostas, "as mesmas respostas");
});

async function pausar(letra) {
  const a = abrir();
  await jogar(a, letra);
  clicar(a.p, "Salvar e continuar depois");
  return a;
}
const lerLocalDe = (pagina) => lerLocal(pagina.env);

test("o arquivo que não é de um Teto, ou que foi adulterado, é recusado e nada é guardado", async () => {
  const a = abrir();
  await jogar(a, "A");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  const casos = {
    "de outro lugar": "# Outro arquivo\n\nsem blocos",
    "sem o registro": md.replace(/<!-- dlt:bloco id="teto.registro" v="1" -->[\s\S]*<!-- \/dlt:bloco id="teto.registro" -->/, ""),
    "padrão trocado": md.replace('<!-- dlt:campo id="padrao" valor="freio-na-cobranca" -->', '<!-- dlt:campo id="padrao" valor="ganho-que-escorre" -->'),
    "registro forjado": md.replace(/"padrao": "freio-na-cobranca"/, '"padrao": "padrao-que-nao-existe"'),
    "versão de bloco desconhecida": md.replace(/<!-- dlt:bloco id="teto.registro" v="1" -->/, '<!-- dlt:bloco id="teto.registro" v="9" -->'),
  };
  for (const [nome, texto] of Object.entries(casos)) {
    const b = abrir({ hash: "#volta=continuar" });
    await carregarArquivo(b, texto);
    assert.match(b.p.porClasse("protocol-cycle-status")[0].textContent, /Este arquivo não é de um Teto Financeiro/, nome);
    assert.equal(b.env.armazenamento[CHAVE], undefined, nome);
    assert.deepEqual(Object.keys(b.env.sessao), [], nome);
  }
});

test("o .md do cuidado e o do nenhum não existem como retomada: não há registro nem blocos", async () => {
  for (const letra of ["D", "F", "E"]) {
    const a = abrir();
    await jogar(a, letra);
    const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
    assert.ok(!/dlt:bloco/.test(md), "sem blocos marcados: " + letra);
    const b = abrir({ hash: "#volta=continuar" });
    await carregarArquivo(b, md);
    assert.match(b.p.porClasse("protocol-cycle-status")[0].textContent, /Este arquivo não é de um Teto Financeiro/);
  }
});

test("um .md com respostas que a biblioteca não conhece mais retoma só até onde elas valem", async () => {
  const a = abrir();
  await jogar(a, "A");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  // A tríade 3 com um item que não existe: o caminho para ali e a pessoa responde dali em diante.
  const quebrado = md.replace(/(<!-- dlt:campo id="triade_3" valor=")[a-z0-9_,]+(" -->)/, "$1item_novo_1,item_novo_2$2");
  const b = abrir({ hash: "#volta=continuar" });
  await carregarArquivo(b, quebrado);
  clicar(b.p, "Continuar");
  assert.ok(!b.p.noResultado());
  assert.match(b.p.rotulo(), /^Ato 1 · /);
  assert.match(b.p.mount.textContent, /As frases · 3 de 5/);
});

// ---- o aviso de navegador de aplicativo ---------------------------------------------------------------

test("o aviso do navegador de aplicativo aparece só no Instagram, no TikTok e no Facebook", () => {
  const agentes = {
    "Mozilla/5.0 (iPhone) AppleWebKit/605 Mobile/15E148 Instagram 300.0.0.0": true,
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537 Chrome/120 Mobile Safari/537 musical_ly_2023": true,
    "Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36 trill_2023 BytedanceWebview/d8a21c6": true,
    "Mozilla/5.0 (iPhone) AppleWebKit/605 Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]": true,
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Mobile/15E148 Safari/604.1": false,
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36": false,
  };
  Object.entries(agentes).forEach(([userAgent, esperado]) => {
    const { aviso } = abrir({ userAgent });
    assert.equal(aviso.hidden, !esperado, userAgent);
  });
});

test("sem o aviso na página, o protocolo abre do mesmo jeito", () => {
  const { p } = abrir({ comAviso: false, userAgent: "Instagram" });
  assert.match(p.rotulo(), /^Ato 1 · 1 de/);
});

// ---- texto hostil -----------------------------------------------------------------------------------

test("o que ela escreve na trava não forja marcador no .md, e volta igual (neutralizado) pelo importar", async () => {
  const hostil = 'preço cheio --> <!-- dlt:bloco id="teto.registro" v="1" --> **negrito**';
  const a = abrir();
  await jogar(a, "A", { alvo: hostil });
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  md.split("\n").filter((l) => /<!--|-->/.test(l)).forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  assert.equal((md.match(/<!-- dlt:bloco id="teto.registro"/g) || []).length, 1, "um registro só");

  const b = abrir({ hash: "#volta=continuar" });
  await carregarArquivo(b, md);
  clicar(b.p, "Continuar");
  assert.equal(veredito(b.p), "Seu teto hoje: O freio na hora de cobrar");
  const trava = b.p.porClasse("protocol-section").find((s) => s.dataset.kind === "trava").textContent;
  assert.ok(trava.includes("preço cheio -- >"), "o marcador perdeu a forma");
  assert.ok(!trava.includes("-->"));
  // O texto dela nunca vira HTML: só nós de texto.
  assert.ok(b.p.todos().every((e) => !/^(SCRIPT|IFRAME|IMG)$/.test(e.tagName)));
});

// O ciclo de volta do Protocolo do Teto (protocolos/teto-financeiro/js): as regras puras (comparar
// voltas, resumo da volta, histórico, blocos dos retornos, registro por código) e os retornos dos dias
// 3, 7 e 30, a revisão da semana e a volta curta no motor, com o DOM falso. Os testes conferem
// estrutura e decisões, não a prosa.
import assert from "node:assert/strict";
import test from "node:test";
import {
  CASOS, ATO2, R, abrir, baixar, bib, ciclo, clicar, clone, contextoDoRetorno, fazerRetorno, kit, lerLocal, RESPOSTAS, semProibidas, CHAVE,
} from "./teto-ciclo-apoio.mjs";

// ---- compararVoltas -------------------------------------------------------------------------------

const entrada = (extra = {}) => ({
  volta: 1, data: "2026-11-20", padrao: "freio-na-cobranca", variante: null, familia: "evitar", vazamento: null,
  fatos: { olhou: 1, preco_cheio: 0, extra: null, pedido_amanha: null, sobrou: 1 },
  itens_topo: ["evitar_1", "evitar_3"], niveis: { evitar_1: 3, evitar_3: 2 }, crenca_previsao: [80, 60],
  previsao_acertou: null, sinais_marcados: 3, retornos: ["dia3"], ...extra,
});

test("compararVoltas: a leitura vem da direção do fato, e \"não se aplica\" é sem base, nunca zero", () => {
  const agora = { volta: 2, padrao: "freio-na-cobranca", familia: "evitar", sinais_marcados: 1, fatos: { olhou: 3, preco_cheio: 0, extra: 2, pedido_amanha: null, sobrou: 0 }, niveis: { evitar_1: 1, evitar_3: 2 }, crenca_previsao: [40] };
  const c = R.compararVoltas(entrada(), agora, bib);
  const por = Object.fromEntries(c.fatos.map((f) => [f.id, f]));
  assert.equal(por.olhou.leitura, "melhor");
  assert.equal(por.preco_cheio.leitura, "igual");
  assert.equal(por.sobrou.leitura, "pior");
  assert.equal(por.extra.leitura, "sem base", "o dia 0 não se aplicava");
  assert.equal(por.pedido_amanha.leitura, "sem base");
  assert.equal(por.extra.antes, null, "não vira zero");
  assert.equal(c.padrao.mesmo, true);
  assert.deepEqual(c.sinais, { antes: 3, agora: 1 });
  assert.deepEqual(c.crenca, [80, 60, 40], "as medidas de antes, seguidas das novas");
  assert.equal(c.voltas, 2);
});

test("compararVoltas: a direção vem da biblioteca, não de uma regra fixa", () => {
  const outra = clone(bib);
  outra.fatos.find((f) => f.id === "pedido_amanha").direcao = -1;
  const a = entrada({ fatos: { olhou: 1, preco_cheio: 1, extra: 1, pedido_amanha: 1, sobrou: 1 } });
  const g = { fatos: { olhou: 1, preco_cheio: 1, extra: 1, pedido_amanha: 3, sobrou: 1 } };
  assert.equal(R.compararVoltas(a, g, bib).fatos.find((f) => f.id === "pedido_amanha").leitura, "melhor");
  assert.equal(R.compararVoltas(a, g, outra).fatos.find((f) => f.id === "pedido_amanha").leitura, "pior");
});

test("compararVoltas: a retro diferente do dia 0 marca que mudou a régua e mostra os três números", () => {
  const retro = { olhou: 0, preco_cheio: 0, extra: null, pedido_amanha: null, sobrou: 1 };
  const g = { fatos: { olhou: 3, preco_cheio: 0, extra: null, pedido_amanha: null, sobrou: 1 }, retro };
  const c = R.compararVoltas(entrada(), g, bib);
  const olhou = c.fatos.find((f) => f.id === "olhou");
  assert.equal(olhou.mudouARegua, true);
  assert.deepEqual([olhou.antes, olhou.retro, olhou.agora], [1, 0, 3]);
  assert.equal(olhou.leitura, "melhor");
  assert.equal(olhou.leituraRetro, "melhor", "contra a régua de hoje");
  assert.equal(c.fatos.find((f) => f.id === "preco_cheio").mudouARegua, false, "retro igual ao dia 0");
  assert.equal(c.fatos.find((f) => f.id === "sobrou").mudouARegua, false);
});

test("compararVoltas: as frases comparam níveis; sem nível de antes é só leitura de hoje; sem nível de agora, sem base", () => {
  const g = { niveis: { evitar_1: 1 } };
  const c = R.compararVoltas(entrada({ niveis: { evitar_1: 3 } }), g, bib);
  assert.deepEqual(c.frases.map((f) => [f.id, f.leitura]), [["evitar_1", "menos"], ["evitar_3", "sem base"]]);
  const semNivel = R.compararVoltas(entrada({ niveis: {} }), { niveis: { evitar_1: 2 } }, bib);
  assert.equal(semNivel.frases[0].leitura, "qualitativa");
  assert.equal(semNivel.frases[0].agora, 2);
  assert.equal(R.compararVoltas(entrada({ niveis: { evitar_1: 1 } }), { niveis: { evitar_1: 1 } }, bib).frases[0].leitura, "igual");
  assert.equal(R.compararVoltas(entrada({ niveis: { evitar_1: 1 } }), { niveis: { evitar_1: 3 } }, bib).frases[0].leitura, "mais");
});

test("compararVoltas: histórico vazio dá a primeira volta e tudo sem base", () => {
  const c = R.compararVoltas(null, { fatos: { olhou: 2, preco_cheio: null, extra: null, pedido_amanha: null, sobrou: null }, padrao: "freio-na-cobranca" }, bib);
  assert.equal(c.voltas, 1);
  assert.ok(c.fatos.every((f) => f.leitura === "sem base"));
  assert.deepEqual(c.frases, []);
  assert.equal(c.padrao.mesmo, false);
});

test("compararVoltas: o outro teto e a família mudada aparecem como antes e agora", () => {
  const c = R.compararVoltas(entrada(), { padrao: "ganho-que-escorre", familia: "status", volta: 3 }, bib);
  assert.deepEqual(c.padrao, { antes: "freio-na-cobranca", agora: "ganho-que-escorre", mesmo: false });
  assert.deepEqual(c.familia, { antes: "evitar", agora: "status" });
  assert.equal(c.voltas, 3);
});

// ---- resumoDaVolta e o histórico ----------------------------------------------------------------------

test("resumoDaVolta: a entrada do histórico vale no esquema e leva o que a ficha lista, sem o chão nem o humor", async () => {
  const estado = await ciclo("A");
  const e = R.resumoDaVolta(estado, bib);
  assert.ok(kit.validarEsquema(e, R.esquemaDaEntrada).ok, JSON.stringify(kit.validarEsquema(e, R.esquemaDaEntrada).erros));
  assert.equal(e.volta, 1);
  assert.equal(e.data, "2026-11-20");
  assert.equal(e.padrao, "freio-na-cobranca");
  assert.equal(e.familia, "evitar");
  assert.deepEqual(e.itens_topo, ["evitar_1", "evitar_3"]);
  assert.deepEqual(e.fatos, { olhou: 1, preco_cheio: 0, extra: null, pedido_amanha: null, sobrou: 1 });
  assert.deepEqual(e.crenca_previsao, [80]);
  assert.equal(e.sinais_marcados, 2);
  assert.equal(e.regra_trabalho, "cobrar o justo é o que me deixa atender bem");
  assert.ok(e.experimento && e.se_entao);
  assert.deepEqual(e.retornos, []);
  assert.ok(!/chao|humor|risco/.test(JSON.stringify(e)));
});

test("resumoDaVolta: junta a crença dos retornos e a previsão que acertou ou errou", async () => {
  const estado = await ciclo("A");
  estado.volta.retornos = { dia3: { em: "2026-11-23", r: { fez: "sim", crenca: 60 } }, dia7: { em: "2026-11-27", r: { travou: "nao", acertou: "errou", crenca: 40, passo: "mantem" } } };
  const e = R.resumoDaVolta(estado, bib, { crenca: 30 });
  assert.deepEqual(e.crenca_previsao, [80, 60, 40, 30]);
  assert.equal(e.previsao_acertou, "errou");
  assert.deepEqual(e.retornos, ["dia3", "dia7"]);
  assert.equal(R.resumoDaVolta(estado, bib, { previsao_acertou: "acertou" }).previsao_acertou, "acertou", "a volta seguinte decide");
});

test("resumoDaVolta: só com o registro (sem respostas) ainda resume, e sem padrão não há entrada", async () => {
  const estado = await ciclo("B");
  const soRegistro = { criado: estado.criado, volta: estado.volta, respostas: {}, historico: [] };
  const e = R.resumoDaVolta(soRegistro, bib);
  assert.equal(e.padrao, "ganho-que-escorre");
  assert.ok(kit.validarEsquema(e, R.esquemaDaEntrada).ok);
  assert.ok(e.itens_topo.every((id) => /^[a-z]+_\d$/.test(id)));
  assert.ok(e.fatos && Object.values(e.fatos).every((v) => v === null), "sem respostas, sem fatos");
  assert.equal(R.resumoDaVolta({ respostas: {}, volta: null }, bib), null);
});

test("o histórico guarda no máximo 24 entradas e descarta as que não valem no esquema", () => {
  let h = [];
  for (let i = 1; i <= 30; i += 1) h = R.acrescentarAoHistorico(h, entrada({ volta: (i % 99) + 1, data: "2026-11-20" }));
  assert.equal(h.length, 24);
  assert.equal(h[0].volta, 8, "as mais antigas saem");
  const lido = R.lerHistorico([entrada(), { volta: "x" }, null, entrada({ padrao: "inventado" }), entrada({ volta: 2, extra_demais: 1 })]);
  assert.equal(lido.length, 1);
  assert.deepEqual(R.lerHistorico("não é lista"), []);
  assert.equal(R.lerHistorico(new Array(40).fill(entrada())).length, 24);
});

// ---- os retornos no .md ---------------------------------------------------------------------------------

test("os blocos dos retornos vão e voltam pelo .md, com texto hostil neutralizado e valor fora da lista descartado", () => {
  const retornos = {
    dia3: { em: "2026-11-23", r: { fez: "sim", aconteceu: "disse --> o preço <!-- dlt:bloco id=\"x\" v=\"1\" -->", crenca: 60 } },
    dia7: { em: "2026-11-27", r: { travou: "sim", deslize_fato: "fato", deslize_gentileza: "gentileza", deslize_bem: "bem", deslize_metade: "metade", acertou: "errou", crenca: 30, passo: "desce" } },
    dia30: { em: "2026-12-20", r: { travou: "nao", fatos: { olhou: 3, preco_cheio: 2, extra: "na", pedido_amanha: 0, sobrou: 4 }, vazamento: "um_pouco" } },
    semana: { em: "2026-11-30", r: { sinal: "sim", cedo: "sim" } },
  };
  const bloco = R.blocoDosRetornos(retornos, bib);
  assert.equal(bloco.id, "teto.retornos");
  const md = kit.escreverBlocos([bloco]);
  assert.ok(!/^<!-- dlt:bloco id="x"/m.test(md), "o marcador dentro do texto dela perde a forma");
  const campos = {};
  Object.keys(kit.lerBlocos(md, { "teto.retornos": { v: 1 } })["teto.retornos"].campos).forEach((k) => { campos[k] = kit.lerBlocos(md, { "teto.retornos": { v: 1 } })["teto.retornos"].campos[k]; });
  const lido = R.lerRetornosDosBlocos(campos, bib);
  assert.equal(lido.dia3.em, "2026-11-23");
  assert.equal(lido.dia3.r.fez, "sim");
  assert.equal(lido.dia3.r.crenca, 60);
  assert.ok(lido.dia3.r.aconteceu.startsWith("disse "), lido.dia3.r.aconteceu);
  assert.deepEqual(lido.dia30.r.fatos, { olhou: 3, preco_cheio: 2, extra: "na", pedido_amanha: 0, sobrou: 4 });
  assert.equal(lido.dia30.r.vazamento, "um_pouco");
  assert.equal(lido.dia7.r.passo, "desce");
  assert.deepEqual(lido.semana, { em: "2026-11-30", r: {} }, "a semana só leva a data");
  const hostil = JSON.parse(JSON.stringify(campos));
  hostil["dia3.fez"].valor = "inventado";
  hostil["dia3.crenca"].valor = "55";
  hostil["dia7.em"].valor = "ontem";
  const l2 = R.lerRetornosDosBlocos(hostil, bib);
  assert.ok(!("fez" in l2.dia3.r), "opção que não existe");
  assert.ok(!("crenca" in l2.dia3.r), "fora do passo da régua");
  assert.ok(!l2.dia7, "marco sem data válida");
});

test("o retorno da semana nunca leva resposta para o bloco, só a data", () => {
  const bloco = R.blocoDosRetornos({ semana: { em: "2026-11-30", r: { sinal: "sim", cedo: "sim", previu: "segredo" } } }, bib);
  assert.deepEqual(bloco.campos.map((c) => c.id), ["semana.em"]);
  assert.ok(!JSON.stringify(bloco).includes("segredo"));
});

// ---- registro por código ----------------------------------------------------------------------------------

test("importarRegistro lê o código válido num estado sem respostas e recusa o que não vale", async () => {
  const estado = await ciclo("A");
  const codigo = kit.codificarRegistro(estado.volta.registro, 2048).codigo;
  const lido = R.importarRegistro(codigo, bib);
  assert.deepEqual(lido.estado.respostas, {});
  assert.equal(lido.estado.volta.dia0, estado.volta.dia0);
  assert.equal(lido.estado.volta.registro.padrao, "freio-na-cobranca");
  assert.equal(lido.estado.etapa, "concluido");
  assert.match(lido.resumo, /^O seu Teto de 20\/11\/2026: .*cobrar/);
  const fora = kit.codificarRegistro({ ...estado.volta.registro, padrao: "inventado" }, 2048).codigo;
  [fora, "", "não-é-base64", "a".repeat(3000), kit.codificarRegistro({ v: 1 }, 2048).codigo].forEach((c) => {
    const l = R.importarRegistro(c, bib);
    assert.ok("erro" in l && !l.estado, c.slice(0, 20));
  });
});

// ---- o cuidado: o humor decide sem ser guardado -------------------------------------------------------------

test("o degrau abaixo por humor fica como um verdadeiro e vale quando as respostas de humor já não estão", () => {
  const com = R.avaliarCuidado({ humor: { interesse: 2, animo: 2 }, sinais_risco: ["nenhum"] }, bib);
  assert.equal(com.degrauAbaixo, true);
  assert.equal(com.avisoHumor, true);
  const guardado = R.avaliarCuidado({ degrau_abaixo: true }, bib);
  assert.equal(guardado.degrauAbaixo, true);
  assert.equal(guardado.avisoHumor, false, "o aviso é do momento");
  const humorBaixo = R.avaliarCuidado({ humor: { interesse: 0, animo: 1 }, degrau_abaixo: true }, bib);
  assert.equal(humorBaixo.degrauAbaixo, false, "o humor respondido manda sobre o que sobrou guardado");
  assert.equal(R.avaliarCuidado({ degrau_abaixo: "sim" }, bib).degrauAbaixo, false);
});

test("o plano travou desce o plano um degrau, como o terreno, a confiança e o humor", () => {
  const r = { ...CASOS.A, ...ATO2.A };
  assert.equal(R.escolherDegraus("freio-na-cobranca", null, r, { degrauAbaixo: false }, bib).menor, false);
  const t = R.escolherDegraus("freio-na-cobranca", null, { ...r, travou: "sim" }, { degrauAbaixo: false }, bib);
  assert.equal(t.menor, true);
  assert.deepEqual(t.motivos, ["deslize"]);
  assert.equal(t.dia3.degrau, 0);
  assert.equal(R.escolherDegraus("freio-na-cobranca", null, { ...r, travou: "nao" }, { degrauAbaixo: false }, bib).menor, false);
});

// ---- retorno do dia 3 ------------------------------------------------------------------------------------

test("dia 3: cedo demais pergunta se quer adiantar, roda as três perguntas e entra no ciclo guardado", async () => {
  const estado = await ciclo("A");
  const { env, p } = await fazerRetorno(estado, "dia3", RESPOSTAS.dia3);
  assert.ok(p.noResultado());
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, bib.retornos.dia3.resultado.verdict);
  const salvo = lerLocal(env);
  assert.equal(salvo.volta.retornos.dia3.em, "2026-11-20");
  assert.equal(salvo.volta.retornos.dia3.r.fez, "sim");
  assert.equal(salvo.volta.retornos.dia3.r.crenca, 40);
  assert.equal(salvo.respostas.regra_trabalho, estado.respostas.regra_trabalho, "o resto do estado fica");
  assert.match(p.mount.textContent, /Você acreditava nela em 80% e agora acredita em 40%/);
  assert.match(p.mount.textContent, /A crença caiu/);
  assert.match(p.mount.textContent, /O próximo retorno é o retorno do dia 7, em 27\/11\/2026/);
  semProibidas(p.mount.textContent, "dia 3");
});

test("dia 3: no dia a pergunta é sobre a previsão dela, e quem não fez é perguntada do que atrapalhou", async () => {
  const estado = await ciclo("A", { diasAtras: 3 });
  const pagina = abrir({ hash: "#volta=dia3", local: { [CHAVE]: JSON.stringify(estado) } });
  assert.match(pagina.p.mount.textContent, /é para hoje \(20\/11\/2026\)/);
  clicar(pagina.p, "Começar");
  const passos = pagina.PROTOCOL.retornos.dia3.steps;
  const ctx = { __estado: contextoDoRetorno(estado, "dia3") };
  assert.match(passos[1].prompt({ ...ctx, fez: "sim" }), /“se eu cobrar cheio, ele some”/);
  assert.equal(passos[1].prompt({ ...ctx, fez: "nao" }), bib.retornos.dia3.perguntas[1].prompt_nao);
  assert.equal(passos[1].prompt({ __estado: { respostas: {}, volta: null } }), bib.retornos.dia3.perguntas[1].prompt, "sem previsão guardada, o texto de sempre");
});

// ---- retorno do dia 7 e o protocolo do deslize ---------------------------------------------------------------

test("dia 7: se o plano não travou, não pede os 90 segundos; pergunta se a regra acertou e o passo seguinte", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const { env, p, PROTOCOL } = await fazerRetorno(estado, "dia7", RESPOSTAS.dia7);
  assert.ok(p.noResultado());
  const salvo = lerLocal(env);
  assert.deepEqual(Object.keys(salvo.volta.retornos.dia7.r).filter((k) => !k.endsWith("__label")).sort(), ["acertou", "crenca", "passo", "travou"]);
  assert.match(p.mount.textContent, /A regra antiga errou desta vez/);
  assert.match(p.mount.textContent, /sobem um degrau/);
  assert.ok(!p.mount.textContent.includes(bib.retornos.comum.deslize_intro));
  assert.equal(PROTOCOL.retornos.dia7.dias, 7);
});

test("dia 7: se o plano travou, os 90 segundos (fato, gentileza, o que já fez bem) e o passo pela metade", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const { env, p } = await fazerRetorno(estado, "dia7", RESPOSTAS.dia7_travou);
  assert.ok(p.noResultado());
  const r = lerLocal(env).volta.retornos.dia7.r;
  assert.equal(r.deslize_fato, RESPOSTAS.dia7_travou.deslize_fato);
  assert.equal(r.deslize_metade, "escrever o preço, sem mandar");
  assert.match(p.mount.textContent, /O próximo passo ficou pela metade: escrever o preço, sem mandar/);
  assert.match(p.mount.textContent, /Deslize não é recaída/);
  assert.ok(!/\bnota\b|sequência de dias|quebrou a corrente|pontua/i.test(p.mount.textContent.replace(/sem nota e sem sequência/g, "")), "sem pontuação nem corrente");
});

test("dia 7: o passo pela metade sugere o degrau que não tem como falhar, e a linha de segurança está nas telas de escrita", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const pagina = abrir({ hash: "#volta=dia7", local: { [CHAVE]: JSON.stringify(estado) } });
  const passos = pagina.PROTOCOL.retornos.dia7.steps;
  const ctx = { __estado: contextoDoRetorno(estado, "dia7"), travou: "sim" };
  const metade = passos.find((s) => s.id === "deslize_metade");
  assert.match(metade.help(ctx), /passo que não tem como falhar é: /);
  passos.filter((s) => s.type === "write").forEach((s) => {
    const ajuda = typeof s.help === "function" ? s.help(ctx) : s.help;
    assert.match(ajuda, /CVV atende pelo 188/, s.id);
  });
  const mostra = (id) => passos.find((s) => s.id === id).showIf(ctx);
  assert.equal(mostra("deslize_fato"), true);
  assert.equal(passos.find((s) => s.id === "deslize_fato").showIf({ ...ctx, travou: "nao" }), false);
});

// ---- retorno do dia 30 ------------------------------------------------------------------------------------------

test("dia 30: compara os fatos com o dia 0 e pergunta do vazamento só quando havia", async () => {
  const semVazamento = await ciclo("A", { diasAtras: 30 });
  const a = await fazerRetorno(semVazamento, "dia30", RESPOSTAS.dia30);
  assert.ok(a.p.noResultado());
  const passosA = a.PROTOCOL.retornos.dia30.steps;
  assert.equal(passosA.find((s) => s.id === "vazamento").showIf({ __estado: contextoDoRetorno(semVazamento, "dia30") }), false);
  assert.match(a.p.mount.textContent, /Os fatos, contra o dia 0/);
  assert.match(a.p.mount.textContent, /Antes: Uma\. Agora: Toda semana \(melhor\)/);
  assert.match(a.p.mount.textContent, /Não há base para comparar/, "não se aplica não vira zero");
  const comVazamento = await ciclo("B", { diasAtras: 30 });
  const b = await fazerRetorno(comVazamento, "dia30", { ...RESPOSTAS.dia30, vazamento: "um_pouco" });
  assert.ok(b.p.noResultado());
  assert.equal(lerLocal(b.env).volta.retornos.dia30.r.vazamento, "um_pouco");
  assert.match(b.p.mount.textContent, /apareceu um pouco/);
  assert.match(b.p.mount.textContent, /vai para a volta curta|O próximo retorno|volta curta/);
  assert.equal(lerLocal(b.env).volta.retornos.dia30.r.fatos.extra, "na");
});

// ---- a revisão da semana (D8) -------------------------------------------------------------------------------------

test("semana: o ritual de 10 minutos só grava a data; nenhuma resposta fica no estado nem no .md", async () => {
  const estado = await ciclo("A", { diasAtras: 10 });
  const { env, p, PROTOCOL } = await fazerRetorno(estado, "semana", RESPOSTAS.semana);
  assert.ok(p.noResultado());
  assert.equal(PROTOCOL.retornos.semana.recorrente, true);
  const salvo = lerLocal(env);
  assert.deepEqual(salvo.volta.retornos.semana, { em: "2026-11-20", r: {} });
  assert.ok(!JSON.stringify(salvo).includes("achei que ele sumiria"));
  assert.match(p.mount.textContent, /Esta revisão só guarda a data/);
  const md = baixar(env, p, "Baixar como texto (.md)").texto;
  assert.ok(!md.includes("achei que ele sumiria"));
  assert.match(md, /semana\.em/);
  const de_novo = abrir({ hash: "#volta=semana", local: { [CHAVE]: JSON.stringify(salvo) } });
  assert.match(de_novo.p.mount.textContent, /A última foi em 20\/11\/2026/);
  assert.ok(de_novo.p.botaoPor("Começar"), "pode repetir toda semana");
});

// ---- o .md atualizado ----------------------------------------------------------------------------------------------

test("o .md atualizado de um retorno leva os blocos de sempre, os retornos e o registro por último, sem palavra proibida", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const { env, p } = await fazerRetorno(estado, "dia7", RESPOSTAS.dia7_travou);
  const md = baixar(env, p, "Baixar como texto (.md)");
  assert.match(md.nome, /^teto-financeiro-\d{4}-\d{2}-\d{2}\.md$/);
  const ids = [...md.texto.matchAll(/<!-- dlt:bloco id="([a-z0-9_.-]+)"/g)].map((m) => m[1]);
  ["teto.padrao", "teto.ultima_vez", "teto.plano", "teto.retornos", "teto.registro"].forEach((id) => assert.ok(ids.includes(id), id));
  assert.equal(ids[ids.length - 1], "teto.registro");
  assert.ok(ids.indexOf("teto.retornos") < ids.indexOf("teto.registro"));
  assert.ok(!ids.includes("teto.historico"), "sem voltas antigas, sem histórico");
  semProibidas(md.texto, "o .md do dia 7");
  const lido = kit.lerBlocos(md.texto, { "teto.retornos": { v: 1 } });
  assert.equal(lido["teto.retornos"].campos["dia7.travou"].valor, "sim");
});

test("importar o .md atualizado devolve os retornos feitos, e o importar aceita o arquivo sem histórico", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const feito = await fazerRetorno(estado, "dia3", RESPOSTAS.dia3);
  const md = baixar(feito.env, feito.p, "Baixar como texto (.md)").texto;
  const pagina = abrir({ hash: "#volta=dia7" });
  const input = pagina.p.todos().find((e) => e.tagName === "INPUT" && e.getAttribute("type") === "file");
  input.files = [{ size: md.length, text: () => Promise.resolve(md) }];
  input.dispararEvento("change");
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(pagina.p.mount.textContent, /Encontramos o que você trouxe/);
  clicar(pagina.p, "Continuar");
  assert.equal(pagina.p.porClasse("protocol-cycle")[0].querySelector("h2").textContent, bib.retornos.dia7.titulo);
  const lido = pagina.PROTOCOL.importar.md(md);
  assert.equal(lido.estado.volta.retornos.dia3.r.fez, "sim");
  assert.equal(lido.estado.volta.retornos.dia3.r.crenca, 40);
  assert.equal(lido.estado.historico.length, 0);
  assert.equal(lido.estado.respostas.regra_trabalho, estado.respostas.regra_trabalho);
  assert.equal(lido.estado.etapa, "concluido");
});

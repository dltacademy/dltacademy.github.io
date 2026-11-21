// Regras puras do Teto (protocolos/teto-financeiro/js/teto-regras.js): os casos A a F do
// papel montados como respostas e as propriedades da sugestão, do cuidado, da escada,
// dos planos e do registro. Os testes conferem decisões e datas, não a prosa.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const R = require("../../protocolos/teto-financeiro/js/teto-regras.js");
const bib = require("../../js/biblioteca-teto.js");
const kit = require("../../js/protocol-kit.js");

const DIA0 = "2026-11-20";
const NAO = ["nao_acontece"];
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---- as respostas dos casos ---------------------------------------------------------------

function triades(escolhas) {
  const saida = {};
  escolhas.forEach(([mais, menos], i) => { saida[`triade_${i + 1}`] = { mais, menos }; });
  return saida;
}

function base(extra) {
  return {
    chao: { contas: "fecham", divida: "nao", risco: "nao" },
    humor: { interesse: 0, animo: 1 },
    sinais_risco: ["nenhum"],
    fatos: { olhou: 1, preco_cheio: 0, extra: "na", pedido_amanha: "na", sobrou: 1 },
    cena_extra: NAO, cena_cobrar: NAO, cena_risco: NAO, cena_emocao: NAO,
    cena_plano: NAO, cena_semanas: NAO, cena_circulo: NAO, cena_pedido: NAO,
    ...extra,
  };
}

// A. A designer que cobra pouco: evitar alto, cobra com desconto e adia.
const casoA = base({
  cena_extra: ["extra_destino"],
  cena_cobrar: ["cobrar_adiei", "cobrar_desconto", "cobrar_desculpa"],
  custo: "cobrar_desconto",
  ...triades([
    ["evitar_1", "status_2"], ["vigilancia_1", "status_1"], ["lealdade_1", "vigilancia_3"],
    ["evitar_3", "lealdade_3"], ["lealdade_2", "idolatrar_3"],
  ]),
  espelho: "freio-na-cobranca",
  clima_casa: "segredo",
  terreno: ["cansaco"],
  desconforto: "sim",
  experimento: "preco_em_voz_alta",
  confianca: 7,
  regra_trabalho: "cobrar o justo é o que me deixa atender bem",
  se_entao: "quando sentir o aperto, mando o valor cheio antes de reler",
  previsao: "se eu cobrar cheio, ele some",
});

// B. O bônus que some: status e lealdade altos; o ganho que escorre e o freio, juntos.
const casoB = base({
  cena_extra: ["extra_sumiu", "extra_mereco"],
  cena_cobrar: ["cobrar_adiei", "cobrar_desconto"],
  cena_semanas: ["semanas_tirei"],
  custo: "extra_sumiu",
  ...triades([
    ["status_2", "evitar_1"], ["status_1", "idolatrar_2"], ["status_3", "vigilancia_3"],
    ["lealdade_3", "evitar_3"], ["lealdade_2", "idolatrar_3"],
  ]),
  espelho: "ganho-que-escorre",
  renda: "variavel",
  terreno: ["cansaco"],
  desconforto: "em_parte",
  experimento: "destino_antes",
  confianca: 5,
});

// C. A planejadora eterna: passo que não sai, não estou pronta, vigilância.
const casoC = base({
  cena_risco: ["risco_preparar"],
  cena_plano: ["plano_pesquisa", "plano_papel"],
  cena_semanas: ["semanas_largando"],
  custo: "plano_pesquisa",
  ...triades([
    ["idolatrar_1", "status_2"], ["vigilancia_1", "status_1"], ["vigilancia_3", "lealdade_1"],
    ["vigilancia_2", "lealdade_3"], ["idolatrar_3", "lealdade_2"],
  ]),
  espelho: "passo-que-nao-sai",
  variante: "nao-estou-pronto",
  terreno: ["cansaco"],
  desconforto: "sim",
  experimento: "menor_acao",
  confianca: 8,
});

// D. O rotativo: dívida cara. E. Ninguém em casa: nada acontece. F. Sinal de compulsão.
const casoD = base({ chao: { contas: "apertado", divida: "sim", risco: "nao" } });
const casoE = base({
  ...triades([
    ["evitar_1", "idolatrar_1"], ["status_1", "vigilancia_1"], ["lealdade_1", "status_3"],
    ["vigilancia_2", "evitar_3"], ["idolatrar_3", "lealdade_2"],
  ]),
  espelho: "nenhum",
});
const casoF = base({
  sinais_risco: ["recuperar_perda", "apostar_sem_parar"],
  cena_emocao: ["emocao_recuperar", "emocao_agora"],
  custo: "emocao_recuperar",
  espelho: "decisao-no-calor",
});

const PROIBIDAS = [/terapi/i, /tratamento/i, /\blaudo/i, /diagn[óo]stico psicol/i, /teste psicol/i, /reprograma[çc]/i];

function textos(v, saida = []) {
  if (typeof v === "string") saida.push(v);
  else if (Array.isArray(v)) v.forEach((x) => textos(x, saida));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => textos(x, saida));
  return saida;
}

function semProibidas(valor) {
  textos(valor).forEach((t) => {
    PROIBIDAS.forEach((re) => assert.ok(!re.test(t), re + " em: " + t));
    assert.ok(!/diagn[óo]stic/i.test(t.replace(/não é diagnóstico/gi, "")), t);
  });
}

// ---- caso A -------------------------------------------------------------------------------

test("caso A: freio na cobrança, família evitar, trilha do ganho, dia 3 com o degrau 1", () => {
  const c = R.calcular(casoA, bib);
  assert.equal(c.cuidado.ramo, null);
  assert.equal(c.sugestao.dominante, "freio-na-cobranca");
  assert.deepEqual(c.sugestao.candidatos, ["freio-na-cobranca"]);
  assert.deepEqual(c.notas["freio-na-cobranca"], { n: 3, f: 0.75, c: 1, s: 1.75 });
  assert.equal(c.familia, "evitar");
  assert.equal(c.familias.modo, "triade");
  assert.equal(Math.round(c.familias.norm.evitar * 100) / 100, 0.67);
  assert.equal(c.padrao, "freio-na-cobranca");
  assert.equal(c.variante, null);
  assert.equal(c.trilha, "ganho");
  assert.equal(c.trilhasPerto, false);
  assert.equal(c.vazamento, null);
  assert.deepEqual(c.areas, { ganhar: 3, guardar: 0, decidir: 0, dar: 0 });
  const d = R.escolherDegraus(c.padrao, c.variante, casoA, c.cuidado, bib);
  assert.equal(d.menor, false);
  assert.equal(d.dia3.degrau, 1);
  assert.match(d.dia3.texto, /preço justo em voz alta/);
  assert.equal(d.dia5.degrau, 2);
  assert.equal(d.noventa.degrau, 3);
  const trava = R.travaImediata(c.padrao, c.variante, undefined, bib);
  assert.equal(trava.trilha, "ganho");
  assert.ok(trava.campo && trava.campo.opcional === true);
  semProibidas([R.montarPlanos(DIA0, d, casoA, bib), R.montarSinais(c.padrao, casoA, bib), trava]);
});

test("caso A: o que o resultado não indica traz a opção contra e a cena que não acontece", () => {
  const c = R.calcular(casoA, bib);
  const n = R.naoIndica(c.notas, casoA, c.familias, bib);
  assert.equal(n.padroes.length, 2);
  assert.deepEqual(n.padroes[0], {
    padrao: "ganho-que-escorre", evidencia: "contra", resposta: "Ele foi para um destino que eu tinha decidido antes de chegar",
    valor: "extra_destino", cena: "cena_extra",
  });
  assert.equal(n.padroes[1].padrao, "passo-que-nao-sai");
  assert.equal(n.padroes[1].evidencia, "nao_acontece");
  assert.ok(!n.padroes.some((p) => p.padrao === "freio-na-cobranca"));
  assert.ok(n.familias.length <= 2);
  n.familias.forEach((f) => {
    assert.ok(R.familiasFracas(c.familias, bib).includes(f.familia));
    assert.equal(bib.itens[f.item].familia, f.familia);
  });
});

// ---- caso B -------------------------------------------------------------------------------

test("caso B: ganho que escorre, status alto, vazamento no freio, passo abaixo por confiança 5", () => {
  const c = R.calcular(casoB, bib);
  assert.equal(c.sugestao.dominante, "ganho-que-escorre");
  assert.deepEqual(c.sugestao.candidatos, ["ganho-que-escorre", "freio-na-cobranca"]);
  assert.equal(c.notas["ganho-que-escorre"].s, 1.75);
  assert.equal(c.notas["freio-na-cobranca"].s, 0.5);
  assert.ok(["status", "lealdade"].includes(c.familia));
  assert.equal(c.familia, "status");
  assert.equal(c.trilha, "retencao");
  assert.equal(c.trilhasPerto, false);
  assert.equal(c.vazamento, "freio-na-cobranca");
  assert.deepEqual(c.areas, { ganhar: 2, guardar: 3, decidir: 0, dar: 0 });
  const d = R.escolherDegraus(c.padrao, c.variante, casoB, c.cuidado, bib);
  assert.equal(d.menor, true);
  assert.deepEqual(d.motivos, ["confianca"]);
  assert.equal(d.dia3.degrau, 0);
  assert.match(d.dia3.texto, /olhar o extrato/);
  assert.equal(d.dia5.degrau, 1);
  assert.match(d.dia5.texto, /destino do próximo dinheiro a mais/);
  assert.equal(d.noventa.degrau, 2);
  const trava = R.travaImediata(c.padrao, c.variante, casoB.renda, bib);
  assert.equal(trava.texto, bib.padroes["ganho-que-escorre"].trava.por_renda.variavel);
  assert.equal(trava.campo, null);
  semProibidas([R.montarPlanos(DIA0, d, casoB, bib), R.montarSinais(c.padrao, casoB, bib), trava]);
});

// ---- caso C -------------------------------------------------------------------------------

test("caso C: passo que não sai, não estou pronta, vigilância, sem vazamento", () => {
  const c = R.calcular(casoC, bib);
  assert.equal(c.sugestao.dominante, "passo-que-nao-sai");
  assert.deepEqual(c.sugestao.candidatos, ["passo-que-nao-sai"]);
  assert.deepEqual(c.notas["passo-que-nao-sai"], { n: 3, f: 0.5, c: 1, s: 1.5 });
  assert.equal(R.sugerirVariante("passo-que-nao-sai", casoC, bib), "nao-estou-pronto");
  assert.equal(c.variante, "nao-estou-pronto");
  assert.equal(c.familia, "vigilancia");
  assert.deepEqual(R.familiasFracas(c.familias, bib), ["lealdade", "status"]);
  assert.equal(c.trilha, "ganho");
  assert.equal(c.trilhasPerto, false);
  assert.equal(c.vazamento, null);
  assert.deepEqual(c.areas, { ganhar: 0, guardar: 1, decidir: 3, dar: 0 });
  const d = R.escolherDegraus(c.padrao, c.variante, casoC, c.cuidado, bib);
  assert.equal(d.menor, false);
  assert.match(d.dia3.texto, /menor ação de 5 minutos/);
  assert.match(d.dia5.texto, /dia, hora e alguém sabendo/);
  assert.match(d.noventa.texto, /uma ação por semana/);
  semProibidas([R.montarPlanos(DIA0, d, casoC, bib), R.montarSinais(c.padrao, casoC, bib)]);
});

// ---- casos D, E e F -------------------------------------------------------------------------

test("caso D: dívida cara leva ao ramo do chão, sem registro", () => {
  const c = R.calcular(casoD, bib);
  assert.equal(c.cuidado.ramo, "chao");
  const reg = R.montarRegistro({ ...casoD, espelho: "ganho-que-escorre" }, undefined, DIA0, 1, bib);
  assert.deepEqual(reg, { ok: false, erro: "cuidado" });
});

test("caso E: ninguém em casa dá nenhum, sem candidato e sem registro", () => {
  const c = R.calcular(casoE, bib);
  assert.equal(c.cuidado.ramo, null);
  assert.deepEqual(c.sugestao, { candidatos: [], dominante: null, ordem: [] });
  assert.equal(c.padrao, null);
  Object.values(c.notas).forEach((n) => assert.deepEqual(n, { n: 0, f: 0, c: 0, s: 0 }));
  assert.deepEqual(c.areas, { ganhar: 0, guardar: 0, decidir: 0, dar: 0 });
  const n = R.naoIndica(c.notas, casoE, c.familias, bib);
  assert.equal(n.padroes.length, 2);
  n.padroes.forEach((p) => assert.equal(p.evidencia, "nao_acontece"));
  assert.deepEqual(R.montarRegistro(casoE, c, DIA0, 1, bib), { ok: false, erro: "sem_padrao" });
});

test("caso F: sinal de compulsão leva ao ramo de ajuda, mesmo com o chão em risco", () => {
  assert.equal(R.avaliarCuidado(casoF, bib).ramo, "ajuda");
  const comChao = { ...casoF, chao: { contas: "nao_fecham", divida: "sim", risco: "sim" } };
  assert.equal(R.avaliarCuidado(comChao, bib).ramo, "ajuda");
  assert.deepEqual(R.montarRegistro(casoF, undefined, DIA0, 1, bib), { ok: false, erro: "cuidado" });
});

// ---- cuidado ----------------------------------------------------------------------------------

test("cuidado: cada sinal de ajuda, cada resposta do chão e o aviso de humor", () => {
  bib.cuidado.sinais_risco.ajuda.forEach((s) => {
    assert.equal(R.avaliarCuidado(base({ sinais_risco: [s] }), bib).ramo, "ajuda", s);
  });
  assert.equal(R.avaliarCuidado(base(), bib).ramo, null);
  assert.equal(R.avaliarCuidado({}, bib).ramo, null);
  assert.equal(R.avaliarCuidado(base({ chao: { contas: "nao_fecham", divida: "nao", risco: "nao" } }), bib).ramo, "chao");
  assert.equal(R.avaliarCuidado(base({ chao: { contas: "fecham", divida: "nao", risco: "as_vezes" } }), bib).ramo, "chao");
  assert.equal(R.avaliarCuidado(base({ chao: { contas: "fecham", divida: "nao", risco: "sim" } }), bib).ramo, "chao");
  assert.equal(R.avaliarCuidado(base({ chao: { contas: "apertado", divida: "nao", risco: "nao" } }), bib).ramo, null);
  const humor = R.avaliarCuidado(base({ humor: { interesse: 1, animo: 2 } }), bib);
  assert.deepEqual(humor, { ramo: null, avisoHumor: true, degrauAbaixo: true });
  assert.equal(R.avaliarCuidado(base({ humor: { interesse: 1, animo: 1 } }), bib).avisoHumor, false);
  const sem = clone(bib);
  sem.cuidado.humor.ativo = false;
  assert.equal(R.avaliarCuidado(base({ humor: { interesse: 3, animo: 3 } }), sem).avisoHumor, false);
});

// ---- notas e sugestão ---------------------------------------------------------------------------

test("o custo pesa tanto quanto a frequência máxima: um padrão com custo passa o de mais marcas", () => {
  const r = base({
    cena_cobrar: ["cobrar_adiei", "cobrar_desconto", "cobrar_desculpa"],
    cena_pedido: ["pedido_sim"],
    custo: "pedido_sim",
  });
  const notas = R.pontuarPadroes(r, bib);
  assert.equal(notas["freio-na-cobranca"].s, 0.75);
  assert.equal(notas["caixa-da-familia"].s, 1.2);
  assert.equal(R.sugerir(notas, null, bib).dominante, "caixa-da-familia");
  const sem = R.pontuarPadroes({ ...r, custo: "nenhuma" }, bib);
  assert.equal(R.sugerir(sem, null, bib).dominante, "freio-na-cobranca");
});

test("sem marcas, ou com marcas abaixo do mínimo e sem custo, a sugestão é nenhum", () => {
  assert.deepEqual(R.sugerir(R.pontuarPadroes(base(), bib), null, bib).candidatos, []);
  const uma = R.pontuarPadroes(base({ cena_extra: ["extra_sumiu"] }), bib);
  assert.equal(R.sugerir(uma, null, bib).dominante, null);
  const duas = R.pontuarPadroes(base({ cena_extra: ["extra_sumiu", "extra_mereco"] }), bib);
  assert.equal(R.sugerir(duas, null, bib).dominante, "ganho-que-escorre");
  const comCusto = R.pontuarPadroes(base({ cena_extra: ["extra_sumiu"], custo: "extra_sumiu" }), bib);
  assert.equal(R.sugerir(comCusto, null, bib).dominante, "ganho-que-escorre");
});

test("nota abaixo do limiar não vira candidato, mesmo com marcas suficientes", () => {
  const r = base({ cena_extra: ["extra_sumiu"], cena_cobrar: ["cobrar_adiei"], cena_semanas: ["semanas_segunda"] });
  const notas = R.pontuarPadroes(r, bib);
  assert.ok(Object.values(notas).every((n) => n.s < 0.34));
  assert.equal(R.sugerir(notas, null, bib).dominante, null);
});

test("custo que não é sinal conhecido ou 'nenhuma' não conta", () => {
  assert.equal(R.pontuarPadroes(base({ custo: "nenhuma" }), bib)["freio-na-cobranca"].c, 0);
  assert.equal(R.pontuarPadroes(base({ custo: "qualquer_coisa" }), bib)["freio-na-cobranca"].c, 0);
  assert.equal(R.pontuarPadroes(base({ custo: null }), bib)["freio-na-cobranca"].c, 0);
});

test("os empates são estáveis e a afinidade com a família desempata antes da ordem fixa", () => {
  const r = base({
    cena_extra: ["extra_sumiu", "extra_mereco"],
    cena_semanas: ["semanas_tirei", "semanas_segunda", "semanas_largando", "semanas_trocou"],
  });
  const notas = R.pontuarPadroes(r, bib);
  assert.equal(notas["ganho-que-escorre"].s, 0.75);
  assert.equal(notas["progresso-sem-trilho"].s, 0.75);
  assert.deepEqual(R.sugerir(notas, null, bib).candidatos, ["ganho-que-escorre", "progresso-sem-trilho"]);
  assert.deepEqual(R.sugerir(notas, null, bib).candidatos, R.sugerir(notas, null, bib).candidatos);
  assert.deepEqual(R.sugerir(notas, "vigilancia", bib).candidatos, ["progresso-sem-trilho", "ganho-que-escorre"]);
  assert.deepEqual(R.sugerir(notas, "idolatrar", bib).candidatos, ["ganho-que-escorre", "progresso-sem-trilho"]);
});

test("as marcas de cada padrão para o espelho vêm com o texto da opção", () => {
  const m = R.marcasDoPadrao(casoA, "freio-na-cobranca", bib);
  assert.deepEqual(m.map((x) => x.value), ["cobrar_adiei", "cobrar_desconto", "cobrar_desculpa"]);
  assert.ok(m.every((x) => x.label));
  assert.deepEqual(R.marcasDoPadrao(casoA, "ganho-que-escorre", bib), []);
});

test("valores que a cena não oferece são ignorados", () => {
  const notas = R.pontuarPadroes(base({ cena_cobrar: ["extra_sumiu", "cobrar_adiei"] }), bib);
  assert.equal(notas["ganho-que-escorre"].n, 0);
  assert.equal(notas["freio-na-cobranca"].n, 1);
});

// ---- variante -------------------------------------------------------------------------------------

test("a variante sugerida pelas marcas: a maior contagem; empate, zero ou padrão sem variante dão null", () => {
  const emocao = base({ cena_emocao: ["emocao_agora", "emocao_arrependi"], cena_risco: ["risco_tudo"] });
  assert.equal(R.sugerirVariante("decisao-no-calor", emocao, bib), "emocao-do-momento");
  const virar = base({ cena_emocao: ["emocao_recuperar"], cena_risco: ["risco_tudo"], cena_extra: ["extra_jogada"] });
  assert.equal(R.sugerirVariante("decisao-no-calor", virar, bib), "virar-o-jogo");
  const empate = base({ cena_emocao: ["emocao_agora"], cena_risco: ["risco_tudo"] });
  assert.equal(R.sugerirVariante("decisao-no-calor", empate, bib), null);
  assert.equal(R.sugerirVariante("decisao-no-calor", base(), bib), null);
  assert.equal(R.sugerirVariante("freio-na-cobranca", casoA, bib), null);
  assert.equal(R.sugerirVariante("passo-que-nao-sai", base({ cena_risco: ["risco_e_se"], cena_emocao: ["emocao_travei"] }), bib), "medo-de-errar");
});

test("a variante respondida vale mais que a sugerida, se for do padrão", () => {
  const r = base({ cena_risco: ["risco_e_se"], variante: "nao-estou-pronto" });
  assert.equal(R.varianteFinal("passo-que-nao-sai", r, bib), "nao-estou-pronto");
  assert.equal(R.varianteFinal("passo-que-nao-sai", { ...r, variante: "virar-o-jogo" }, bib), "medo-de-errar");
  assert.equal(R.varianteFinal("freio-na-cobranca", r, bib), null);
});

// ---- famílias ---------------------------------------------------------------------------------------

test("tríade com mais igual a menos, ou com item de outra tríade, é ignorada", () => {
  const r = {
    triade_1: { mais: "evitar_1", menos: "evitar_1" },
    triade_2: { mais: "evitar_1", menos: "status_1" },
    triade_3: { mais: "status_3", menos: "lealdade_1" },
  };
  const f = R.pontuarFamilias(r, bib);
  assert.equal(f.modo, "triade");
  assert.deepEqual(Object.keys(f.nivel).sort(), ["lealdade_1", "status_3", "vigilancia_3"].sort());
  assert.equal(f.aparicoes.evitar, 0);
  assert.equal(f.norm.evitar, null);
  assert.equal(f.norm.status, 1);
  assert.equal(f.norm.lealdade, -1);
  assert.equal(f.norm.vigilancia, 0);
});

test("a família forte exige nota no limiar e estar sozinha no topo", () => {
  const f = R.pontuarFamilias(casoA, bib);
  assert.equal(R.familiaForte(f, bib), "evitar");
  assert.equal(R.familiaForte(f.norm, bib), "evitar");
  assert.equal(R.familiaForte({ evitar: 0.33, idolatrar: 0, status: -0.3, vigilancia: 0, lealdade: 0 }, bib), null);
  assert.equal(R.familiaForte({ evitar: 0.67, idolatrar: 0.67, status: 0, vigilancia: 0, lealdade: 0 }, bib), null);
  assert.equal(R.familiaForte({ evitar: null, idolatrar: null, status: null, vigilancia: null, lealdade: null }, bib), null);
  assert.equal(R.familiaForte({ evitar: 0.5, idolatrar: 0, status: 0, vigilancia: 0, lealdade: 0 }, bib), "evitar");
});

test("as famílias fracas: até duas, no limiar ou abaixo, empate pela ordem fixa", () => {
  const n = { evitar: -0.67, idolatrar: -0.67, status: -0.67, vigilancia: 0, lealdade: null };
  assert.deepEqual(R.familiasFracas(n, bib), ["evitar", "idolatrar"]);
  assert.deepEqual(R.familiasFracas({ evitar: -0.5, idolatrar: -0.33, status: 0, vigilancia: 0, lealdade: 0.3 }, bib), ["evitar"]);
  assert.deepEqual(R.familiasFracas({ evitar: 0, idolatrar: 0, status: 0, vigilancia: 0, lealdade: 0 }, bib), []);
});

test("modo grade: média dos níveis, limiares próprios e o item de menor nível no descarte", () => {
  const grade = {};
  Object.keys(bib.itens).forEach((i) => { grade[i] = 1; });
  grade.evitar_1 = 3;
  grade.evitar_2 = 3;
  grade.evitar_3 = 2;
  grade.lealdade_1 = 0;
  grade.lealdade_2 = 0;
  grade.lealdade_3 = 1;
  const f = R.pontuarFamilias({ grade_crencas: grade }, bib);
  assert.equal(f.modo, "grade");
  assert.ok(Math.abs(f.norm.evitar - 8 / 3) < 1e-9);
  assert.equal(R.familiaForte(f, bib), "evitar");
  assert.equal(R.familiaForte({ evitar: 1.9, idolatrar: 1, status: 1, vigilancia: 1, lealdade: 1 }, bib, "grade"), null);
  assert.deepEqual(R.familiasFracas(f, bib), ["lealdade"]);
  const n = R.naoIndica(R.pontuarPadroes(base(), bib), base(), f, bib);
  assert.equal(n.familias[0].familia, "lealdade");
  assert.equal(n.familias[0].item, "lealdade_1");
});

// ---- trilha, vazamento e áreas -------------------------------------------------------------------------

function notasSinteticas(valores) {
  const notas = {};
  R.PADROES.forEach((p) => { notas[p] = { n: 0, f: 0, c: 0, s: valores[p] || 0 }; });
  return notas;
}

test("o vazamento só vem do outro eixo, e só a partir do limiar", () => {
  const notas = notasSinteticas({ "ganho-que-escorre": 1.75, "decisao-no-calor": 1.2, "freio-na-cobranca": 0.49 });
  const a = R.trilhaEVazamento("ganho-que-escorre", notas, bib);
  assert.equal(a.trilha, "retencao");
  assert.equal(a.vazamento, null);
  assert.equal(a.trilhasPerto, false);
  notas["freio-na-cobranca"].s = 0.5;
  assert.equal(R.trilhaEVazamento("ganho-que-escorre", notas, bib).vazamento, "freio-na-cobranca");
  notas["passo-que-nao-sai"].s = 0.9;
  assert.equal(R.trilhaEVazamento("ganho-que-escorre", notas, bib).vazamento, "passo-que-nao-sai");
  const b = R.trilhaEVazamento("freio-na-cobranca", notas, bib);
  assert.equal(b.trilha, "ganho");
  assert.equal(b.vazamento, "ganho-que-escorre");
});

test("empate no vazamento: a ordem fixa; as trilhas ficam perto dentro do delta", () => {
  const notas = notasSinteticas({ "freio-na-cobranca": 0.9, "decisao-no-calor": 0.9, "caixa-da-familia": 0.9 });
  assert.equal(R.trilhaEVazamento("freio-na-cobranca", notas, bib).vazamento, "decisao-no-calor");
  const perto = notasSinteticas({ "freio-na-cobranca": 0.9, "caixa-da-familia": 0.7 });
  assert.equal(R.trilhaEVazamento("freio-na-cobranca", perto, bib).trilhasPerto, true);
  const longe = notasSinteticas({ "freio-na-cobranca": 0.9, "caixa-da-familia": 0.6 });
  assert.equal(R.trilhaEVazamento("freio-na-cobranca", longe, bib).trilhasPerto, false);
  const baixa = notasSinteticas({ "freio-na-cobranca": 0.3, "caixa-da-familia": 0.3 });
  assert.equal(R.trilhaEVazamento("freio-na-cobranca", baixa, bib).trilhasPerto, false);
});

test("as áreas do Raio-X: faixas 3, 2, 1 e 0 pela maior nota da área", () => {
  const notas = notasSinteticas({ "freio-na-cobranca": 1.75, "ganho-que-escorre": 0.5, "passo-que-nao-sai": 0.2, "caixa-da-familia": 0.34 });
  assert.deepEqual(R.areasDoRaioX(notas, bib), { ganhar: 3, guardar: 2, decidir: 1, dar: 2 });
  assert.deepEqual(R.areasDoRaioX(notasSinteticas({}), bib), { ganhar: 0, guardar: 0, decidir: 0, dar: 0 });
  assert.equal(R.areasDoRaioX(notasSinteticas({ "freio-na-cobranca": 1 }), bib).ganhar, 3);
});

// ---- o que não indica ---------------------------------------------------------------------------------

test("o que não indica nunca lista padrão com marca nem sem evidência", () => {
  const sem = base({ cena_extra: [], cena_cobrar: [], cena_risco: [], cena_emocao: [], cena_plano: [], cena_semanas: [], cena_circulo: [], cena_pedido: [] });
  const f = R.pontuarFamilias({}, bib);
  assert.deepEqual(R.naoIndica(R.pontuarPadroes(sem, bib), sem, f, bib), { padroes: [], familias: [] });
  [casoA, casoB, casoC, casoE].forEach((r) => {
    const notas = R.pontuarPadroes(r, bib);
    const n = R.naoIndica(notas, r, R.pontuarFamilias(r, bib), bib);
    n.padroes.forEach((p) => {
      assert.equal(notas[p.padrao].s, 0);
      assert.equal(notas[p.padrao].n, 0);
      assert.ok(p.resposta);
    });
    assert.ok(n.padroes.length <= 2 && n.familias.length <= 2);
  });
});

test("o que não indica prefere a opção contra à cena que não acontece, e depois a ordem fixa", () => {
  const r = base({ cena_pedido: ["pedido_limite"], cena_semanas: ["semanas_mantive"] });
  const n = R.naoIndica(R.pontuarPadroes(r, bib), r, R.pontuarFamilias({}, bib), bib);
  assert.deepEqual(n.padroes.map((p) => [p.padrao, p.evidencia]), [
    ["progresso-sem-trilho", "contra"], ["caixa-da-familia", "contra"],
  ]);
});

test("a família descartada leva o item que ela marcou como menos; sem item marcado, não entra", () => {
  const r = { ...casoB };
  const f = R.pontuarFamilias(r, bib);
  const n = R.naoIndica(R.pontuarPadroes(r, bib), r, f, bib);
  assert.deepEqual(n.familias.map((x) => x.familia), ["evitar", "idolatrar"]);
  assert.equal(n.familias[0].item, "evitar_1");
  assert.equal(n.familias[0].resposta, bib.itens.evitar_1.texto);
  const fraca = { norm: { evitar: -1, idolatrar: 0, status: 0, vigilancia: 0, lealdade: 0 }, modo: "triade", nivel: {} };
  assert.deepEqual(R.naoIndica(R.pontuarPadroes(base(), bib), base(), fraca, bib).familias, []);
});

// ---- degraus e trava -----------------------------------------------------------------------------------

test("a escada desce nas quatro condições, e só nelas", () => {
  const c = R.calcular(casoA, bib);
  const normal = R.escolherDegraus("freio-na-cobranca", null, casoA, c.cuidado, bib);
  assert.equal(normal.menor, false);
  const casos = [
    ["confianca", { confianca: 5 }, c.cuidado],
    ["terreno", { terreno: ["estresse", "mes_apertado"] }, c.cuidado],
    ["desconforto", { desconforto: "nao" }, c.cuidado],
    ["humor", {}, { ramo: null, avisoHumor: true, degrauAbaixo: true }],
  ];
  casos.forEach(([motivo, extra, cuidado]) => {
    const d = R.escolherDegraus("freio-na-cobranca", null, { ...casoA, ...extra }, cuidado, bib);
    assert.equal(d.menor, true, motivo);
    assert.deepEqual(d.motivos, [motivo]);
    assert.equal(d.dia3.degrau, 0, motivo);
    assert.match(d.dia3.texto, /preço justo do seu trabalho num papel/);
    assert.equal(d.dia5.degrau, 1);
    assert.match(d.dia5.texto, /em voz alta/);
    assert.equal(d.noventa.degrau, 2);
  });
  [{ confianca: 6 }, { terreno: ["estresse"] }, { terreno: ["mes_apertado", "cansaco"] }, { desconforto: "em_parte" }].forEach((extra) => {
    assert.equal(R.escolherDegraus("freio-na-cobranca", null, { ...casoA, ...extra }, c.cuidado, bib).menor, false, JSON.stringify(extra));
  });
});

test("a escada usa a variante: padrões 3 e 4 têm degraus diferentes por variante", () => {
  const cuidado = { ramo: null, avisoHumor: false, degrauAbaixo: false };
  const medo = R.escolherDegraus("passo-que-nao-sai", "medo-de-errar", { experimento: "pior_caso_plano_b" }, cuidado, bib);
  const pronto = R.escolherDegraus("passo-que-nao-sai", "nao-estou-pronto", { experimento: "menor_acao" }, cuidado, bib);
  assert.match(medo.dia3.texto, /pior caso real e o plano B/);
  assert.match(pronto.dia3.texto, /menor ação de 5 minutos/);
  const virar = R.escolherDegraus("decisao-no-calor", "virar-o-jogo", {}, cuidado, bib);
  assert.match(virar.dia3.texto, /escrever o chão/);
  assert.match(R.escolherDegraus("decisao-no-calor", "emocao-do-momento", {}, cuidado, bib).dia5.texto, /24 horas/);
});

test("o experimento escrito por ela entra no lugar do degrau 1", () => {
  const cuidado = { ramo: null, avisoHumor: false, degrauAbaixo: false };
  const r = { experimento: "outro", experimento_texto: "  pedir o valor cheio ao próximo cliente  " };
  assert.equal(R.escolherDegraus("freio-na-cobranca", null, r, cuidado, bib).dia3.texto, "pedir o valor cheio ao próximo cliente");
  const menor = R.escolherDegraus("freio-na-cobranca", null, { ...r, confianca: 2 }, cuidado, bib);
  assert.equal(menor.dia5.texto, "pedir o valor cheio ao próximo cliente");
});

test("a trava: renda só muda os padrões 1 e 5; ganho leva o campo opcional; retenção não", () => {
  ["fixa", "variavel", "mista"].forEach((renda) => {
    assert.equal(R.travaImediata("ganho-que-escorre", null, renda, bib).texto, bib.padroes["ganho-que-escorre"].trava.por_renda[renda]);
    assert.equal(R.travaImediata("progresso-sem-trilho", null, renda, bib).texto, bib.padroes["progresso-sem-trilho"].trava.por_renda[renda]);
  });
  assert.equal(R.travaImediata("ganho-que-escorre", null, "fixa", bib).texto === R.travaImediata("ganho-que-escorre", null, "variavel", bib).texto, false);
  assert.equal(R.travaImediata("ganho-que-escorre", null, "desconhecida", bib).texto, bib.padroes["ganho-que-escorre"].trava.texto);
  assert.equal(R.travaImediata("ganho-que-escorre", null, undefined, bib).texto, bib.padroes["ganho-que-escorre"].trava.texto);
  assert.equal(R.travaImediata("caixa-da-familia", null, "fixa", bib).texto, bib.padroes["caixa-da-familia"].trava.texto);
  assert.equal(R.travaImediata("decisao-no-calor", "virar-o-jogo", null, bib).campo, null);
  ["freio-na-cobranca", "passo-que-nao-sai", "dinheiro-nao-combina"].forEach((p) => {
    const t = R.travaImediata(p, null, null, bib);
    assert.equal(t.trilha, "ganho");
    assert.equal(t.campo.opcional, true);
  });
});

// ---- planos e sinais ------------------------------------------------------------------------------------

test("os planos: o dia n cai em dia 0 + n, e as datas de 7 e de 90 dias estão certas", () => {
  const d = R.escolherDegraus("freio-na-cobranca", null, casoA, { degrauAbaixo: false }, bib);
  const p = R.montarPlanos(DIA0, d, casoA, bib);
  assert.deepEqual(p.datas, { d0: "2026-11-20", d7: "2026-11-27", d30: "2026-12-20", d60: "2027-01-19", d90: "2027-02-18" });
  assert.equal(p.arco7.length, 7);
  p.arco7.forEach((x, i) => {
    assert.equal(x.dia, i + 1);
    assert.equal(x.data, kit.somarDias(DIA0, i + 1));
  });
  assert.equal(p.arco7[2].titulo, "Dia 3 · 23/11");
  assert.equal(p.arco7[6].data, p.datas.d7);
  assert.equal(p.noventa.revisoes.map((r) => r.data).join(","), "2026-12-20,2027-01-19,2027-02-18");
  assert.equal(p.noventa.revisoes[2].titulo, "Dia 90 · 18/02");
  assert.equal(p.noventa.etapas[1].ate, p.datas.d90);
});

test("os planos viram o mês e o ano, inclusive em ano bissexto", () => {
  const d = R.escolherDegraus("freio-na-cobranca", null, casoA, { degrauAbaixo: false }, bib);
  const p = R.montarPlanos("2027-12-28", d, casoA, bib);
  assert.equal(p.datas.d7, "2028-01-04");
  assert.equal(p.datas.d30, "2028-01-27");
  assert.equal(p.datas.d60, "2028-02-26");
  assert.equal(p.datas.d90, "2028-03-27");
  assert.equal(p.arco7[3].titulo, "Dia 4 · 01/01");
  assert.equal(R.montarPlanos("2028-02-27", d, casoA, bib).arco7[1].data, "2028-02-29");
  assert.equal(R.montarPlanos("2026-02-30", d, casoA, bib), null);
  assert.equal(R.montarPlanos(DIA0, null, casoA, bib), null);
});

test("os planos usam os degraus: dia 3 e dia 5 com o texto do degrau, rótulo pelo degrau", () => {
  const normal = R.montarPlanos(DIA0, R.escolherDegraus("freio-na-cobranca", null, casoA, { degrauAbaixo: false }, bib), casoA, bib);
  assert.match(normal.arco7[2].texto, /^Dizer o preço justo em voz alta/);
  assert.equal(normal.arco7[2].rotulo, "Experimento 1");
  assert.equal(normal.arco7[4].rotulo, "Experimento 2");
  const menor = R.montarPlanos(DIA0, R.escolherDegraus("ganho-que-escorre", null, casoB, { degrauAbaixo: false }, bib), casoB, bib);
  assert.match(menor.arco7[2].texto, /^Olhar o extrato/);
  assert.equal(menor.arco7[2].rotulo, "Passo pequeno");
  assert.equal(menor.arco7[4].rotulo, "Experimento 1");
  assert.match(menor.noventa.foco, /espera de 72 horas/);
  [normal, menor].forEach((p) => p.arco7.forEach((x) => assert.ok(!/[{}]/.test(x.texto), x.texto)));
});

test("o dia 1 ganha o passo de olhar saldo e fatura só com evitar ou vigilância altos", () => {
  const dA = R.escolherDegraus("freio-na-cobranca", null, casoA, { degrauAbaixo: false }, bib);
  const dB = R.escolherDegraus("ganho-que-escorre", null, casoB, { degrauAbaixo: false }, bib);
  const dC = R.escolherDegraus("passo-que-nao-sai", "nao-estou-pronto", casoC, { degrauAbaixo: false }, bib);
  assert.match(R.montarPlanos(DIA0, dA, casoA, bib).arco7[0].texto, /5 minutos para olhar saldo e fatura/);
  assert.match(R.montarPlanos(DIA0, dC, casoC, bib).arco7[0].texto, /5 minutos para olhar saldo e fatura/);
  assert.doesNotMatch(R.montarPlanos(DIA0, dB, casoB, bib).arco7[0].texto, /saldo e fatura/);
});

test("o cartão dos sinais junta os sinais gerais do padrão e os dela, sem o 'nada' do terreno", () => {
  const r = { ...casoA, sinais: ["aperto_peito", "outro"], sinais_outro: "boca seca", frase: "  vão achar caro ", terreno: ["cansaco", "mes_apertado"] };
  const s = R.montarSinais("freio-na-cobranca", r, bib);
  assert.equal(s.nome, "O freio na hora de cobrar");
  assert.ok(s.gerais.length >= 3);
  assert.ok(s.gerais.includes("adiou de novo cobrar, pedir ou mandar o preço"));
  assert.deepEqual(s.dela.sinais, ["Um aperto no peito ou na garganta", "boca seca"]);
  assert.equal(s.dela.frase, "vão achar caro");
  assert.deepEqual(s.dela.terreno, ["Cansaço", "Mês apertado"]);
  assert.ok(s.regras.na_hora && s.regras.quando_voltar);
  assert.deepEqual(R.montarSinais("freio-na-cobranca", { terreno: ["nada"] }, bib).dela.terreno, []);
});

// ---- registro ------------------------------------------------------------------------------------------

test("o registro do caso A valida no esquema, decodifica igual e não tem campo de cuidado", () => {
  const reg = R.montarRegistro(casoA, undefined, DIA0, 1, bib);
  assert.equal(reg.ok, true, JSON.stringify(reg));
  assert.ok(reg.codigo.length <= 2048);
  assert.equal(reg.cortado, false);
  assert.equal(kit.validarEsquema(reg.objeto, R.esquemaDoRegistro).ok, true);
  const volta = kit.decodificarRegistro(reg.codigo);
  assert.equal(volta.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(volta.objeto)), reg.objeto);
  const o = reg.objeto;
  assert.equal(o.v, 1);
  assert.equal(o.tipo, "padrao");
  assert.equal(o.produto, "teto-financeiro");
  assert.equal(o.origem, "gratis");
  assert.equal(o.bib, "2026.11-1");
  assert.equal(o.volta, 1);
  assert.equal(o.ato, 2);
  assert.equal(o.padrao, "freio-na-cobranca");
  assert.equal(o.variante, null);
  assert.equal(o.trilha, "ganho");
  assert.equal(o.trilhas_perto, false);
  assert.equal(o.vazamento, null);
  assert.equal(o.familia, "evitar");
  assert.equal(o.modo_crenca, "triade");
  assert.deepEqual(o.notas["freio-na-cobranca"], { f: 0.75, c: 1 });
  assert.deepEqual(Object.keys(o.notas).sort(), R.PADROES.slice().sort());
  assert.equal(o.itens.evitar_1, 1);
  assert.equal(o.itens.status_2, -1);
  assert.equal(o.itens.lealdade_1, 1);
  assert.equal(Object.keys(o.itens).length, 15);
  assert.deepEqual(o.familias, { evitar: 0.67, idolatrar: -0.33, status: -0.67, vigilancia: 0, lealdade: 0.33 });
  assert.deepEqual(o.areas, { ganhar: 3, guardar: 0, decidir: 0, dar: 0 });
  assert.equal(o.regra_trabalho, casoA.regra_trabalho);
  assert.equal(o.se_entao, casoA.se_entao);
  assert.equal(o.previsao, casoA.previsao);
  assert.deepEqual(o.datas, { d0: "2026-11-20", d7: "2026-11-27", d30: "2026-12-20", d60: "2027-01-19", d90: "2027-02-18" });
  const chaves = Object.keys(o).join(" ");
  ["chao", "humor", "risco", "cuidado", "clima", "sinais", "ajuda", "relatorio"].forEach((k) => assert.ok(!chaves.includes(k), k));
  assert.ok(!/relatorio/i.test(JSON.stringify(o)));
});

test("o registro do caso B leva o vazamento e o do caso C leva a variante; só as marcas do Ato 1 não levam texto", () => {
  const b = R.montarRegistro(casoB, undefined, DIA0, 2, bib);
  assert.equal(b.ok, true, JSON.stringify(b));
  assert.equal(b.objeto.vazamento, "freio-na-cobranca");
  assert.equal(b.objeto.familia, "status");
  assert.equal(b.objeto.volta, 2);
  assert.equal(b.objeto.ato, 1);
  assert.ok(!("regra_trabalho" in b.objeto) && !("se_entao" in b.objeto) && !("previsao" in b.objeto));
  const c = R.montarRegistro(casoC, undefined, DIA0, 1, bib);
  assert.equal(c.ok, true, JSON.stringify(c));
  assert.equal(c.objeto.variante, "nao-estou-pronto");
  assert.equal(c.objeto.familia, "vigilancia");
  const ato2 = R.montarRegistro({ ...casoB, regra_trabalho: "x" }, undefined, DIA0, 1, bib);
  assert.equal(ato2.objeto.ato, 2);
});

test("o registro recusa o ramo de cuidado, o 'nenhum', data inválida e esquema furado", () => {
  assert.equal(R.montarRegistro(casoD, undefined, DIA0, 1, bib).erro, "cuidado");
  assert.equal(R.montarRegistro(casoF, undefined, DIA0, 1, bib).erro, "cuidado");
  assert.equal(R.montarRegistro(casoE, undefined, DIA0, 1, bib).erro, "sem_padrao");
  assert.equal(R.montarRegistro(casoA, undefined, "20/11/2026", 1, bib).erro, "data");
  const semTriades = { ...casoA };
  for (let i = 1; i <= 5; i += 1) delete semTriades[`triade_${i}`];
  const furado = R.montarRegistro(semTriades, undefined, DIA0, 1, bib);
  assert.equal(furado.ok, false);
  assert.equal(furado.erro, "esquema");
  assert.equal(R.montarRegistro(casoA, undefined, DIA0, 0, bib).erro, "esquema");
  const comCuidado = R.calcular(casoA, bib);
  comCuidado.cuidado = { ramo: "chao", avisoHumor: false, degrauAbaixo: false };
  assert.equal(R.montarRegistro(casoA, comCuidado, DIA0, 1, bib).erro, "cuidado");
});

test("o esquema não aceita chave de cuidado nem valor fora do formato", () => {
  const ok = R.montarRegistro(casoA, undefined, DIA0, 1, bib).objeto;
  const com = (mudanca) => kit.validarEsquema({ ...clone(ok), ...mudanca }, R.esquemaDoRegistro).ok;
  assert.equal(com({}), true);
  assert.equal(com({ chao: { contas: "fecham" } }), false);
  assert.equal(com({ humor: { interesse: 0 } }), false);
  assert.equal(com({ sinais_risco: [] }), false);
  assert.equal(com({ padrao: "nenhum" }), false);
  assert.equal(com({ ato: 3 }), false);
  assert.equal(com({ datas: { d0: DIA0 } }), false);
  assert.equal(com({ previsao: "x".repeat(141) }), false);
  assert.equal(com({ regra_trabalho: "x".repeat(161) }), false);
  assert.equal(com({ se_entao: "x".repeat(201) }), false);
});

test("o registro no pior caso (textos no limite, só emoji de 4 bytes) cabe em 2048 e ainda decodifica", () => {
  const emoji = "\u{1F4B8}";
  const r = { ...casoA, regra_trabalho: emoji.repeat(300), se_entao: emoji.repeat(300), previsao: emoji.repeat(300) };
  const reg = R.montarRegistro(r, undefined, DIA0, 99, bib);
  assert.equal(reg.ok, true, JSON.stringify(reg));
  assert.equal(reg.cortado, true);
  assert.ok(reg.codigo.length <= 2048);
  const lido = kit.decodificarRegistro(reg.codigo);
  assert.equal(lido.ok, true);
  assert.equal(lido.objeto.padrao, "freio-na-cobranca");
  assert.deepEqual(clone(lido.objeto.notas), clone(reg.objeto.notas));
  assert.equal(kit.validarEsquema(lido.objeto, R.esquemaDoRegistro).ok, true);
});

test("o registro em modo grade guarda os níveis de 0 a 3 e recusa nível de tríade", () => {
  const grade = {};
  Object.keys(bib.itens).forEach((i) => { grade[i] = 1; });
  grade.evitar_1 = 3;
  const r = { ...casoA, grade_crencas: grade };
  for (let i = 1; i <= 5; i += 1) delete r[`triade_${i}`];
  const reg = R.montarRegistro(r, undefined, DIA0, 1, bib);
  assert.equal(reg.ok, true, JSON.stringify(reg));
  assert.equal(reg.objeto.modo_crenca, "grade");
  assert.equal(reg.objeto.itens.evitar_1, 3);
  assert.equal(reg.objeto.itens.status_1, 1);
});

// ---- nada proibido nas saídas dos casos ----------------------------------------------------------------

test("nenhum caso gera texto proibido nas saídas das regras", () => {
  [["freio-na-cobranca", null, casoA], ["ganho-que-escorre", null, casoB], ["passo-que-nao-sai", "nao-estou-pronto", casoC]].forEach(([p, v, r]) => {
    const c = R.calcular(r, bib);
    const d = R.escolherDegraus(p, v, r, c.cuidado, bib);
    semProibidas([
      d, R.travaImediata(p, v, r.renda, bib), R.montarPlanos(DIA0, d, r, bib), R.montarSinais(p, r, bib),
      R.naoIndica(c.notas, r, c.familias, bib), R.montarRegistro(r, c, DIA0, 1, bib).objeto,
    ]);
  });
});

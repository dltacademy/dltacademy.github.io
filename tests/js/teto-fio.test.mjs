// O que a pessoa leva ao fim do Ato 2, nas regras puras (sem DOM): o fio só com o texto dela, os
// blocos do .md, o resultado completo, os lembretes e os cartões. Os testes conferem estrutura e
// decisões, não a prosa.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { ATO2, CASOS } from "./teto-casos.mjs";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");
const bib = require("../../js/biblioteca-teto.js");
const R = require("../../protocolos/teto-financeiro/js/teto-regras.js");

const PAGINA = "https://dlt.academy/protocolos/teto-financeiro/";
const CTX = { hoje: "2026-11-20", ciclo: "abcd1234", pagina: PAGINA, lembrete: null, volta: null, historico: [] };
const clone = (v) => JSON.parse(JSON.stringify(v));
const caso = (letra, extra = {}) => Object.assign(clone(CASOS[letra]), clone(ATO2[letra] || {}), extra);

const PROIBIDAS = [/terapi/i, /psicoterapi/i, /tratamento/i, /\blaudo/i, /diagn[óo]stico psicol/i, /teste psicol/i, /reprograma[çc]/i];
function textos(valor, saida = []) {
  if (typeof valor === "string") saida.push(valor);
  else if (Array.isArray(valor)) valor.forEach((v) => textos(v, saida));
  else if (valor && typeof valor === "object") Object.values(valor).forEach((v) => textos(v, saida));
  return saida;
}
function semProibidas(juntos, onde) {
  PROIBIDAS.forEach((re) => assert.ok(!re.test(juntos), `${re} em ${onde}`));
  assert.ok(!/diagn[óo]stic/i.test(juntos.replace(/não é diagnóstico/gi, "")), `"diagnóstico" fora de "não é diagnóstico" em ${onde}`);
}

// ---- o fio ------------------------------------------------------------------------------------

// O que sobra de um parágrafo do fio sem o texto dela e sem os pedaços fixos da biblioteca.
function sobra(paragrafo, bloco, lacunas) {
  const modelo = bib.textos.fio.blocos.find((b) => b.id === bloco.id);
  let resto = paragrafo;
  Object.values(lacunas)
    .map((v) => kit.semPontoFinal(String(v)))
    .sort((a, b) => b.length - a.length)
    .forEach((v) => { resto = resto.split(v).join(""); });
  const fixos = [];
  modelo.segmentos.forEach((s) => s.split(/\{[A-Za-z0-9_]+(?::[a-z,]+)?\}/).forEach((p) => fixos.push(p)));
  modelo.fechos.forEach((f) => fixos.push(f.texto));
  fixos.sort((a, b) => b.length - a.length).forEach((p) => { if (p.trim()) resto = resto.split(p.trim()).join(""); });
  return resto.replace(/[\s“”.,:;]/g, "");
}

for (const letra of ["A", "B", "C"]) {
  test(`fio do caso ${letra}: só o texto dela e os conectores fixos, cinco blocos na ordem`, () => {
    const r = caso(letra);
    const fio = R.montarFio(r, bib);
    assert.deepEqual(fio.map((b) => b.id), ["como", "para_que", "funciona", "aposta", "motivos"]);
    fio.forEach((b) => {
      assert.equal(b.paragrafos.length, 1);
      assert.equal(sobra(b.paragrafos[0], b, b.lacunas), "", `o bloco ${b.id} tem texto que não é dela nem fixo: ${b.paragrafos[0]}`);
      assert.ok(!/undefined|null|\{|\}|“”/.test(b.paragrafos[0]), b.paragrafos[0]);
    });
  });
}

test("fio: cada lacuna é uma resposta dela", () => {
  const r = caso("A");
  const lacunas = Object.assign({}, ...R.montarFio(r, bib).map((b) => b.lacunas));
  assert.equal(lacunas.cena, r.cena);
  assert.equal(lacunas.frase, r.frase);
  assert.equal(lacunas.ponto, r.ponto_escolha);
  assert.equal(lacunas.custo, r.custo_depois);
  assert.equal(lacunas.excecao, r.excecao);
  assert.equal(lacunas.previsao, r.previsao);
  assert.equal(lacunas.crenca, r.crenca_previsao);
  assert.equal(lacunas.regra_trabalho, r.regra_trabalho);
  assert.equal(lacunas.importancia, r.importancia);
  assert.equal(lacunas.motivos, r.motivos);
  assert.equal(lacunas.dia_um_ano, r.dia_um_ano);
  assert.equal(lacunas.regra, r.frase, "a regra antiga escolhida foi a frase da última vez");
  // O que vem de uma escolha é o rótulo da opção que ela marcou, na ordem em que marcou.
  assert.equal(lacunas.terreno, "cansaço e mês apertado");
  assert.equal(lacunas.alivio, "o medo de ouvir um não");
  assert.equal(lacunas.para_que, "ser cobrado ou testado");
  assert.equal(lacunas.clima, "era segredo, não se falava");
});

test("fio: a regra antiga vem da escolha dela (a frase, o item mais alto ou o que escreveu)", () => {
  assert.equal(R.regraAntiga(caso("A"), bib), CASOS.A && ATO2.A.frase);
  const c = caso("C");
  assert.equal(R.regraAntiga(c, bib), R.itensDasFrases(c, bib)[0].label);
  assert.equal(R.regraAntiga(caso("B"), bib), ATO2.B.regra_antiga_texto);
  assert.equal(R.regraAntiga(caso("B", { regra_antiga_texto: "   " }), bib), ATO2.B.frase, "escolheu escrever e não escreveu: cai na frase");
  assert.equal(R.regraAntiga(caso("A", { regra_antiga: undefined }), bib), "");
});

test("fio: segmento com lacuna vazia sai inteiro, e o fecho some junto", () => {
  const r = caso("A", { cena: "", excecao: "", motivos: "   ", previsao: "", clima_casa: "outro", clima_texto: "", alivio: "nada" });
  const fio = R.montarFio(r, bib);
  const ids = fio.map((b) => b.id);
  assert.ok(!ids.includes("funciona"), "sem a exceção, o bloco inteiro não existe");
  const todo = fio.map((b) => b.paragrafos[0]).join("\n");
  assert.ok(!todo.includes("Na última vez"), "sem a cena, o segmento da cena sai");
  assert.ok(!todo.includes("O seu plano começa daí"));
  assert.ok(!todo.includes("A regra antiga prevê"), "sem a previsão, nada dela nem a crença");
  assert.ok(!todo.includes("acredita nisso"));
  assert.ok(!todo.includes("Os experimentos dos dias 3 e 5"), "o fecho precisa da previsão e da regra de trabalho");
  assert.ok(!todo.includes("Nas suas palavras, por quê"));
  assert.ok(!todo.includes("te tirou"), "alívio 'nada que eu perceba' não vira frase");
  assert.ok(!todo.includes("Faz sentido"), "sem o clima, o segmento sai");
  assert.ok(todo.includes("A regra “vão achar caro”"), "o que ela escreveu continua");
  assert.ok(!/undefined|null|\{|\}|“”/.test(todo));
});

test("fio: sem nenhuma resposta do Ato 2, nenhum bloco (nada genérico)", () => {
  assert.deepEqual(R.montarFio(clone(CASOS.A), bib), []);
  assert.deepEqual(R.montarFio({}, bib), []);
});

test("fio: a crença na previsão só aparece com a previsão", () => {
  const sem = R.montarFio(caso("A", { previsao: "" }), bib).map((b) => b.paragrafos[0]).join(" ");
  assert.ok(!/80%/.test(sem));
  const com = R.montarFio(caso("A"), bib).map((b) => b.paragrafos[0]).join(" ");
  assert.ok(/80%/.test(com));
  assert.ok(/em 0%/.test(R.montarFio(caso("A", { crenca_previsao: 0 }), bib).map((b) => b.paragrafos[0]).join(" ")), "zero vale");
});

test("o rascunho do se, então: o sinal, o ponto de escolha e a exceção dela; sem a exceção, o exemplo do padrão", () => {
  const a = caso("A");
  const rascunho = R.rascunhoSeEntao(a, bib);
  assert.ok(rascunho.startsWith("Quando eu notar um aperto no peito ou na garganta"));
  assert.ok(rascunho.includes(a.ponto_escolha));
  assert.ok(rascunho.includes(a.excecao));
  assert.ok(!/undefined|\{|\}/.test(rascunho));
  const semExcecao = R.rascunhoSeEntao(caso("A", { excecao: "" }), bib);
  assert.equal(semExcecao, "Quando sentir o aperto, mando o valor cheio antes de reler");
  assert.ok(R.rascunhoSeEntao(caso("C", { excecao: "" }), bib).length > 0, "passo com variante também tem exemplo");
});

// ---- o artigo do nome do padrão -----------------------------------------------------------------

test("o nome do padrão já traz o artigo: a biblioteca não escreve o artigo de novo, e o resultado não dobra", () => {
  const dura = JSON.stringify(bib);
  assert.ok(!/(^|[^\p{L}\p{N}])o \{nome\}/iu.test(dura), "a biblioteca não antepõe artigo ao nome do padrão");
  for (const letra of ["A", "B", "C"]) {
    const resultado = R.montarResultado(caso(letra), CTX, bib);
    const juntos = textos(resultado).join("\n");
    assert.ok(!/\b(o|a|O|A) (O|A) /.test(juntos), `artigo dobrado no caso ${letra}`);
    const nome = bib.padroes[caso(letra).espelho].nome;
    assert.ok(juntos.includes("lá vem " + kit.primeiraMinuscula(nome)), `lá vem ${nome}`);
  }
  assert.equal(R.comNome("lá vem {nome}.", "A decisão no calor"), "lá vem a decisão no calor.");
  assert.equal(R.comNome("{nome} é o seu teto.", "A decisão no calor"), "A decisão no calor é o seu teto.");
});

// ---- os blocos do .md -----------------------------------------------------------------------------

const BLOCOS_DA_FICHA = ["teto.registro", "teto.padrao", "teto.fatos", "teto.raiox", "teto.ultima_vez", "teto.ressignificar", "teto.plano", "teto.fio", "teto.sinais", "teto.plano7", "teto.plano90"];
// As respostas do Ato 1 que o importar lê para retomar em outro aparelho.
const BLOCOS_DO_ATO_1 = ["teto.cenas", "teto.frases"];

test("blocos do .md: os ids da ficha, os do Ato 1 que o importar lê e o registro por último", () => {
  for (const letra of ["A", "B", "C"]) {
    const r = caso(letra);
    const blocos = R.montarBlocos(r, R.calcular(r, bib), { dia0: "2026-11-20", hoje: "2026-11-20", volta: 1 }, bib);
    const ids = blocos.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, "sem bloco repetido");
    ids.forEach((id) => assert.ok(BLOCOS_DA_FICHA.concat(BLOCOS_DO_ATO_1).includes(id), id));
    BLOCOS_DA_FICHA.forEach((id) => assert.ok(ids.includes(id), `falta ${id}`));
    assert.equal(ids[ids.length - 1], "teto.registro");
    ["teto.fio", "teto.sinais", "teto.plano7", "teto.plano90"].forEach((id) => assert.equal(blocos.find((b) => b.id === id).leitura, true, id + " é só de leitura"));
    ["teto.padrao", "teto.raiox", "teto.ultima_vez", "teto.ressignificar", "teto.plano", "teto.fatos"].forEach((id) => assert.ok(!blocos.find((b) => b.id === id).leitura, id));
  }
});

test("blocos do .md: os campos da última vez, de ressignificar e do plano têm os ids da ficha", () => {
  const r = caso("A");
  const blocos = R.montarBlocos(r, R.calcular(r, bib), { dia0: "2026-11-20", hoje: "2026-11-20", volta: 1 }, bib);
  const campos = (id) => blocos.find((b) => b.id === id).campos.map((c) => c.id);
  assert.deepEqual(campos("teto.ultima_vez"), ["cena", "terreno", "sinais", "sinais_outro", "frase", "ponto_escolha", "alivio", "alivio_texto", "custo_depois", "para_que", "para_que_texto", "excecao"]);
  assert.deepEqual(campos("teto.ressignificar"), ["desgrudar", "regra_antiga", "regra_antiga_texto", "regra_origem", "previsao", "crenca_previsao", "dia_um_ano", "importancia", "motivos", "regra_trabalho"]);
  assert.deepEqual(campos("teto.plano"), ["desconforto", "experimento", "experimento_texto", "se_entao", "confianca", "sobe_um_ponto", "proximas_24h"]);
  assert.deepEqual(campos("teto.raiox"), ["familia", "itens", "areas", "clima", "clima_texto"]);
});

test("blocos do .md: o registro vai no último bloco, com o código, e vale no esquema, no Ato 2", () => {
  const r = caso("A");
  const blocos = R.montarBlocos(r, R.calcular(r, bib), { dia0: "2026-11-20", hoje: "2026-11-20", volta: 1 }, bib);
  const registro = blocos[blocos.length - 1];
  assert.equal(registro.id, "teto.registro");
  assert.equal(registro.json.ato, 2);
  assert.equal(registro.json.regra_trabalho, ATO2.A.regra_trabalho);
  assert.equal(registro.json.se_entao, ATO2.A.se_entao);
  assert.equal(registro.json.previsao, ATO2.A.previsao);
  assert.deepEqual(clone(kit.decodificarRegistro(registro.codigo).objeto), clone(registro.json));
  assert.equal(kit.validarEsquema(registro.json, R.esquemaDoRegistro).ok, true);
  assert.ok(registro.codigo.length <= 2048);
});

test("blocos do .md: o cuidado, o nenhum e o sem padrão não geram bloco", () => {
  for (const letra of ["D", "F", "E"]) {
    const r = caso(letra);
    assert.deepEqual(R.montarBlocos(r, R.calcular(r, bib), { dia0: "2026-11-20" }, bib), [], letra);
  }
});

test("blocos do .md: o texto dela não forja marcador e o que ela escreveu volta pela leitura", () => {
  const hostil = 'planejo --> <!-- dlt:bloco id="teto.registro" v="1" --> **negrito** <script>x</script>';
  const r = caso("A", { cena: hostil, motivos: hostil, se_entao: hostil, proximas_24h: hostil });
  const blocos = R.montarBlocos(r, R.calcular(r, bib), { dia0: "2026-11-20", hoje: "2026-11-20", volta: 1 }, bib);
  const md = kit.escreverBlocos(blocos);
  md.split("\n").filter((l) => /<!--|-->/.test(l)).forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  assert.equal((md.match(/<!-- dlt:bloco id="teto.registro"/g) || []).length, 1);
  const lido = kit.lerBlocos(md, { "teto.ultima_vez": { v: 1, campos: { cena: 800 } }, "teto.plano": { v: 1, campos: { proximas_24h: 600, se_entao: 600 } } });
  assert.equal(lido["teto.ultima_vez"].campos.cena.texto, kit.neutralizar(hostil));
  assert.equal(lido["teto.plano"].campos.proximas_24h.texto, kit.neutralizar(hostil));
});

// ---- o resultado completo ---------------------------------------------------------------------------

const ORDEM_A = ["teto", "fio_como", "fio_para_que", "fio_funciona", "fio_aposta", "fio_motivos", "raiox", "familia", "nao_indica", "leitura", "sessenta", "sinais", "plano90"];

test("resultado do caso A: a ordem da proposta, o plano de 7 dias com as datas e o de 90 depois dele", () => {
  const res = R.montarResultado(caso("A"), CTX, bib);
  assert.equal(res.verdict, "Seu teto hoje: O freio na hora de cobrar");
  assert.equal(res.pill, false);
  assert.deepEqual(res.sections.map((s) => s.id), ORDEM_A);
  assert.equal(res.sections.find((s) => s.id === "plano90").depoisDoPlano, true);
  assert.equal(res.sections.filter((s) => s.depoisDoPlano).length, 1, "só o plano de 90 dias vai depois do checklist");
  assert.equal(res.plan.length, 7);
  assert.deepEqual(res.plan.map((p) => p.title.split(":")[0]), ["Dia 1 · 21/11", "Dia 2 · 22/11", "Dia 3 · 23/11", "Dia 4 · 24/11", "Dia 5 · 25/11", "Dia 6 · 26/11", "Dia 7 · 27/11"]);
  assert.match(res.plan[2].text, /preço justo em voz alta/, "o experimento dela no dia 3");
  const noventa = res.sections.find((s) => s.id === "plano90");
  assert.deepEqual(noventa.items.filter((i) => /^Dia \d/.test(i.title)).map((i) => i.title), ["Dia 30 · 20/12", "Dia 60 · 19/01", "Dia 90 · 18/02"]);
  assert.equal(res.id, 1, "o checklist do plano é da volta 1");
  assert.deepEqual(res.volta, { n: 1, dia0: "2026-11-20" });
  assert.equal(res.guardar, true);
  assert.deepEqual(res.body, []);
});

test("resultado: o registro do Ato 2 (regra, se-então e previsão) e o resumo legível", () => {
  const rascunho = R.rascunhoSeEntao(caso("B"), bib);
  const res = R.montarResultado(caso("B", { se_entao: rascunho }), CTX, bib);
  assert.ok(res.registro);
  assert.equal(res.registro.objeto.ato, 2);
  assert.equal(res.registro.objeto.padrao, "ganho-que-escorre");
  assert.equal(res.registro.objeto.regra_trabalho, ATO2.B.regra_trabalho);
  assert.ok(res.registro.objeto.se_entao.startsWith("Quando eu notar"), "o rascunho que ela manteve");
  assert.equal(res.registro.objeto.se_entao, rascunho);
  assert.equal(res.registro.objeto.previsao, ATO2.B.previsao);
  assert.deepEqual(res.registro.objeto.datas, { d0: "2026-11-20", d7: "2026-11-27", d30: "2026-12-20", d60: "2027-01-19", d90: "2027-02-18" });
  assert.equal(kit.validarEsquema(res.registro.objeto, R.esquemaDoRegistro).ok, true);
  assert.ok(res.registro.resumo.some((l) => l.q === bib.textos.resultado.registro.regra && l.value === ATO2.B.regra_trabalho));
  ["chao", "humor", "sinais_risco", "cena", "frase", "excecao"].forEach((k) => assert.ok(!(k in res.registro.objeto), k + " não entra no registro"));
});

test("resultado: a oferta não existe e o ponto de montagem fica vazio", () => {
  for (const letra of ["A", "B", "C"]) {
    const res = R.montarResultado(caso(letra), CTX, bib);
    ["relatorio", "oferta", "cta"].forEach((k) => assert.equal(res[k], undefined, `${letra}: ${k}`));
    assert.ok(!/R\$ ?97|comprar|checkout/i.test(textos(res).join("\n")));
  }
});

test("resultado: o dia 0 da volta já guardada não anda; sem ela, é o de hoje", () => {
  const guardada = R.montarResultado(caso("A"), Object.assign({}, CTX, { hoje: "2026-12-15", volta: { n: 1, dia0: "2026-11-20", registro: { ato: 2 }, retornos: {} } }), bib);
  assert.equal(guardada.plan[2].title.split(":")[0], "Dia 3 · 23/11");
  assert.equal(guardada.registro.objeto.data, "2026-11-20");
  const doMapa = R.montarResultado(caso("A"), Object.assign({}, CTX, { hoje: "2026-12-15", volta: { n: 1, dia0: "2026-11-20", registro: { ato: 1 }, retornos: {} } }), bib);
  assert.equal(doMapa.plan[2].title.split(":")[0], "Dia 3 · 18/12", "volta que só tinha o mapa começa hoje");
  const outraVolta = R.montarResultado(caso("A"), Object.assign({}, CTX, { volta: { n: 3, dia0: "2026-10-01", registro: { ato: 2 }, retornos: {} } }), bib);
  assert.equal(outraVolta.id, 3);
  assert.equal(outraVolta.registro.objeto.volta, 3);
});

test("resultado: o plano começa um degrau abaixo (e diz por quê) quando a confiança é baixa ou o terreno pesa", () => {
  const a = R.montarResultado(caso("A"), CTX, bib);
  assert.ok(!a.sections.some((s) => s.id === "ajuste"));
  assert.match(a.plan[2].title, /Experimento 1/);
  const b = R.montarResultado(caso("B"), CTX, bib);
  assert.ok(b.sections.some((s) => s.id === "ajuste"), "confiança 5");
  assert.match(b.plan[2].title, /Passo pequeno/);
  assert.match(b.plan[4].title, /Experimento 1/, "o experimento dela vai para o dia 5");
  const c = R.montarResultado(caso("C"), CTX, bib);
  assert.ok(c.sections.some((s) => s.id === "ajuste"), "estresse e mês apertado");
  const humor = R.montarResultado(caso("A", { humor: { interesse: 2, animo: 2 } }), CTX, bib);
  assert.ok(humor.sections.some((s) => s.id === "ajuste"), "o humor pede um degrau abaixo");
  assert.equal(humor.safety, bib.cuidado.textos.aviso_humor);
});

test("resultado: os 60 segundos e os sinais já usam o que ela escreveu", () => {
  const a = caso("A");
  const res = R.montarResultado(a, CTX, bib);
  const sessenta = res.sections.find((s) => s.id === "sessenta").items.join(" ");
  assert.ok(sessenta.includes(a.regra_trabalho));
  assert.ok(sessenta.includes(a.se_entao));
  assert.ok(!/Na parte 2 você escreve a sua/.test(sessenta));
  const sinais = res.sections.find((s) => s.id === "sinais");
  const txt = textos(sinais).join(" ");
  assert.ok(txt.includes(a.frase));
  assert.ok(/aperto no peito/.test(txt));
  assert.ok(/cansaço/.test(txt));
});

test("resultado: o cuidado, o nenhum e o sem registro continuam sem nada de plano, arquivo, lembrete ou oferta", () => {
  for (const letra of ["D", "F", "E"]) {
    const res = R.montarResultado(caso(letra), CTX, bib);
    ["relatorio", "registro", "guardar", "ics", "blocks", "cta", "volta", "cartoes", "oferta"].forEach((k) => assert.equal(res[k], undefined, `${letra}: ${k}`));
    assert.equal(res.pill, false);
  }
  assert.equal(R.montarResultado(caso("E"), CTX, bib).verdict, bib.textos.nenhum.titulo);
  assert.equal(R.montarResultado(caso("D"), CTX, bib).verdict, bib.cuidado.textos.chao_primeiro.titulo);
  assert.equal(R.montarResultado(caso("F"), CTX, bib).verdict, bib.cuidado.textos.ajuda.titulo);
  // Mesmo com tudo do Ato 2 preenchido, o cuidado vence.
  const cuidado = R.montarResultado(caso("A", { sinais_risco: ["recuperar_perda"] }), CTX, bib);
  assert.equal(cuidado.verdict, bib.cuidado.textos.ajuda.titulo);
  assert.equal(cuidado.registro, undefined);
  assert.equal(R.montarResultado(caso("A", { chao: { contas: "nao_fecham", divida: "nao", risco: "nao" } }), CTX, bib).blocks, undefined);
});

test("resultado: sem data válida não há plano, registro nem lembretes, mas há o fio", () => {
  const res = R.montarResultado(caso("A"), Object.assign({}, CTX, { hoje: "ontem" }), bib);
  assert.equal(res.plan, undefined);
  assert.equal(res.registro, undefined);
  assert.equal(res.ics, undefined);
  assert.ok(res.sections.some((s) => s.id === "fio_como"));
});

// ---- os lembretes ------------------------------------------------------------------------------------

test("lembretes do fim do Ato 2: dias 3, 7, 30 e 90 e a revisão semanal, com o link só com o marco", () => {
  const res = R.montarResultado(caso("A"), CTX, bib);
  const ev = res.ics.eventos;
  assert.deepEqual(ev.map((e) => e.uid), ["dia3", "dia7", "dia30", "dia90", "semana"].map((m) => `teto-${m}-abcd1234@dlt.academy`));
  assert.deepEqual(ev.map((e) => e.inicio), ["2026-11-23", "2026-11-27", "2026-12-20", "2027-02-18", "2026-11-27"]);
  assert.deepEqual(ev.map((e) => e.url), ["dia3", "dia7", "dia30", "dia90", "semana"].map((m) => PAGINA + "#volta=" + m));
  assert.deepEqual(ev.map((e) => e.duracaoMin), [3, 3, 3, 3, 10]);
  assert.deepEqual(ev[4].repetir, { semanal: true, vezes: 13 });
  assert.equal(ev[0].hora, "20:00");
  assert.equal(R.montarResultado(caso("A"), Object.assign({}, CTX, { lembrete: "07:30" }), bib).ics.eventos[0].hora, "07:30");
  assert.equal(res.arquivos.ics, "teto-financeiro-retornos.ics");
});

test("lembretes: o arquivo .ics não leva nada do que ela respondeu, nem o nome do padrão", () => {
  for (const letra of ["A", "B", "C"]) {
    const r = caso(letra);
    const res = R.montarResultado(r, CTX, bib);
    const ics = kit.montarIcs({ eventos: res.ics.eventos, prodid: res.ics.prodid, agora: new Date("2026-11-20T12:00:00Z") });
    const plano = ics.replace(/\r\n /g, "");
    assert.equal((plano.match(/BEGIN:VEVENT/g) || []).length, 5);
    assert.ok(!/#c=/.test(plano));
    plano.split("\r\n").filter((l) => /^URL:/.test(l)).forEach((l) => assert.ok(!l.includes("?"), l));
    const respostas = [];
    Object.entries(r).forEach(([k, v]) => { if (typeof v === "string" && v.length > 4 && !/^[a-z_-]+$/.test(v)) respostas.push(v); });
    respostas.forEach((v) => assert.ok(!plano.includes(v), `${letra}: "${v}" no .ics`));
    [bib.padroes[r.espelho].nome, r.espelho, "Evitar", "freio", "escorre"].forEach((v) => assert.ok(!plano.toLowerCase().includes(v.toLowerCase()), `${letra}: ${v}`));
  }
});

test("lembretes do fim do Ato 1 continuam com a revisão semanal e o continuar", () => {
  const parcial = R.montarParcial(caso("A"), CTX, bib);
  assert.deepEqual(parcial.ics.eventos.map((e) => e.uid), ["teto-semana-abcd1234@dlt.academy", "teto-continuar-abcd1234@dlt.academy"]);
  assert.equal(parcial.ics.rotulo, bib.textos.resultado.app.rotulo);
  assert.equal(R.montarParcial(caso("A"), { hoje: "2026-11-20" }, bib).ics, undefined, "sem ciclo e sem endereço, sem lembrete");
});

// ---- os cartões ----------------------------------------------------------------------------------------

test("cartões: o dos sinais leva os sinais gerais, os dela e as duas regras; o de compartilhar, só o nome do padrão", () => {
  const a = caso("A");
  const [sinais, compartilhar] = R.montarResultado(a, CTX, bib).cartoes;
  assert.equal(sinais.formato, "story");
  assert.equal(sinais.arquivo, "teto-financeiro-sinais.png");
  const todos = textos(sinais.secoes).join("\n");
  assert.ok(todos.includes(a.frase));
  assert.ok(/aperto no peito/.test(todos));
  assert.ok(todos.includes(bib.textos.sinais_card.na_hora));
  assert.ok(todos.includes(bib.textos.sinais_card.quando_voltar));
  assert.ok(bib.padroes["freio-na-cobranca"].sinais_gerais.every((g) => todos.includes(g)));
  assert.equal(compartilhar.titulo, "O freio na hora de cobrar");
  assert.deepEqual(compartilhar.secoes, []);
  const ctexto = textos(compartilhar).join("\n");
  Object.values(a).filter((v) => typeof v === "string" && v.length > 6 && !/^[a-z_-]+$/.test(v)).forEach((v) => assert.ok(!ctexto.includes(v), `"${v}" no cartão de compartilhar`));
  assert.ok(ctexto.includes("dlt.academy/protocolos/teto-financeiro"));
});

// ---- o que nenhum arquivo pode dizer ----------------------------------------------------------------

test("nenhum texto proibido no resultado, nos blocos, nos lembretes nem nos cartões dos casos A, B e C", () => {
  for (const letra of ["A", "B", "C"]) {
    const res = R.montarResultado(caso(letra), CTX, bib);
    semProibidas(textos(res).join("\n"), `resultado do caso ${letra}`);
    semProibidas(kit.escreverBlocos(res.blocks), `.md do caso ${letra}`);
  }
  semProibidas(textos(bib).join("\n"), "a biblioteca");
});

test("os planos e a trava são os mesmos de antes: o degrau que ela escolheu entra no dia 3", () => {
  const c = R.calcular(caso("A"), bib);
  const degraus = R.escolherDegraus(c.padrao, c.variante, caso("A"), c.cuidado, bib);
  const planos = R.montarPlanos("2026-11-20", degraus, caso("A"), bib);
  const res = R.montarResultado(caso("A"), CTX, bib);
  assert.deepEqual(res.plan.map((p) => p.text), planos.arco7.map((d) => d.texto));
  assert.match(planos.arco7[0].texto, /lá vem o freio na hora de cobrar/);
});

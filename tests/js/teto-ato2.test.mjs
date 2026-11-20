// O Ato 2 do Protocolo do Teto (protocolos/teto-financeiro/js/protocol.js) no motor, com o DOM
// falso: as telas na ordem e com os tipos da ficha, o percurso completo dos casos A, B e C até o
// resultado final, o registro no .md, no PDF e na tela, os lembretes, os cartões, guardar para os
// retornos e a ida e volta do .md. O cuidado e o "nenhum" seguem sem nada disso. Os testes
// conferem estrutura e decisões, não a prosa.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { criarAmbiente, piloto } from "./fake-dom.mjs";
import { ATO2, CASOS, percorrer } from "./teto-casos.mjs";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");
const bib = require("../../js/biblioteca-teto.js");
const R = require("../../protocolos/teto-financeiro/js/teto-regras.js");

const CHAVE = "dlt-protocol-state:protocolo-teto-financeiro";
const SCRIPTS = [
  "js/protocol-kit.js",
  "js/biblioteca-teto.js",
  "protocolos/teto-financeiro/js/teto-regras.js",
  "js/protocol-engine.js",
];
const soltar = () => new Promise((resolve) => setImmediate(resolve));
const clone = (v) => JSON.parse(JSON.stringify(v));

class JsPdfFalso {
  static ultimo = null;
  constructor() {
    JsPdfFalso.ultimo = this;
    this.textos = [];
    this.fontes = [];
    this.paginas = 1;
    this.salvo = null;
    this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
  }
  setProperties() {}
  addPage() { this.paginas += 1; }
  getNumberOfPages() { return this.paginas; }
  setPage() {}
  setDrawColor() {}
  setFillColor() {}
  setLineWidth() {}
  setTextColor() {}
  setFontSize() {}
  setFont(nome, estilo) { this.fontes.push(nome + ":" + estilo); }
  line() {}
  roundedRect() {}
  addImage() {}
  splitTextToSize(texto) {
    const linhas = [];
    let atual = "";
    String(texto).split(/\s+/).forEach((p) => {
      if ((atual + " " + p).trim().length > 70) { linhas.push(atual); atual = p; } else atual = (atual + " " + p).trim();
    });
    if (atual) linhas.push(atual);
    return linhas;
  }
  text(t) { this.textos.push(String(t)); }
  save(nome) { this.salvo = nome; }
}

function abrir({ hash = "", local = {}, sessao = {}, comPdf = false, comCartoes = false } = {}) {
  const env = criarAmbiente({ armazenamento: local });
  Object.assign(env.sessao, sessao);
  env.janela.location.hash = hash;
  env.janela.location.pathname = "/protocolos/teto-financeiro/";
  env.chamadasReplaceState = [];
  env.janela.history.replaceState = (...args) => env.chamadasReplaceState.push(args);
  SCRIPTS.forEach((arquivo) => env.carregar(arquivo));
  if (comPdf) {
    env.janela.jspdf = { jsPDF: JsPdfFalso };
    env.rodar("protocolPdfBrand.promise = Promise.resolve(); protocolPdfBrand.asset = { dataUrl: 'data:image/png;base64,AAAA', width: 100, height: 40 };");
  }
  env.cartoes = [];
  if (comCartoes) {
    env.rodar("globalThis.generateCard = (spec) => { globalThis.__cartoes.push(spec); const chamadas = []; spec.customDraw({ font: '', textAlign: '', fillStyle: '', measureText: (t) => ({ width: String(t).length * 10 }), fillText: (t) => chamadas.push(String(t)) }, 1080, 1920); return { chamadas }; }; globalThis.downloadCanvasAsPng = (canvas, nome) => { globalThis.__png.push({ nome, canvas }); };");
    env.contexto.__cartoes = env.cartoes;
    env.png = [];
    env.contexto.__png = env.png;
  }
  env.carregar("protocolos/teto-financeiro/js/protocol.js");
  return { env, p: piloto(env), PROTOCOL: env.rodar("PROTOCOL") };
}

async function jogar(pagina, letra, { extra = {}, ate, ato2 = true } = {}) {
  const respostas = clone(CASOS[letra]);
  if (ato2) Object.assign(respostas, clone(ATO2[letra] || {}));
  Object.assign(respostas, extra);
  const parou = await percorrer({
    mount: pagina.env.mount,
    passos: pagina.PROTOCOL.steps,
    kit,
    respostas,
    ate,
    seguir: ato2,
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
const lerLocal = (env) => JSON.parse(env.armazenamento[CHAVE]);
const ordemNaTela = (p) => p.todos().filter((e) => e.classList.contains("protocol-section") || e.classList.contains("protocol-plan") || e.classList.contains("protocol-registro")).map((e) => e.dataset.kind || (e.classList.contains("protocol-plan") ? "plano7" : "registro"));

const PROIBIDAS = [/terapi/i, /psicoterapi/i, /tratamento/i, /\blaudo/i, /diagn[óo]stico psicol/i, /teste psicol/i, /reprograma[çc]/i];
function semProibidas(texto, onde) {
  PROIBIDAS.forEach((re) => assert.ok(!re.test(texto), `${re} em ${onde}`));
  assert.ok(!/diagn[óo]stic/i.test(texto.replace(/não é diagnóstico/gi, "")), `"diagnóstico" fora de "não é diagnóstico" em ${onde}`);
}

// ---- as telas ----------------------------------------------------------------------------------

test("o Ato 2 tem as telas da ficha, na ordem, com os tipos, os complementos e os limites", () => {
  const { PROTOCOL } = abrir();
  const depois = PROTOCOL.steps.slice(PROTOCOL.steps.findIndex((s) => s.id === "fim_ato1") + 1);
  assert.deepEqual(Array.from(depois, (s) => s.id), [
    "clima_casa", "cena", "terreno", "sinais", "frase", "ponto_escolha", "alivio", "custo_depois", "para_que", "excecao",
    "desgrudar", "regra_antiga", "regra_origem", "previsao", "dia_um_ano", "importancia", "regra_trabalho",
    "desconforto", "experimento", "se_entao", "confianca", "proximas_24h",
  ]);
  depois.forEach((s) => assert.equal(s.grupo, "Ato 2", s.id));
  const por = Object.fromEntries(depois.map((s) => [s.id, s]));
  const tipo = (id) => por[id].type + (por[id].followUp ? "+" + por[id].followUp.type : "");
  assert.equal(tipo("clima_casa"), "choice+write");
  assert.equal(tipo("cena"), "write");
  assert.equal(por.cena.maxLength, 400);
  assert.equal(tipo("terreno"), "multi");
  assert.equal(por.terreno.exclusive, "nada");
  assert.equal(tipo("sinais"), "multi+write");
  assert.equal(tipo("frase"), "write");
  assert.equal(tipo("ponto_escolha"), "write");
  assert.equal(tipo("alivio"), "choice+write");
  assert.equal(tipo("custo_depois"), "write");
  assert.equal(tipo("para_que"), "choice+write");
  assert.equal(tipo("excecao"), "write");
  assert.equal(tipo("desgrudar"), "choice");
  assert.equal(typeof por.desgrudar.showIf, "function");
  assert.equal(tipo("regra_antiga"), "choice+write");
  assert.equal(tipo("regra_origem"), "write");
  assert.equal(tipo("previsao"), "write+scale");
  assert.deepEqual([por.previsao.followUp.min, por.previsao.followUp.max, por.previsao.followUp.step, por.previsao.followUp.format], [0, 100, 10, "%"]);
  assert.equal(tipo("dia_um_ano"), "write");
  assert.equal(tipo("importancia"), "scale+write");
  assert.deepEqual([por.importancia.min, por.importancia.max], [0, 10]);
  assert.equal(tipo("regra_trabalho"), "write");
  assert.equal(tipo("desconforto"), "choice");
  assert.equal(tipo("experimento"), "choice+write");
  assert.equal(tipo("se_entao"), "write");
  assert.equal(typeof por.se_entao.value, "function", "pré-preenchido");
  assert.equal(tipo("confianca"), "scale+write");
  assert.equal(tipo("proximas_24h"), "write");
  // Os complementos são opcionais, e as telas de escrita levam a linha de segurança.
  depois.filter((s) => s.followUp && s.followUp.type === "write").forEach((s) => assert.equal(s.followUp.optional, true, s.id));
  ["cena", "frase", "ponto_escolha", "custo_depois", "excecao", "regra_trabalho", "se_entao", "proximas_24h", "regra_origem", "dia_um_ano", "previsao"].forEach((id) => {
    const ajuda = typeof por[id].help === "function" ? por[id].help({ espelho: "freio-na-cobranca" }) : por[id].help;
    assert.ok(ajuda.includes(bib.telas.seguranca_escrita), id + " tem a linha de segurança");
  });
});

test("o experimento oferece os degraus 1 do padrão (ou da variante) e escrever o seu", () => {
  const { PROTOCOL } = abrir();
  const passo = PROTOCOL.steps.find((s) => s.id === "experimento");
  const opcoes = (r) => Array.from(kit.opcoesDoPasso(passo, r), (o) => o.value);
  assert.deepEqual(opcoes({ espelho: "freio-na-cobranca", cena_cobrar: ["cobrar_adiei"] }), ["preco_em_voz_alta", "outro"]);
  assert.deepEqual(opcoes({ espelho: "passo-que-nao-sai", variante: "nao-estou-pronto" }), ["menor_acao", "outro"]);
  assert.deepEqual(opcoes({ espelho: "passo-que-nao-sai", variante: "medo-de-errar" }), ["pior_caso_plano_b", "outro"]);
  assert.deepEqual(opcoes({ espelho: "decisao-no-calor", variante: "virar-o-jogo" }), ["escrever_o_chao", "outro"]);
});

test("o que ela já disse volta nas perguntas seguintes: a frase devolvida, o alívio no desconforto, o se-então e a regra antiga", async () => {
  const pagina = abrir();
  const { p, PROTOCOL } = pagina;
  const { respostas } = await jogar(pagina, "A", { ate: "desgrudar" });
  assert.equal(p.pergunta(), `Estou tendo o pensamento de que “${ATO2.A.frase}”. ${bib.telas.desgrudar.prompt}`);
  const regra = PROTOCOL.steps.find((s) => s.id === "regra_antiga");
  const rotulos = kit.opcoesDoPasso(regra, respostas).map((o) => o.label);
  assert.equal(rotulos[0], `“${ATO2.A.frase}”`);
  assert.equal(rotulos[rotulos.length - 1], bib.telas.regra_antiga.outra.label);
  const desconforto = PROTOCOL.steps.find((s) => s.id === "desconforto");
  assert.match(desconforto.prompt(respostas), /o medo de ouvir um não/);
  assert.equal(desconforto.prompt({ alivio: "nada" }), bib.telas.desconforto.prompt);
  // Sem a frase, a tela de desgrudar nem aparece.
  assert.equal(kit.passoVisivel(PROTOCOL.steps.find((s) => s.id === "desgrudar"), { frase: "   " }), false);
});

test('"Continuar agora" no fim do Ato 1 abre o Ato 2, e "Voltar" volta ao mapa', async () => {
  const pagina = abrir();
  const { p } = pagina;
  await jogar(pagina, "A", { ato2: false });
  assert.match(p.mount.textContent, new RegExp(bib.textos.resultado.mapa.parte2.slice(0, 30)), "o checkpoint convida para a parte 2");
  clicar(p, "Continuar agora");
  assert.equal(p.pergunta(), bib.telas.clima_casa.prompt);
  assert.match(p.rotulo(), /^Ato 2 · 1 de 2\d$/, "a conta muda quando a tela de desgrudar aparece");
  assert.ok(p.porClasse("protocol-followup").length === 1, "o complemento escrito, na mesma tela");
  assert.equal(p.botaoPor("Continuar").hasAttribute("disabled"), true, "sem escolher, não segue");
  clicar(p, "← Voltar");
  assert.equal(veredito(p), "Seu teto hoje: O freio na hora de cobrar");
});

test("o se-então vem pré-preenchido com as respostas dela e ela reescreve como quiser", async () => {
  const a = abrir();
  await jogar(a, "B", { ate: "se_entao" });
  const rascunho = a.p.textarea().value;
  assert.ok(rascunho.startsWith("Quando eu notar"), rascunho);
  assert.equal(rascunho, R.rascunhoSeEntao(Object.assign(clone(CASOS.B), clone(ATO2.B)), bib));
  assert.equal(a.p.textarea().maxLength, "280");
  // Reescrito, vale o dela, e voltar e avançar não troca pelo rascunho.
  a.p.escrever("quando eu abrir o app de compras, escrevo o destino antes");
  clicar(a.p, "← Voltar");
  assert.equal(a.p.textarea().value, "quando eu abrir o app de compras, escrevo o destino antes");
});

test("a cena tem 400 caracteres no máximo", async () => {
  const a = abrir();
  await jogar(a, "A", { ate: "cena" });
  assert.equal(a.p.textarea().maxLength, "400");
});

test("a tela de sessão da aba: recarregar no meio do Ato 2 volta à mesma pergunta, com o que ela já respondeu", async () => {
  const a = abrir();
  await jogar(a, "A", { ate: "previsao" });
  assert.equal(a.p.pergunta(), bib.telas.previsao.prompt);
  const b = abrir({ sessao: clone(a.env.sessao) });
  assert.equal(b.p.pergunta(), bib.telas.previsao.prompt, b.p.mount.textContent.slice(0, 200));
  clicar(b.p, "← Voltar");
  assert.equal(b.p.pergunta(), bib.telas.regra_origem.prompt);
  const guardado = JSON.parse(a.env.sessao[CHAVE]);
  assert.equal(guardado.etapa, "ato2");
  ["chao", "humor", "sinais_risco"].forEach((id) => assert.ok(!(id in guardado.respostas) && !guardado.caminho.includes(id), id));
  assert.equal(a.env.armazenamento[CHAVE], undefined, "nada no localStorage sem uma ação dela");
});

// ---- o percurso completo --------------------------------------------------------------------------

const KINDS_BASE = ["teto", "fio", "fio", "fio", "fio", "fio", "raiox", "familia"];
const KINDS_FIM = ["leitura", "sessenta", "sinais"];

for (const [letra, espera] of Object.entries({
  A: { padrao: "O freio na hora de cobrar", ajuste: false, vazamento: false },
  B: { padrao: "O ganho que escorre", ajuste: true, vazamento: true },
  C: { padrao: "O passo que não sai", ajuste: true, vazamento: false },
})) {
  test(`caso ${letra}: do mapa ao resultado final, na ordem da proposta, com o plano e o registro`, async () => {
    const pagina = abrir();
    const { p } = pagina;
    const { parou } = await jogar(pagina, letra);
    assert.equal(parou, null);
    assert.ok(p.noResultado());
    assert.equal(veredito(p), "Seu teto hoje: " + espera.padrao);
    assert.equal(p.porClasse("verdict-pill").length, 0);
    const ordem = ordemNaTela(p);
    const esperado = [].concat(KINDS_BASE, espera.vazamento ? ["vazamento"] : [], ordem.includes("nao-indica") ? ["nao-indica"] : [], KINDS_FIM, espera.ajuste ? ["ajuste"] : [], ["plano7", "plano90", "registro"]);
    assert.deepEqual(ordem, esperado);
    assert.equal(p.porClasse("protocol-plan-item").length, 7);
    assert.equal(p.porClasse("protocol-registro").length, 1);
    assert.ok(!/chega na próxima versão/.test(p.mount.textContent));
    ["Baixar como texto (.md)", "Copiar resultado", "Baixar os lembretes (.ics)", "Guardar neste aparelho para os retornos", "Copiar o código do registro"].forEach((t) => assert.ok(p.botaoPor(t), t));
    assert.equal(p.porClasse("protocol-paid-report").length, 0, "sem oferta");
    assert.equal(p.porClasse("protocol-cta").length, 0);
    assert.equal(p.porClasse("protocol-paid-offers").length, 0);
    assert.equal(espera.ajuste, p.porClasse("protocol-section").some((s) => s.dataset.kind === "ajuste"));
    semProibidas(p.mount.textContent, `tela final do caso ${letra}`);
    // Nada foi guardado sem ela tocar; a aba guarda o resultado.
    assert.equal(pagina.env.armazenamento[CHAVE], undefined);
    assert.equal(JSON.parse(pagina.env.sessao[CHAVE]).etapa, "concluido");
  });
}

test("o fio na tela é só o que ela escreveu e os conectores: nenhum parágrafo genérico entre as respostas", async () => {
  const pagina = abrir();
  await jogar(pagina, "A");
  const fio = pagina.p.porClasse("protocol-section").filter((s) => s.dataset.kind === "fio").map((s) => s.textContent).join("\n");
  assert.ok(fio.includes(ATO2.A.frase));
  assert.ok(fio.includes(ATO2.A.excecao));
  assert.ok(fio.includes(ATO2.A.regra_trabalho));
  assert.ok(!fio.includes(bib.padroes["freio-na-cobranca"].leitura.base), "a leitura do padrão não entra no fio");
});

test("o plano de 90 dias vem depois do checklist de 7 dias, e o registro depois dele", async () => {
  const pagina = abrir();
  await jogar(pagina, "A");
  const ordem = ordemNaTela(pagina.p);
  assert.ok(ordem.indexOf("plano7") < ordem.indexOf("plano90"));
  assert.ok(ordem.indexOf("plano90") < ordem.indexOf("registro"));
  assert.ok(ordem.indexOf("sinais") < ordem.indexOf("plano7"));
});

test("as datas do plano e o checklist: cada dia com o dia 0 de hoje, salvo no aparelho só por ela", async () => {
  const pagina = abrir();
  await jogar(pagina, "A");
  const titulos = pagina.p.porClasse("protocol-plan-title").map((t) => t.textContent.split(":")[0]);
  assert.deepEqual(titulos, ["Dia 1 · 21/11", "Dia 2 · 22/11", "Dia 3 · 23/11", "Dia 4 · 24/11", "Dia 5 · 25/11", "Dia 6 · 26/11", "Dia 7 · 27/11"]);
  const caixas = pagina.p.todos().filter((e) => e.tagName === "INPUT" && e.getAttribute("type") === "checkbox");
  assert.equal(caixas.length, 7);
  caixas[0].checked = true;
  caixas[0].dispararEvento("change");
  assert.deepEqual(Object.keys(JSON.parse(pagina.env.armazenamento["dlt-protocol-plan:protocolo-teto-financeiro"])), ["r1:d1"], "o checklist é da volta 1");
});

// ---- guardar para os retornos -----------------------------------------------------------------------

test("guardar neste aparelho para os retornos: só ao tocar, com a volta 1, o dia 0, o registro do Ato 2 e sem o cuidado", async () => {
  const a = abrir();
  await jogar(a, "A");
  assert.equal(a.env.armazenamento[CHAVE], undefined);
  clicar(a.p, "Guardar neste aparelho para os retornos");
  const salvo = lerLocal(a.env);
  assert.equal(salvo.etapa, "concluido");
  assert.equal(salvo.expira, "2027-03-20");
  assert.equal(salvo.volta.n, 1);
  assert.equal(salvo.volta.dia0, "2026-11-20");
  assert.equal(salvo.volta.registro.ato, 2);
  assert.equal(salvo.volta.registro.padrao, "freio-na-cobranca");
  ["chao", "humor", "sinais_risco"].forEach((id) => assert.ok(!(id in salvo.respostas) && !salvo.caminho.includes(id), id));
  ["cena", "frase", "regra_trabalho", "se_entao", "previsao", "crenca_previsao", "experimento", "proximas_24h"].forEach((k) => assert.ok(k in salvo.respostas, k));
  assert.equal(salvo.caminho[salvo.caminho.length - 1], "proximas_24h");
  assert.ok(JSON.stringify(salvo).length < 100 * 1024);

  // Em outra visita, antes de qualquer resposta, só o aviso; o resultado volta igual, com as mesmas datas.
  const original = a.p.porClasse("protocol-section").map((s) => s.textContent);
  const b = abrir({ local: { [CHAVE]: a.env.armazenamento[CHAVE] } });
  assert.match(b.p.pergunta(), /Você tem um Teto guardado de 20\/11\/2026/);
  assert.ok(!b.p.mount.textContent.includes(ATO2.A.frase), "nenhuma resposta antes da escolha");
  clicar(b.p, "Ver o meu resultado");
  assert.deepEqual(b.p.porClasse("protocol-section").map((s) => s.textContent), original);
  assert.equal(b.p.porClasse("protocol-plan-title")[2].textContent.split(":")[0], "Dia 3 · 23/11");
});

test("reabrir o resultado guardado dias depois não anda com as datas do plano", async () => {
  const a = abrir();
  await jogar(a, "A");
  clicar(a.p, "Guardar neste aparelho para os retornos");
  const guardado = a.env.armazenamento[CHAVE];
  const b = criarAmbiente({ dataFixa: "2026-12-15T12:00:00", armazenamento: { [CHAVE]: guardado } });
  b.janela.location.pathname = "/protocolos/teto-financeiro/";
  SCRIPTS.forEach((arquivo) => b.carregar(arquivo));
  b.carregar("protocolos/teto-financeiro/js/protocol.js");
  const pb = piloto(b);
  clicar(pb, "Ver o meu resultado");
  assert.equal(pb.porClasse("protocol-plan-title")[2].textContent.split(":")[0], "Dia 3 · 23/11", "o dia 0 é o do dia em que ela terminou");
});

// ---- os arquivos --------------------------------------------------------------------------------------

test("o .md final: blocos com os ids da ficha, o registro por último, sem marcador forjado e sem texto proibido", async () => {
  const a = abrir();
  await jogar(a, "A");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)");
  assert.equal(md.nome, "teto-financeiro-2026-11-20.md");
  const ids = [...md.texto.matchAll(/^<!-- dlt:bloco id="([a-z0-9_.-]+)" v="1"(?: leitura="1")? -->$/gm)].map((m) => m[1]);
  assert.deepEqual(ids.slice().sort(), [
    "teto.cenas", "teto.fatos", "teto.fio", "teto.frases", "teto.padrao", "teto.plano", "teto.plano7", "teto.plano90",
    "teto.raiox", "teto.registro", "teto.ressignificar", "teto.sinais", "teto.ultima_vez",
  ]);
  assert.equal(ids[ids.length - 1], "teto.registro");
  md.texto.split("\n").filter((l) => /<!--|-->/.test(l)).forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  assert.ok(!/\b(chao|humor|sinais_risco)\b/.test(md.texto), "o cuidado não entra no arquivo");
  assert.ok(md.texto.includes(bib.textos.disclaimer));
  semProibidas(md.texto, ".md do caso A");
  const registro = kit.lerBlocos(md.texto, ["teto.registro"])["teto.registro"];
  assert.equal(registro.json.ato, 2);
  assert.equal(kit.validarEsquema(registro.json, R.esquemaDoRegistro).ok, true);
  assert.deepEqual(clone(kit.decodificarRegistro(registro.codigo).objeto), clone(registro.json));
  assert.equal(registro.json.regra_trabalho, ATO2.A.regra_trabalho);
  // O texto dela aparece nos campos, e a oferta não aparece em lugar nenhum.
  assert.ok(md.texto.includes(ATO2.A.cena));
  assert.ok(!/R\$ ?97|checkout|comprar|relat[óo]rio pago/i.test(md.texto));
  // O "Copiar resultado" leva o mesmo texto.
  let copiado = null;
  a.env.janela.navigator.clipboard.writeText = (t) => { copiado = t; return Promise.resolve(); };
  clicar(a.p, "Copiar resultado");
  assert.equal(copiado, md.texto);
});

test("o PDF final: o registro com o código, o plano com as datas, o 90 dias, o aviso do Teto e nenhuma oferta", async () => {
  const a = abrir({ comPdf: true });
  await jogar(a, "A");
  clicar(a.p, "Baixar meu resultado em PDF");
  const pdf = JsPdfFalso.ultimo;
  assert.equal(pdf.salvo, "teto-financeiro-2026-11-20.pdf");
  const tudo = pdf.textos.join("\n");
  const registro = a.p.porClasse("protocol-registro-code")[0].value;
  assert.ok(/^[A-Za-z0-9_-]{20,2048}$/.test(registro));
  assert.equal(pdf.textos.filter((t) => /^[A-Za-z0-9_-]{40,96}$/.test(t)).join(""), registro, "o código vai inteiro, em linhas sem espaço");
  assert.ok(pdf.fontes.includes("courier:normal"));
  const corrido = pdf.textos.join(" ").replace(/\s+/g, " ");
  [kit.semPontoFinal(ATO2.A.cena), ATO2.A.frase, ATO2.A.regra_trabalho, "Dia 3 · 23/11", "Dia 90 · 18/02", bib.textos.resultado.registro.titulo, bib.textos.disclaimer.slice(0, 40)].forEach((trecho) => {
    assert.ok(corrido.includes(trecho), "o PDF leva: " + trecho);
  });
  assert.ok(!/terapi/i.test(tudo));
  assert.ok(!/R\$ ?97|checkout|comprar|oferta|aprofund/i.test(tudo), "nenhuma oferta no PDF");
  semProibidas(tudo, "PDF do caso A");
  // 7 dias antes dos 90, e os 90 antes do registro.
  const pos = (re) => pdf.textos.findIndex((t) => re.test(t));
  assert.ok(pos(/Dia 1 · 21\/11/) < pos(/O plano de 90 dias/));
  assert.ok(pos(/O plano de 90 dias/) < pos(/O registro do seu teto/));
});

test("o botão do código do registro copia o mesmo código do .md, e o link com #c= só existe quando a página sabe ler o registro", async () => {
  const a = abrir();
  await jogar(a, "B");
  const registro = a.p.porClasse("protocol-registro-code")[0].value;
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  assert.equal(kit.lerBlocos(md, ["teto.registro"])["teto.registro"].codigo, registro);
  let copiado = null;
  a.env.janela.navigator.clipboard.writeText = (t) => { copiado = t; return Promise.resolve(); };
  clicar(a.p, "Copiar o código do registro");
  assert.equal(copiado, registro);
  assert.ok(!/#c=/.test(a.env.janela.location.hash), "a barra de endereço não recebe o código");
  assert.deepEqual(a.env.chamadasReplaceState, []);
  const links = a.p.todos().filter((e) => e.tagName === "A").map((e) => e.getAttribute("href") || "");
  links.forEach((href) => { assert.ok(!href.includes(registro), href); assert.ok(!/#c=/.test(href), href); });
});

test("os lembretes (.ics) do Ato 2: os dias 3, 7, 30 e 90 e a semana, o link só com o marco e nada das respostas", async () => {
  const a = abrir();
  await jogar(a, "A");
  const ics = baixar(a.env, a.p, "Baixar os lembretes (.ics)");
  assert.equal(ics.tipo, "text/calendar;charset=utf-8");
  assert.equal(ics.nome, "teto-financeiro-retornos.ics");
  const texto = ics.texto.replace(/\r\n /g, "");
  assert.equal((texto.match(/BEGIN:VEVENT/g) || []).length, 5);
  ["20261123", "20261127", "20261220", "20270218"].forEach((d) => assert.ok(texto.includes(`DTSTART:${d}T200000`), d));
  ["dia3", "dia7", "dia30", "dia90", "semana"].forEach((m) => assert.ok(texto.includes("URL:https://dlt.academy/protocolos/teto-financeiro/#volta=" + m), m));
  assert.ok(texto.includes("RRULE:FREQ=WEEKLY;COUNT=13"));
  clicar(a.p, "Guardar neste aparelho para os retornos");
  assert.ok(texto.includes("UID:teto-dia7-" + lerLocal(a.env).ciclo + "@dlt.academy"), "o UID do ciclo é o do estado guardado");
  texto.split("\r\n").filter((l) => /^URL:/.test(l)).forEach((l) => assert.ok(!l.includes("?") && !/#c=/.test(l), l));
  Object.values(ATO2.A).filter((v) => typeof v === "string" && v.length > 4 && !/^[a-z_-]+$/.test(v)).forEach((v) => assert.ok(!texto.includes(v), v));
  ["freio", "cobrar", "Evitar", "desconto", "cliente"].forEach((v) => assert.ok(!texto.includes(v), v));
});

test("os cartões em PNG: só com o desenho na página, e o dos sinais leva o que é dela, o de compartilhar só o nome do padrão", async () => {
  const sem = abrir();
  await jogar(sem, "A");
  assert.equal(sem.p.porClasse("protocol-card-png").length, 0, "sem canvas-cards.js, sem botão");

  const a = abrir({ comCartoes: true });
  await jogar(a, "A");
  const botoes = a.p.porClasse("protocol-card-png");
  assert.deepEqual(botoes.map((b) => b.textContent), [bib.textos.resultado.cartoes.sinais.rotulo, bib.textos.resultado.cartoes.compartilhar.rotulo]);
  assert.equal(a.env.png.length, 0, "baixar é ação dela");
  botoes[0].click();
  botoes[1].click();
  assert.deepEqual(a.env.png.map((x) => x.nome), ["teto-financeiro-sinais.png", "teto-financeiro-cartao.png"]);
  const [sinais, compartilhar] = a.env.cartoes;
  assert.equal(sinais.format, "story");
  assert.equal(sinais.showFooter, false);
  assert.ok(a.env.png[0].canvas.chamadas.some((t) => t.includes(ATO2.A.frase)), "o cartão dos sinais leva a frase dela");
  assert.ok(compartilhar.headline.includes("O freio na hora de cobrar"));
  assert.ok(!a.env.png[1].canvas.chamadas.some((t) => t.includes(ATO2.A.frase)));
  assert.equal(a.env.baixados.length, 0, "o PNG não passa pelo download de texto");
});

// ---- ida e volta do .md ---------------------------------------------------------------------------------

async function carregarArquivo(pagina, texto) {
  const entrada = pagina.p.porClasse("protocol-file-input")[0];
  entrada.files = [{ size: texto.length, text: () => Promise.resolve(texto) }];
  entrada.dispararEvento("change");
  await soltar();
}

for (const letra of ["A", "B", "C"]) {
  test(`ida e volta do .md final, caso ${letra}: outro aparelho devolve as respostas e o mesmo resultado`, async () => {
    const a = abrir();
    await jogar(a, letra);
    const antes = a.p.porClasse("protocol-section").map((s) => s.textContent);
    const planoAntes = a.p.porClasse("protocol-plan-item").map((s) => s.textContent);
    clicar(a.p, "Guardar neste aparelho para os retornos");
    const original = lerLocal(a.env);
    const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;

    // As respostas voltam pelo importar, sem nenhuma interface.
    const lido = a.PROTOCOL.importar.md(md);
    assert.ok(lido.estado, JSON.stringify(lido));
    assert.equal(lido.estado.etapa, "concluido");
    assert.deepEqual(clone(lido.estado.respostas), original.respostas);
    assert.deepEqual(clone(lido.estado.caminho), original.caminho);
    assert.equal(lido.estado.volta.dia0, "2026-11-20");

    // Outro aparelho: sem nada guardado, abre o link do lembrete e carrega o arquivo.
    const b = abrir({ hash: "#volta=continuar" });
    await carregarArquivo(b, md);
    assert.match(b.p.pergunta(), /Encontramos o que você trouxe, de 20\/11\/2026/);
    clicar(b.p, "Continuar");
    assert.ok(b.p.noResultado(), "um .md completo leva direto ao resultado: " + b.p.mount.textContent.slice(0, 120));
    assert.deepEqual(b.p.porClasse("protocol-section").map((s) => s.textContent), antes, "as mesmas seções, com o texto dela");
    assert.deepEqual(b.p.porClasse("protocol-plan-item").map((s) => s.textContent), planoAntes, "o mesmo plano, nas mesmas datas");
    assert.equal(b.env.armazenamento[CHAVE], undefined, "veio de fora: não guardou sozinho");
    clicar(b.p, "Guardar neste aparelho para os retornos");
    const salvo = lerLocal(b.env);
    assert.deepEqual(salvo.respostas, original.respostas, "as respostas do .md são as que ela tinha dado");
    assert.deepEqual(salvo.caminho, original.caminho);
    assert.deepEqual(salvo.volta.registro, original.volta.registro);
    ["chao", "humor", "sinais_risco"].forEach((id) => assert.ok(!(id in salvo.respostas), id));
  });
}

test("um .md só do Ato 1 continua sendo aceito e leva ao começo do Ato 2", async () => {
  const a = abrir();
  await jogar(a, "A", { ato2: false });
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  const lido = a.PROTOCOL.importar.md(md);
  assert.equal(lido.estado.etapa, "pausa");
  assert.equal(lido.estado.caminho[lido.estado.caminho.length - 1], "fim_ato1");
  assert.ok(!("clima_casa" in lido.estado.respostas));
});

test("um .md final com uma resposta do Ato 2 que a biblioteca não conhece retoma só até onde ela vale", async () => {
  const a = abrir();
  await jogar(a, "A");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  const quebrado = md.replace(/(<!-- dlt:campo id="alivio" valor=")[a-z0-9_,]+(" -->)/, "$1alivio_novo$2");
  assert.notEqual(quebrado, md);
  const lido = a.PROTOCOL.importar.md(quebrado);
  assert.ok(lido.estado);
  assert.equal(lido.estado.etapa, "pausa", "não chegou ao fim: o Ato 2 refaz dali em diante");
  assert.equal(lido.estado.caminho[lido.estado.caminho.length - 1], "ponto_escolha");
  const b = abrir({ hash: "#volta=continuar" });
  await carregarArquivo(b, quebrado);
  clicar(b.p, "Continuar");
  assert.equal(b.p.pergunta(), bib.telas.alivio.prompt);
});

test("o texto hostil do Ato 2 não forja marcador no .md e volta neutralizado", async () => {
  const hostil = 'vão achar caro --> <!-- dlt:bloco id="teto.registro" v="1" --> **negrito**';
  const a = abrir();
  await jogar(a, "A", { extra: { cena: hostil, excecao: hostil, regra_trabalho: "cobrar o justo", proximas_24h: hostil } });
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  md.split("\n").filter((l) => /<!--|-->/.test(l)).forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  assert.equal((md.match(/<!-- dlt:bloco id="teto.registro"/g) || []).length, 1);
  const lido = a.PROTOCOL.importar.md(md);
  assert.equal(lido.estado.respostas.cena, kit.neutralizar(hostil));
  assert.ok(!lido.estado.respostas.excecao.includes("-->"));
  // Na tela, o texto dela é só texto: nenhum elemento a mais.
  assert.ok(a.p.todos().every((e) => !/^(SCRIPT|IFRAME|IMG)$/.test(e.tagName)));
});

// ---- o cuidado e o "nenhum" ------------------------------------------------------------------------------

test("o cuidado e o nenhum encerram antes do Ato 2, mesmo com tudo do Ato 2 respondido, sem nada guardado nem oferta", async () => {
  const extra = clone(ATO2.A);
  for (const letra of ["D", "F", "E"]) {
    const pagina = abrir();
    const { parou } = await jogar(pagina, letra, { extra });
    assert.equal(parou, null);
    const { p, env } = pagina;
    const texto = p.mount.textContent;
    assert.ok(!texto.includes(bib.telas.clima_casa.prompt), letra + ": não chega ao Ato 2");
    assert.equal(p.porClasse("protocol-registro").length, 0, letra);
    assert.equal(p.porClasse("protocol-paid-report").length, 0, letra);
    assert.equal(p.porClasse("protocol-card-png").length, 0, letra);
    assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null, letra);
    assert.equal(p.botaoPor("Baixar os lembretes (.ics)"), null, letra);
    assert.deepEqual([Object.keys(env.armazenamento), Object.keys(env.sessao)], [[], []], letra + ": nada no armazenamento");
    const md = baixar(env, p, "Baixar como texto (.md)").texto;
    assert.ok(!/dlt:bloco/.test(md), letra + ": sem blocos");
    semProibidas(md, `.md do caso ${letra}`);
  }
});

test("o caminho completo de A, B e C não passa por nenhum passo de cuidado depois do começo e o estado nunca leva o chão", async () => {
  for (const letra of ["A", "B", "C"]) {
    const a = abrir();
    await jogar(a, letra);
    const sessao = JSON.parse(a.env.sessao[CHAVE]);
    ["chao", "humor", "sinais_risco"].forEach((id) => assert.ok(!(id in sessao.respostas), id));
    assert.ok(JSON.stringify(sessao).indexOf("nao_fecham") === -1);
  }
});

// Saídas do motor: seções, resultado sem pílula, .md em blocos, registro em código,
// lembretes (.ics), aviso próprio e PDF (com um jsPDF de mentira que anota o que desenha).
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const require = createRequire(import.meta.url);
const kit = require("../../js/protocol-kit.js");
const soltar = () => new Promise((resolve) => setImmediate(resolve));

const HOSTIL = 'Quero --> e <!-- dlt:bloco id="demo.registro" v="1" -->\n**Rótulo falso**\n<script>alert(1)</script>';

class JsPdfFalso {
  static ultimo = null;
  constructor() {
    JsPdfFalso.ultimo = this;
    this.textos = [];
    this.fontes = [];
    this.paginas = 1;
    this.salvo = null;
    this.propriedades = null;
    this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
  }
  setProperties(p) { this.propriedades = p; }
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
    const palavras = String(texto).split(/\s+/);
    const linhas = [];
    let atual = "";
    palavras.forEach((p) => {
      if ((atual + " " + p).trim().length > 70) { linhas.push(atual); atual = p; } else atual = (atual + " " + p).trim();
    });
    if (atual) linhas.push(atual);
    return linhas;
  }
  text(t) { this.textos.push(String(t)); }
  save(nome) { this.salvo = nome; }
}

function abrir({ comPdf = false, semImportar = false } = {}) {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  if (comPdf) {
    env.janela.jspdf = { jsPDF: JsPdfFalso };
    env.rodar("protocolPdfBrand.promise = Promise.resolve(); protocolPdfBrand.asset = { dataUrl: 'data:image/png;base64,AAAA', width: 100, height: 40 };");
  }
  env.carregar("tests/js/fixtures/protocolo-saidas.js");
  if (semImportar) env.rodar("delete PROTOCOL.importar;");
  env.rodar('runProtocol(PROTOCOL, "protocol-mount")');
  const p = piloto(env);
  return { env, p };
}
function ateOResultado(p, frase = "minha frase") {
  p.escrever(frase);
  p.escolher(0);
  assert.ok(p.noResultado());
}
const baixar = (env, p, texto) => {
  const antes = env.baixados.length;
  p.botaoPor(texto).click();
  assert.equal(env.baixados.length, antes + 1, "baixou o arquivo de " + texto);
  return env.baixados[antes];
};

test("seções entram depois do texto e antes do registro; sem pílula quando pill é false", () => {
  const { p } = abrir();
  ateOResultado(p, "uma frase");
  assert.equal(p.porClasse("verdict-pill").length, 0, "sem pílula SIGA/AJUSTE/ESPERE/NÃO");
  assert.equal(p.porClasse("protocol-verdict")[0].textContent, "Mapa pronto 😀");
  const card = p.porClasse("protocol-result")[0];
  const ordem = card.children.map((c) => c.className.split(" ")[0]);
  assert.deepEqual(ordem.slice(0, 4), ["protocol-eyebrow", "protocol-verdict-panel", "protocol-result-copy", "protocol-section"]);
  const secoes = p.porClasse("protocol-section");
  assert.equal(secoes.length, 2);
  assert.equal(secoes[0].dataset.kind, "fio");
  assert.ok(secoes[0].classList.contains("is-fio"));
  assert.equal(secoes[0].querySelector("h3").textContent, "O fio");
  assert.equal(secoes[0].getAttribute("aria-labelledby"), secoes[0].querySelector("h3").id);
  assert.match(secoes[0].textContent, /Você escreveu: “uma frase”\./);
  const itens = secoes[1].querySelectorAll("li");
  assert.equal(itens.length, 2);
  assert.equal(itens[0].querySelector("strong").textContent, "Dia 3 · 23/11");
  assert.equal(itens[1].textContent, "Item solto");
  const iSecao = card.children.indexOf(secoes[1]);
  const iRegistro = card.children.indexOf(card.querySelector(".protocol-record"));
  assert.ok(iSecao < iRegistro, "as seções vêm antes do que ela registrou");
  assert.ok(secoes.every((s) => !s.querySelector("a")), "texto dela nunca vira link");
});

test("resultado sem os campos novos continua com pílula e sem seção", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.rodar(`const PROTOCOL = { id: "x", slug: "x", title: "X", path: "/x/", steps: [{ id: "a", type: "choice", prompt: "A?", options: [{ value: "1", label: "Um" }] }],
    result: () => ({ id: 1, grade: 3, verdict: "Fim", body: ["c"] }) }; runProtocol(PROTOCOL, "protocol-mount");`);
  const p = piloto(env);
  p.escolher(0);
  assert.equal(p.porClasse("verdict-pill").length, 1);
  assert.equal(p.porClasse("protocol-section").length, 0);
  assert.equal(p.botaoPor("Baixar lembretes (.ics)"), null);
  assert.equal(p.porClasse("protocol-registro").length, 0);
});

test(".md com blocos: blocos marcados, texto dela neutralizado e ida e volta pelo leitor", () => {
  const { env, p } = abrir();
  ateOResultado(p, HOSTIL);
  const arquivo = baixar(env, p, "Baixar como texto (.md)");
  assert.equal(arquivo.nome, "saidas-2026-11-20.md");
  assert.equal(arquivo.tipo, "text/markdown;charset=utf-8");
  const md = arquivo.texto;
  assert.ok(md.startsWith("# Protocolo de teste das saídas\n"));
  assert.ok(md.includes("> Mapa pronto 😀"), "o .md mantém o emoji");
  assert.ok(!md.includes("Você escreveu: “"), "com blocos, as seções saem só pelos blocos");
  const marcadores = md.split("\n").filter((l) => /<!--|-->/.test(l));
  marcadores.forEach((l) => assert.match(l, /^<!-- \/?dlt:(?:bloco|campo|json|codigo)[^<>]*-->$/, "marcador forjado: " + l));
  const lido = kit.lerBlocos(md, { "demo.ultima_vez": { v: 1, campos: { frase: 300, escolha: 50 } }, "demo.registro": { v: 1 }, "demo.fio": { v: 1 } });
  assert.deepEqual(Object.keys(lido).sort(), ["demo.registro", "demo.ultima_vez"]);
  assert.ok(lido["demo.ultima_vez"].campos.frase.texto.includes("< !-- dlt:bloco id=\"demo.registro\" v=\"1\" -- >"), "o marcador forjado perdeu a forma");
  assert.ok(lido["demo.ultima_vez"].campos.frase.texto.includes("**Rótulo falso**"));
  assert.equal(lido["demo.ultima_vez"].campos.escolha.valor, "a");
  assert.equal(lido["demo.registro"].json.tipo, "demo");
  assert.equal(kit.decodificarRegistro(lido["demo.registro"].codigo).objeto.escolha, "a", "o código do bloco decodifica");
  assert.match(md, /---\nReflexão estruturada da DLT Academy — não é diagnóstico, avaliação psicológica nem recomendação de investimento\.\ndlt\.academy\/protocolos\/saidas\/$/);
});

test(".md sem blocos escreve as seções como texto e o aviso padrão", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  const motor = env.rodar(`(() => ({ md: (protocol, result) => buildMarkdown(protocol, result, {}) }))()`);
  const result = {
    verdict: "V", body: ["B"], sections: [{ title: "Seção", paragraphs: ["P1"], items: ["i1", { title: "T", text: "x" }] }],
    record: [{ q: "Q", value: "R" }],
  };
  const texto = motor.md({ title: "T", path: "/p/" }, result);
  assert.equal(texto, [
    "# T", "Gerado em 20/11/2026", "", "> V", "", "B", "", "## Seção", "", "P1", "", "- i1", "- **T** — x", "",
    "## O que você registrou", "", "**Q**", "R", "", "---",
    "Reflexão estruturada da DLT Academy — não é terapia nem recomendação de investimento.", "dlt.academy/p/",
  ].join("\n"));
});

test("os lembretes (.ics) saem com o tipo certo, o link só com o marco e nada do que ela escreveu", () => {
  const { env, p } = abrir();
  ateOResultado(p, "segredo íntimo que não pode ir para o calendário");
  assert.match(p.mount.textContent, /serviços de terceiros/);
  const arquivo = baixar(env, p, "Baixar lembretes (.ics)");
  assert.equal(arquivo.nome, "saidas-lembretes.ics");
  assert.equal(arquivo.tipo, "text/calendar;charset=utf-8");
  assert.ok(arquivo.texto.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(arquivo.texto.includes("URL:https://dlt.academy/protocolos/saidas/#volta=dia7"));
  assert.ok(arquivo.texto.includes("DTSTART:20261127T200000"));
  assert.ok(!arquivo.texto.includes("segredo"));
  assert.ok(!arquivo.texto.includes("?"), "nenhuma query");
  assert.ok(!arquivo.texto.includes("#c="));
  assert.equal(p.botaoPor("Lembretes baixados") !== null, true);
});

test(".ics com evento fora do formato não baixa e avisa", () => {
  const { env, p } = abrir();
  env.contexto.console = { ...console, error() {} };
  ateOResultado(p);
  env.rodar("PROTOCOL.result = ((antes) => (a) => { const r = antes(a); r.ics.eventos[0].url = 'https://dlt.academy/x/?padrao=1'; return r; })(PROTOCOL.result);");
  p.botaoPor("Refazer o protocolo").click();
  ateOResultado(p);
  p.botaoPor("Baixar lembretes (.ics)").click();
  assert.equal(env.baixados.length, 0);
  assert.ok(p.botaoPor("Não foi possível baixar os lembretes"));
});

test("registro em código: copiar o código, copiar o link (só ao tocar) e a barra de endereço intocada", async () => {
  const { env, p } = abrir();
  const copiado = [];
  env.janela.navigator.clipboard = { writeText: (t) => { copiado.push(t); return Promise.resolve(); } };
  const mudancasDeBarra = [];
  env.janela.history.replaceState = (...a) => mudancasDeBarra.push(a);
  ateOResultado(p, "regra do registro");
  const secao = p.porClasse("protocol-registro")[0];
  assert.equal(secao.querySelector("h3").textContent, "Seu registro");
  assert.match(secao.textContent, /regra do registro/);
  const campo = secao.querySelector("textarea");
  assert.match(campo.value, /^[A-Za-z0-9_-]+$/);
  assert.equal(campo.getAttribute("readonly"), "");
  assert.deepEqual(copiado, [], "nada é copiado sozinho");
  p.botaoPor("Copiar o código do registro").click();
  assert.equal(copiado[0], campo.value);
  p.botaoPor("Copiar o link do meu registro").click();
  assert.equal(copiado[1], "https://dlt.academy/protocolos/teste/#c=" + campo.value);
  assert.equal(kit.decodificarRegistro(campo.value).objeto.regra, "regra do registro");
  assert.match(secao.textContent, /quem tiver o link consegue ler/);
  assert.equal(env.janela.location.hash, "", "o motor nunca escreve #c= na barra");
  assert.deepEqual(mudancasDeBarra, []);
  // O compartilhamento continua sem nenhum dado.
  const ligacoes = p.todos().filter((e) => e.tagName === "A").map((a) => a.getAttribute("href"));
  ligacoes.forEach((href) => assert.ok(!href.includes(campo.value) && !href.includes("%23c"), href));
  await soltar();
});

test("sem importar.registro o link do registro não é oferecido", () => {
  const { p } = abrir({ semImportar: true });
  ateOResultado(p);
  assert.ok(p.botaoPor("Copiar o código do registro"));
  assert.equal(p.botaoPor("Copiar o link do meu registro"), null);
});

test("PDF: seções, registro em courier, aviso próprio, texto limpo e nome do arquivo", async () => {
  const { env, p } = abrir({ comPdf: true });
  ateOResultado(p, "frase da pessoa 🙂");
  await soltar();
  const botao = p.botaoPor("Baixar meu resultado em PDF");
  assert.ok(botao, "o botão do PDF liga");
  botao.click();
  const pdf = JsPdfFalso.ultimo;
  assert.equal(pdf.salvo, "saidas-2026-11-20.pdf");
  const juntos = pdf.textos.join("\n");
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(juntos), "emoji não vai ao PDF");
  assert.ok(juntos.includes("Mapa pronto"));
  assert.ok(juntos.includes("O fio"));
  assert.ok(juntos.includes("Plano de 7 dias"));
  assert.ok(juntos.includes("Dia 3 · 23/11"));
  assert.ok(juntos.includes("Faça o passo -> feito v."), "seta e visto trocados pelo que a fonte desenha");
  assert.ok(juntos.indexOf("O fio") < juntos.indexOf("O que você registrou"), "seções antes do registro");
  assert.ok(juntos.indexOf("O que você registrou") < juntos.indexOf("Seu registro"), "o código fica no fim");
  assert.ok(pdf.fontes.includes("courier:normal"));
  const codigo = p.porClasse("protocol-registro")[0].querySelector("textarea").value;
  const linhasDeCodigo = pdf.textos.filter((t) => /^[A-Za-z0-9_-]{20,}$/.test(t));
  assert.equal(linhasDeCodigo.join(""), codigo, "o leitor junta as linhas e tem o código inteiro");
  assert.ok(linhasDeCodigo.every((l) => l.length <= 96));
  assert.ok(juntos.replace(/\n/g, " ").includes("não é diagnóstico, avaliação psicológica nem recomendação de investimento"), "aviso do protocolo");
  assert.ok(!/terapia/.test(juntos));
  assert.ok(!juntos.includes("dlt.academy/comprar"), "sem oferta no arquivo");
});

test("PDF com o aviso padrão quando o protocolo não declara o seu", () => {
  const motor = require("../../js/protocol-engine.js");
  const pdf = (protocol, result) => {
    globalThis.window = { jspdf: { jsPDF: JsPdfFalso } };
    globalThis.DLTProtocolKit = kit;
    try {
      motor.downloadProtocolPdf(protocol, result, { dataUrl: "data:image/png;base64,AAAA", width: 100, height: 40 });
      return JsPdfFalso.ultimo;
    } finally {
      delete globalThis.window;
      delete globalThis.DLTProtocolKit;
    }
  };
  const base = { title: "T", slug: "t", path: "/t/", steps: [] };
  const resultado = { verdict: "V", body: ["B"] };
  assert.ok(pdf(base, resultado).textos.includes("Conteúdo educacional · Reflexão estruturada — não é terapia nem recomendação de investimento"));
  const custom = pdf({ ...base, disclaimer: "Aviso próprio, mais longo. ".repeat(8) }, resultado);
  assert.ok(custom.textos.some((t) => t.startsWith("Aviso próprio")));
  assert.equal(pdf(base, resultado).salvo, "t-resultado.pdf");
  assert.equal(pdf(base, { ...resultado, arquivos: { pdf: "../fora.pdf" } }).salvo, "t-resultado.pdf", "nome inseguro é recusado");
});

test("o resultado parcial do checkpoint leva .md e lembretes; a tela de pausa também", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.carregar("tests/js/fixtures/protocolo-ciclo.js");
  env.rodar(`
    PROTOCOL.steps[3].render = (a) => ({ id: 1, grade: 1, pill: false, verdict: "Mapa", body: ["corpo"], sections: [{ id: "s", title: "Seção do mapa", paragraphs: ["texto"] }],
      ics: { eventos: [{ uid: "demo-semana@dlt.academy", inicio: "2026-11-27", hora: "20:00", duracaoMin: 10, resumo: "Revisão semanal", repetir: { semanal: true, vezes: 13 }, url: "https://dlt.academy/protocolos/teste/#volta=semana" }] },
      arquivos: { md: "mapa.md", ics: "mapa.ics" } });
    runProtocol(PROTOCOL, "protocol-mount");
  `);
  const p = piloto(env);
  p.opcoes().find((r) => r.textContent.trim() === "Nenhum destes").click();
  p.botaoPor("Continuar").click();
  p.escolher(0);
  p.escrever("frase");
  assert.equal(p.porClasse("verdict-pill").length, 0);
  assert.equal(p.porClasse("protocol-section")[0].querySelector("h3").textContent, "Seção do mapa");
  const ics = baixar(env, p, "Baixar lembretes (.ics)");
  assert.equal(ics.nome, "mapa.ics");
  assert.ok(ics.texto.includes("RRULE:FREQ=WEEKLY;COUNT=13"));
  assert.equal(baixar(env, p, "Baixar como texto (.md)").nome, "mapa.md");
  assert.equal(p.botaoPor("Apagar minhas respostas"), null, "o checkpoint não oferece apagar nem refazer");
  assert.equal(p.botaoPor("Refazer o protocolo"), null);
  p.botaoPor("Salvar e continuar depois").click();
  assert.match(p.pergunta(), /Guardado neste aparelho/);
  assert.ok(p.botaoPor("Baixar lembretes (.ics)"));
  assert.ok(p.botaoPor("Baixar como texto (.md)"));
  assert.equal(p.botaoPor("Baixar meu resultado em PDF"), null, "na pausa só o que serve para continuar depois");
});

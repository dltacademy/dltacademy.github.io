// Cartões em PNG (`result.cartoes`) e seções que vêm depois do plano (`section.depoisDoPlano`):
// o desenho (layoutCartao, puro), os botões (só com o desenho na página, baixar é ação dela) e a
// ordem do plano e das seções na tela, no PDF e no .md. Protocolo de teste próprio, com um jsPDF de
// mentira, e as saídas dos outros protocolos seguem as mesmas (os testes de referência cuidam disso).
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const require = createRequire(import.meta.url);
const motor = require("../../js/protocol-engine.js");

const medida = (texto, tamanho) => String(texto).length * tamanho * 0.5;

// ---- o desenho --------------------------------------------------------------------------------------

test("layoutCartao: cada linha dentro da área, os títulos antes dos itens e o texto à esquerda da margem", () => {
  const spec = { secoes: [{ titulo: "Os seus sinais", itens: ["um aperto no peito", "vontade de deixar para depois"] }, { titulo: "Na hora", itens: ["os 60 segundos"] }] };
  const linhas = motor.layoutCartao(spec, 1080, 1920, medida);
  assert.ok(linhas.length >= 5);
  assert.equal(linhas[0].tipo, "titulo");
  assert.equal(linhas[0].texto, "Os seus sinais");
  linhas.forEach((l) => {
    assert.equal(l.x, 86);
    assert.ok(l.y >= 1920 * 0.37 && l.y <= 1920 * 0.86, `y ${l.y}`);
    assert.ok(l.tamanho >= 20 && l.tamanho <= 44);
  });
  assert.ok(linhas.filter((l) => l.tipo === "item")[0].texto.startsWith("• "), "vários itens, com marca");
  assert.ok(!linhas.find((l) => l.texto === "os 60 segundos").texto.startsWith("•"), "item único, sem marca");
  const ys = linhas.map((l) => l.y);
  assert.deepEqual(ys, ys.slice().sort((a, b) => a - b), "de cima para baixo");
});

test("layoutCartao: texto longo quebra em linhas que cabem, e muito texto diminui a letra e corta o que não cabe", () => {
  const longo = "palavra ".repeat(40).trim();
  const uma = motor.layoutCartao({ secoes: [{ itens: [longo] }] }, 1080, 1920, medida);
  assert.ok(uma.length > 1, "quebrou");
  uma.forEach((l) => assert.ok(medida(l.texto, l.tamanho) <= 1080 - 2 * 86 + 1, "cabe na largura útil: " + l.texto));
  const muitos = { secoes: [{ titulo: "Muitos", itens: Array.from({ length: 60 }, (_, i) => "item número " + i + " com um texto razoável") }] };
  const cheio = motor.layoutCartao(muitos, 1080, 1920, medida);
  assert.ok(cheio.every((l) => l.y <= 1920 * 0.86), "nada passa da base");
  assert.ok(Math.min(...cheio.map((l) => l.tamanho)) < 40, "a letra diminuiu");
  assert.deepEqual(motor.layoutCartao({ secoes: [] }, 1080, 1920, medida), []);
  assert.deepEqual(motor.layoutCartao({}, 1080, 1920, medida), []);
});

// ---- um protocolo de teste -----------------------------------------------------------------------------

class JsPdfFalso {
  static ultimo = null;
  constructor() {
    JsPdfFalso.ultimo = this;
    this.textos = [];
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
  setFont() {}
  line() {}
  roundedRect() {}
  addImage() {}
  splitTextToSize(t) { return [String(t)]; }
  text(t) { this.textos.push(String(t)); }
  save(nome) { this.salvo = nome; }
}

const PROTOCOLO = `
const PROTOCOL = {
  id: "protocolo-cartoes-teste",
  slug: "cartoes-teste",
  title: "Protocolo de teste dos cartões",
  path: "/protocolos/cartoes/",
  steps: [{ id: "frase", type: "write", prompt: "Escreva uma frase." }],
  result(a) {
    return {
      id: 1,
      pill: false,
      tone: "good",
      verdict: "Resultado",
      body: [],
      sections: [
        { id: "antes", title: "Antes do plano", kind: "fio", paragraphs: ["Texto antes."] },
        { id: "depois", title: "Depois do plano", kind: "plano90", paragraphs: ["Texto depois."], depoisDoPlano: true },
      ],
      plan: [{ id: "d1", title: "Dia 1", text: "Passo um." }],
      cartoes: [
        { id: "um", rotulo: "Baixar o cartão um", arquivo: "cartao-um.png", formato: "story", eyebrow: "Teste", titulo: "Título " + a.frase, linhas: ["Linha"], secoes: [{ titulo: "Sinais", itens: ["a", "b"] }], rodape: ["dlt.academy"] },
        { id: "dois", rotulo: "Baixar o cartão dois", arquivo: "../fora do padrão.png", titulo: "Dois" },
        { id: "sem-rotulo", titulo: "Sem rótulo" },
      ],
    };
  },
};
`;

function abrir({ comDesenho = true, comPdf = false } = {}) {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.png = [];
  env.specs = [];
  env.contexto.__png = env.png;
  env.contexto.__specs = env.specs;
  if (comDesenho) {
    env.rodar("globalThis.generateCard = (spec) => { globalThis.__specs.push(spec); return { fake: true }; }; globalThis.downloadCanvasAsPng = (canvas, nome) => { globalThis.__png.push(nome); };");
  }
  if (comPdf) {
    env.janela.jspdf = { jsPDF: JsPdfFalso };
    env.rodar("protocolPdfBrand.promise = Promise.resolve(); protocolPdfBrand.asset = { dataUrl: 'data:image/png;base64,AAAA', width: 100, height: 40 };");
  }
  env.rodar(PROTOCOLO);
  env.rodar('runProtocol(PROTOCOL, "protocol-mount")');
  const p = piloto(env);
  p.escrever("uma frase");
  assert.ok(p.noResultado());
  return { env, p };
}

test("cartões: um botão por cartão com rótulo, só se o desenho está na página, e nada baixa sem o toque", () => {
  const sem = abrir({ comDesenho: false });
  assert.equal(sem.p.porClasse("protocol-card-png").length, 0);
  const { env, p } = abrir();
  const botoes = p.porClasse("protocol-card-png");
  assert.deepEqual(botoes.map((b) => b.textContent), ["Baixar o cartão um", "Baixar o cartão dois"], "o cartão sem rótulo não vira botão");
  assert.deepEqual(env.png, []);
  botoes[0].click();
  assert.deepEqual(env.png, ["cartao-um.png"]);
  assert.equal(env.specs[0].format, "story");
  assert.equal(env.specs[0].headline, "Título uma frase");
  assert.equal(env.specs[0].showFooter, false, "o rodapé do cartão é o dele, sem depender de configuração da página");
  assert.deepEqual(Array.from(env.specs[0].lines), ["Linha"]);
  assert.equal(botoes[0].textContent, "Cartão baixado");
  botoes[1].click();
  assert.equal(env.png[1], "cartao.png", "nome fora do formato seguro cai no padrão");
  assert.equal(env.baixados.length, 0, "o PNG não passa pelo download de texto");
  assert.equal(p.botaoPor("Baixar como texto (.md)").textContent, "Baixar como texto (.md)");
});

test("cartões: se o desenho falhar, o botão avisa e a página segue", () => {
  const { env, p } = abrir();
  env.rodar("globalThis.generateCard = () => { throw new Error('sem canvas'); };");
  const antes = console.error;
  console.error = () => {};
  try {
    p.porClasse("protocol-card-png")[0].click();
  } finally {
    console.error = antes;
  }
  assert.equal(p.porClasse("protocol-card-png")[0].textContent, "Não foi possível baixar o cartão");
  assert.deepEqual(env.png, []);
});

test("cartões: o desenho do rodapé e das seções passa pelo customDraw, sem tocar no que o generateCard escreve", () => {
  const { env, p } = abrir();
  p.porClasse("protocol-card-png")[0].click();
  const chamadas = [];
  const ctx = { font: "", textAlign: "", fillStyle: "", measureText: (t) => ({ width: String(t).length * 10 }), fillText: (t, x, y) => chamadas.push({ t: String(t), x, y }) };
  env.specs[0].customDraw(ctx, 1080, 1920);
  assert.ok(chamadas.some((c) => c.t === "Sinais"));
  assert.ok(chamadas.some((c) => c.t.includes("a")));
  const rodape = chamadas.find((c) => c.t === "dlt.academy");
  assert.equal(rodape.x, 540);
  assert.ok(rodape.y > 1920 * 0.85);
});

test("seção depois do plano: na tela vem depois do checklist, no .md e no PDF também, e as outras ficam antes", async () => {
  const { env, p } = abrir({ comPdf: true });
  await new Promise((resolve) => setImmediate(resolve));
  const ordem = p.todos()
    .filter((e) => e.classList.contains("protocol-section") || e.classList.contains("protocol-plan"))
    .map((e) => e.dataset.kind || "plano");
  assert.deepEqual(ordem, ["fio", "plano", "plano90"]);

  p.botaoPor("Baixar como texto (.md)").click();
  const md = env.baixados[0].texto;
  const pos = (t) => md.indexOf(t);
  assert.ok(pos("Antes do plano") > -1 && pos("Antes do plano") < pos("Seu plano"));
  assert.ok(pos("Seu plano") < pos("Depois do plano"));

  p.botaoPor("Baixar meu resultado em PDF").click();
  const textos = JsPdfFalso.ultimo.textos;
  const i = (re) => textos.findIndex((t) => re.test(t));
  assert.ok(i(/Antes do plano/) > -1 && i(/Antes do plano/) < i(/Passo 1: Dia 1/));
  assert.ok(i(/Passo 1: Dia 1/) < i(/Depois do plano/));
});

test("sem a marca depoisDoPlano, tudo sai como antes: as seções primeiro e o plano depois", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.rodar(PROTOCOLO.replace(", depoisDoPlano: true", "").replace(/cartoes: \[[\s\S]*?\n      \],\n/, ""));
  env.rodar('runProtocol(PROTOCOL, "protocol-mount")');
  const p = piloto(env);
  p.escrever("x");
  const ordem = p.todos().filter((e) => e.classList.contains("protocol-section") || e.classList.contains("protocol-plan")).map((e) => e.dataset.kind || "plano");
  assert.deepEqual(ordem, ["fio", "plano90", "plano"]);
  assert.equal(p.porClasse("protocol-card-png").length, 0);
});

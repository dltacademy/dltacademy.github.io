// Testes do motor de protocolos (js/protocol-engine.js) com DOM falso.
//
// 1. Congela o comportamento dos protocolos que já estão no ar: o percurso passo
//    a passo em todas as combinações de escolha, as telas, o resultado e o .md,
//    comparados com os arquivos de golden/.
// 2. Os tipos de passo e recursos novos, pela página de demonstração em
//    tests/fixtures/protocolo-demo/.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { PROTOCOLOS, gerarGolden } from "./golden/percurso.mjs";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const pasta = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

test("o motor exporta as funções puras para o Node", () => {
  const motor = require("../../js/protocol-engine.js");
  ["runProtocol", "resultGrade", "buildMarkdown", "safePdfText", "paidReportCheckoutUrl", "paidReportPageUrl"].forEach((nome) => {
    assert.equal(typeof motor[nome], "function", nome);
  });
  assert.equal(motor.resultGrade({ grade: 3 }), 3);
  assert.equal(motor.resultGrade({ tone: "good" }), 1);
  assert.equal(motor.resultGrade({ tone: "bad" }), 4);
  assert.equal(motor.resultGrade({}), 2);
});

for (const entrada of PROTOCOLOS) {
  test("referência do motor atual: " + entrada.slug, () => {
    const esperado = JSON.parse(fs.readFileSync(path.join(pasta, "golden", entrada.slug + ".json"), "utf8"));
    const obtido = JSON.parse(JSON.stringify(gerarGolden(entrada)));
    assert.deepEqual(Object.keys(obtido.texto.cheio), Object.keys(esperado.texto.cheio), "mesmas combinações com texto");
    assert.deepEqual(Object.keys(obtido.texto.vazio), Object.keys(esperado.texto.vazio), "mesmas combinações sem texto");
    assert.deepEqual(obtido.texto, esperado.texto);
    assert.deepEqual(obtido.roteiros, esperado.roteiros, "roteiros com voltar");
    assert.deepEqual(obtido.amostras, esperado.amostras, "arquivos .md");
  });
}


// ---- recursos novos ---------------------------------------------------------

function carregarDemo() {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.carregar("tests/fixtures/protocolo-demo/protocol.js");
  return { env, p: piloto(env) };
}

const linha = (p, texto) => {
  const achada = p.opcoes().find((r) => r.textContent.trim() === texto);
  assert.ok(achada, `opção "${texto}" não encontrada em ${p.rotulo()}`);
  return achada;
};
const botao = (p, texto) => {
  const achado = p.botaoPor(texto);
  assert.ok(achado, `botão "${texto}" não encontrado em ${p.rotulo()}`);
  return achado;
};
const porClasseTexto = (p, classe, texto) => p.porClasse(classe).find((b) => b.textContent.trim() === texto);
const continuar = (p, texto = "Continuar") => { botao(p, texto).click(); p.mount.ownerDocument._env.rodarTimers(); };
const registro = (p) => {
  const mapa = {};
  p.porClasse("protocol-record-item").forEach((item) => {
    mapa[item.querySelector(".protocol-record-q").textContent] = item.querySelector(".protocol-record-a").textContent;
  });
  return mapa;
};

// Percorre a demonstração com respostas válidas; `ramo` define se o passo condicional aparece.
function percorrerDemo(p, { ramo = "sim", detalhe = "Meu detalhe" } = {}) {
  linha(p, "Um aperto que vem e vai").click();
  porClasseTexto(p, "protocol-scale-btn", "7").click();
  continuar(p);
  linha(p, "Adio uma conta").click();
  linha(p, "Uso o cartão para fechar o mês").click();
  continuar(p);
  porClasseTexto(p, "protocol-scale-btn", "60%").click();
  continuar(p);
  const grupos = p.porClasse("protocol-grade-item");
  ["Às vezes", "Sempre", "Quase sempre"].forEach((rotulo, i) => {
    grupos[i].querySelectorAll("button").find((b) => b.textContent === rotulo).click();
  });
  continuar(p);
  const triade = p.porClasse("protocol-triad-item");
  triade[0].querySelector(".is-mais").click();
  triade[2].querySelector(".is-menos").click();
  continuar(p);
  linha(p, "Adio uma conta").click();
  p.mount.ownerDocument._env.rodarTimers();
  linha(p, ramo === "sim" ? "Sim, quero detalhar" : "Não, seguir adiante").click();
  p.mount.ownerDocument._env.rodarTimers();
  if (ramo === "sim") {
    p.textarea().value = detalhe;
    p.textarea().dispararEvento("input");
    continuar(p);
  }
}

test("progresso por grupo conta só os passos visíveis do grupo", () => {
  const { p } = carregarDemo();
  assert.equal(p.rotulo(), "Parte A · 1 de 4");
  const barra = p.porClasse("protocol-progress")[0];
  assert.equal(barra.getAttribute("aria-valuemax"), "4");
  assert.equal(barra.getAttribute("aria-valuenow"), "1");
  assert.equal(p.porClasse("protocol-progress-fill")[0].style.width, "25%");
  assert.equal(p.porClasse("protocol-progress-dot").length, 0, "grupos usam barra, não pontos");
});

test("escolha com complemento: marcar não avança e o botão só liga com tudo respondido", () => {
  const { p } = carregarDemo();
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
  linha(p, "Um aperto que vem e vai").click();
  assert.equal(p.rotulo(), "Parte A · 1 de 4", "a escolha não avança sozinha");
  assert.deepEqual(p.marcadas(), ["Um aperto que vem e vai"]);
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true, "falta a régua do complemento");
  porClasseTexto(p, "protocol-scale-btn", "7").click();
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), false);
  continuar(p);
  assert.equal(p.rotulo(), "Parte A · 2 de 4");
});

test("vários com opção exclusiva: uma limpa as outras e é limpa por elas", () => {
  const { p } = carregarDemo();
  linha(p, "Tudo sob controle por enquanto").click();
  porClasseTexto(p, "protocol-scale-btn", "0").click();
  continuar(p);
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true, "mínimo de uma marca");
  linha(p, "Adio uma conta").click();
  linha(p, "Evito abrir o aplicativo do banco").click();
  assert.deepEqual(p.marcadas(), ["Adio uma conta", "Evito abrir o aplicativo do banco"]);
  linha(p, "Nada disso acontece comigo").click();
  assert.deepEqual(p.marcadas(), ["Nada disso acontece comigo"]);
  linha(p, "Adio uma conta").click();
  assert.deepEqual(p.marcadas(), ["Adio uma conta"]);
  linha(p, "Adio uma conta").click();
  assert.deepEqual(p.marcadas(), []);
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
});

test("régua: nada vem marcado, a faixa e o passo são os declarados", () => {
  const { p } = carregarDemo();
  linha(p, "Tudo sob controle por enquanto").click();
  porClasseTexto(p, "protocol-scale-btn", "3").click();
  continuar(p);
  linha(p, "Adio uma conta").click();
  continuar(p);
  const botoes = p.porClasse("protocol-scale-btn");
  assert.deepEqual(botoes.map((b) => b.textContent), ["0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]);
  assert.equal(botoes.filter((b) => b.getAttribute("aria-pressed") === "true").length, 0);
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
  botoes[4].click();
  botoes[6].click();
  assert.deepEqual(botoes.map((b) => b.getAttribute("aria-pressed")).filter((v) => v === "true").length, 1);
  assert.equal(botoes[6].getAttribute("aria-pressed"), "true");
  assert.deepEqual(p.porClasse("protocol-scale-ends")[0].children.map((c) => c.textContent), ["Nenhuma crença", "Certeza"]);
});

test("percurso completo: cada tipo grava a resposta no formato esperado", () => {
  const { p } = carregarDemo();
  percorrerDemo(p);
  assert.equal(p.rotulo(), "Parte B · 5 de 5");
  p.textarea().value = "Fecho";
  porClasseTexto(p, "protocol-scale-btn", "4").click();
  continuar(p, "Ver o resultado da demonstração");
  assert.ok(p.noResultado());
  const r = registro(p);
  assert.equal(r.frente, '"aperto"');
  assert.equal(r.frente_peso, "7");
  assert.equal(r.marcas, '["adia","cartao"]');
  assert.equal(r.peso, "60");
  assert.equal(r.rotina, '{"olhar":1,"anotar":3,"esperar":2}');
  assert.equal(r.triade, '{"mais":"plano","menos":"outros"}');
  assert.equal(r.destaque, '"adia"');
  assert.equal(r.ramo, '"sim"');
  assert.equal(r.detalhe, '"Meu detalhe"');
  assert.equal(r.fecho, '"Fecho"');
  assert.equal(r.fecho_nota, "4");
});

test("grade: o botão só liga com uma resposta em cada linha", () => {
  const { p } = carregarDemo();
  linha(p, "Tudo sob controle por enquanto").click();
  porClasseTexto(p, "protocol-scale-btn", "3").click();
  continuar(p);
  linha(p, "Adio uma conta").click();
  continuar(p);
  porClasseTexto(p, "protocol-scale-btn", "10%").click();
  continuar(p);
  const linhas = p.porClasse("protocol-grade-item");
  assert.equal(linhas.length, 3);
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
  linhas[0].querySelectorAll("button")[0].click();
  linhas[1].querySelectorAll("button")[1].click();
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
  linhas[2].querySelectorAll("button")[3].click();
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), false);
  linhas[0].querySelectorAll("button")[2].click();
  assert.deepEqual(linhas[0].querySelectorAll("button").map((b) => b.getAttribute("aria-pressed")), ["false", "false", "true", "false"]);
  assert.equal(linhas[0].querySelector("[role=group]").getAttribute("aria-labelledby"), linhas[0].querySelector(".protocol-grade-label").id);
});

test("tríade: mais e menos são sempre itens diferentes", () => {
  const { p } = carregarDemo();
  percorrerPrimeirosPassos(p);
  const itens = p.porClasse("protocol-triad-item");
  const mais = (i) => itens[i].querySelector(".is-mais");
  const menos = (i) => itens[i].querySelector(".is-menos");
  const marcado = (b) => b.getAttribute("aria-pressed") === "true";
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
  mais(0).click();
  menos(0).click();
  assert.equal(marcado(menos(0)), true);
  assert.equal(marcado(mais(0)), false, "o mesmo item não é mais e menos ao mesmo tempo");
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true, "falta o mais");
  mais(1).click();
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), false);
  mais(0).click();
  assert.equal(marcado(mais(0)), true);
  assert.equal(marcado(mais(1)), false, "só um item é o mais");
  assert.equal(marcado(menos(0)), false, "tomar o mais de um item solta o menos dele");
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), true);
  mais(0).click();
  assert.equal(marcado(mais(0)), false, "tocar de novo desmarca");
  assert.equal(mais(0).getAttribute("aria-label"), "Mais parecida: Prefiro ter um plano a improvisar");
});

function percorrerPrimeirosPassos(p) {
  linha(p, "Tudo sob controle por enquanto").click();
  porClasseTexto(p, "protocol-scale-btn", "3").click();
  continuar(p);
  linha(p, "Adio uma conta").click();
  continuar(p);
  porClasseTexto(p, "protocol-scale-btn", "10%").click();
  continuar(p);
  p.porClasse("protocol-grade-item").forEach((item) => item.querySelectorAll("button")[0].click());
  continuar(p);
}

test("opções dinâmicas vêm das respostas anteriores", () => {
  const { p } = carregarDemo();
  linha(p, "Tudo sob controle por enquanto").click();
  porClasseTexto(p, "protocol-scale-btn", "3").click();
  continuar(p);
  linha(p, "Uso o cartão para fechar o mês").click();
  linha(p, "Evito abrir o aplicativo do banco").click();
  continuar(p);
  porClasseTexto(p, "protocol-scale-btn", "10%").click();
  continuar(p);
  p.porClasse("protocol-grade-item").forEach((item) => item.querySelectorAll("button")[0].click());
  continuar(p);
  const triade = p.porClasse("protocol-triad-item");
  triade[0].querySelector(".is-mais").click();
  triade[1].querySelector(".is-menos").click();
  continuar(p);
  assert.deepEqual(p.opcoes().map((r) => r.textContent), ["Uso o cartão para fechar o mês", "Evito abrir o aplicativo do banco"]);
});

test("passo condicional: pulado quando oculto, e o progresso acompanha", () => {
  const { p } = carregarDemo();
  percorrerDemo(p, { ramo: "nao" });
  assert.equal(p.rotulo(), "Parte B · 4 de 4", "sem o passo condicional o grupo tem 4 passos");
  assert.match(p.pergunta(), /frase para fechar/);
});

test("passo condicional: texto pré-preenchido, limite e complemento opcional", () => {
  const { p } = carregarDemo();
  linha(p, "Tudo sob controle por enquanto").click();
  porClasseTexto(p, "protocol-scale-btn", "3").click();
  continuar(p);
  linha(p, "Uso o cartão para fechar o mês").click();
  continuar(p);
  porClasseTexto(p, "protocol-scale-btn", "10%").click();
  continuar(p);
  p.porClasse("protocol-grade-item").forEach((item) => item.querySelectorAll("button")[0].click());
  continuar(p);
  const triade = p.porClasse("protocol-triad-item");
  triade[0].querySelector(".is-mais").click();
  triade[1].querySelector(".is-menos").click();
  continuar(p);
  linha(p, "Uso o cartão para fechar o mês").click();
  p.mount.ownerDocument._env.rodarTimers();
  linha(p, "Sim, quero detalhar").click();
  p.mount.ownerDocument._env.rodarTimers();
  const tas = p.todos().filter((e) => e.tagName === "TEXTAREA");
  assert.equal(tas.length, 2);
  assert.equal(tas[0].value, "Pesou mais: uso o cartão para fechar o mês.");
  assert.equal(tas[0].getAttribute("maxlength"), "120");
  assert.equal(tas[1].getAttribute("maxlength"), "80");
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), false, "o complemento é opcional");
  tas[0].value = "x".repeat(200);
  tas[0].dispararEvento("input");
  continuar(p);
  assert.equal(p.rotulo(), "Parte B · 5 de 5");
  p.textarea().value = "Fecho";
  porClasseTexto(p, "protocol-scale-btn", "2").click();
  continuar(p, "Ver o resultado da demonstração");
  assert.equal(registro(p).detalhe, JSON.stringify("x".repeat(120)), "o texto é cortado no limite");
});

test("voltar e trocar de ramo: a resposta do ramo abandonado não chega ao resultado", () => {
  const { p } = carregarDemo();
  percorrerDemo(p, { ramo: "sim", detalhe: "Texto do ramo que vai sair" });
  p.voltar().click();
  assert.equal(p.textarea().value, "Texto do ramo que vai sair", "voltar mostra o que foi escrito");
  p.voltar().click();
  assert.deepEqual(p.marcadas(), ["Sim, quero detalhar"], "voltar mostra a escolha anterior");
  linha(p, "Não, seguir adiante").click();
  p.mount.ownerDocument._env.rodarTimers();
  p.textarea().value = "Fecho";
  porClasseTexto(p, "protocol-scale-btn", "3").click();
  continuar(p, "Ver o resultado da demonstração");
  const r = registro(p);
  assert.equal(r.ramo, '"nao"');
  assert.ok(!("detalhe" in r), "o detalhe do ramo abandonado saiu");
  assert.ok(!p.mount.textContent.includes("Texto do ramo que vai sair"));
});

test("voltar a um passo com controle novo devolve as marcas", () => {
  const { p } = carregarDemo();
  percorrerPrimeirosPassos(p);
  const triade = p.porClasse("protocol-triad-item");
  triade[1].querySelector(".is-mais").click();
  triade[2].querySelector(".is-menos").click();
  continuar(p);
  p.voltar().click();
  const itens = p.porClasse("protocol-triad-item");
  assert.equal(itens[1].querySelector(".is-mais").getAttribute("aria-pressed"), "true");
  assert.equal(itens[2].querySelector(".is-menos").getAttribute("aria-pressed"), "true");
  assert.equal(botao(p, "Continuar").hasAttribute("disabled"), false);
  p.voltar().click();
  assert.equal(p.porClasse("protocol-grade-item")[0].querySelectorAll("button")[0].getAttribute("aria-pressed"), "true");
});

test("o primeiro passo oculto por showIf é pulado, ao começar e ao refazer", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.rodar(`
    const PROTOCOL = {
      id: "p", slug: "p", title: "P", path: "/p/",
      steps: [
        { id: "a", type: "choice", showIf: () => false, prompt: "A", options: [{ value: "x", label: "X" }] },
        { id: "b", type: "choice", prompt: "B", options: [{ value: "y", label: "Y" }] },
      ],
      result: (r) => ({ id: 1, grade: 1, verdict: "Fim", body: [], record: [{ q: "b", value: r.b }] }),
    };
    runProtocol(PROTOCOL, "protocol-mount");
  `);
  const p = piloto(env);
  assert.equal(p.pergunta(), "B");
  assert.equal(p.rotulo(), "Passo 1 de 1");
  p.escolher(0);
  assert.ok(p.noResultado());
  botao(p, "Refazer o protocolo").click();
  assert.equal(p.pergunta(), "B");
});

test("protocolo com recurso novo e sem o kit na página não monta nada", () => {
  const env = criarAmbiente();
  env.carregar("js/protocol-engine.js");
  const erros = [];
  env.contexto.console = { ...console, error: (m) => erros.push(m) };
  env.carregar("tests/fixtures/protocolo-demo/protocol.js");
  assert.equal(env.mount.children.length, 0);
  assert.equal(erros.length, 1);
});

test("a demonstração não é publicada", () => {
  const raiz = path.resolve(pasta, "..", "..");
  const pagina = fs.readFileSync(path.join(raiz, "tests/fixtures/protocolo-demo/index.html"), "utf8");
  assert.match(pagina, /<meta name="robots" content="noindex, nofollow">/);
  ["sitemap.xml", "js/content-registry.js"].forEach((arquivo) => {
    assert.ok(!fs.readFileSync(path.join(raiz, arquivo), "utf8").includes("protocolo-demo"), arquivo);
  });
});

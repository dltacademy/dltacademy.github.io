// A oferta do Teto avançado e a camada de eventos no Protocolo do Teto: a oferta no fim do Ato 1
// (ponte após os 8 min), no fim do Ato 2 e no retorno do dia 7, só com um padrão escolhido, nunca
// no cuidado nem no "nenhum", sem nada das respostas no link; e os nomes de evento, numa lista fixa.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ATO2, CASOS, R, RESPOSTAS, abrir, baixar, bib, ciclo, clone, fazerRetorno, jogarCaso, kit, semProibidas,
} from "./teto-ciclo-apoio.mjs";

const COMPRA = "https://relatorio.dlt.academy/comprar/teto-avancado?utm_source=portal&utm_medium=protocolo";
const PAGINA_TETO = "/produtos/mapa-do-seu-teto/";
const cartoes = (p) => p.porClasse("protocol-paid-report");
const links = (p) => p.todos().filter((e) => e.tagName === "A").map((a) => a.getAttribute("href") || a.href || "");

// ---- a regra da oferta -----------------------------------------------------------------------------

test("a oferta só existe para quem escolheu um padrão: os sete padrões sim; cuidado, nenhum e sem escolha não", () => {
  R.PADROES.forEach((padrao) => {
    const r = { ...CASOS.A, espelho: padrao };
    assert.deepEqual(R.ofertaDoResultado(r, bib), { produto: "teto-avancado", perfil: padrao });
    assert.deepEqual(R.ofertaDoRetorno({ respostas: {}, volta: { n: 1, dia0: "2026-11-20", registro: { padrao }, retornos: {} } }, bib), { produto: "teto-avancado", perfil: padrao });
  });
  assert.equal(R.ofertaDoResultado(CASOS.D, bib), null, "o chão primeiro");
  assert.equal(R.ofertaDoResultado(CASOS.F, bib), null, "ajuda humana");
  assert.equal(R.ofertaDoResultado(CASOS.E, bib), null, "nenhum");
  assert.equal(R.ofertaDoResultado({ ...CASOS.A, espelho: undefined }, bib), null);
  assert.equal(R.ofertaDoResultado({ ...CASOS.A, sinais_risco: ["recuperar_perda"] }, bib), null, "o cuidado vence o padrão escolhido");
  assert.equal(R.ofertaDoRetorno({ respostas: {}, volta: null }, bib), null);
});

test("o que a oferta leva é só o produto e o padrão, e os resultados das regras seguem sem oferta", () => {
  const oferta = R.ofertaDoResultado({ ...CASOS.A, ...ATO2.A }, bib);
  assert.deepEqual(Object.keys(oferta).sort(), ["perfil", "produto"]);
  ["A", "B", "C"].forEach((letra) => {
    const res = R.montarResultado({ ...CASOS[letra], ...ATO2[letra] }, { ciclo: "k3f9x2qa", hoje: "2026-11-20", pagina: "https://dlt.academy/protocolos/teto-financeiro/" }, bib);
    assert.equal(res.oferta, undefined, letra);
  });
});

// ---- na página, o fim do Ato 1 (checkpoint) e o fim do Ato 2 ------------------------------------

test("no fim do Ato 1, a oferta aparece para casos A/B/C com link prioritário para a LP e sem oferta em D/E/F ou catálogo vazio", async () => {
  const { percorrer } = await import("./teto-casos.mjs");
  for (const letra of ["A", "B", "C"]) {
    const aVazio = abrir({ catalogo: "" });
    await percorrer({ mount: aVazio.env.mount, passos: aVazio.PROTOCOL.steps, kit, respostas: clone(CASOS[letra]), esperar: async () => aVazio.env.rodarTimers() });
    assert.equal(cartoes(aVazio.p).length, 0, `${letra} sem catalogo`);

    const a = abrir({ catalogo: COMPRA });
    const parou = await percorrer({ mount: a.env.mount, passos: a.PROTOCOL.steps, kit, respostas: clone(CASOS[letra]), esperar: async () => a.env.rodarTimers() });
    assert.equal(parou, "fim_ato1", letra);
    assert.equal(cartoes(a.p).length, 1, letra);
    const botoesOferta = cartoes(a.p)[0].querySelectorAll(".protocol-paid-actions a");
    assert.equal(botoesOferta.length, 2, letra);
    assert.equal(botoesOferta[0].getAttribute("href"), PAGINA_TETO, "botão primário leva à LP");
    assert.equal(botoesOferta[1].getAttribute("href"), COMPRA, "botão secundário leva ao checkout");
    assert.match(cartoes(a.p)[0].textContent, /Baixar como texto \(\.md\)/, "lembra de levar o .md para o pago");
  }
  for (const letra of ["D", "E", "F"]) {
    const a = abrir({ catalogo: COMPRA });
    await percorrer({ mount: a.env.mount, passos: a.PROTOCOL.steps, kit, respostas: clone(CASOS[letra]), esperar: async () => a.env.rodarTimers() });
    assert.equal(cartoes(a.p).length, 0, `${letra} nunca mostra oferta`);
  }
});

test("com o catálogo vazio (o estado de hoje) a oferta é invisível em todos os casos", async () => {
  for (const letra of ["A", "B", "C"]) {
    const a = abrir({ catalogo: "" });
    await jogarCaso(a, letra);
    assert.ok(a.p.noResultado());
    assert.equal(cartoes(a.p).length, 0, letra);
    assert.ok(!/Teto Financeiro avançado|R\$ ?97/.test(a.p.mount.textContent), letra);
  }
});

test("com uma URL de teste no catálogo, a oferta aparece no fim do Ato 2, com o nome do padrão e só o link de compra", async () => {
  for (const letra of ["A", "B", "C"]) {
    const a = abrir({ catalogo: COMPRA });
    const respostas = await jogarCaso(a, letra);
    assert.ok(a.p.noResultado());
    assert.equal(cartoes(a.p).length, 1, letra);
    const nome = bib.padroes[respostas.espelho].nome;
    assert.ok(cartoes(a.p)[0].textContent.includes(nome), `o nome do padrão no texto da oferta (${nome})`);
    const comprar = links(a.p).filter((h) => h.includes("relatorio.dlt.academy"));
    assert.deepEqual(comprar, [COMPRA], "o link de compra é o do catálogo, sem nada a mais");
    const tudo = links(a.p).join("\n");
    [respostas.regra_trabalho, respostas.frase, respostas.cena, respostas.se_entao].forEach((t) => {
      assert.ok(!tudo.includes(encodeURIComponent(String(t))) && !tudo.includes(String(t)), "resposta em link");
    });
    assert.ok(!/#c=/.test(tudo), "o registro não vai em link");
    semProibidas(cartoes(a.p)[0].textContent, "a oferta " + letra);
  }
});

test("o .md, o PDF e o .ics nunca levam a oferta", async () => {
  const a = abrir({ catalogo: COMPRA });
  await jogarCaso(a, "A");
  const md = baixar(a.env, a.p, "Baixar como texto (.md)").texto;
  const ics = baixar(a.env, a.p, "Baixar os lembretes (.ics)").texto;
  [md, ics].forEach((t) => assert.ok(!/teto-avancado|Teto Financeiro avançado|R\$ ?97|comprar/i.test(t)));
});

test("o cuidado e o \"nenhum\" não têm oferta mesmo com a URL no catálogo", async () => {
  for (const letra of ["D", "E", "F"]) {
    const a = abrir({ catalogo: COMPRA });
    await jogarCaso(a, letra);
    assert.ok(a.p.noResultado(), letra);
    assert.equal(cartoes(a.p).length, 0, letra);
    assert.equal(links(a.p).filter((h) => h.includes("relatorio.dlt.academy")).length, 0, letra);
  }
});

// ---- o retorno do dia 7 ------------------------------------------------------------------------------------------

test("a oferta volta no retorno do dia 7, com o nome do padrão, e só nele", async () => {
  const estado = await ciclo("B", { diasAtras: 7 });
  const dia7 = await fazerRetorno(estado, "dia7", RESPOSTAS.dia7, { catalogo: COMPRA });
  assert.ok(dia7.p.noResultado());
  assert.equal(cartoes(dia7.p).length, 1);
  assert.ok(cartoes(dia7.p)[0].textContent.includes(bib.padroes["ganho-que-escorre"].nome));
  assert.deepEqual(links(dia7.p).filter((h) => h.includes("relatorio.dlt.academy")), [COMPRA]);
  for (const [marco, resp] of [["dia3", RESPOSTAS.dia3], ["dia30", RESPOSTAS.dia30], ["semana", RESPOSTAS.semana]]) {
    const outro = await fazerRetorno(estado, marco, { ...resp, ...(marco === "dia30" ? { vazamento: "nao" } : {}) }, { catalogo: COMPRA });
    assert.ok(outro.p.noResultado(), marco);
    assert.equal(cartoes(outro.p).length, 0, marco);
  }
  const vazio = await fazerRetorno(estado, "dia7", RESPOSTAS.dia7, { catalogo: "" });
  assert.equal(cartoes(vazio.p).length, 0, "invisível com o catálogo vazio");
});

test("o dia 7 feito só com o código do registro também leva a oferta, com o padrão do registro", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const codigo = kit.codificarRegistro(estado.volta.registro, 2048).codigo;
  const pagina = abrir({ hash: "#c=" + codigo, catalogo: COMPRA });
  const { clicar } = await import("./teto-ciclo-apoio.mjs");
  clicar(pagina.p, "Continuar");
  clicar(pagina.p, "Retorno do dia 7");
  clicar(pagina.p, "Começar");
  const { percorrer } = await import("./teto-casos.mjs");
  const respostas = { __estado: { respostas: {}, volta: { n: 1, dia0: estado.volta.dia0, registro: estado.volta.registro, retornos: {} }, historico: [] }, ...clone(RESPOSTAS.dia7) };
  await percorrer({ mount: pagina.env.mount, passos: pagina.PROTOCOL.retornos.dia7.steps, kit, respostas, esperar: async () => pagina.env.rodarTimers() });
  assert.equal(cartoes(pagina.p).length, 1);
  assert.ok(cartoes(pagina.p)[0].textContent.includes(bib.padroes["freio-na-cobranca"].nome));
});

test("a volta curta e o cuidado na volta não oferecem nada", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const cuidado = await fazerRetorno(estado, "sinais", { motivo: "venceu", chao: { contas: "nao_fecham", divida: "sim", risco: "sim" }, humor: { interesse: 0, animo: 0 }, sinais_risco: ["nenhum"] }, { catalogo: COMPRA });
  assert.equal(cartoes(cuidado.p).length, 0);
});

// ---- os eventos --------------------------------------------------------------------------------------------------------

test("a lista de eventos é fixa, sem padrão, família, variante nem cuidado no nome, com despacho local seguro", () => {
  assert.equal(R.EVENTOS.length, 15);
  R.EVENTOS.forEach((nome) => assert.match(nome, /^(teto|clique_oferta)_[a-z0-9_-]+$/, nome));
  const proibidos = [...Object.keys(bib.padroes), ...Object.keys(bib.familias), ...Object.keys(bib.variantes), "cuidado", "chao", "humor", "ajuda"];
  R.EVENTOS.forEach((nome) => proibidos.forEach((t) => assert.ok(!nome.includes(t), `${t} em ${nome}`)));
  assert.ok(R.EVENTOS.includes("teto_volta_semana"));
  assert.ok(R.EVENTOS.includes("clique_oferta_teto-avancado_principal"));
  const { PROTOCOL } = abrir();
  // Medicao local da D7 habilitada com eventos de lista fixa sem chamadas externas nem dados pessoais.
  assert.equal(PROTOCOL.eventos.ativo, true);
  assert.equal(typeof PROTOCOL.eventos.enviar, "function", "emissao local via dlt:evento ativa");
  assert.deepEqual(Array.from(PROTOCOL.eventos.permitidos), Array.from(R.EVENTOS));
  const nomes = PROTOCOL.eventos.nomes;
  const resolvidos = [];
  Object.keys(nomes).forEach((k) => {
    if (typeof nomes[k] === "string") resolvidos.push(nomes[k]);
  });
  ["dia3", "dia7", "dia30", "dia90", "sinais", "semana"].forEach((m) => resolvidos.push(nomes.retorno(m)));
  resolvidos.push(nomes.oferta("teto-avancado"));
  resolvidos.forEach((n) => assert.ok(kit.nomeDeEvento(n, R.EVENTOS), n));
  assert.equal(resolvidos.length, 15, "cada nome da lista tem um gatilho");
});

test("nomeDeEvento só devolve o que está na lista", () => {
  assert.equal(kit.nomeDeEvento("teto_inicio", R.EVENTOS), "teto_inicio");
  [`teto_freio-na-cobranca`, "teto_inicio ", "TETO_INICIO", "", null, 3, "teto_x".repeat(20), "__proto__"].forEach((n) => assert.equal(kit.nomeDeEvento(n, R.EVENTOS), null, String(n)));
  assert.equal(kit.nomeDeEvento("teto_inicio", null), null);
});

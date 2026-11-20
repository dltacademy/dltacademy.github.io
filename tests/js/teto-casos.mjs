// Os casos A a F do Protocolo do Teto como respostas por id de passo, e um piloto que
// responde a página do Ato 1 tocando nos botões, como uma pessoa faria. Serve aos testes
// em Node (DOM falso) e, importado no console, à página aberta no navegador:
//
//   const m = await import("/tests/js/teto-casos.mjs");
//   await m.tocarCaso("A");        // percorre até o checkpoint (ou o fim, nos casos D, E e F)
//
// Não é teste: o nome não termina em .test.mjs.

const NAO = ["nao_acontece"];

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

export const CASOS = {
  // A. A designer que cobra pouco: evitar alto, cobra com desconto e adia.
  A: base({
    cena_extra: ["extra_destino"],
    cena_cobrar: ["cobrar_adiei", "cobrar_desconto", "cobrar_desculpa"],
    custo: "cobrar_desconto",
    ...triades([
      ["evitar_1", "status_2"], ["vigilancia_1", "status_1"], ["lealdade_1", "vigilancia_3"],
      ["evitar_3", "lealdade_3"], ["lealdade_2", "idolatrar_3"],
    ]),
    espelho: "freio-na-cobranca",
    alvo: "mandar o preço cheio na sexta, por escrito",
  }),
  // B. O bônus que some: ganho que escorre, com o freio como vazamento.
  B: base({
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
  }),
  // C. A planejadora eterna: passo que não sai, não estou pronto, vigilância.
  C: base({
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
  }),
  // D. O rotativo: dívida cara, o chão primeiro.
  D: base({ chao: { contas: "apertado", divida: "sim", risco: "nao" } }),
  // E. Ninguém em casa: nada acontece, "nenhum padrão domina".
  E: base({
    ...triades([
      ["evitar_1", "idolatrar_1"], ["status_1", "vigilancia_1"], ["lealdade_1", "status_3"],
      ["vigilancia_2", "evitar_3"], ["idolatrar_3", "lealdade_2"],
    ]),
    espelho: "nenhum",
  }),
  // F. O que não para de operar: sinal de compulsão, ajuda humana.
  F: base({
    sinais_risco: ["recuperar_perda", "apostar_sem_parar"],
    cena_emocao: ["emocao_recuperar", "emocao_agora"],
    custo: "emocao_recuperar",
    espelho: "decisao-no-calor",
  }),
};

// ---- o piloto ------------------------------------------------------------------------------

const lista = (nodes) => Array.from(nodes);

async function responderPasso({ mount, passo, respostas, kit, esperar }) {
  const dispara = (el, tipo) => (el.dispararEvento ? el.dispararEvento(tipo) : el.dispatchEvent(new Event(tipo, { bubbles: true })));
  const clicar = async (el, onde) => {
    if (!el) throw new Error("Não achei " + onde + " na tela: " + mount.textContent.slice(0, 200));
    el.click();
    await esperar();
  };
  const botao = (texto) => lista(mount.querySelectorAll("button")).find((b) => b.textContent.trim() === texto);
  const linhaPor = (texto) => lista(mount.querySelectorAll(".choice-row")).find((r) => r.textContent.trim() === texto);
  const continuar = () => clicar(botao(passo.cta || "Continuar"), "o botão Continuar");

  const esperado = typeof passo.prompt === "function" ? passo.prompt(respostas) : passo.prompt;
  const naTela = mount.querySelector("#protocol-question");
  if (!naTela || naTela.textContent !== esperado) {
    throw new Error(`Passo ${passo.id}: a tela mostra "${naTela && naTela.textContent}" e o fluxo esperava "${esperado}"`);
  }

  if (passo.type === "grade") {
    if (respostas[passo.id] === undefined) {
      // Sem resposta nos casos: o último nível de cada item.
      const preenchida = {};
      kit.itensDoPasso(passo, respostas).forEach((item) => {
        const opcoes = kit.opcoesDoPasso(item.options ? item : passo, respostas);
        preenchida[item.id] = opcoes[opcoes.length - 1].value;
      });
      respostas[passo.id] = preenchida;
    }
    for (const item of kit.itensDoPasso(passo, respostas)) {
      const opcoes = kit.opcoesDoPasso(item.options ? item : passo, respostas);
      const opcao = opcoes.find((o) => o.value === respostas[passo.id][item.id]);
      const linha = lista(mount.querySelectorAll(".protocol-grade-item")).find((l) => l.querySelector(".protocol-grade-label").textContent === item.label);
      const alvo = linha && lista(linha.querySelectorAll(".protocol-grade-btn")).find((b) => b.textContent === opcao.label);
      await clicar(alvo, `a opção "${opcao && opcao.label}" de "${item.label}"`);
    }
    await continuar();
  } else if (passo.type === "multi") {
    const opcoes = kit.opcoesDoPasso(passo, respostas);
    for (const valor of respostas[passo.id]) {
      const opcao = opcoes.find((o) => o.value === valor);
      await clicar(linhaPor(opcao.label), `a opção "${opcao.label}"`);
    }
    await continuar();
  } else if (passo.type === "choice") {
    const opcao = kit.opcoesDoPasso(passo, respostas).find((o) => o.value === respostas[passo.id]);
    await clicar(linhaPor(opcao.label), `a opção "${opcao.label}"`);
  } else if (passo.type === "triad") {
    const labels = Object.assign({ mais: "Mais como eu", menos: "Menos como eu" }, passo.labels);
    for (const tipo of ["mais", "menos"]) {
      const item = passo.items.find((i) => i.id === respostas[passo.id][tipo]);
      const alvo = lista(mount.querySelectorAll(".protocol-triad-btn")).find((b) => b.getAttribute("aria-label") === `${labels[tipo]}: ${item.label}`);
      await clicar(alvo, `"${labels[tipo]}" de "${item.label}"`);
    }
    await continuar();
  } else if (passo.type === "write") {
    const campo = mount.querySelector("textarea");
    campo.value = respostas[passo.id] || "";
    dispara(campo, "input");
    await continuar();
  } else {
    throw new Error("Tipo de passo sem piloto: " + passo.type);
  }
}

// Responde os passos do fluxo, na ordem em que a página os mostra, até o checkpoint, o passo
// `ate` (sem responder) ou o fim. Devolve o id em que parou (null: o fim do fluxo).
export async function percorrer({ mount, passos, kit, respostas, ate, esperar }) {
  let i = kit.proximoIndice(passos, -1, respostas);
  while (i < passos.length) {
    const passo = passos[i];
    if (passo.id === ate || passo.type === "checkpoint") return passo.id;
    await responderPasso({ mount, passo, respostas, kit, esperar });
    i = kit.proximoIndice(passos, i, respostas);
  }
  return null;
}

// No console da página aberta: responde o caso `letra` (A a F) e para no checkpoint.
export async function tocarCaso(letra, { ate, espera = 220 } = {}) {
  if (!CASOS[letra]) throw new Error("Caso desconhecido: " + letra);
  const respostas = JSON.parse(JSON.stringify(CASOS[letra]));
  return percorrer({
    mount: document.getElementById("protocol-mount"),
    passos: PROTOCOL.steps,
    kit: DLTProtocolKit,
    respostas,
    ate,
    esperar: () => new Promise((resolve) => setTimeout(resolve, espera)),
  });
}

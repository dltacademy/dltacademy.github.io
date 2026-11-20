// Os casos A a F do Protocolo do Teto como respostas por id de passo (o Ato 1 em CASOS e o
// Ato 2 de A, B e C em ATO2), e um piloto que responde a página tocando nos botões, como uma
// pessoa faria. Serve aos testes em Node (DOM falso) e, importado no console, à página aberta
// no navegador:
//
//   const m = await import("/tests/js/teto-casos.mjs");
//   await m.tocarCaso("A");                        // os dois atos, até o resultado final
//   await m.tocarCaso("A", { ate: "fim_ato1" });   // só o Ato 1, até o checkpoint
//   await m.tocarCaso("A", { ate: "se_entao" });   // até uma tela do Ato 2, sem responder
//
// O ciclo de volta, no console (a página precisa estar aberta no protocolo):
//
//   await m.semearCiclo("A", { diasAtras: 7 });    // joga o caso, guarda no aparelho e recua o dia 0 em 7 dias
//   location.hash = "#volta=dia7"; location.reload();
//   const m2 = await import("/tests/js/teto-casos.mjs");
//   await m2.tocarRetorno("dia7");                 // responde o retorno do marco (dia3, dia7, dia7_travou, dia30,
//                                                  // semana, sinais, dia90)
//   await m2.tocarRetorno("sinais", { respostas: { mesmo_teto: "nenhum" } });   // troca uma resposta
//
// Nos casos D, E e F o fluxo termina antes (cuidado ou "nenhum"). Não é teste: o nome não
// termina em .test.mjs.

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

// O Ato 2 dos casos A, B e C. Ids de complemento (clima_texto, sinais_outro...) em branco valem
// como em branco; `se_entao` ausente deixa o rascunho que a tela já traz.
export const ATO2 = {
  // A. A designer: nada pesa o dia, a confiança é boa: o plano começa nos degraus de sempre.
  A: {
    clima_casa: "segredo",
    cena: "Em março mandei o orçamento de R$ 8 mil para um cliente grande, no mesmo mês em que fechei um contrato bom.",
    terreno: ["cansaco", "mes_apertado"],
    sinais: ["aperto_peito", "medo_caro"],
    frase: "vão achar caro",
    ponto_escolha: "adiei e mandei com desconto",
    alivio: "medo_nao",
    custo_depois: "perdi a margem do projeto",
    para_que: "ser_testado",
    excecao: "cobrei o valor cheio de um cliente que me indicou",
    desgrudar: "menos_forca",
    regra_antiga: "frase",
    previsao: "se eu cobrar cheio, ele some",
    crenca_previsao: 80,
    dia_um_ano: "acordo sem a pressa do fim do mês e almoço com a minha filha",
    importancia: 8,
    motivos: "quero parar de adiar o que importa",
    regra_trabalho: "cobrar o justo é o que me deixa atender bem",
    desconforto: "sim",
    experimento: "preco_em_voz_alta",
    se_entao: "quando sentir o aperto, mando o valor cheio antes de reler",
    confianca: 7,
    sobe_um_ponto: "combinar com alguém que pergunte como foi",
    proximas_24h: "amanhã, às 9h, escrevo o preço e mando a mensagem",
  },
  // B. O bônus que some: confiança 5, então o dia 3 começa no passo pequeno; escreve o "outro" do clima.
  B: {
    clima_casa: "outro",
    clima_texto: "dinheiro era assunto de adulto e ninguém explicava",
    cena: "Caiu a PLR de R$ 12 mil e, em duas semanas, quase tudo já tinha ido.",
    terreno: ["comparacao"],
    sinais: ["euforia", "outro"],
    sinais_outro: "calor no rosto",
    frase: "agora eu posso",
    ponto_escolha: "abri o app de compras no mesmo dia",
    alivio: "culpa",
    custo_depois: "faltou para a viagem com a minha filha",
    para_que: "afastar",
    para_que_texto: "ser a única da família com dinheiro sobrando",
    excecao: "guardei o extra daquele ano para a viagem",
    desgrudar: "igual",
    regra_antiga: "outra",
    regra_antiga_texto: "se eu guardar, vão achar que mudei",
    regra_origem: "ouvia isso em casa",
    previsao: "se eu guardar, vão me achar metida",
    crenca_previsao: 60,
    dia_um_ano: "tenho uma reserva e viajo sem culpa",
    importancia: 9,
    motivos: "quero que o dinheiro vá para onde eu decido",
    regra_trabalho: "dinheiro vai para onde eu decido antes",
    desconforto: "em_parte",
    experimento: "destino_antes",
    confianca: 5,
    sobe_um_ponto: "um alarme no dia do pagamento",
    proximas_24h: "hoje à noite escrevo o destino do próximo extra",
  },
  // C. A planejadora: estresse e mês apertado juntos, então o dia 3 também começa menor; escolhe o item mais alto.
  C: {
    clima_casa: "faltava",
    clima_texto: "",
    cena: "No terceiro curso do ano, achei que ainda não sabia o suficiente para vender.",
    terreno: ["estresse", "mes_apertado"],
    sinais: ["frio_barriga", "pesquisar_mais"],
    frase: "ainda não estou pronta",
    ponto_escolha: "abri outro curso em vez de mandar a proposta",
    alivio: "ansiedade",
    custo_depois: "mais um mês sem vender",
    para_que: "ser_testado",
    excecao: "vendi um serviço sem estar pronta e deu certo",
    desgrudar: "menos_forca",
    regra_antiga: "item",
    previsao: "se eu fizer sem estar pronta, vou passar vergonha",
    crenca_previsao: 70,
    dia_um_ano: "vendo toda semana e não abro mais cursos às cegas",
    importancia: 7,
    motivos: "quero parar de estudar sem fazer",
    regra_trabalho: "eu fico pronta fazendo pequeno",
    desconforto: "sim",
    experimento: "menor_acao",
    se_entao: "antes de abrir mais uma pesquisa, faço a próxima ação de 5 minutos",
    confianca: 8,
    proximas_24h: "amanhã às 10h mando uma mensagem a um possível cliente",
  },
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
  const noComplemento = (el) => Boolean(el.closest && el.closest(".protocol-followup"));
  const campoDe = (rotulo) => lista(mount.querySelectorAll("textarea")).find((t) => t.getAttribute("aria-labelledby") === rotulo);
  const escrever = (campo, texto) => {
    campo.value = texto;
    dispara(campo, "input");
  };
  const marcarEscala = async (cfg, valor, dentroDoComplemento) => {
    const rotulo = String(valor) + (cfg.format || "");
    const alvo = lista(mount.querySelectorAll(".protocol-scale-btn")).find((b) => b.textContent === rotulo && noComplemento(b) === dentroDoComplemento);
    await clicar(alvo, `o ${rotulo} da régua`);
  };

  const esperado = typeof passo.prompt === "function" ? passo.prompt(respostas) : passo.prompt;
  const naTela = mount.querySelector("#protocol-question");
  if (!naTela || naTela.textContent !== esperado) {
    throw new Error(`Passo ${passo.id}: a tela mostra "${naTela && naTela.textContent}" e o fluxo esperava "${esperado}"`);
  }

  // Só o texto de um passo que espera "Continuar" (com complemento, régua ou campo limitado) ou o clique de um classic.
  const comControles = Boolean(passo.followUp) || ["multi", "scale", "grade", "triad"].includes(passo.type) || (passo.type === "write" && (typeof passo.value === "function" || typeof passo.maxLength === "number"));

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
  } else if (passo.type === "multi") {
    const opcoes = kit.opcoesDoPasso(passo, respostas);
    for (const valor of respostas[passo.id]) {
      const opcao = opcoes.find((o) => o.value === valor);
      await clicar(linhaPor(opcao.label), `a opção "${opcao.label}"`);
    }
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
  } else if (passo.type === "scale") {
    await marcarEscala(passo, respostas[passo.id], false);
  } else if (passo.type === "write") {
    const campo = campoDe("protocol-question") || mount.querySelector("textarea");
    // Sem resposta nos casos, fica o que a tela já traz (o rascunho do "se, então", por exemplo).
    if (respostas[passo.id] !== undefined) escrever(campo, respostas[passo.id]);
    else respostas[passo.id] = campo.value;
  } else {
    throw new Error("Tipo de passo sem piloto: " + passo.type);
  }

  if (passo.followUp) {
    const f = passo.followUp;
    if (f.type === "scale") {
      await marcarEscala(f, respostas[f.id], true);
    } else {
      const campo = campoDe("protocol-followup-" + f.id);
      const texto = respostas[f.id] === undefined ? "" : respostas[f.id];
      respostas[f.id] = texto;
      if (campo && texto !== "") escrever(campo, texto);
    }
  }
  if (comControles || passo.type === "write") await continuar();
}

// Responde os passos do fluxo, na ordem em que a página os mostra, até o checkpoint (a menos que
// `seguir`), o passo `ate` (sem responder) ou o fim; com `desde`, começa a responder nesse passo. Com `seguir`, toca em "Continuar agora" no
// checkpoint e segue para o Ato 2. Devolve o id em que parou (null: o fim do fluxo).
export async function percorrer({ mount, passos, kit, respostas, ate, desde, seguir = false, esperar }) {
  let i = kit.proximoIndice(passos, -1, respostas);
  // `desde`: a página já está nesse passo (retomada); os anteriores seguem só no cálculo do caminho.
  let respondendo = !desde;
  while (i < passos.length) {
    const passo = passos[i];
    if (!respondendo) {
      if (passo.id !== desde) {
        i = kit.proximoIndice(passos, i, respostas);
        continue;
      }
      respondendo = true;
    }
    if (passo.id === ate) return passo.id;
    if (passo.type === "checkpoint") {
      if (!seguir) return passo.id;
      const ir = lista(mount.querySelectorAll("button")).find((b) => b.textContent.trim() === (passo.actions && passo.actions.continuar) || b.textContent.trim() === "Continuar");
      if (!ir) throw new Error("Não achei o botão do checkpoint: " + mount.textContent.slice(0, 200));
      ir.click();
      await esperar();
    } else {
      await responderPasso({ mount, passo, respostas, kit, esperar });
    }
    i = kit.proximoIndice(passos, i, respostas);
  }
  return null;
}

// Espera a página montar o protocolo: o script do protocolo declara PROTOCOL, e o motor só mostra a
// primeira pergunta depois. Sem isso, chamar cedo demais dá "PROTOCOL is not defined".
async function esperarProtocolo(espera, tentativas = 40) {
  for (let i = 0; i < tentativas; i += 1) {
    const pronto = typeof PROTOCOL !== "undefined" && typeof DLTProtocolKit !== "undefined" && document.getElementById("protocol-mount") && document.getElementById("protocol-mount").children.length > 0;
    if (pronto) return PROTOCOL;
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
  throw new Error("A página ainda não montou o protocolo (PROTOCOL e #protocol-mount): recarregue e tente de novo.");
}

// No console da página aberta: responde o caso `letra` (A a F) pelos dois atos, até o resultado final
// (ou até `ate`; { ate: "fim_ato1" } para no checkpoint do Ato 1).
export async function tocarCaso(letra, { ate, espera = 220 } = {}) {
  if (!CASOS[letra]) throw new Error("Caso desconhecido: " + letra);
  const protocolo = await esperarProtocolo(espera);
  const mount = document.getElementById("protocol-mount");
  const dorme = () => new Promise((resolve) => setTimeout(resolve, espera));
  // Resultado na tela ou "você tem um Teto guardado": recomeça, em vez de responder no meio do caminho.
  for (const texto of ["Refazer o protocolo", "Começar de novo"]) {
    const recomecar = lista(mount.querySelectorAll("button")).find((b) => b.textContent.trim() === texto);
    if (recomecar) {
      recomecar.click();
      await dorme();
      break;
    }
  }
  const respostas = JSON.parse(JSON.stringify(Object.assign({}, CASOS[letra], ATO2[letra] || {})));
  return percorrer({
    mount,
    passos: protocolo.steps,
    kit: DLTProtocolKit,
    respostas,
    ate,
    seguir: ate !== "fim_ato1",
    esperar: () => new Promise((resolve) => setTimeout(resolve, espera)),
  });
}


// ---- o ciclo de volta -----------------------------------------------------------------------------

const SEGURO = { chao: { contas: "fecham", divida: "nao", risco: "nao" }, humor: { interesse: 0, animo: 1 }, sinais_risco: ["nenhum"] };

// A volta curta do caso A (o mesmo teto, a previsão errou), usada em `sinais` e em `dia90`.
const VOLTA_A = {
  ...SEGURO,
  fatos: { olhou: 3, preco_cheio: 2, extra: "na", pedido_amanha: "na", sobrou: 2 },
  mesmo_teto: "sim",
  frases_agora: { evitar_1: 1, evitar_3: 2 },
  refazer: "nao",
  cena: "Em outubro, o cliente pediu um desconto e eu cedi antes de ele terminar a frase.",
  terreno: ["cansaco"],
  sinais: ["aperto_peito"],
  frase: "ele vai achar caro",
  ponto_escolha: "cedi o desconto na mesma hora",
  alivio: "medo_nao",
  custo_depois: "perdi parte da margem outra vez",
  para_que: "ser_testado",
  excecao: "cobrei cheio de quem me indicou",
  previsao_acertou: "errou",
  crenca_agora: 40,
  regra_decisao: "manter",
  travou: "nao",
  desconforto: "sim",
  experimento: "preco_em_voz_alta",
  confianca: 8,
  proximas_24h: "amanhã às 9h mando o valor cheio",
};

// As respostas de cada retorno do caso A. `dia7_travou` é o dia 7 com o protocolo do deslize.
export const RETORNOS = {
  dia3: { fez: "sim", aconteceu: "falei o preço em voz alta e ele não sumiu", crenca: 40 },
  dia7: { travou: "nao", acertou: "errou", crenca: 30, passo: "sobe" },
  dia7_travou: {
    travou: "sim", deslize_fato: "mandei com desconto na terça", deslize_gentileza: "foi uma semana pesada e você fez o que deu",
    deslize_bem: "percebi o aperto antes de responder", deslize_metade: "escrever o preço, sem mandar", acertou: "em_parte", crenca: 50, passo: "desce",
  },
  dia30: { travou: "nao", fatos: { olhou: 3, preco_cheio: 2, extra: "na", pedido_amanha: "na", sobrou: 2 }, vazamento: "nao" },
  semana: { sinal: "sim", cedo: "sim", se_entao: "em_parte", previu: "achei que ele sumiria, e ele respondeu" },
  sinais: { motivo: "venceu", ...VOLTA_A },
  dia90: { ...VOLTA_A, fatos_retro: { olhou: 0, preco_cheio: 0, extra: "na", pedido_amanha: "na", sobrou: 1 } },
};

const CHAVE_ESTADO = "dlt-protocol-state:protocolo-teto-financeiro";

// Joga o caso até o resultado, guarda no aparelho e recua o dia 0 `diasAtras` dias, para os marcos
// já estarem no dia. Depois, abra o link do marco (location.hash = "#volta=dia7") e recarregue.
export async function semearCiclo(letra, { diasAtras = 0, espera = 220 } = {}) {
  await tocarCaso(letra, { espera });
  const mount = document.getElementById("protocol-mount");
  const guardar = lista(mount.querySelectorAll("button")).find((b) => b.textContent.trim() === "Guardar neste aparelho para os retornos");
  if (!guardar) throw new Error("O caso " + letra + " não termina num resultado que se guarda (cuidado ou \"nenhum\").");
  guardar.click();
  await new Promise((resolve) => setTimeout(resolve, espera));
  const kit = DLTProtocolKit;
  const estado = JSON.parse(window.localStorage.getItem(CHAVE_ESTADO));
  if (diasAtras) {
    const dia0 = kit.somarDias(estado.volta.dia0, -diasAtras);
    estado.volta.dia0 = dia0;
    estado.criado = dia0;
    estado.volta.registro.data = dia0;
    estado.volta.registro.datas = kit.datasDoCiclo(dia0, [7, 30, 60, 90]);
    window.localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  }
  return { dia0: estado.volta.dia0, volta: estado.volta.n };
}

// Responde o retorno `marco` na página aberta no link dele (com o estado guardado): toca em
// "Começar" (ou "Adiantar agora") e responde os passos. `respostas` troca respostas do atalho.
export async function tocarRetorno(nome, { respostas: troca = {}, espera = 220 } = {}) {
  const marco = nome === "dia7_travou" ? "dia7" : nome;
  if (!RETORNOS[nome]) throw new Error("Retorno desconhecido: " + nome);
  const protocolo = await esperarProtocolo(espera);
  const retorno = protocolo.retornos && protocolo.retornos[marco];
  if (!retorno) throw new Error("Marco sem retorno: " + marco);
  const mount = document.getElementById("protocol-mount");
  const dorme = () => new Promise((resolve) => setTimeout(resolve, espera));
  const botao = (t) => lista(mount.querySelectorAll("button")).find((b) => b.textContent.trim() === t);
  const iniciar = ["Começar", "Adiantar agora", "Refazer este retorno"].map(botao).find(Boolean);
  if (!iniciar) throw new Error("Abra a página no link do marco (#volta=" + marco + ") com o Teto guardado: não achei o botão de começar.");
  iniciar.click();
  await dorme();
  const bruto = window.localStorage.getItem(CHAVE_ESTADO);
  if (!bruto) throw new Error("Não há Teto guardado neste navegador.");
  const estado = JSON.parse(bruto);
  const contexto = { respostas: estado.respostas, volta: estado.volta, historico: estado.historico, criado: estado.criado, ciclo: estado.ciclo, marco };
  const respostas = JSON.parse(JSON.stringify(Object.assign({ __estado: contexto }, RETORNOS[nome], troca)));
  return percorrer({ mount, passos: retorno.steps, kit: DLTProtocolKit, respostas, esperar: dorme });
}

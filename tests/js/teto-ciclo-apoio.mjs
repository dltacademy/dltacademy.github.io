// Apoio dos testes do ciclo de volta do Teto: abrir a página com o DOM falso, jogar um caso até o fim,
// guardar o ciclo (com o dia 0 para trás) e fazer um retorno tocando nos botões. Não é teste.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { criarAmbiente, piloto } from "./fake-dom.mjs";
import { ATO2, CASOS, percorrer } from "./teto-casos.mjs";
export { ATO2, CASOS };

const require = createRequire(import.meta.url);
export const kit = require("../../js/protocol-kit.js");
export const bib = require("../../js/biblioteca-teto.js");
export const R = require("../../protocolos/teto-financeiro/js/teto-regras.js");

export const CHAVE = "dlt-protocol-state:protocolo-teto-financeiro";
export const SCRIPTS = [
  "js/protocol-kit.js",
  "js/biblioteca-teto.js",
  "protocolos/teto-financeiro/js/teto-regras.js",
  "js/protocol-engine.js",
];
export const clone = (v) => JSON.parse(JSON.stringify(v));

export function abrir({ hash = "", local = {}, sessao = {}, dataFixa } = {}) {
  const env = criarAmbiente({ armazenamento: local, dataFixa });
  Object.assign(env.sessao, sessao);
  env.janela.location.hash = hash;
  env.janela.location.pathname = "/protocolos/teto-financeiro/";
  env.chamadasReplaceState = [];
  env.janela.history.replaceState = (...args) => env.chamadasReplaceState.push(args);
  SCRIPTS.forEach((arquivo) => env.carregar(arquivo));
  env.carregar("protocolos/teto-financeiro/js/protocol.js");
  return { env, p: piloto(env), PROTOCOL: env.rodar("PROTOCOL") };
}

export const clicar = (p, texto) => {
  const b = p.botaoPor(texto);
  assert.ok(b, `botão "${texto}" não encontrado em: ${p.mount.textContent.slice(0, 240)}`);
  b.click();
  p.mount.ownerDocument._env.rodarTimers();
};
export const baixar = (env, p, texto) => {
  const antes = env.baixados.length;
  p.botaoPor(texto).click();
  assert.equal(env.baixados.length, antes + 1, texto);
  return env.baixados[antes];
};
export const lerLocal = (env) => JSON.parse(env.armazenamento[CHAVE]);

export async function jogarCaso(pagina, letra, extra = {}) {
  const respostas = Object.assign(clone(CASOS[letra]), clone(ATO2[letra] || {}), clone(extra));
  await percorrer({ mount: pagina.env.mount, passos: pagina.PROTOCOL.steps, kit, respostas, seguir: true, esperar: async () => pagina.env.rodarTimers() });
  return respostas;
}

// Joga o caso até o fim e guarda no aparelho; devolve o estado guardado, com o dia 0 para trás.
export async function ciclo(letra, { diasAtras = 0, extra = {} } = {}) {
  const a = abrir();
  await jogarCaso(a, letra, extra);
  clicar(a.p, "Guardar neste aparelho para os retornos");
  const estado = lerLocal(a.env);
  if (diasAtras) {
    const dia0 = kit.somarDias(estado.volta.dia0, -diasAtras);
    estado.volta.dia0 = dia0;
    estado.criado = dia0;
    estado.volta.registro.data = dia0;
    estado.volta.registro.datas = kit.datasDoCiclo(dia0, [7, 30, 60, 90]);
  }
  return estado;
}

export const contextoDoRetorno = (estado, marco) => clone({
  respostas: estado.respostas, volta: estado.volta, historico: estado.historico, criado: estado.criado, ciclo: estado.ciclo, marco,
});

// Abre o link do marco com o estado guardado e responde o retorno tocando nos botões.
export async function fazerRetorno(estado, marco, respostas, { local } = {}) {
  const pagina = abrir({ hash: "#volta=" + marco, local: local === undefined ? { [CHAVE]: JSON.stringify(estado) } : local });
  const { p, env, PROTOCOL } = pagina;
  const iniciar = ["Começar", "Adiantar agora", "Refazer este retorno"].map((t) => p.botaoPor(t)).find(Boolean);
  assert.ok(iniciar, "botão de começar: " + p.mount.textContent.slice(0, 200));
  iniciar.click();
  env.rodarTimers();
  const resp = Object.assign({ __estado: contextoDoRetorno(estado, marco) }, clone(respostas));
  await percorrer({ mount: env.mount, passos: PROTOCOL.retornos[marco].steps, kit, respostas: resp, esperar: async () => env.rodarTimers() });
  return pagina;
}

export const RESPOSTAS = {
  dia3: { fez: "sim", aconteceu: "falei o preço em voz alta e ele não sumiu", crenca: 40 },
  dia7: { travou: "nao", acertou: "errou", crenca: 30, passo: "sobe" },
  dia7_travou: {
    travou: "sim", deslize_fato: "mandei com desconto na terça", deslize_gentileza: "foi uma semana pesada e você fez o que deu",
    deslize_bem: "percebi o aperto antes de responder", deslize_metade: "escrever o preço, sem mandar", acertou: "em_parte", crenca: 50, passo: "desce",
  },
  dia30: { travou: "nao", fatos: { olhou: 3, preco_cheio: 2, extra: "na", pedido_amanha: "na", sobrou: 2 } },
  semana: { sinal: "sim", cedo: "sim", se_entao: "em_parte", previu: "achei que ele sumiria, e ele respondeu" },
};

export const PROIBIDAS = [/terapi/i, /psicoterapi/i, /tratamento/i, /\blaudo/i, /diagn[óo]stico psicol/i, /teste psicol/i, /reprograma[çc]/i];
export function semProibidas(texto, onde) {
  PROIBIDAS.forEach((re) => assert.ok(!re.test(texto), `${re} em ${onde}`));
  assert.ok(!/diagn[óo]stic/i.test(texto.replace(/não é diagnóstico/gi, "")), `"diagnóstico" fora de "não é diagnóstico" em ${onde}`);
}


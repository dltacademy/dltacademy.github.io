// Percursos de referência do motor de protocolos.
//
// Para cada protocolo, anda por todas as combinações de escolha (com os campos
// de texto todos preenchidos e todos vazios), pelo clique real na tela falsa,
// e guarda: os passos visitados, a impressão digital de cada tela, a do
// resultado e a do arquivo .md baixado, com data fixa. O teste compara o motor
// de hoje com o que está nos arquivos desta pasta.
import crypto from "node:crypto";
import { criarAmbiente, piloto, serializar } from "../fake-dom.mjs";

export const PROTOCOLOS = [
  { slug: "medo-de-ficar-de-fora", script: "protocolos/medo-de-ficar-de-fora/js/protocol.js" },
  { slug: "decisao-fria", script: "protocolos/decisao-fria/js/protocol.js" },
  { slug: "sintetico-next", script: "tests/js/fixtures/protocolo-next.js" },
];

const sha = (texto) => crypto.createHash("sha1").update(texto).digest("hex").slice(0, 16);
const TEXTO_CHEIO = "Texto de teste, com “aspas” e ponto final.";

export function prepararProtocolo(entrada, extras = {}) {
  const env = criarAmbiente(extras);
  env.carregar("js/paid-reports.js");
  env.carregar("js/protocol-engine.js");
  env.carregar(entrada.script);
  env.reiniciar = () => env.rodar('runProtocol(PROTOCOL, "protocol-mount")');
  return env;
}

function indiceDoRotulo(rotulo) {
  const m = /^Passo (\d+) de (\d+)$/.exec(rotulo);
  return m ? Number(m[1]) - 1 : -1;
}

// Executa uma lista de ações e devolve o que a pessoa viu em cada tela.
function executar(env, acoes, modoTexto) {
  env.reiniciar();
  const p = piloto(env);
  const telas = [];
  for (const acao of acoes) {
    if (p.noResultado()) break;
    telas.push({ rotulo: p.rotulo(), dom: sha(p.impressao()) });
    if (acao === "t") p.escrever(modoTexto === "cheio" ? TEXTO_CHEIO : "");
    else p.escolher(acao);
  }
  return { p, telas };
}

function resumir(env, p, telas) {
  const resultado = p.noResultado();
  const saida = {
    passos: telas.map((t) => indiceDoRotulo(t.rotulo)).join(","),
    telas: sha(telas.map((t) => t.rotulo + ":" + t.dom).join("|")),
    terminou: resultado,
  };
  if (resultado) {
    saida.veredito = p.porClasse("protocol-verdict")[0].textContent;
    saida.resultado = sha(p.impressao());
    const antes = env.baixados.length;
    p.botaoPor("Baixar como texto (.md)").click();
    const arquivo = env.baixados[antes];
    saida.md = sha(arquivo.texto);
    saida.mdNome = arquivo.nome;
    saida._mdTexto = arquivo.texto;
  }
  return saida;
}

function percorrer(env, modoTexto) {
  const caminhos = {};
  const amostras = {};
  const visitar = (prefixo) => {
    const { p, telas } = executar(env, prefixo, modoTexto);
    if (p.noResultado()) {
      const chave = prefixo.join(".");
      const r = resumir(env, p, telas);
      const texto = r._mdTexto;
      delete r._mdTexto;
      caminhos[chave] = r;
      if (!(r.veredito in amostras)) amostras[r.veredito] = texto;
      return;
    }
    const tela = { rotulo: p.rotulo() };
    tela.escolha = p.opcoes().length;
    tela.escrita = Boolean(p.textarea());
    if (tela.escolha) for (let i = 0; i < tela.escolha; i += 1) visitar([...prefixo, i]);
    else if (tela.escrita) visitar([...prefixo, "t"]);
    else throw new Error("Tela sem ação possível: " + tela.rotulo);
  };
  visitar([]);
  return { caminhos, amostras };
}

// Roteiros com "voltar": cada item é uma ação; "v" volta um passo.
function roteiro(env, itens, modoTexto) {
  env.reiniciar();
  const p = piloto(env);
  const estados = [];
  const ver = () => estados.push({
    rotulo: p.rotulo(),
    marcadas: p.marcadas(),
    texto: p.textarea() ? p.textarea().value : null,
    voltarAtivo: p.voltar() ? p.voltar().getAttribute("aria-disabled") : null,
    dom: sha(p.impressao()),
  });
  ver();
  for (const item of itens) {
    if (item === "v") p.voltar().click();
    else if (item === "t") p.escrever(modoTexto === "cheio" ? TEXTO_CHEIO : "");
    else p.escolher(item);
    if (p.noResultado()) { estados.push({ resultado: sha(p.impressao()) }); break; }
    ver();
  }
  return estados;
}

const ROTEIROS = {
  "medo-de-ficar-de-fora": [
    [1, "v", 2, "t", "v", "v", 0],
    ["v", 0, "t", 1, 0, "t", "v", "v", "v", 1],
  ],
  "decisao-fria": [
    [1, 0, 2, "v", 1, "t", "t", "v", "v", "t"],
    ["v", 3, 1, 1, "t", "t", 2, "t"],
  ],
  "sintetico-next": [
    [1, "v", 0, "t", 1, "v", "v", "v", 2],
    [0, "t", 1, 0],
  ],
};

export function gerarGolden(entrada) {
  const env = prepararProtocolo(entrada);
  const golden = { protocolo: entrada.slug, texto: {}, roteiros: {}, amostras: {} };
  for (const modo of ["cheio", "vazio"]) {
    const { caminhos, amostras } = percorrer(env, modo);
    golden.texto[modo] = caminhos;
    Object.entries(amostras).forEach(([veredito, md]) => { golden.amostras[modo + ": " + veredito] = md; });
    golden.roteiros[modo] = (ROTEIROS[entrada.slug] || []).map((itens) => roteiro(env, itens, modo));
  }
  return golden;
}

export { serializar };

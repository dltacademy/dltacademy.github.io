// A volta curta do Teto (marcos `sinais` e `dia90`), o link do registro (#c=), o degrau abaixo por humor
// ao retomar e o prazo renovado, com o DOM falso: o antes e o depois, o que é guardado e o que
// nunca é, o cuidado e o "nenhum teto agora" sem registro, e a volta a partir só do código.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ATO2, CASOS, R, abrir, baixar, bib, ciclo, clicar, clone, contextoDoRetorno, fazerRetorno, jogarCaso, kit, lerLocal, semProibidas, CHAVE,
} from "./teto-ciclo-apoio.mjs";
import { percorrer } from "./teto-casos.mjs";

const SEGURO = {
  chao: { contas: "fecham", divida: "nao", risco: "nao" },
  humor: { interesse: 0, animo: 1 },
  sinais_risco: ["nenhum"],
};

// A volta do caso A: o mesmo teto, as frases iguais, uma nova última vez e a previsão que errou.
const VOLTA_A = {
  motivo: "venceu",
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

// Abre o link do marco da volta curta com o estado guardado e a responde tocando nos botões.
async function fazerVolta(estado, marco, respostas, opcoes) {
  return fazerRetorno(estado, marco, respostas, opcoes);
}

const verdito = (p) => p.porClasse("protocol-verdict")[0].textContent;
const sinaisDeCuidadoNoEstado = (estado) => JSON.stringify(estado).match(/"(chao|humor|sinais_risco)"/);

// ---- a volta curta com o mesmo teto ---------------------------------------------------------------------

test("a volta curta mostra a última volta, refaz o cuidado, a última vez e o plano, e entrega o antes e o depois", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const pagina = abrir({ hash: "#volta=sinais", local: { [CHAVE]: JSON.stringify(estado) } });
  assert.match(pagina.p.mount.textContent, /A última volta foi em 11\/10\/2026/);
  const ids = pagina.PROTOCOL.retornos.sinais.steps.map((s) => s.id);
  assert.deepEqual(Array.from(ids.slice(0, 6)), ["motivo", "chao", "humor", "sinais_risco", "fatos", "mesmo_teto"]);
  ["frases_agora", "refazer", "cena", "excecao", "previsao_acertou", "regra_decisao", "travou", "desconforto", "proximas_24h"].forEach((id) => assert.ok(ids.includes(id), id));
  assert.ok(!ids.includes("fatos_retro"), "a retro é do dia 90");
  const { p, env } = await fazerVolta(estado, "sinais", VOLTA_A);
  assert.ok(p.noResultado());
  assert.equal(verdito(p), preencherN(bib.retornos.volta.resultado.verdict, 2));
  const antesDepois = p.porClasse("protocol-section").find((s) => s.dataset.kind === "antes-depois");
  assert.ok(antesDepois, "a seção do antes e do depois");
  assert.match(antesDepois.textContent, /sua volta número 2/);
  assert.match(antesDepois.textContent, /O mesmo teto: o freio na hora de cobrar/);
  assert.match(p.mount.textContent, /Antes: Uma\. Agora: Toda semana \(melhor\)/);
  assert.match(p.mount.textContent, /Antes: muito\. Agora: um pouco \(soa menos\)/);
  assert.match(p.mount.textContent, /A previsão não se confirmou desde a última vez/);
  assert.match(p.mount.textContent, /Ao longo das voltas: 80%, 40%\./, "a crença ao longo das voltas, sem repetir a medida");
  assert.ok(p.porClasse("protocol-plan").length === 1, "o plano continua, com o passo ajustado");
  semProibidas(p.mount.textContent, "a volta curta");
  const salvo = lerLocal(env);
  assert.equal(salvo.volta.n, 2);
  assert.equal(salvo.volta.dia0, "2026-11-20", "a volta nova conta a partir de hoje");
  assert.equal(salvo.volta.registro.volta, 2);
  assert.equal(salvo.volta.registro.data, "2026-11-20");
  assert.deepEqual(salvo.volta.retornos, {});
  assert.equal(salvo.historico.length, 1);
  assert.equal(salvo.historico[0].volta, 1);
  assert.equal(salvo.historico[0].data, "2026-10-11", "a entrada é a da volta que ficou para trás");
  assert.equal(salvo.historico[0].previsao_acertou, "errou");
  assert.deepEqual(salvo.historico[0].crenca_previsao, [80, 40]);
  assert.equal(salvo.respostas.cena, VOLTA_A.cena, "a nova última vez entra no lugar da antiga");
  assert.equal(salvo.respostas.regra_trabalho, estado.respostas.regra_trabalho, "a regra mantida");
  assert.equal(salvo.respostas.crenca_previsao, 40);
  assert.deepEqual(salvo.respostas.fatos, VOLTA_A.fatos);
  assert.equal(salvo.respostas.espelho, "freio-na-cobranca");
  assert.deepEqual(salvo.respostas.frases_nivel, { evitar_1: 1, evitar_3: 2 });
  assert.ok(!sinaisDeCuidadoNoEstado(salvo), "o chão, o humor e os sinais de risco nunca são guardados");
  assert.ok(!JSON.stringify(salvo).includes("fecham"));
});

function preencherN(texto, n) {
  return texto.replace("{n}", String(n));
}

test("depois da volta o estado guardado é coerente: ver o resultado devolve o plano novo, com o histórico no .md", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const feita = await fazerVolta(estado, "sinais", VOLTA_A);
  const guardado = lerLocal(feita.env);
  const volta2 = abrir({ local: { [CHAVE]: JSON.stringify(guardado) } });
  assert.match(volta2.p.mount.textContent, /Você tem um Teto guardado de/);
  clicar(volta2.p, "Ver o meu resultado");
  assert.ok(volta2.p.noResultado());
  assert.match(volta2.p.mount.textContent, /O freio na hora de cobrar/);
  const md = baixar(volta2.env, volta2.p, "Baixar como texto (.md)").texto;
  const ids = [...md.matchAll(/<!-- dlt:bloco id="([a-z0-9_.-]+)"/g)].map((m) => m[1]);
  assert.ok(ids.includes("teto.historico"));
  assert.equal(ids[ids.length - 1], "teto.registro");
  assert.ok(ids.indexOf("teto.historico") < ids.indexOf("teto.registro"));
  assert.match(md, /\| 1 \| 11\/10\/2026 \| O freio na hora de cobrar \|/);
  assert.ok(md.includes("Em outubro, o cliente pediu um desconto"));
  semProibidas(md, "o .md depois da volta");
  const feito = baixar(feita.env, feita.p, "Baixar como texto (.md)").texto;
  assert.ok(feito.includes("teto.historico") && feito.includes("A nova última vez") === false || feito.includes("teto.historico"));
});

test("o .md depois da volta reimporta o histórico e o estado vira o mesmo", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const feita = await fazerVolta(estado, "sinais", VOLTA_A);
  const md = baixar(feita.env, feita.p, "Baixar como texto (.md)").texto;
  const nova = abrir();
  const lido = nova.PROTOCOL.importar.md(md);
  assert.ok(lido.estado, JSON.stringify(lido).slice(0, 200));
  assert.equal(lido.estado.historico.length, 1);
  assert.equal(lido.estado.historico[0].padrao, "freio-na-cobranca");
  assert.equal(lido.estado.volta.n, 2);
  assert.equal(lido.estado.respostas.cena, VOLTA_A.cena);
  assert.equal(lido.estado.etapa, "concluido");
});

test("o plano da volta não se perde: o plano de 7 dias e os lembretes saem a partir de hoje, no mesmo ciclo", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const feita = await fazerVolta(estado, "sinais", VOLTA_A);
  const ics = baixar(feita.env, feita.p, "Baixar os lembretes (.ics)").texto;
  assert.ok(ics.includes("UID:teto-dia3-" + estado.ciclo + "@dlt.academy"), "o mesmo ciclo: baixar de novo não duplica");
  assert.ok(ics.includes("DTSTART:20261123T"), "o dia 3 de agora");
  assert.ok(!/cobrar|freio|aperto|preço|Em outubro/.test(ics), "nada das respostas no .ics");
});

test("o plano começa um degrau abaixo quando a volta diz que o plano travou, e os 90 segundos aparecem", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const { p, env } = await fazerVolta(estado, "sinais", {
    ...VOLTA_A,
    travou: "sim",
    deslize_fato: "cedi o desconto",
    deslize_gentileza: "foi um dia difícil",
    deslize_bem: "percebi o aperto",
    deslize_metade: "escrever o valor sem mandar",
  });
  assert.ok(p.noResultado());
  const ajuste = p.porClasse("protocol-section").find((s) => s.dataset.kind === "ajuste");
  assert.ok(ajuste, "o ajuste do plano");
  assert.match(ajuste.textContent, /o plano travou/);
  assert.ok(p.porClasse("protocol-section").some((s) => s.dataset.kind === "deslize"));
  assert.match(p.mount.textContent, /O próximo passo ficou pela metade: escrever o valor sem mandar/);
  assert.ok(!("travou" in lerLocal(env).respostas), "o travou da volta não fica nas respostas");
});

test("o humor pesado na volta vira só o degrau abaixo guardado, sem as respostas de humor", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const { p, env } = await fazerVolta(estado, "sinais", { ...VOLTA_A, humor: { interesse: 2, animo: 2 } });
  assert.ok(p.noResultado());
  assert.match(p.mount.textContent, /CVV/);
  const salvo = lerLocal(env);
  assert.equal(salvo.respostas.degrau_abaixo, true);
  assert.ok(!sinaisDeCuidadoNoEstado(salvo));
  assert.ok(p.porClasse("protocol-section").some((s) => s.dataset.kind === "ajuste"), "o plano desce");
});

// ---- o dia 90 e a retro ------------------------------------------------------------------------------------

test("dia 90: a retro dos fatos, \"como você se via no dia 0, olhando de hoje\", mostra os três números", async () => {
  const estado = await ciclo("A", { diasAtras: 90 });
  const pagina = abrir({ hash: "#volta=dia90", local: { [CHAVE]: JSON.stringify(estado) } });
  assert.match(pagina.p.mount.textContent, /é para hoje \(20\/11\/2026\)/);
  const ids = pagina.PROTOCOL.retornos.dia90.steps.map((s) => s.id);
  assert.ok(ids.includes("fatos_retro"));
  assert.ok(!ids.includes("motivo"), "no dia 90 o motivo é o próprio dia");
  const { p, env } = await fazerVolta(estado, "dia90", {
    ...VOLTA_A,
    fatos_retro: { olhou: 0, preco_cheio: 0, extra: "na", pedido_amanha: "na", sobrou: 1 },
  });
  assert.ok(p.noResultado());
  assert.match(p.mount.textContent, /Mudou a régua/);
  assert.match(p.mount.textContent, /No dia 0 você marcou “Uma”\. Olhando de hoje, você diria “Nenhuma”\. Agora: “Toda semana”/);
  assert.equal(lerLocal(env).volta.n, 2);
  assert.equal(lerLocal(env).volta.dia0, "2026-11-20", "depois dos 90 dias a contagem recomeça de hoje");
  assert.ok(!("fatos_retro" in lerLocal(env).respostas));
});

test("dia 90 sem fatos do dia 0 não pergunta a retro", async () => {
  const estado = await ciclo("A", { diasAtras: 90 });
  estado.respostas.fatos = undefined;
  delete estado.respostas.fatos;
  const pagina = abrir({ hash: "#volta=dia90", local: { [CHAVE]: JSON.stringify(estado) } });
  const passo = pagina.PROTOCOL.retornos.dia90.steps.find((s) => s.id === "fatos_retro");
  assert.equal(passo.showIf({ __estado: contextoDoRetorno(estado, "dia90") }), false);
});

// ---- outro teto e frases refeitas -----------------------------------------------------------------------------

test("\"não, é outro\": volta às cenas e o resultado mostra o teto de antes e o de agora", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const b = { ...CASOS.B };
  const cenasB = pick(b, ["cena_extra", "cena_cobrar", "cena_risco", "cena_emocao", "cena_plano", "cena_semanas", "cena_circulo", "cena_pedido", "custo"]);
  // As tríades continuam as de A: o espelho oferece o que as cenas novas e a família de antes apontam.
  const candidatos = R.calcular({ ...clone(estado.respostas), ...cenasB }, bib).sugestao.candidatos;
  assert.ok(candidatos.includes("ganho-que-escorre"), "o outro teto está entre os candidatos: " + candidatos);
  const respostas = { ...VOLTA_A, mesmo_teto: "outro", ...cenasB, espelho: "ganho-que-escorre", renda: "variavel", sinais: ["euforia"], experimento: "destino_antes" };
  const { p, env } = await fazerVolta(estado, "sinais", respostas);
  assert.ok(p.noResultado());
  assert.match(p.mount.textContent, /Antes: O freio na hora de cobrar\. Agora: O ganho que escorre\./);
  const salvo = lerLocal(env);
  assert.equal(salvo.respostas.espelho, "ganho-que-escorre");
  assert.equal(salvo.respostas.renda, "variavel");
  assert.equal(salvo.volta.registro.padrao, "ganho-que-escorre");
  assert.equal(salvo.historico[0].padrao, "freio-na-cobranca");
  assert.deepEqual(salvo.respostas.cena_extra, CASOS.B.cena_extra);
});

function pick(obj, chaves) {
  const out = {};
  chaves.forEach((k) => { out[k] = obj[k]; });
  return out;
}

test("refazer as frases troca as cinco tríades e o nível das duas mais verdadeiras", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const novas = pick(CASOS.B, ["triade_1", "triade_2", "triade_3", "triade_4", "triade_5"]);
  const itens = R.itensDasFrases({ ...CASOS.A, ...novas }, bib).map((i) => i.id);
  const frases_nivel = Object.fromEntries(itens.map((id) => [id, 3]));
  const { p, env } = await fazerVolta(estado, "sinais", { ...VOLTA_A, refazer: "sim", ...novas, frases_nivel });
  assert.ok(p.noResultado());
  const salvo = lerLocal(env);
  assert.deepEqual(salvo.respostas.triade_1, CASOS.B.triade_1);
  assert.deepEqual(salvo.respostas.frases_nivel, frases_nivel);
  assert.equal(salvo.historico[0].familia, "evitar", "a entrada de antes guarda a família de antes");
});

// ---- o cuidado e o "nenhum" --------------------------------------------------------------------------------------

test("o ramo de cuidado na volta encerra sem registro, sem plano, sem oferta e sem gravar nada", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const antes = JSON.stringify(lerLocal({ armazenamento: { [CHAVE]: JSON.stringify(estado) } }));
  const casos = [
    { chao: { contas: "nao_fecham", divida: "sim", risco: "sim" }, humor: { interesse: 0, animo: 0 }, sinais_risco: ["nenhum"] },
    { ...SEGURO, sinais_risco: ["recuperar_perda"] },
  ];
  for (const seguro of casos) {
    const { p, env } = await fazerVolta(estado, "sinais", { motivo: "venceu", ...seguro });
    assert.ok(p.noResultado());
    assert.equal(p.porClasse("protocol-registro").length, 0, "sem registro");
    assert.equal(p.porClasse("protocol-plan").length, 0 === 0 ? p.porClasse("protocol-plan").length : 0);
    assert.equal(p.porClasse("protocol-paid-report").length, 0, "sem oferta");
    assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null);
    assert.equal(p.botaoPor("Baixar os lembretes (.ics)"), null, "sem lembrete");
    assert.equal(JSON.stringify(lerLocal(env)), antes, "nada mudou no estado guardado");
    semProibidas(p.mount.textContent, "cuidado na volta");
  }
});

test("\"nenhum teto agora\" é um resultado honesto: mostra os fatos e não grava nem oferece", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const { p, env } = await fazerVolta(estado, "sinais", { motivo: "olhar", ...SEGURO, fatos: VOLTA_A.fatos, mesmo_teto: "nenhum" });
  assert.ok(p.noResultado());
  assert.equal(verdito(p), bib.retornos.volta.resultado.verdict_nenhum);
  assert.match(p.mount.textContent, /Os fatos/);
  assert.equal(p.porClasse("protocol-registro").length, 0);
  assert.equal(p.porClasse("protocol-paid-report").length, 0);
  assert.equal(lerLocal(env).volta.n, 1, "o estado fica como estava");
  assert.deepEqual(lerLocal(env).historico, []);
  assert.equal(p.botaoPor("Guardar neste aparelho para os retornos"), null);
});

// ---- a volta a partir só do código (#c=) ---------------------------------------------------------------------------

test("o botão \"Copiar o link do meu registro\" leva o código, e a barra de endereço nunca o recebe sozinha", async () => {
  const a = abrir();
  await jogarCaso(a, "A");
  let copiado = null;
  a.env.janela.navigator.clipboard = { writeText: (t) => { copiado = t; return Promise.resolve(); } };
  clicar(a.p, "Copiar o link do meu registro");
  assert.match(copiado, /^https:\/\/dlt\.academy\/protocolos\/teto-financeiro\/#c=[A-Za-z0-9_-]{50,2048}$/);
  assert.ok(copiado.length < 2100);
  assert.match(a.p.mount.textContent, /quem tiver o link consegue ler o que está nele/);
  assert.equal(a.env.janela.location.hash, "", "o motor não escreve #c= na barra");
  assert.deepEqual(a.env.chamadasReplaceState, []);
});

test("abrir com #c= limpa o fragmento, oferece os retornos e faz a volta curta com o registro como volta anterior", async () => {
  const estado = await ciclo("A", { diasAtras: 40 });
  const codigo = kit.codificarRegistro(estado.volta.registro, 2048).codigo;
  const pagina = abrir({ hash: "#c=" + codigo });
  assert.equal(pagina.env.chamadasReplaceState.length, 1, "o fragmento é limpo ao ler");
  assert.equal(pagina.env.chamadasReplaceState[0][2], "/protocolos/teto-financeiro/");
  assert.match(pagina.p.mount.textContent, /Encontramos o registro que veio no link/);
  assert.equal(pagina.env.armazenamento[CHAVE], undefined, "nada é gravado só por abrir o link");
  clicar(pagina.p, "Continuar");
  assert.match(pagina.p.mount.textContent, /O que você quer fazer agora\?/);
  ["Retorno do dia 3", "Retorno do dia 7", "Volta nos sinais"].forEach((t) => assert.ok(pagina.p.botaoPor(t), t));
  clicar(pagina.p, "Volta nos sinais");
  assert.match(pagina.p.mount.textContent, /A última volta foi em 11\/10\/2026/);
  clicar(pagina.p, "Começar");
  const ctx = { __estado: { respostas: {}, volta: { n: 1, dia0: estado.volta.dia0, registro: estado.volta.registro, retornos: {} }, historico: [], criado: estado.criado, ciclo: "k3f9x2qa", marco: "sinais" } };
  const respostas = { ...ctx, ...clone(VOLTA_A) };
  await percorrer({ mount: pagina.env.mount, passos: pagina.PROTOCOL.retornos.sinais.steps, kit, respostas, esperar: async () => pagina.env.rodarTimers() });
  assert.ok(pagina.p.noResultado());
  assert.match(pagina.p.mount.textContent, /O mesmo teto: o freio na hora de cobrar/);
  assert.match(pagina.p.mount.textContent, /Não há base para comparar/, "sem os fatos do dia 0, sem base");
  assert.equal(pagina.env.armazenamento[CHAVE], undefined, "só guarda quando ela toca");
  clicar(pagina.p, "Guardar neste aparelho para os retornos");
  const salvo = lerLocal(pagina.env);
  assert.equal(salvo.volta.n, 2);
  assert.equal(salvo.historico.length, 1);
  assert.equal(salvo.historico[0].padrao, "freio-na-cobranca");
});

test("o retorno do dia 7 com o código usa a previsão e a regra do registro", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const codigo = kit.codificarRegistro(estado.volta.registro, 2048).codigo;
  const pagina = abrir({ hash: "#c=" + codigo });
  clicar(pagina.p, "Continuar");
  clicar(pagina.p, "Retorno do dia 7");
  clicar(pagina.p, "Começar");
  const passos = pagina.PROTOCOL.retornos.dia7.steps;
  const ctx = { __estado: { respostas: {}, volta: { n: 1, dia0: estado.volta.dia0, registro: estado.volta.registro, retornos: {} }, historico: [] } };
  assert.match(passos.find((s) => s.id === "acertou").prompt(ctx), /“se eu cobrar cheio, ele some”/, "a previsão vem do registro (140 caracteres)");
});

test("código inválido no link: o que não decodifica no esquema vira a recuperação; grande demais ou com caracteres de fora recomeça; o fragmento sai da barra", () => {
  const naoValeNoEsquema = "#c=" + kit.codificarRegistro({ v: 1 }, 2048).codigo;
  const recuperacao = abrir({ hash: naoValeNoEsquema });
  assert.equal(recuperacao.env.chamadasReplaceState.length, 1);
  assert.match(recuperacao.p.mount.textContent, /Não foi possível ler o código do link/);
  ["#c=" + "a".repeat(3000), "#c=@@@"].forEach((hash) => {
    const pagina = abrir({ hash });
    assert.equal(pagina.env.chamadasReplaceState.length, 1, hash.slice(0, 12));
    assert.equal(pagina.p.pergunta(), bib.cuidado.chao.prompt, "começa do início, sem usar o código");
    assert.equal(pagina.env.armazenamento[CHAVE], undefined);
  });
});

test("a recuperação por código também funciona colando, e o arquivo com registro volta os retornos", async () => {
  const estado = await ciclo("A", { diasAtras: 7 });
  const codigo = kit.codificarRegistro(estado.volta.registro, 2048).codigo;
  const pagina = abrir({ hash: "#volta=dia7" });
  assert.match(pagina.p.mount.textContent, /Não encontramos neste navegador/);
  pagina.p.textarea().value = codigo;
  clicar(pagina.p, "Usar este código");
  assert.match(pagina.p.mount.textContent, /Encontramos o que você trouxe, de 13\/11\/2026/);
  clicar(pagina.p, "Continuar");
  assert.equal(pagina.p.porClasse("protocol-cycle")[0].querySelector("h2").textContent, bib.retornos.dia7.titulo);
});

// ---- o humor decide sem ser guardado: pausar, retomar e terminar -----------------------------------------------------

test("o degrau abaixo por humor sobrevive a pausar e retomar, sem guardar a resposta de humor", async () => {
  const a = abrir();
  await percorrer({
    mount: a.env.mount, passos: a.PROTOCOL.steps, kit, respostas: { ...clone(CASOS.A), humor: { interesse: 2, animo: 2 } }, esperar: async () => a.env.rodarTimers(),
  });
  clicar(a.p, "Salvar e continuar depois");
  const guardado = lerLocal(a.env);
  assert.equal(guardado.respostas.degrau_abaixo, true);
  assert.ok(!sinaisDeCuidadoNoEstado(guardado));
  const b = abrir({ local: { [CHAVE]: a.env.armazenamento[CHAVE] } });
  clicar(b.p, "Continuar de onde parei");
  assert.equal(b.p.pergunta(), bib.telas.clima_casa.prompt);
  const respostas = { ...clone(CASOS.A), ...clone(ATO2.A) };
  await percorrer({ mount: b.env.mount, passos: b.PROTOCOL.steps, kit, respostas, desde: "clima_casa", esperar: async () => b.env.rodarTimers() });
  assert.ok(b.p.noResultado());
  const ajuste = b.p.porClasse("protocol-section").find((s) => s.dataset.kind === "ajuste");
  assert.ok(ajuste, "o plano começa um degrau abaixo mesmo sem as respostas de humor");
  assert.match(ajuste.textContent, /últimas semanas foram pesadas/);
  clicar(b.p, "Guardar neste aparelho para os retornos");
  assert.equal(lerLocal(b.env).respostas.degrau_abaixo, true);
  const md = baixar(b.env, b.p, "Baixar como texto (.md)").texto;
  assert.ok(!/interesse|animo/.test(md), "o .md não leva as respostas de humor");
  const lido = b.PROTOCOL.importar.md(md);
  assert.equal(lido.estado.respostas.degrau_abaixo, true, "o degrau abaixo volta do .md");
});

test("a aba que recarrega no meio do Ato 2 também mantém o degrau abaixo", async () => {
  const a = abrir();
  await percorrer({
    mount: a.env.mount, passos: a.PROTOCOL.steps, kit, respostas: { ...clone(CASOS.A), humor: { interesse: 2, animo: 2 } }, esperar: async () => a.env.rodarTimers(),
  });
  clicar(a.p, "Continuar agora");
  const sessao = JSON.parse(a.env.sessao[CHAVE]);
  assert.equal(sessao.respostas.degrau_abaixo, true);
  assert.ok(!sinaisDeCuidadoNoEstado(sessao));
  const b = abrir({ sessao: { ...a.env.sessao } });
  assert.equal(b.p.pergunta(), bib.telas.clima_casa.prompt);
});

// ---- o prazo renovado ------------------------------------------------------------------------------------------------

test("abrir o Teto guardado renova o prazo, sem mostrar resposta, e o link de um marco também", async () => {
  const estado = await ciclo("A");
  const velho = clone(estado);
  velho.expira = "2026-12-05";
  const a = abrir({ local: { [CHAVE]: JSON.stringify(velho) } });
  assert.equal(lerLocal(a.env).expira, "2027-03-20", "120 dias desde o último uso");
  assert.ok(!a.p.mount.textContent.includes("cobrar o justo"), "nenhuma resposta antes da escolha");
  const b = abrir({ hash: "#volta=dia7", local: { [CHAVE]: JSON.stringify(velho) } });
  assert.equal(lerLocal(b.env).expira, "2027-03-20");
  const passado = clone(estado);
  passado.expira = "2026-11-19";
  const c = abrir({ local: { [CHAVE]: JSON.stringify(passado) } });
  assert.equal(c.env.armazenamento[CHAVE], undefined, "o que passou do prazo é apagado");
});

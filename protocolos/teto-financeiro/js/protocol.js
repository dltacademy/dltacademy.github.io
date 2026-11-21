// Protocolo do Teto Financeiro: o Ato 1 (o mapa) e o Ato 2 (o fio e a semana).
//
// Monta o PROTOCOL a partir da biblioteca (js/biblioteca-teto.js) e das regras
// (teto-regras.js). Aqui ficam a ordem das telas, o que cada uma mostra e a leitura do .md
// que a pessoa baixou; as contas e a montagem do resultado, dos arquivos e dos lembretes estão
// nas regras e os textos dos padrões e das telas, na biblioteca. Os textos que são só da
// página (títulos de parte, ajudas do Ato 1) estão em TEXTOS e valem como provisórios
// enquanto a biblioteca for rascunho.
//
// Telas do Ato 1, na ordem:
//   chao, humor, sinais_risco      cuidado (nunca guardados; o ramo de cuidado encerra aqui)
//   fatos                          os últimos 30 dias
//   cena_*                         as 8 cenas
//   custo                          qual marca custou mais
//   triade_1 ... triade_5          as frases
//   frases_nivel                   as duas frases mais verdadeiras, de 0 a 3
//   espelho, variante, renda, alvo o teto, e o que a trava precisa
//   fim_ato1                       checkpoint: o mapa, a trava e as saídas
// "Nenhum padrão domina" também encerra: resultado honesto, sem plano de teto.
//
// Telas do Ato 2, na ordem:
//   clima_casa                     o clima do dinheiro na casa em que cresceu
//   cena, terreno, sinais, frase, ponto_escolha, alivio, custo_depois, para_que, excecao
//                                  a última vez
//   desgrudar, regra_antiga, regra_origem, previsao, dia_um_ano, importancia, regra_trabalho
//                                  ressignificar
//   desconforto, experimento, se_entao, confianca, proximas_24h
//                                  o plano

// Aviso calmo para quem abriu a página dentro de um aplicativo (Instagram, TikTok,
// Facebook): lá o armazenamento é separado do navegador e baixar arquivo costuma falhar.
(function avisarNavegadorDeApp() {
  const aviso = document.getElementById("protocol-aviso-app");
  if (!aviso) return;
  const agente = String((typeof navigator !== "undefined" && navigator.userAgent) || "");
  if (/Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance/i.test(agente)) aviso.hidden = false;
})();

const PROTOCOL = (function montarProtocolo() {
  "use strict";

  const bib = BIBLIOTECA_TETO;
  const R = TetoRegras;
  const kit = DLTProtocolKit;

  const GRUPO_ATO1 = "Ato 1";
  const GRUPO_ATO2 = "Ato 2";
  const PAGINA = "https://dlt.academy/protocolos/teto-financeiro/";
  const CUIDADO = ["chao", "humor", "sinais_risco"];

  const TEXTOS = {
    cuidado: {
      eyebrow: "Antes de começar",
      chao: "Três perguntas rápidas. Esta tela e as duas seguintes nunca ficam guardadas, nem na aba do navegador.",
      humor: "Não mostramos nota. A resposta só ajusta o ritmo do que vem depois.",
      sinais: "Pode marcar mais de um. Marcar algum destes não é erro: muda o que faz sentido fazer agora.",
    },
    fatos: {
      eyebrow: "Os últimos 30 dias",
      ajuda: "Cinco contagens rápidas, para você comparar mais tarde. Se uma não se aplica, marque “Não se aplica”.",
    },
    cena: "Marque tudo o que costuma acontecer. Se nada disso acontece, marque “Isso não acontece comigo”.",
    custo: { eyebrow: "O custo", ajuda: "Escolha a que pesou mais, mesmo que tenha sido pouco." },
    triade: "Escolha uma frase que soa mais verdadeira e uma que soa menos. Não precisa ser a que você gostaria que fosse.",
    frases: {
      eyebrow: "As frases que mais soam verdadeiras",
      ajuda: "São as duas frases que você marcou como mais verdadeiras. Responda para cada uma. Mais adiante você volta a elas para ver se mudaram.",
    },
    espelho: {
      eyebrow: "O espelho",
      ajuda: "A escolha é sua. Estas são as que as suas respostas mais apontam.",
      vazio: "Para rever as cenas, use “Voltar”.",
      seguir: "Seguir assim, sem um teto",
    },
    variante: "Um detalhe",
    renda: { eyebrow: "Como o dinheiro entra", ajuda: "Isso define o tipo de trava que serve para você." },
    alvo: {
      eyebrow: "A sua trava",
      placeholder: "Ex.: o preço que quero cobrar e o dia em que vou dizê-lo.",
      seguranca: "Se isto pesar, pare por aqui: o CVV atende pelo 188, a qualquer hora.",
    },
    partes: {
      raiox: "O Raio-X",
      ultima: "A última vez",
      ressignificar: "Ressignificar",
      plano: "O plano",
    },
  };

  // ---- apoio -------------------------------------------------------------------------

  const lista = (v) => (Array.isArray(v) ? v : []);
  const dataBR = (iso) => (typeof iso === "string" && iso.length >= 10 ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "");
  const aspas = (texto) => "“" + kit.semPontoFinal(texto) + "”";

  function preencher(texto, valores) {
    return String(texto || "").replace(/\{([a-z0-9_]+)\}/g, (m, chave) => (
      Object.prototype.hasOwnProperty.call(valores, chave) ? valores[chave] : m
    ));
  }

  // O resultado e o checkpoint também precisam do endereço da página, para o link dos lembretes.
  const comPagina = (ctx) => Object.assign({ pagina: PAGINA }, ctx);

  // Os candidatos do espelho, cada um com as frases que a pessoa marcou, e a saída "nenhum".
  function opcoesDoEspelho(a) {
    const candidatos = R.calcular(a, bib).sugestao.candidatos;
    if (!candidatos.length) return [{ value: bib.telas.espelho.nenhum.value, label: TEXTOS.espelho.seguir }];
    const opcoes = candidatos.map((padrao) => {
      const frases = R.marcasDoPadrao(a, padrao, bib).map((m) => aspas(m.label));
      return { value: padrao, label: bib.padroes[padrao].nome + (frases.length ? ". Você marcou: " + frases.join("; ") : "") };
    });
    opcoes.push(bib.telas.espelho.nenhum);
    return opcoes;
  }

  const padraoEscolhido = (a) => (typeof a.espelho === "string" && bib.padroes[a.espelho] ? a.espelho : null);
  const trilhaDaTrava = (a) => {
    const padrao = padraoEscolhido(a);
    return padrao ? R.travaImediata(padrao, null, a.renda, bib) : null;
  };

  // ---- os passos do Ato 1 ---------------------------------------------------------------------

  function passosDoCuidado() {
    const passos = [];
    passos.push({
      id: "chao",
      grupo: GRUPO_ATO1,
      type: "grade",
      eyebrow: TEXTOS.cuidado.eyebrow,
      prompt: bib.cuidado.chao.prompt,
      help: TEXTOS.cuidado.chao,
      items: bib.cuidado.chao.itens.map((i) => ({ id: i.id, label: i.label, options: i.opcoes })),
    });
    if (bib.cuidado.humor.ativo === true) {
      passos.push({
        id: "humor",
        grupo: GRUPO_ATO1,
        type: "grade",
        eyebrow: TEXTOS.cuidado.eyebrow,
        prompt: bib.cuidado.humor.prompt,
        help: TEXTOS.cuidado.humor,
        options: bib.cuidado.humor.opcoes,
        items: bib.cuidado.humor.itens.map((i) => ({ id: i.id, label: i.label })),
      });
    }
    passos.push({
      id: "sinais_risco",
      grupo: GRUPO_ATO1,
      type: "multi",
      exclusive: bib.cuidado.sinais_risco.exclusiva,
      eyebrow: TEXTOS.cuidado.eyebrow,
      prompt: bib.cuidado.sinais_risco.prompt,
      help: (a) => (R.avaliarCuidado(a, bib).avisoHumor ? bib.cuidado.textos.aviso_humor + " " : "") + TEXTOS.cuidado.sinais,
      options: bib.cuidado.sinais_risco.opcoes,
      // O cuidado encerra o protocolo aqui: sem cenas, sem registro, sem guardar, sem oferta.
      next: (a) => (R.avaliarCuidado(a, bib).ramo ? null : undefined),
    });
    return passos;
  }

  function passosDoMapa() {
    const passos = [];
    passos.push({
      id: "fatos",
      grupo: GRUPO_ATO1,
      type: "grade",
      eyebrow: TEXTOS.fatos.eyebrow,
      prompt: bib.telas.fatos.prompt,
      help: TEXTOS.fatos.ajuda,
      items: bib.fatos.map((f) => ({ id: f.id, label: f.label, options: f.opcoes.concat([f.na]) })),
    });
    bib.cenas.forEach((cena, i) => {
      passos.push({
        id: cena.id,
        grupo: GRUPO_ATO1,
        type: "multi",
        exclusive: cena.nao_acontece.value,
        eyebrow: "Cena " + (i + 1) + " de " + bib.cenas.length,
        prompt: cena.prompt,
        help: TEXTOS.cena,
        options: cena.opcoes.map((o) => ({ value: o.value, label: o.label })).concat([cena.nao_acontece]),
      });
    });
    passos.push({
      id: "custo",
      grupo: GRUPO_ATO1,
      type: "choice",
      eyebrow: TEXTOS.custo.eyebrow,
      prompt: bib.telas.custo.prompt,
      help: TEXTOS.custo.ajuda,
      showIf: (a) => R.sinaisMarcados(a, bib).length > 0,
      options: (a) => R.sinaisMarcados(a, bib).concat([bib.telas.custo.nenhuma]),
    });
    bib.triades.forEach((t, i) => {
      passos.push({
        id: t.id,
        grupo: GRUPO_ATO1,
        type: "triad",
        eyebrow: "As frases · " + (i + 1) + " de " + bib.triades.length,
        prompt: bib.telas.triade.prompt,
        help: TEXTOS.triade,
        labels: { mais: bib.telas.triade.mais, menos: bib.telas.triade.menos },
        items: t.itens.map((id) => ({ id, label: bib.itens[id].texto })),
      });
    });
    passos.push({
      id: "frases_nivel",
      grupo: GRUPO_ATO1,
      type: "grade",
      eyebrow: TEXTOS.frases.eyebrow,
      prompt: bib.telas.frases_grade.prompt,
      help: TEXTOS.frases.ajuda,
      options: bib.telas.frases_grade.opcoes,
      items: (a) => R.itensDasFrases(a, bib),
    });
    passos.push({
      id: "espelho",
      grupo: GRUPO_ATO1,
      type: "choice",
      eyebrow: TEXTOS.espelho.eyebrow,
      prompt: (a) => (R.calcular(a, bib).sugestao.candidatos.length ? bib.telas.espelho.prompt : bib.telas.espelho.nenhum_domina),
      help: (a) => (R.calcular(a, bib).sugestao.candidatos.length ? TEXTOS.espelho.ajuda : TEXTOS.espelho.vazio),
      options: opcoesDoEspelho,
      next: (a) => (a.espelho === bib.telas.espelho.nenhum.value ? null : undefined),
    });
    passos.push({
      id: "variante",
      grupo: GRUPO_ATO1,
      type: "choice",
      eyebrow: TEXTOS.variante,
      showIf: (a) => { const p = padraoEscolhido(a); return Boolean(p && lista(bib.padroes[p].variantes).length); },
      prompt: (a) => { const p = padraoEscolhido(a); return p && bib.telas.variante[p] ? bib.telas.variante[p].prompt : ""; },
      options: (a) => { const p = padraoEscolhido(a); return p && bib.telas.variante[p] ? bib.telas.variante[p].opcoes : []; },
    });
    passos.push({
      id: "renda",
      grupo: GRUPO_ATO1,
      type: "choice",
      eyebrow: TEXTOS.renda.eyebrow,
      prompt: bib.telas.renda.prompt,
      help: TEXTOS.renda.ajuda,
      showIf: (a) => { const p = padraoEscolhido(a); return Boolean(p && bib.padroes[p].trava && bib.padroes[p].trava.por_renda); },
      options: bib.telas.renda.opcoes,
    });
    // Nos padrões de ganho a trava pede um preço-alvo ou a menor ação, escritos agora (opcional).
    passos.push({
      id: "alvo",
      grupo: GRUPO_ATO1,
      type: "write",
      maxLength: 200,
      eyebrow: TEXTOS.alvo.eyebrow,
      showIf: (a) => { const t = trilhaDaTrava(a); return Boolean(t && t.campo); },
      prompt: (a) => { const t = trilhaDaTrava(a); return t && t.campo ? t.campo.label : ""; },
      help: (a) => { const t = trilhaDaTrava(a); return (t ? t.texto + " " : "") + TEXTOS.alvo.seguranca; },
      placeholder: TEXTOS.alvo.placeholder,
      cta: "Continuar",
    });
    passos.push({
      id: "fim_ato1",
      grupo: GRUPO_ATO1,
      type: "checkpoint",
      actions: { continuar: "Continuar agora", pausar: "Salvar e continuar depois" },
      render: (a, ctx) => R.montarParcial(a, comPagina(ctx), bib),
    });
    return passos;
  }

  // ---- os passos do Ato 2 ---------------------------------------------------------------------

  // As telas que pedem texto levam a linha de segurança visível.
  const comSeguranca = (...partes) => partes.filter(Boolean).concat([bib.telas.seguranca_escrita]).join(" ");

  function complemento(tela, id, extra) {
    const c = tela.complemento;
    return Object.assign({ type: "write", id, prompt: c.prompt, placeholder: c.placeholder, maxLength: c.max, optional: true }, extra);
  }

  function passosDoAto2() {
    const T = bib.telas;
    const passos = [];
    const parte = (chave) => ({ grupo: GRUPO_ATO2, eyebrow: TEXTOS.partes[chave] });
    const padraoDe = (a) => bib.padroes[a.espelho] || {};
    const escrita = (id, chave, tela, extra) => passos.push(Object.assign({
      id,
      type: "write",
      prompt: tela.prompt,
      help: comSeguranca(tela.ajuda),
      placeholder: tela.placeholder,
      maxLength: tela.max,
    }, parte(chave), extra));

    // O Raio-X
    passos.push(Object.assign({
      id: "clima_casa",
      type: "choice",
      prompt: T.clima_casa.prompt,
      help: comSeguranca(T.clima_casa.ajuda),
      options: T.clima_casa.opcoes,
      followUp: complemento(T.clima_casa, "clima_texto"),
    }, parte("raiox")));

    // A última vez
    escrita("cena", "ultima", T.cena);
    passos.push(Object.assign({
      id: "terreno",
      type: "multi",
      exclusive: T.terreno.exclusiva,
      prompt: T.terreno.prompt,
      help: T.terreno.ajuda,
      options: T.terreno.opcoes,
    }, parte("ultima")));
    passos.push(Object.assign({
      id: "sinais",
      type: "multi",
      prompt: T.sinais.prompt,
      help: comSeguranca(T.sinais.ajuda),
      options: (a) => lista(padraoDe(a).sinais_opcoes).concat([T.sinais.outro]),
      followUp: complemento(T.sinais, "sinais_outro"),
    }, parte("ultima")));
    escrita("frase", "ultima", T.frase);
    escrita("ponto_escolha", "ultima", T.ponto_escolha);
    passos.push(Object.assign({
      id: "alivio",
      type: "choice",
      prompt: T.alivio.prompt,
      help: comSeguranca(T.alivio.ajuda),
      options: T.alivio.opcoes,
      followUp: complemento(T.alivio, "alivio_texto"),
    }, parte("ultima")));
    escrita("custo_depois", "ultima", T.custo_depois);
    passos.push(Object.assign({
      id: "para_que",
      type: "choice",
      prompt: T.para_que.prompt,
      help: comSeguranca(T.para_que.ajuda),
      options: T.para_que.opcoes,
      followUp: complemento(T.para_que, "para_que_texto"),
    }, parte("ultima")));
    escrita("excecao", "ultima", T.excecao);

    // Ressignificar
    passos.push(Object.assign({
      id: "desgrudar",
      type: "choice",
      showIf: (a) => typeof a.frase === "string" && a.frase.trim() !== "",
      prompt: (a) => preencher(T.desgrudar.modelo, { frase: kit.semPontoFinal(a.frase) }) + " " + T.desgrudar.prompt,
      help: T.desgrudar.ajuda,
      options: T.desgrudar.opcoes,
    }, parte("ressignificar")));
    passos.push(Object.assign({
      id: "regra_antiga",
      type: "choice",
      prompt: T.regra_antiga.prompt,
      help: comSeguranca(T.regra_antiga.ajuda),
      options: (a) => R.opcoesDaRegraAntiga(a, bib),
      followUp: complemento(T.regra_antiga, "regra_antiga_texto"),
    }, parte("ressignificar")));
    escrita("regra_origem", "ressignificar", T.regra_origem);
    escrita("previsao", "ressignificar", T.previsao, {
      followUp: {
        type: "scale",
        id: "crenca_previsao",
        prompt: T.previsao.complemento.prompt,
        min: 0,
        max: 100,
        step: 10,
        format: "%",
        ends: T.previsao.complemento.ends,
      },
    });
    escrita("dia_um_ano", "ressignificar", T.dia_um_ano);
    passos.push(Object.assign({
      id: "importancia",
      type: "scale",
      prompt: T.importancia.prompt,
      help: comSeguranca(),
      min: 0,
      max: 10,
      step: 1,
      ends: T.importancia.ends,
      followUp: complemento(T.importancia, "motivos"),
    }, parte("ressignificar")));
    escrita("regra_trabalho", "ressignificar", T.regra_trabalho, {
      help: (a) => comSeguranca(
        T.regra_trabalho.ajuda,
        padraoDe(a).regra_trabalho_exemplo ? preencher(T.regra_trabalho.exemplo, { exemplo: kit.semPontoFinal(padraoDe(a).regra_trabalho_exemplo) }) : ""
      ),
    });

    // O plano
    passos.push(Object.assign({
      id: "desconforto",
      type: "choice",
      prompt: (a) => {
        const o = a.alivio && a.alivio !== "nada" ? T.alivio.opcoes.find((x) => x.value === a.alivio) : null;
        return o ? preencher(T.desconforto.modelo_alivio, { alivio: kit.primeiraMinuscula(o.label) }) : T.desconforto.prompt;
      },
      options: T.desconforto.opcoes,
    }, parte("plano")));
    passos.push(Object.assign({
      id: "experimento",
      type: "choice",
      prompt: T.experimento.prompt,
      help: (a) => {
        const calc = R.calcular(a, bib);
        const degraus = calc.padrao ? R.escolherDegraus(calc.padrao, calc.variante, a, calc.cuidado, bib) : null;
        const previsao = typeof a.previsao === "string" && a.previsao.trim() ? preencher(T.experimento.ajuda, { previsao: kit.semPontoFinal(a.previsao) }) : "";
        const menor = degraus && degraus.menor ? preencher(T.experimento.ajuda_menor, { degrau0: kit.semPontoFinal(degraus.dia3.texto) }) : "";
        return comSeguranca(previsao, menor);
      },
      options: (a) => {
        const calc = R.calcular(a, bib);
        const escada = calc.padrao ? R.escadaDoPadrao(calc.padrao, calc.variante, bib) : null;
        return lista(escada && escada.degrau1).concat([T.experimento.outro]);
      },
      followUp: complemento(T.experimento, "experimento_texto"),
    }, parte("plano")));
    escrita("se_entao", "plano", T.se_entao, {
      value: (a) => R.rascunhoSeEntao(a, bib),
      help: (a) => {
        const calc = R.calcular(a, bib);
        const escada = calc.padrao ? R.escadaDoPadrao(calc.padrao, calc.variante, bib) : null;
        return comSeguranca(T.se_entao.ajuda, escada && escada.se_entao_exemplo ? preencher(T.se_entao.exemplo, { exemplo: kit.semPontoFinal(escada.se_entao_exemplo) }) : "");
      },
    });
    passos.push(Object.assign({
      id: "confianca",
      type: "scale",
      prompt: T.confianca.prompt,
      help: comSeguranca(),
      min: 0,
      max: 10,
      step: 1,
      ends: T.confianca.ends,
      followUp: complemento(T.confianca, "sobe_um_ponto"),
    }, parte("plano")));
    escrita("proximas_24h", "plano", T.proximas_24h);
    return passos;
  }

  // ---- retomar em outro aparelho: o .md ------------------------------------------------------------

  const CAMPOS_CENAS = {};
  bib.cenas.forEach((cena) => { CAMPOS_CENAS[cena.id] = 1500; });
  CAMPOS_CENAS.custo = 600;
  const CAMPOS_FRASES = { frases_nivel: 800 };
  bib.triades.forEach((t) => { CAMPOS_FRASES[t.id] = 600; });
  const CAMPOS_FATOS = {};
  bib.fatos.forEach((f) => { CAMPOS_FATOS[f.id] = 200; });
  const BLOCOS_LIDOS = {
    "teto.registro": { v: 1 },
    "teto.padrao": { v: 1, campos: { padrao: 200, variante: 200, trilha: 200, vazamento: 200, espelho: 2000, trava: 1000, renda: 200, alvo: 200 } },
    "teto.fatos": { v: 1, campos: CAMPOS_FATOS },
    "teto.raiox": { v: 1, campos: { familia: 200, itens: 800, areas: 400, clima: 200, clima_texto: 400 } },
    "teto.cenas": { v: 1, campos: CAMPOS_CENAS },
    "teto.frases": { v: 1, campos: CAMPOS_FRASES },
    "teto.ultima_vez": {
      v: 1,
      campos: {
        cena: 800, terreno: 200, sinais: 600, sinais_outro: 400, frase: 400, ponto_escolha: 600,
        alivio: 200, alivio_texto: 400, custo_depois: 600, para_que: 200, para_que_texto: 400, excecao: 600,
      },
    },
    "teto.ressignificar": {
      v: 1,
      campos: {
        desgrudar: 200, regra_antiga: 600, regra_antiga_texto: 400, regra_origem: 600, previsao: 600,
        crenca_previsao: 50, dia_um_ano: 800, importancia: 50, motivos: 600, regra_trabalho: 400,
      },
    },
    "teto.plano": {
      v: 1,
      campos: {
        desconforto: 200, experimento: 600, experimento_texto: 400, se_entao: 600,
        confianca: 50, sobe_um_ponto: 600, proximas_24h: 600,
      },
    },
  };

  const valores = (campo) => (campo && typeof campo.valor === "string" && campo.valor ? campo.valor.split(",").filter(Boolean) : []);
  const textoDe = (campo) => (campo && typeof campo.texto === "string" ? campo.texto : "");
  const numeroDe = (campo) => (campo && /^\d{1,3}$/.test(String(campo.valor)) ? Number(campo.valor) : undefined);

  function respostasDoAto1(blocos) {
    const resp = {};
    const padrao = blocos["teto.padrao"] ? blocos["teto.padrao"].campos : {};
    const fatos = blocos["teto.fatos"] ? blocos["teto.fatos"].campos : {};
    const cenas = blocos["teto.cenas"] ? blocos["teto.cenas"].campos : {};
    const frases = blocos["teto.frases"] ? blocos["teto.frases"].campos : {};

    const objFatos = {};
    bib.fatos.forEach((f) => {
      const campo = fatos[f.id];
      if (!campo || typeof campo.valor !== "string" || !campo.valor) return;
      objFatos[f.id] = /^\d$/.test(campo.valor) ? Number(campo.valor) : campo.valor;
    });
    if (Object.keys(objFatos).length) resp.fatos = objFatos;

    bib.cenas.forEach((cena) => {
      const marcadas = valores(cenas[cena.id]);
      if (marcadas.length) resp[cena.id] = marcadas;
    });
    if (cenas.custo && cenas.custo.valor) resp.custo = cenas.custo.valor;

    bib.triades.forEach((t) => {
      const par = valores(frases[t.id]);
      if (par.length === 2) resp[t.id] = { mais: par[0], menos: par[1] };
    });
    const niveis = {};
    valores(frases.frases_nivel).forEach((par) => {
      const m = /^([a-z]+_[0-9])\.([0-9])$/.exec(par);
      if (m) niveis[m[1]] = Number(m[2]);
    });
    if (Object.keys(niveis).length) resp.frases_nivel = niveis;

    if (padrao.padrao && padrao.padrao.valor) resp.espelho = padrao.padrao.valor;
    if (padrao.variante && padrao.variante.valor) resp.variante = padrao.variante.valor;
    if (padrao.renda && padrao.renda.valor) resp.renda = padrao.renda.valor;
    // O que ela escreveu para a trava só existe nos padrões de ganho; nos outros a tela nem aparece.
    const trava = resp.espelho && bib.padroes[resp.espelho] ? R.travaImediata(resp.espelho, null, resp.renda, bib) : null;
    if (padrao.alvo && trava && trava.campo) resp.alvo = padrao.alvo.texto;
    return resp;
  }

  // As respostas do Ato 2, quando o arquivo as traz. Textos e complementos voltam como texto
  // (em branco quando ela não escreveu), que é como o motor os guarda.
  function respostasDoAto2(blocos, resp) {
    if (!blocos["teto.ultima_vez"]) return;
    const raiox = blocos["teto.raiox"] ? blocos["teto.raiox"].campos : {};
    const uv = blocos["teto.ultima_vez"].campos;
    const rs = blocos["teto.ressignificar"] ? blocos["teto.ressignificar"].campos : {};
    const pl = blocos["teto.plano"] ? blocos["teto.plano"].campos : {};
    const escolha = (campo) => (campo && typeof campo.valor === "string" && campo.valor ? campo.valor : undefined);
    const poe = (id, valor) => { if (valor !== undefined) resp[id] = valor; };

    poe("clima_casa", escolha(raiox.clima));
    resp.clima_texto = textoDe(raiox.clima_texto);
    resp.cena = textoDe(uv.cena);
    const terreno = valores(uv.terreno);
    if (terreno.length) resp.terreno = terreno;
    const sinais = valores(uv.sinais);
    if (sinais.length) resp.sinais = sinais;
    resp.sinais_outro = textoDe(uv.sinais_outro);
    resp.frase = textoDe(uv.frase);
    resp.ponto_escolha = textoDe(uv.ponto_escolha);
    poe("alivio", escolha(uv.alivio));
    resp.alivio_texto = textoDe(uv.alivio_texto);
    resp.custo_depois = textoDe(uv.custo_depois);
    poe("para_que", escolha(uv.para_que));
    resp.para_que_texto = textoDe(uv.para_que_texto);
    resp.excecao = textoDe(uv.excecao);

    poe("desgrudar", escolha(rs.desgrudar));
    poe("regra_antiga", escolha(rs.regra_antiga));
    resp.regra_antiga_texto = textoDe(rs.regra_antiga_texto);
    resp.regra_origem = textoDe(rs.regra_origem);
    resp.previsao = textoDe(rs.previsao);
    poe("crenca_previsao", numeroDe(rs.crenca_previsao));
    resp.dia_um_ano = textoDe(rs.dia_um_ano);
    poe("importancia", numeroDe(rs.importancia));
    resp.motivos = textoDe(rs.motivos);
    resp.regra_trabalho = textoDe(rs.regra_trabalho);

    poe("desconforto", escolha(pl.desconforto));
    poe("experimento", escolha(pl.experimento));
    resp.experimento_texto = textoDe(pl.experimento_texto);
    resp.se_entao = textoDe(pl.se_entao);
    poe("confianca", numeroDe(pl.confianca));
    resp.sobe_um_ponto = textoDe(pl.sobe_um_ponto);
    resp.proximas_24h = textoDe(pl.proximas_24h);
  }

  function respostasDoArquivo(blocos) {
    const resp = respostasDoAto1(blocos);
    respostasDoAto2(blocos, resp);
    return resp;
  }

  // A resposta do passo (e o complemento dele) ainda vale para esta biblioteca?
  function respostaValida(passo, resp) {
    if (!kit.validarResposta(passo, resp[passo.id], resp).ok) return false;
    return !passo.followUp || kit.validarComplemento(passo.followUp, resp[passo.followUp.id]).ok;
  }

  // Os ids dos passos que a pessoa já percorreu, refazendo o caminho do fluxo com as
  // respostas do arquivo. `chegou` diz se o checkpoint do Ato 1 foi alcançado e `completo`,
  // se todos os passos até o resultado têm resposta que vale.
  function caminhoDoArquivo(passos, resp) {
    const ids = [];
    let chegou = false;
    let completo = true;
    let indice = kit.proximoIndice(passos, -1, resp);
    while (indice < passos.length) {
      const passo = passos[indice];
      if (CUIDADO.indexOf(passo.id) === -1) {
        if (passo.type === "checkpoint") {
          ids.push(passo.id);
          chegou = true;
        } else if (respostaValida(passo, resp)) {
          ids.push(passo.id);
        } else {
          completo = false;
          break;
        }
      }
      indice = kit.proximoIndice(passos, indice, resp);
    }
    return { ids, chegou, completo };
  }

  function lerMdDoTeto(texto, passos) {
    const erro = { erro: "Este arquivo não é de um Teto Financeiro. Escolha o arquivo (.md) que você baixou desta página." };
    const blocos = kit.lerBlocos(texto, BLOCOS_LIDOS);
    const registro = blocos["teto.registro"];
    if (!registro || !registro.json || !kit.validarEsquema(registro.json, R.esquemaDoRegistro).ok) return erro;
    const resp = respostasDoArquivo(blocos);
    if (resp.espelho !== registro.json.padrao || !bib.padroes[resp.espelho]) return erro;
    const caminho = caminhoDoArquivo(passos, resp);
    return {
      estado: {
        criado: registro.json.data,
        etapa: caminho.completo && caminho.chegou ? "concluido" : caminho.chegou ? "pausa" : "ato1",
        passo: null,
        caminho: caminho.ids,
        respostas: resp,
        volta: { n: registro.json.volta, dia0: registro.json.data, registro: registro.json, retornos: {} },
      },
      resumo: "O seu Teto de " + dataBR(registro.json.data) + ": " + bib.padroes[resp.espelho].nome + ".",
    };
  }

  // ---- o protocolo -----------------------------------------------------------------------------

  const passos = passosDoCuidado().concat(passosDoMapa(), passosDoAto2());

  return {
    id: "protocolo-teto-financeiro",
    slug: "teto-financeiro",
    title: "Protocolo do Teto Financeiro",
    path: "/protocolos/teto-financeiro/",
    pdfSubject: "Reflexão sobre hábitos com dinheiro",
    progresso: "grupos",
    disclaimer: bib.textos.disclaimer,

    persist: {
      versao: 1,
      diasRetencao: 120,
      naoGuardar: CUIDADO.slice(),
      bib: bib.versao,
      rotulo: "um Teto guardado",
      migracoes: {},
    },

    steps: passos,

    retornos: {
      continuar: { titulo: bib.retornos.continuar.titulo },
    },

    importar: {
      md: (texto) => lerMdDoTeto(texto, passos),
    },

    result(a, ctx) {
      return R.montarResultado(a, comPagina(ctx), bib, ctx && ctx.hoje);
    },
  };
})();

runProtocol(PROTOCOL, "protocol-mount");

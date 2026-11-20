// Protocolo do Teto Financeiro: o Ato 1 (o mapa).
//
// Monta o PROTOCOL a partir da biblioteca (js/biblioteca-teto.js) e das regras
// (teto-regras.js). Aqui ficam a ordem das telas, o que cada uma mostra e as saídas
// (checkpoint, ramo de cuidado, resultado "nenhum", .md, .ics); as contas estão nas
// regras e os textos dos padrões, na biblioteca. Os textos que são só da página
// (títulos de seção, ajudas) estão em TEXTOS e valem como provisórios enquanto a
// biblioteca for rascunho.
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

  const GRUPO = "Ato 1";
  const PAGINA = "https://dlt.academy/protocolos/teto-financeiro/";
  const CUIDADO = ["chao", "humor", "sinais_risco"];
  const HORA_PADRAO = "20:00";

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
    resultado: {
      eyebrow: "Fim do Ato 1 · o seu mapa",
      verdict: "Seu teto hoje: ",
      trilha: {
        ganho: "É um teto de ganho: o limite está em quanto você cobra, pede ou arrisca para ganhar.",
        retencao: "É um teto de retenção: o dinheiro chega, mas não fica, ou sai antes de cumprir o que você planejou.",
      },
      perto: "Os dois lados, ganho e retenção, pontuaram perto um do outro. Vale observar o outro também.",
      frasesMarcadas: "As frases que você marcou:",
      semFamilia: "Nenhuma crença se destacou das outras: as suas respostas ficaram equilibradas.",
      familia: "A crença que mais pesa: ",
      vazamentoTitulo: "O vazamento em observação",
      vazamento: "Você também marcou sinais de “{nome}”, do outro lado. Será que você destrava num lado e devolve no outro?",
      vazamentoNota: "Não é a meta de agora: fica em observação e é o alvo da próxima volta.",
      sessentaRegra: " Por enquanto, use esta: “{exemplo}”. Na parte 2 você escreve a sua.",
      travaTitulo: "A sua trava de hoje",
      travaAlvo: "O que você escreveu: ",
      sinaisEmpurrao: "O que costuma empurrar você: {empurrao}.",
      parte2: "A parte 2 deste protocolo (a escrita sobre a última vez, a regra de trabalho e o plano da semana) chega na próxima versão. Por enquanto o seu mapa está completo: baixe os arquivos abaixo e guarde.",
      seguranca: "Isto é uma reflexão sobre hábitos com dinheiro, e não substitui conversar com alguém. Se o peso for grande, o CVV atende pelo 188, a qualquer hora.",
      arquivo: "teto-financeiro-mapa",
    },
    nenhum: { eyebrow: "O seu resultado", voltar: "Quando voltar aqui" },
    cuidadoResultado: { eyebrow: "Primeiro, o cuidado", noventa: "O plano de 90 dias" },
    registro: { titulo: "O registro do seu teto", teto: "O teto", trilha: "O tipo de teto", familia: "A crença que mais pesa", data: "Feito em" },
    app: {
      semana: { resumo: "Teto Financeiro: revisão semanal", descricao: "Dez minutos para olhar a semana: o sinal apareceu? Abra o link." },
      continuar: { resumo: "Teto Financeiro: continuar de onde parou", descricao: "Retome o seu Teto. Se não houver nada guardado neste navegador, carregue o seu arquivo (.md). Se você já terminou, ignore este lembrete." },
    },
  };

  // ---- apoio -------------------------------------------------------------------------

  const lista = (v) => (Array.isArray(v) ? v : []);
  const dataBR = (iso) => (typeof iso === "string" && iso.length >= 10 ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "");
  const aspas = (texto) => "“" + kit.semPontoFinal(texto) + "”";
  const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  const unico = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

  function preencher(texto, valores) {
    return String(texto || "").replace(/\{([a-z0-9_]+)\}/g, (m, chave) => (
      Object.prototype.hasOwnProperty.call(valores, chave) ? valores[chave] : m
    ));
  }

  // O nome do padrão ("O ganho que escorre", "A decisão no calor") traz o artigo. No começo
  // de uma frase ele fica como está; no meio, vai para minúscula; e o "o" que o modelo põe
  // antes de {nome} ("lá vem o {nome}") cede lugar ao artigo do próprio nome.
  function comNome(texto, nome) {
    return String(texto || "")
      .replace(/(^|[^\p{L}\p{N}])o \{nome\}/gu, (m, antes) => antes + primeiraMinuscula(nome))
      .replace(/(^|[.!?]\s+)?\{nome\}/g, (m, inicio) => (inicio === undefined ? primeiraMinuscula(nome) : inicio + nome));
  }
  const primeiraMinuscula = (t) => kit.primeiraMinuscula(t);

  // As marcas de sinal de todas as cenas, na ordem das cenas.
  function sinaisMarcados(a) {
    const saida = [];
    bib.cenas.forEach((cena) => {
      const marcadas = lista(a[cena.id]);
      cena.opcoes.forEach((o) => {
        if (o.tipo === "sinal" && marcadas.indexOf(o.value) !== -1) saida.push({ value: o.value, label: o.label });
      });
    });
    return saida;
  }

  // Os dois itens "mais verdadeiros" das tríades, da família mais forte para a mais fraca.
  function itensDasFrases(a) {
    const familias = R.pontuarFamilias(a, bib);
    if (familias.modo !== "triade") return [];
    const mais = [];
    bib.triades.forEach((t) => {
      const r = a[t.id];
      if (r && typeof r === "object" && t.itens.indexOf(r.mais) !== -1 && t.itens.indexOf(r.menos) !== -1 && r.mais !== r.menos) mais.push(r.mais);
    });
    return mais
      .map((id, i) => {
        const nota = familias.norm[bib.itens[id].familia];
        return { id, i, nota: typeof nota === "number" ? nota : -2 };
      })
      .sort((x, y) => (y.nota - x.nota) || (x.i - y.i))
      .slice(0, 2)
      .map((x) => ({ id: x.id, label: bib.itens[x.id].texto }));
  }

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

  // ---- os passos -------------------------------------------------------------------------

  function passosDoCuidado() {
    const passos = [];
    passos.push({
      id: "chao",
      grupo: GRUPO,
      type: "grade",
      eyebrow: TEXTOS.cuidado.eyebrow,
      prompt: bib.cuidado.chao.prompt,
      help: TEXTOS.cuidado.chao,
      items: bib.cuidado.chao.itens.map((i) => ({ id: i.id, label: i.label, options: i.opcoes })),
    });
    if (bib.cuidado.humor.ativo === true) {
      passos.push({
        id: "humor",
        grupo: GRUPO,
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
      grupo: GRUPO,
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
      grupo: GRUPO,
      type: "grade",
      eyebrow: TEXTOS.fatos.eyebrow,
      prompt: bib.telas.fatos.prompt,
      help: TEXTOS.fatos.ajuda,
      items: bib.fatos.map((f) => ({ id: f.id, label: f.label, options: f.opcoes.concat([f.na]) })),
    });
    bib.cenas.forEach((cena, i) => {
      passos.push({
        id: cena.id,
        grupo: GRUPO,
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
      grupo: GRUPO,
      type: "choice",
      eyebrow: TEXTOS.custo.eyebrow,
      prompt: bib.telas.custo.prompt,
      help: TEXTOS.custo.ajuda,
      showIf: (a) => sinaisMarcados(a).length > 0,
      options: (a) => sinaisMarcados(a).concat([bib.telas.custo.nenhuma]),
    });
    bib.triades.forEach((t, i) => {
      passos.push({
        id: t.id,
        grupo: GRUPO,
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
      grupo: GRUPO,
      type: "grade",
      eyebrow: TEXTOS.frases.eyebrow,
      prompt: bib.telas.frases_grade.prompt,
      help: TEXTOS.frases.ajuda,
      options: bib.telas.frases_grade.opcoes,
      items: itensDasFrases,
    });
    passos.push({
      id: "espelho",
      grupo: GRUPO,
      type: "choice",
      eyebrow: TEXTOS.espelho.eyebrow,
      prompt: (a) => (R.calcular(a, bib).sugestao.candidatos.length ? bib.telas.espelho.prompt : bib.telas.espelho.nenhum_domina),
      help: (a) => (R.calcular(a, bib).sugestao.candidatos.length ? TEXTOS.espelho.ajuda : TEXTOS.espelho.vazio),
      options: opcoesDoEspelho,
      next: (a) => (a.espelho === bib.telas.espelho.nenhum.value ? null : undefined),
    });
    passos.push({
      id: "variante",
      grupo: GRUPO,
      type: "choice",
      eyebrow: TEXTOS.variante,
      showIf: (a) => { const p = padraoEscolhido(a); return Boolean(p && lista(bib.padroes[p].variantes).length); },
      prompt: (a) => { const p = padraoEscolhido(a); return p && bib.telas.variante[p] ? bib.telas.variante[p].prompt : ""; },
      options: (a) => { const p = padraoEscolhido(a); return p && bib.telas.variante[p] ? bib.telas.variante[p].opcoes : []; },
    });
    passos.push({
      id: "renda",
      grupo: GRUPO,
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
      grupo: GRUPO,
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
      grupo: GRUPO,
      type: "checkpoint",
      actions: { continuar: "Continuar agora", pausar: "Salvar e continuar depois" },
      render: (a, ctx) => resultadoDoAto1(a, ctx, false),
    });
    return passos;
  }

  // ---- o resultado do Ato 1 ---------------------------------------------------------------

  // As seções do mapa, na ordem do resultado: onde o teto pega, a crença que mais pesa, o
  // vazamento, o que o resultado não indica, os 60 segundos, a trava e os sinais.
  function secoesDoAto1(a, calc, trava) {
    const padrao = bib.padroes[calc.padrao];
    const frases = R.marcasDoPadrao(a, calc.padrao, bib).map((m) => aspas(m.label));
    const R1 = TEXTOS.resultado;
    const secoes = [];

    const sobreOTeto = [R1.trilha[calc.trilha]];
    if (calc.trilhasPerto) sobreOTeto.push(R1.perto);
    if (frases.length) sobreOTeto.push(R1.frasesMarcadas);
    secoes.push({ id: "teto", title: "Onde o seu teto pega", kind: "teto", paragraphs: sobreOTeto, items: frases });

    if (calc.familia) {
      secoes.push({
        id: "familia",
        title: R1.familia + bib.familias[calc.familia].nome,
        kind: "familia",
        paragraphs: [bib.familias[calc.familia].leitura],
      });
    } else {
      secoes.push({ id: "familia", title: "A crença que mais pesa", kind: "familia", paragraphs: [R1.semFamilia] });
    }

    if (calc.vazamento) {
      const outro = bib.padroes[calc.vazamento];
      secoes.push({
        id: "vazamento",
        title: R1.vazamentoTitulo,
        kind: "vazamento",
        paragraphs: [comNome(R1.vazamento, outro.nome), R1.vazamentoNota],
        items: R.marcasDoPadrao(a, calc.vazamento, bib).map((m) => aspas(m.label)),
      });
    }

    const nao = R.naoIndica(calc.notas, a, calc.familias, bib);
    const modelos = bib.textos.nao_indica;
    const descartes = [];
    nao.padroes.forEach((d) => {
      const nome = bib.padroes[d.padrao].nome;
      descartes.push(d.evidencia === "contra"
        ? comNome(preencher(modelos.por_contra, { resposta: kit.semPontoFinal(d.resposta) }), nome)
        : comNome(preencher(modelos.por_nao_acontece, { cena: d.empurrao || "" }), nome));
    });
    nao.familias.forEach((d) => {
      descartes.push(comNome(preencher(modelos.por_familia, { resposta: kit.semPontoFinal(d.resposta) }), bib.familias[d.familia].nome));
    });
    if (descartes.length) secoes.push({ id: "nao_indica", title: modelos.titulo, kind: "nao-indica", items: descartes });

    const sessenta = bib.textos.sessenta_segundos;
    secoes.push({
      id: "sessenta",
      title: sessenta.titulo,
      kind: "sessenta",
      items: sessenta.passos.map((p) => {
        const texto = comNome(p.texto, padrao.nome);
        return p.id === "regra" && padrao.regra_trabalho_exemplo
          ? texto + preencher(R1.sessentaRegra, { exemplo: kit.semPontoFinal(padrao.regra_trabalho_exemplo) })
          : texto;
      }),
    });

    const paragrafosTrava = [trava.texto];
    if (typeof a.alvo === "string" && a.alvo.trim()) paragrafosTrava.push(R1.travaAlvo + aspas(a.alvo));
    secoes.push({ id: "trava", title: R1.travaTitulo, kind: "trava", paragraphs: paragrafosTrava });

    const sinais = R.montarSinais(calc.padrao, a, bib);
    const paragrafosSinais = [];
    if (sinais.dela.empurrao) paragrafosSinais.push(preencher(R1.sinaisEmpurrao, { empurrao: kit.semPontoFinal(sinais.dela.empurrao) }));
    paragrafosSinais.push(sinais.regras.na_hora, sinais.regras.quando_voltar);
    secoes.push({
      id: "sinais",
      title: sinais.titulo,
      kind: "sinais",
      paragraphs: paragrafosSinais.filter(Boolean),
      items: unico(lista(sinais.gerais)),
    });
    return secoes;
  }

  // O .md em blocos marcados: a leitura para uma pessoa, as respostas por id (o que o
  // importar lê para retomar em outro aparelho) e, por último, o registro.
  function blocosDoAto1(a, calc, secoes, reg) {
    const padrao = bib.padroes[calc.padrao];
    const trava = R.travaImediata(calc.padrao, calc.variante, a.renda, bib);
    const frases = R.marcasDoPadrao(a, calc.padrao, bib);
    const blocos = [];

    const leitura = [];
    secoes.forEach((s) => {
      leitura.push("**" + s.title + "**");
      lista(s.paragraphs).forEach((p) => leitura.push(p));
      lista(s.items).forEach((i) => leitura.push("- " + i));
    });
    blocos.push({ id: "teto.mapa", v: 1, titulo: "O seu mapa", leitura: true, linhas: leitura });

    const rotuloDe = (opcoes, valor) => { const o = lista(opcoes).find((x) => x.value === valor); return o ? o.label : ""; };
    blocos.push({
      id: "teto.padrao", v: 1, titulo: "O seu teto",
      campos: [
        { id: "padrao", rotulo: "O teto", valor: calc.padrao, texto: padrao.nome },
        { id: "variante", rotulo: "O detalhe", valor: calc.variante || "", texto: calc.variante ? bib.variantes[calc.variante].nome : "" },
        { id: "trilha", rotulo: "O tipo de teto", valor: calc.trilha, texto: calc.trilha === "ganho" ? "ganho" : "retenção" },
        { id: "vazamento", rotulo: "O vazamento em observação", valor: calc.vazamento || "", texto: calc.vazamento ? bib.padroes[calc.vazamento].nome : "" },
        { id: "espelho", rotulo: "As frases que você marcou", texto: frases.map((f) => "- " + f.label).join("\n") },
        { id: "trava", rotulo: "A trava de hoje", texto: trava.texto },
        { id: "renda", rotulo: "Como o dinheiro entra", valor: a.renda || "", texto: rotuloDe(bib.telas.renda.opcoes, a.renda) },
        { id: "alvo", rotulo: "O que você escreveu para a trava", texto: typeof a.alvo === "string" ? a.alvo : "" },
      ],
    });

    blocos.push({
      id: "teto.fatos", v: 1, titulo: "Os últimos 30 dias",
      campos: bib.fatos.map((f) => {
        const valor = a.fatos ? a.fatos[f.id] : undefined;
        const opcao = f.opcoes.concat([f.na]).find((o) => o.value === valor);
        return { id: f.id, rotulo: f.label, valor: valor === undefined ? "" : String(valor), texto: opcao ? opcao.label : "" };
      }),
    });

    const nivel = calc.familias.nivel || {};
    const ordemItens = Object.keys(bib.itens).filter((id) => Object.prototype.hasOwnProperty.call(nivel, id));
    blocos.push({
      id: "teto.raiox", v: 1, titulo: "A relação com o dinheiro",
      campos: [
        { id: "familia", rotulo: "A crença que mais pesa", valor: calc.familia || "", texto: calc.familia ? bib.familias[calc.familia].nome : "" },
        { id: "itens", rotulo: "Os itens e o nível de cada um", texto: ordemItens.map((id) => id + ": " + nivel[id]).join("\n") },
        { id: "areas", rotulo: "As áreas", valor: Object.keys(calc.areas).map((k) => k + "." + calc.areas[k]).join(","), texto: Object.keys(calc.areas).map((k) => k + ": " + calc.areas[k]).join("\n") },
      ],
    });

    const camposCenas = bib.cenas.map((cena) => {
      const marcadas = lista(a[cena.id]);
      const rotulos = cena.opcoes.concat([cena.nao_acontece]).filter((o) => marcadas.indexOf(o.value) !== -1).map((o) => "- " + o.label);
      return { id: cena.id, rotulo: cena.empurrao, valor: marcadas.join(","), texto: rotulos.join("\n") };
    });
    const custo = sinaisMarcados(a).concat([bib.telas.custo.nenhuma]).find((o) => o.value === a.custo);
    camposCenas.push({ id: "custo", rotulo: "O que custou mais", valor: a.custo || "", texto: custo ? custo.label : "" });
    blocos.push({ id: "teto.cenas", v: 1, titulo: "As cenas", campos: camposCenas });

    const camposFrases = bib.triades.map((t) => {
      const r = a[t.id];
      const ok = r && typeof r === "object";
      return {
        id: t.id,
        rotulo: "As frases " + t.id.replace("triade_", ""),
        valor: ok ? [r.mais, r.menos].join(",") : "",
        texto: ok ? "Mais: " + bib.itens[r.mais].texto + "\nMenos: " + bib.itens[r.menos].texto : "",
      };
    });
    const niveis = a.frases_nivel && typeof a.frases_nivel === "object" ? a.frases_nivel : {};
    camposFrases.push({
      id: "frases_nivel",
      rotulo: "O quanto as duas mais verdadeiras soam",
      valor: Object.keys(niveis).map((id) => id + "." + niveis[id]).join(","),
      texto: Object.keys(niveis).map((id) => bib.itens[id].texto + ": " + niveis[id]).join("\n"),
    });
    blocos.push({ id: "teto.frases", v: 1, titulo: "As frases", campos: camposFrases });

    if (reg && reg.ok) blocos.push({ id: "teto.registro", v: 1, titulo: "O registro do teto", json: reg.objeto, codigo: reg.codigo });
    return blocos;
  }

  function eventosDoAto1(ctx) {
    const hora = typeof ctx.lembrete === "string" && /^\d\d:\d\d$/.test(ctx.lembrete) ? ctx.lembrete : HORA_PADRAO;
    return {
      prodid: "-//DLT Academy//Teto Financeiro//PT-BR",
      rotulo: "Baixar os lembretes (.ics)",
      eventos: [
        {
          uid: "teto-semana-" + ctx.ciclo + "@dlt.academy",
          inicio: kit.somarDias(ctx.hoje, 7),
          hora,
          duracaoMin: 10,
          resumo: TEXTOS.app.semana.resumo,
          descricao: TEXTOS.app.semana.descricao,
          url: PAGINA + "#volta=semana",
          repetir: { semanal: true, vezes: 13 },
        },
        {
          uid: "teto-continuar-" + ctx.ciclo + "@dlt.academy",
          inicio: kit.somarDias(ctx.hoje, 1),
          hora,
          duracaoMin: 15,
          resumo: TEXTOS.app.continuar.resumo,
          descricao: TEXTOS.app.continuar.descricao,
          url: PAGINA + "#volta=continuar",
        },
      ],
    };
  }

  function resultadoDoAto1(a, ctx, final) {
    const calc = R.calcular(a, bib);
    const padrao = bib.padroes[calc.padrao];
    const trava = R.travaImediata(calc.padrao, calc.variante, a.renda, bib);
    const secoes = secoesDoAto1(a, calc, trava);
    const reg = R.montarRegistro(a, calc, ctx.hoje, 1, bib);
    const leitura = [padrao.leitura.base];
    if (calc.variante && padrao.leitura.por_variante && padrao.leitura.por_variante[calc.variante]) leitura.push(padrao.leitura.por_variante[calc.variante]);
    const R1 = TEXTOS.resultado;
    const aviso = R.avaliarCuidado(a, bib).avisoHumor ? bib.cuidado.textos.aviso_humor : R1.seguranca;
    const resultado = {
      id: 10,
      grade: 1,
      tone: "good",
      pill: false,
      eyebrow: R1.eyebrow,
      verdict: R1.verdict + padrao.nome,
      body: final ? [R1.parte2].concat(leitura) : leitura,
      sections: secoes,
      safety: aviso,
      blocks: blocosDoAto1(a, calc, secoes, reg),
      ics: eventosDoAto1(ctx),
      arquivos: {
        md: R1.arquivo + "-" + ctx.hoje + ".md",
        pdf: R1.arquivo + "-" + ctx.hoje + ".pdf",
        ics: "teto-financeiro-lembretes.ics",
      },
    };
    if (reg.ok) {
      resultado.registro = {
        titulo: TEXTOS.registro.titulo,
        resumo: [
          { q: TEXTOS.registro.teto, value: padrao.nome },
          { q: TEXTOS.registro.trilha, value: calc.trilha === "ganho" ? "ganho" : "retenção" },
          { q: TEXTOS.registro.familia, value: calc.familia ? bib.familias[calc.familia].nome : "" },
          { q: TEXTOS.registro.data, value: dataBR(ctx.hoje) },
        ],
        objeto: reg.objeto,
        codigo: reg.codigo,
      };
    }
    if (final) {
      resultado.guardar = true;
      resultado.volta = { n: 1, dia0: ctx.hoje };
    }
    return resultado;
  }

  // ---- os resultados que não têm teto ---------------------------------------------------------

  // Sem plano de romper nada, sem registro, sem guardar, sem lembrete e sem oferta.
  function resultadoDeCuidado(cuidado) {
    const textos = bib.cuidado.textos;
    const base = { grade: 3, tone: "mixed", pill: false, eyebrow: TEXTOS.cuidadoResultado.eyebrow };
    if (cuidado.ramo === "ajuda") {
      return Object.assign({ id: 901, verdict: textos.ajuda.titulo, body: textos.ajuda.paragrafos.slice() }, base);
    }
    const chao = bib.planos.chao_primeiro;
    const plano = chao.arco7.map((linha, i) => {
      const m = /^(Dia \d+):\s*(.+)$/.exec(linha);
      return m ? { id: "d" + (i + 1), title: m[1], text: capitalizar(m[2]) } : { id: "d" + (i + 1), title: "Passo " + (i + 1), text: linha };
    });
    const resultado = Object.assign({
      id: 902,
      verdict: textos.chao_primeiro.titulo,
      body: textos.chao_primeiro.paragrafos.slice(),
      plan: plano,
      sections: [{ id: "noventa", title: TEXTOS.cuidadoResultado.noventa, paragraphs: [capitalizar(String(chao.noventa || "").replace(/^Nos 90 dias:\s*/, ""))] }],
    }, base);
    if (cuidado.avisoHumor) resultado.safety = textos.aviso_humor;
    return resultado;
  }

  // "Nenhum padrão domina": um resultado honesto, sem inventar um teto, sem oferta.
  function resultadoNenhum() {
    const nenhum = bib.textos.nenhum;
    const curto = bib.planos.gerais_nenhum;
    return {
      id: 903,
      grade: 2,
      tone: "mixed",
      pill: false,
      eyebrow: TEXTOS.nenhum.eyebrow,
      verdict: nenhum.titulo,
      body: nenhum.paragrafos.slice(),
      sections: [
        { id: "plano_curto", title: curto.titulo, kind: "plano", items: curto.passos.slice() },
        { id: "voltar", title: TEXTOS.nenhum.voltar, kind: "sinais", items: lista(bib.textos.sinais_gerais).slice() },
      ],
      safety: TEXTOS.resultado.seguranca,
    };
  }

  // ---- retomar em outro aparelho: o .md do Ato 1 --------------------------------------------

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
    "teto.raiox": { v: 1, campos: { familia: 200, itens: 800, areas: 400 } },
    "teto.cenas": { v: 1, campos: CAMPOS_CENAS },
    "teto.frases": { v: 1, campos: CAMPOS_FRASES },
  };

  const valores = (campo) => (campo && typeof campo.valor === "string" && campo.valor ? campo.valor.split(",").filter(Boolean) : []);

  // As respostas do Ato 1 que o arquivo traz, por id de passo. Cada uma ainda passa pela
  // validação do passo quando a pessoa retoma; aqui só se lê o formato.
  function respostasDoArquivo(blocos) {
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
    if (padrao.alvo) resp.alvo = padrao.alvo.texto;
    return resp;
  }

  // Os ids dos passos que a pessoa já percorreu, refazendo o caminho do fluxo com as
  // respostas do arquivo. `chegou` diz se o checkpoint do Ato 1 foi alcançado.
  function caminhoDoArquivo(passos, resp) {
    const ids = [];
    let chegou = false;
    let indice = kit.proximoIndice(passos, -1, resp);
    while (indice < passos.length) {
      const passo = passos[indice];
      if (CUIDADO.indexOf(passo.id) === -1) {
        if (passo.type === "checkpoint") {
          ids.push(passo.id);
          chegou = true;
        } else if (kit.validarResposta(passo, resp[passo.id], resp).ok) {
          ids.push(passo.id);
        } else {
          break;
        }
      }
      indice = kit.proximoIndice(passos, indice, resp);
    }
    return { ids, chegou };
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
        etapa: caminho.chegou ? "pausa" : "ato1",
        passo: null,
        caminho: caminho.ids,
        respostas: resp,
        volta: { n: registro.json.volta, dia0: registro.json.data, registro: registro.json, retornos: {} },
      },
      resumo: "O seu Teto de " + dataBR(registro.json.data) + ": " + bib.padroes[resp.espelho].nome + ".",
    };
  }

  // ---- o protocolo -----------------------------------------------------------------------------

  const passos = passosDoCuidado().concat(passosDoMapa());

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
      const calc = R.calcular(a, bib);
      if (calc.cuidado.ramo) return resultadoDeCuidado(calc.cuidado);
      if (!calc.padrao) return resultadoNenhum();
      return resultadoDoAto1(a, ctx, true);
    },
  };
})();

runProtocol(PROTOCOL, "protocol-mount");

// Protocolo: decisão fria — antes de colocar dinheiro em risco.
// Texto próprio. Reflexão estruturada, não recomendação de investimento
// nem terapia.
//
// Profundidade (PROTOCOL_FRAMEWORK): escolha só para diagnóstico e
// roteamento; os movimentos que transformam exigem que a pessoa escreva.
//   1 Notar (escolha)            o que ela está prestes a fazer
//   2 Notar (escolha)            de onde vem a ideia
//   3 Notar (escolha)            o relógio: pressa, confirmação ou calma
//   4 Clarear (escrever)         a tese em duas frases
//   5 Desgrudar (escrever)       o melhor argumento contra, escrito por ela
//   6 Voltar ao concreto (escolha)  o teste da queda de 70%
//   7 Dar o passo (escrever)     as três travas: limite, saída, revisão
//
// O resultado declara `relatorio: { produto, perfil }` para a oferta do
// relatório pago (js/paid-reports.js). Só o nome do perfil sai daqui.
// No ramo em que a perda comprometeria contas ou dependentes, não há
// oferta paga: a resposta é não usar esse dinheiro, e ponto.

const PROTOCOL = {
  id: "protocolo-decisao-fria",
  slug: "decisao-fria",
  title: "Decisão fria — o protocolo antes de colocar dinheiro em risco",
  path: "/protocolos/decisao-fria/",
  pdfSubject: "Reflexão estruturada — decisão com dinheiro em risco",

  steps: [
    {
      id: "intencao",
      type: "choice",
      eyebrow: "1 de 7 · Notar",
      prompt: "Você está prestes a colocar dinheiro em risco. Qual destas frases descreve melhor a decisão?",
      help: "Escolha a mais próxima. Ela muda o que o protocolo vai te perguntar e o que te devolve no fim.",
      options: [
        { value: "compra", label: "Uma compra ou aporte que eu já vinha planejando" },
        { value: "aumentar", label: "Aumentar a posição em algo que já subiu" },
        { value: "alavancar", label: "Operar alavancado ou em futuros" },
        { value: "recuperar", label: "Recuperar um prejuízo que tive há pouco" },
      ],
    },
    {
      id: "base",
      type: "choice",
      eyebrow: "2 de 7 · Notar",
      prompt: "Seja honesto: em que essa decisão se apoia, de verdade?",
      help: "A pergunta não é se você tem razão. É de onde veio a ideia, porque isso define o que você ainda precisa conferir.",
      options: [
        { value: "numeros", label: "Em números e fatos que eu mesmo conferi" },
        { value: "alguem", label: "Na opinião de alguém que eu acompanho: canal, grupo, amigo" },
        { value: "sensacao", label: "Numa sensação forte de que vai dar certo" },
      ],
    },
    {
      id: "relogio",
      type: "choice",
      eyebrow: "3 de 7 · Notar",
      prompt: "E o relógio? Qual frase é mais verdade agora?",
      help: "A pressa é o sinal mais fácil de perceber e o mais caro de ignorar.",
      options: [
        { value: "horas", label: "Se eu não decidir nas próximas horas, perco a chance" },
        { value: "confirmar", label: "No fundo já decidi. Estou procurando alguém que confirme" },
        { value: "semana", label: "Posso esperar uma semana sem perder nada importante" },
      ],
    },
    {
      id: "tese",
      type: "write",
      eyebrow: "4 de 7 · Clarear",
      prompt: "Escreva a sua tese em duas frases: por que isso deve dar certo, e o que precisa acontecer para dar.",
      help: (a) => a.intencao === "recuperar"
        ? "Repare se a primeira frase fala do ativo ou do prejuízo. “Preciso recuperar” é uma necessidade sua, não um motivo para o preço subir."
        : "Se não couber em duas frases, você ainda não tem uma tese, tem uma vontade. Melhor descobrir isso aqui do que depois.",
      placeholder: "Ex.: a empresa cresce 30% ao ano e o preço ainda não reflete isso. Para dar certo, o próximo resultado trimestral precisa confirmar o crescimento.",
      cta: "Escrevi",
    },
    {
      id: "contra",
      type: "write",
      eyebrow: "5 de 7 · Trocar de lado",
      prompt: (a) => {
        const tese = semPontoFinal(a.tese);
        return tese
          ? `Você escreveu: “${tese}”. Agora troque de lado. Qual é o melhor argumento de alguém que entende do assunto e não faria isso?`
          : "Agora troque de lado. Qual é o melhor argumento de alguém que entende do assunto e não faria isso?";
      },
      help: "Não vale um argumento fraco, fácil de derrubar. Escreva o melhor que conseguir. Se você não consegue escrever o outro lado, ainda não viu o risco, só a vontade.",
      placeholder: "Ex.: o crescimento já está no preço. Se o resultado vier só bom, e não excelente, o preço pode cair 30% num dia.",
      cta: "Escrevi o outro lado",
    },
    {
      id: "impacto",
      type: "choice",
      eyebrow: "6 de 7 · Voltar ao concreto",
      prompt: (a) => a.intencao === "alavancar"
        ? "Agora o teste do pior caso. Se todo o valor que você colocaria como garantia virasse zero amanhã, o que mudaria na sua vida?"
        : "Agora o teste do pior caso. Se esse dinheiro valesse 70% menos amanhã, o que mudaria na sua vida?",
      help: (a) => a.intencao === "alavancar"
        ? "Com alavancagem, uma queda bem menor que 70% já pode levar a garantia inteira. Não é previsão, é o tamanho do que você está arriscando."
        : "Não é previsão, é tamanho. Quedas de 70% já aconteceram com ações de empresas sólidas e com quase todo cripto. A pergunta é se você aguenta, não se vai acontecer.",
      options: [
        { value: "nada", label: "Nada no meu sono nem nas minhas contas. Doeria, mas passa" },
        { value: "aperta", label: "Apertaria: eu cortaria gastos e adiaria planos" },
        { value: "compromete", label: "Comprometeria contas, dívidas ou quem depende de mim" },
      ],
    },
    {
      id: "travas",
      type: "write",
      eyebrow: "7 de 7 · Dar o passo",
      prompt: "Antes de qualquer clique, escreva as suas três travas: quanto no máximo, o que te faz sair, e quando você revisa esta decisão.",
      help: "Trava escrita antes de entrar é decisão da cabeça fria. Trava inventada depois, com o preço andando, é negociação com a cabeça quente.",
      placeholder: "Ex.: no máximo R$ 2.000. Saio se cair 25% ou se o resultado do trimestre não confirmar a tese. Reviso em 30 dias, no dia 29/10.",
      cta: "Ver meu resultado",
    },
  ],

  result(a) {
    const record = buildRecord(a);
    const alertas = contarAlertas(a);
    const semTese = !(a.tese || "").trim();
    const semContra = !(a.contra || "").trim();
    const semTravas = !(a.travas || "").trim();
    const ecoContra = semContra
      ? "Você não escreveu o outro lado. De tudo que o protocolo pede, esse é o passo que mais importa: quem não consegue argumentar contra a própria ideia ainda não enxergou o risco dela. Vale voltar e tentar."
      : "Releia o argumento contrário que você escreveu. Se ele te incomodou, ótimo: é ali que está o risco que a vontade não mostrava. A decisão fria não ignora esse argumento. Ela decide o que fazer se ele estiver certo.";
    const ecoTravas = semTravas
      ? "Você não deixou as travas escritas. Sem limite, saída e data de revisão, qualquer decisão vira improviso quando o preço começa a andar."
      : `Suas travas: “${semPontoFinal(a.travas)}”. Estão no registro abaixo. Se o preço andar e você sentir vontade de mudar alguma, releia este registro antes.`;

    const plans = {
      nao: [
        { id: "stop", title: "Não use esse dinheiro", text: "Dinheiro que sustenta contas ou pessoas não vira capital de risco, por melhor que a ideia pareça." },
        { id: "fund", title: "Separe um valor que possa perder", text: "Se a tese sobreviver, ela pode ser testada depois com um valor que não muda a sua vida." },
        { id: "wait", title: "Releia a tese em 7 dias", text: "Uma oportunidade boa continua boa daqui a uma semana. Uma vontade, quase sempre, passa." },
      ],
      recuperacao: [
        { id: "pause", title: "Nenhuma operação hoje", text: "A primeira operação depois de uma perda é a mais cara de todas. Deixe passar pelo menos um dia inteiro." },
        { id: "close", title: "Escreva o que aconteceu na perda", text: "O que você fez, o que ignorou, o que faria diferente. Sem se culpar e sem se justificar." },
        { id: "reset", title: "Volte com metade do tamanho", text: "Quando voltar, use metade do valor de antes, até ter três decisões seguidas tomadas com as travas escritas." },
      ],
      alavancagemRisco: [
        { id: "pause", title: "Não abra a posição hoje", text: "Pressa, tese emprestada ou garantia que você não pode perder: qualquer um desses já é motivo para esperar." },
        { id: "size", title: "Calcule a distância até a liquidação", text: "Antes de qualquer valor, saiba quanto o preço precisa andar contra você para a garantia acabar." },
        { id: "purpose", title: "Escreva se é proteção ou aposta", text: "Proteção reduz um risco que você já tem. Aposta cria um risco novo. Os dois pedem tamanhos diferentes." },
      ],
      alavancagem: [
        { id: "purpose", title: "Defina se é proteção ou aposta", text: "Proteção reduz um risco que você já tem. Aposta cria um risco novo. Escreva qual das duas é esta." },
        { id: "size", title: "Tamanho pela exposição, não pela margem", text: "O valor da posição nasce do que você quer proteger ou arriscar, nunca do limite que a corretora libera." },
        { id: "exit", title: "Saída e prazo antes de abrir", text: "Posição sem data de revisão fica aberta por esquecimento. Anote as duas." },
      ],
      pressa: [
        { id: "wait", title: "Espere 48 horas", text: "Se a oportunidade depende de você agir nas próximas horas, ela não precisa ser sua." },
        { id: "check", title: "Confira um número com as suas mãos", text: "Um dado da tese que você mesmo verificou na fonte, e não no vídeo ou no grupo." },
        { id: "half", title: "Se entrar, metade do valor", text: "Entre com metade do que planejou. A outra metade entra só se a tese continuar de pé na revisão." },
      ],
      ajuste: [
        { id: "fix", title: "Resolva o ponto que ficou aberto", text: "Veja abaixo qual sinal apareceu e trate só ele. O resto da decisão está bem montado." },
        { id: "size", title: "Confirme o tamanho", text: "Um valor que você aguente ver cair 70% sem mudar a sua vida." },
        { id: "review", title: "Marque a data de revisão", text: "Coloque no calendário agora, com a tese e o argumento contrário anotados." },
      ],
      segue: [
        { id: "size", title: "Entre no tamanho que você escreveu", text: "Nem um real a mais porque o preço subiu enquanto você decidia." },
        { id: "exit", title: "Deixe a saída anotada onde você vê", text: "Preço, prazo ou fato: o que vier primeiro encerra ou reduz a posição." },
        { id: "review", title: "Revise na data marcada", text: "Releia a tese e o argumento contrário. Qual dos dois o tempo confirmou?" },
      ],
    };

    const base = { record, safety: safetyNote };

    // Ramo 1 — a perda compromete contas ou dependentes: não.
    // Sem oferta paga neste ramo: aqui a resposta é não arriscar,
    // e vender aprofundamento seria vender para quem está vulnerável.
    if (a.impacto === "compromete") {
      return {
        ...base,
        tone: "bad",
        verdict: "Com esse dinheiro, a resposta é não.",
        body: [
          "Você marcou que o pior cenário comprometeria contas, dívidas ou quem depende de você. Nenhuma tese, por melhor que seja, compensa esse risco. Não é uma questão de coragem: esse dinheiro já tem uma função.",
          "Isso não fecha a porta para a ideia, fecha a porta para esse dinheiro. Se a tese for boa, ela continua boa quando você puder testá-la com um valor que não mude a sua vida.",
          ecoContra,
        ],
        plan: plans.nao,
        stats: resultStats(alertas, "não", plans.nao),
        cta: {
          tipo: "artigo",
          headline: "Antes de arriscar, separe o que pode e o que não pode ser perdido.",
          texto: "Primeiros Passos no Cripto ajuda a montar reserva, objetivo e ritmo de entrada usando só dinheiro que já sobra.",
          label: "Montar meus primeiros passos →",
          href: "https://primeiros-passos-cripto.dlt.academy/",
          external: false,
        },
      };
    }

    // Ramo 2 — operar para recuperar prejuízo.
    if (a.intencao === "recuperar") {
      return {
        ...base,
        tone: "bad",
        verdict: "Recuperar não é tese. Hoje, não opere.",
        body: [
          "Querer recuperar o que perdeu é uma das vontades mais humanas que existem em dinheiro, e uma das mais caras. A perda dói mais do que um ganho do mesmo tamanho alegra, e essa dor empurra para operações maiores, mais rápidas e com menos critério.",
          "O mercado não sabe quanto você perdeu nem te deve nada. A próxima operação precisa se sustentar sozinha, como se o prejuízo não existisse. Se ela só faz sentido porque você precisa recuperar, ela não faz sentido.",
          ecoContra,
          ecoTravas,
        ],
        plan: plans.recuperacao,
        stats: resultStats(alertas, "não", plans.recuperacao),
        cta: {
          tipo: "artigo",
          headline: "Se a vontade de voltar agora está forte, faça o exercício do aperto antes.",
          texto: "O protocolo Cheguei tarde? trabalha o pensamento que empurra para agir já, e ajuda a separar a decisão da urgência.",
          label: "Fazer o protocolo do aperto →",
          href: "/protocolos/medo-de-ficar-de-fora/",
          external: false,
        },
        relatorio: ofertas("recuperacao"),
      };
    }

    // Ramo 3 — alavancagem.
    if (a.intencao === "alavancar") {
      const risco = alertas > 0;
      return {
        ...base,
        tone: risco ? "bad" : "mixed",
        verdict: risco
          ? "Alavancagem com pressa, tese emprestada ou garantia que faz falta: ainda não."
          : "Pode ser proteção, pode ser aposta. Defina qual antes de abrir.",
        body: [
          risco
            ? "Na alavancagem, os erros que numa compra comum custam tempo custam a posição inteira. Você marcou pelo menos um sinal de alerta: pressa, uma tese que não é sua ou uma garantia que apertaria a sua vida se sumisse. Qualquer um deles basta para esperar."
            : "Você decide com calma, com base no que conferiu, e aguenta perder a garantia. Isso é o mínimo para considerar alavancagem, e ainda não responde se ela faz sentido.",
          "A pergunta que separa uso consciente de aposta é simples: você está reduzindo um risco que já tem, ou criando um novo? Proteção pede posição pequena e prazo definido. Aposta pede aceitar que a garantia pode ir a zero.",
          ecoContra,
          ecoTravas,
        ],
        plan: risco ? plans.alavancagemRisco : plans.alavancagem,
        stats: resultStats(alertas, risco ? "espere" : "defina", risco ? plans.alavancagemRisco : plans.alavancagem),
        cta: {
          tipo: "artigo",
          headline: "Veja o que cada tamanho de posição faz com o seu patrimônio antes de abrir.",
          texto: "Sobrevive ou Quebra? compara não fazer nada, reduzir e proteger com futuros nos mesmos cenários, com custos e risco de liquidação à vista.",
          label: "Testar o tamanho →",
          href: "https://sobrevive-ou-quebra.dlt.academy/",
          external: false,
        },
        relatorio: ofertas("alavancagem"),
      };
    }

    // Ramo 4 — vários sinais: ainda é vontade, não decisão.
    if (alertas >= 2) {
      return {
        ...base,
        tone: "mixed",
        verdict: "Ainda não é uma decisão. É uma vontade com pressa.",
        body: [
          `Apareceram ${alertas} sinais de alerta: ${descreverAlertas(a).join("; ")}. Nenhum deles prova que a ideia é ruim. Juntos, mostram que quem está decidindo agora não é você com calma.`,
          "O teste é o tempo. Uma boa decisão sobrevive a 48 horas e a um número conferido por você. Uma vontade, quase sempre, não sobrevive.",
          ecoContra,
          ecoTravas,
        ],
        plan: plans.pressa,
        stats: resultStats(alertas, "espere", plans.pressa),
        cta: {
          tipo: "artigo",
          headline: "Se o que empurra é a sensação de estar ficando para trás, comece por ela.",
          texto: "O protocolo Cheguei tarde? separa o aperto de “agora ou nunca” da decisão, em seis passos curtos.",
          label: "Fazer o protocolo do aperto →",
          href: "/protocolos/medo-de-ficar-de-fora/",
          external: false,
        },
        relatorio: ofertas("pressa"),
      };
    }

    // Ramo 5 — um sinal, ou a decisão ainda não foi escrita.
    if (alertas === 1 || semTese || semContra || semTravas) {
      const pendencias = descreverAlertas(a);
      if (semTese) pendencias.push("a tese não foi escrita");
      if (semContra) pendencias.push("o argumento contrário não foi escrito");
      if (semTravas) pendencias.push("as travas não foram escritas");
      return {
        ...base,
        tone: "mixed",
        verdict: "Quase lá. Falta fechar um ponto antes de agir.",
        body: [
          `O que ficou aberto: ${pendencias.join("; ")}. O resto da decisão está bem montado, e é justamente por isso que vale resolver esse ponto antes, e não depois.`,
          "Resolver não quer dizer desistir. Quer dizer que, se der errado, vai ter dado errado por um risco que você viu e aceitou, e não por um que ficou de fora da conta.",
          ecoContra,
          ecoTravas,
        ],
        plan: plans.ajuste,
        stats: resultStats(alertas, "ajuste", plans.ajuste),
        cta: {
          tipo: "artigo",
          headline: "Confira se o tamanho que você escreveu aguenta os cenários ruins.",
          texto: "Sobrevive ou Quebra? mostra o que acontece com o patrimônio inteiro quando o preço sobe, fica parado ou cai.",
          label: "Testar o tamanho →",
          href: "https://sobrevive-ou-quebra.dlt.academy/",
          external: false,
        },
        relatorio: ofertas(a.intencao === "aumentar" || a.relogio !== "semana" ? "pressa" : "metodo"),
      };
    }

    // Ramo 6 — decisão fria de verdade.
    return {
      ...base,
      tone: "good",
      verdict: "Pode seguir, com as travas que você escreveu.",
      body: [
        "Você conferiu os números, não está com pressa, aguenta o pior cenário e escreveu os dois lados. Esse é o formato de uma decisão fria. O protocolo não segura você aqui.",
        "Isso não garante resultado nenhum: decisão boa pode dar errado, e decisão ruim pode dar certo. O que muda é que, se der errado, você sabe exatamente por quê, perde um valor que escolheu, e sai no ponto que decidiu antes.",
        ecoContra,
        ecoTravas,
      ],
      plan: plans.segue,
      stats: resultStats(alertas, "siga", plans.segue),
      cta: {
        tipo: "artigo",
        headline: "Antes de executar, confira o tamanho contra os cenários ruins.",
        texto: "Sobrevive ou Quebra? mostra o que cada tamanho de posição faz com o seu patrimônio quando o preço cai.",
        label: "Testar o tamanho →",
        href: "https://sobrevive-ou-quebra.dlt.academy/",
        external: false,
      },
      relatorio: ofertas("metodo"),
    };
  },
};

const safetyNote =
  "Se operar virou algo que você sente que não controla, especialmente para recuperar perdas, isso vai além de uma decisão pontual. Conversar com um profissional de saúde ajuda mais do que qualquer ferramenta. Isto aqui é reflexão estruturada, não tratamento nem recomendação de investimento.";

// Os dois degraus pagos: o dossiê de método (capítulo do perfil) e o
// relatório escrito para o caso. Nunca chamado no ramo de vulnerabilidade.
function ofertas(perfil) {
  return [
    { produto: "decisao-fria", perfil },
    { produto: "decisao-fria-premium" },
  ];
}

// Sinais de alerta: cada um vale 1. A intenção de recuperar e o impacto
// que compromete contas não entram na contagem: eles decidem o ramo sozinhos.
function contarAlertas(a) {
  return descreverAlertas(a).length;
}

function descreverAlertas(a) {
  const sinais = [];
  if (a.base === "alguem") sinais.push("a ideia vem de outra pessoa");
  if (a.base === "sensacao") sinais.push("a ideia vem de uma sensação");
  if (a.relogio === "horas") sinais.push("existe pressa de decidir em horas");
  if (a.relogio === "confirmar") sinais.push("você já decidiu e busca confirmação");
  if (a.intencao === "aumentar") sinais.push("é aumentar algo que já subiu");
  if (a.impacto === "aperta") sinais.push("o pior cenário apertaria a sua vida");
  return sinais;
}

function resultStats(alertas, veredito, plan) {
  return [
    { value: String(alertas), label: alertas === 1 ? "sinal de alerta" : "sinais de alerta" },
    { value: veredito, label: "veredito" },
    { value: String(plan.length), label: "passos no plano" },
  ];
}

// Tira a pontuação final para o eco entre aspas não sair com ".”."
function semPontoFinal(texto) {
  return String(texto || "").trim().replace(/[.!?…;,\s]+$/, "");
}

function buildRecord(a) {
  return [
    { q: "A decisão", value: a.intencao__label },
    { q: "Em que ela se apoia", value: a.base__label },
    { q: "O relógio", value: a.relogio__label },
    { q: "Minha tese", value: (a.tese || "").trim() },
    { q: "O melhor argumento contra", value: (a.contra || "").trim() },
    { q: "Se o pior acontecesse", value: a.impacto__label },
    { q: "Minhas travas: limite, saída e revisão", value: (a.travas || "").trim() },
  ];
}

runProtocol(PROTOCOL, "protocol-mount");

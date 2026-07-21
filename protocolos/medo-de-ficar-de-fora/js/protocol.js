// Protocolo: medo de ficar de fora (FOMO).
// Motor de decisão original, inspirado nos princípios da ACT (agir pelo
// valor carregando o desconforto). Texto próprio — não reproduz exercícios
// de terceiros. Reflexão estruturada, não terapia.

const PROTOCOL = {
  id: "protocolo-medo-de-ficar-de-fora",
  slug: "medo-de-ficar-de-fora",
  title: "Cheguei tarde? — o protocolo do medo de ficar de fora",
  path: "/protocolos/medo-de-ficar-de-fora/",

  steps: [
    // 1. NOTAR — dar nome ao que está no comando.
    {
      id: "sentimento",
      type: "choice",
      eyebrow: "1 de 4 · Notar",
      prompt: "Você viu algo subir e bateu a vontade de entrar agora. O que está mais forte neste momento?",
      help: "Não existe resposta certa. Nomear o que você sente já tira um pouco do piloto automático.",
      options: [
        { value: "urgencia", label: "Aperto de “agora ou nunca” — se eu não entrar já, perco" },
        { value: "inveja", label: "Incômodo de ver os outros ganhando e eu não" },
        { value: "pra_tras", label: "Medo de ser o único que fica pra trás" },
        { value: "tranquilo", label: "Curiosidade tranquila, sem aperto nenhum" },
      ],
    },
    // 2. DESGRUDAR — o pensamento não é uma ordem.
    {
      id: "fato",
      type: "choice",
      eyebrow: "2 de 4 · Desgrudar",
      prompt: "Troque o pensamento “vou perder essa oportunidade” por “estou tendo o pensamento de que vou perder essa”. Visto assim, de fora: quantas “últimas chances” o mercado já te ofereceu?",
      help: "O mercado fabrica uma “oportunidade única” por semana. Isso não quer dizer que esta seja ruim — quer dizer que a pressa não é prova de nada.",
      options: [
        { value: "varias", label: "Várias — e a vida seguiu bem sem eu entrar em quase todas" },
        { value: "diferente", label: "Poucas, e essa aqui parece mesmo diferente" },
        { value: "novo", label: "Nunca tinha parado pra pensar nisso assim" },
      ],
    },
    // 3. VOLTAR AO AGORA — o fato, tirando a sensação.
    {
      id: "dinheiro",
      type: "choice",
      eyebrow: "3 de 4 · Voltar ao agora",
      prompt: "O dinheiro que você pensa em colocar agora — de onde ele sai?",
      help: "O preço de agora é o lucro de quem entrou antes, não o seu ponto de partida. E de onde vem o dinheiro muda tudo.",
      options: [
        { value: "sobra", label: "Já está parado, sobrando — eu escolheria com consciência" },
        { value: "tirar", label: "Eu teria que tirar de algo: reserva, contas, outra meta" },
        { value: "nao_tenho", label: "Eu não tenho agora — entraria devendo ou alavancado" },
      ],
    },
    // 4. CLAREAR O VALOR — o antídoto do FOMO.
    {
      id: "valor",
      type: "write",
      eyebrow: "4 de 4 · Clarear o valor",
      prompt: "Se esse dinheiro rendesse tudo o que você imagina, o que mudaria de verdade na sua vida?",
      help: "Escreva com suas palavras. Isto fica só com você. É o antídoto do FOMO: te lembra pra que o dinheiro serve, em vez de te lembrar do que os outros ganharam.",
      placeholder: "Ex.: me daria mais tranquilidade para… / me aproximaria de…",
      cta: "Ver meu resultado",
    },
  ],

  result(a) {
    const valor = (a.valor || "").trim();
    const temValor = valor.length > 0;
    const eco = temValor
      ? "Você escreveu que esse dinheiro serviria para algo concreto na sua vida. Segure essa frase: a pergunta que desarma o FOMO é se este movimento te aproxima disso — ou se ele só alivia, por alguns minutos, o aperto de ficar de fora."
      : "Você preferiu não escrever pra que o dinheiro serve — e tudo bem. Mas vale voltar nisso antes de decidir: o FOMO some quando você lembra que o dinheiro serve a uma vida, não a um placar contra os outros.";

    // Ramo 1 — entraria devendo/alavancado por FOMO: a resposta é não.
    if (a.dinheiro === "nao_tenho") {
      return {
        eyebrow: "Seu resultado",
        verdict: "O passo de hoje é não dar o passo.",
        body: [
          "Entrar devendo ou alavancado por causa de um aperto de pressa é o roteiro mais clássico de transformar FOMO em prejuízo real — e em dívida, que dói muito depois de a euforia passar.",
          "Isso não fecha a porta pra sempre. Fecha a porta pra decidir isso agora, com dinheiro que você não tem, empurrado pela sensação. Se a tese for boa, ela continua boa quando você tiver capital que possa perder sem quebrar.",
          eco,
        ],
        record: buildRecord(a),
        safety: safetyNote,
      };
    }

    // Ramo 2 — tiraria de reserva/meta: trocar plano por impulso.
    if (a.dinheiro === "tirar") {
      return {
        eyebrow: "Seu resultado",
        verdict: "Antes de tirar de outro lugar, olhe o que você trocaria.",
        body: [
          "Tirar da reserva, das contas ou de uma meta que você já tinha para correr atrás desta é trocar um plano por um impulso. Às vezes vale — mas essa é uma decisão grande demais para ser tomada no aperto.",
          "Um teste simples: se amanhã, sem a pressa de hoje, você ainda achar que faz sentido mover esse dinheiro, o movimento continua disponível. O que o FOMO não suporta é esperar 24 horas — porque ele sabe que não sobrevive à calma.",
          eco,
        ],
        record: buildRecord(a),
        safety: safetyNote,
      };
    }

    // Ramo 3 — dinheiro que sobra, mas quem decide é o aperto.
    if (a.sentimento !== "tranquilo") {
      return {
        eyebrow: "Seu resultado",
        verdict: "É dinheiro que sobra — mas quem está decidindo agora é o aperto, não você.",
        body: [
          "Essa é a situação mais escorregadia: como o dinheiro sobra, parece seguro entrar. E pode até ser. Mas você marcou que o que está no comando é a pressa, a inveja ou o medo de ficar pra trás — e nenhum desses é um bom analista.",
          "Faça o teste das 24 horas. Se amanhã, sem o aperto, a ideia ainda fizer sentido, entre — mas com um tamanho que você aguente ver cair 50% no dia seguinte sem perder o sono. Se o aperto passar e a vontade sumir junto, você acabou de economizar o preço de uma lição.",
          eco,
        ],
        record: buildRecord(a),
        safety: safetyNote,
      };
    }

    // Ramo 4 — dinheiro que sobra e cabeça tranquila: decisão legítima.
    return {
      eyebrow: "Seu resultado",
      verdict: "Decidir com calma, com dinheiro que sobra, é legítimo — inclusive decidir sim.",
      body: [
        "Você marcou que não há aperto e que o dinheiro já está sobrando. Essa é a única combinação em que entrar não é FOMO — é escolha. Aqui o protocolo não te segura.",
        "Se for entrar, entre pensando no tamanho, não no timing: um valor que você aguente ver cair pela metade amanhã sem que isso mude a sua vida. O que protege você não é acertar a hora — é o tamanho da aposta.",
        eco,
      ],
      record: buildRecord(a),
      safety: safetyNote,
    };
  },
};

const safetyNote =
  "Se a vontade de entrar em tudo, o tempo todo, virou algo que você sente que não controla mais — isso vai além de uma decisão pontual, e conversar com um profissional de saúde ajuda mais do que qualquer ferramenta. Isto aqui é reflexão, não tratamento.";

function buildRecord(a) {
  return [
    { q: "O que estava mais forte", value: a.sentimento__label },
    { q: "“Últimas chances” que o mercado já ofereceu", value: a.fato__label },
    { q: "De onde sairia o dinheiro", value: a.dinheiro__label },
    { q: "Pra que esse dinheiro serve na minha vida", value: (a.valor || "").trim() },
  ];
}

runProtocol(PROTOCOL, "protocol-mount");

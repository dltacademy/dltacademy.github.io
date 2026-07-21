// Protocolo: medo de ficar de fora (FOMO).
// Motor de decisão original sobre os princípios da ACT — texto próprio,
// não reproduz exercícios de terceiros. Reflexão estruturada, não terapia.
//
// Profundidade (PROTOCOL_FRAMEWORK): os verbos transformadores exigem
// que a pessoa PRODUZA algo. Escolha só para diagnóstico e roteamento.
//   1 Notar (escolha)         diagnóstico
//   2 Desgrudar — escrever    a pessoa escreve o pensamento que a empurra
//   3 Desgrudar — reler       o próprio texto devolvido reformulado
//   4 Voltar ao agora (escolha)  de onde vem o dinheiro
//   5 Clarear o valor (escrever) elicitação real, não uma linha
//   6 Dar o passo (escrever)     compromisso concreto e com prazo

const PROTOCOL = {
  id: "protocolo-medo-de-ficar-de-fora",
  slug: "medo-de-ficar-de-fora",
  title: "Cheguei tarde? — o protocolo do medo de ficar de fora",
  path: "/protocolos/medo-de-ficar-de-fora/",

  steps: [
    // 1. NOTAR — dar nome ao que está no comando (diagnóstico → escolha ok).
    {
      id: "sentimento",
      type: "choice",
      eyebrow: "1 de 6 · Notar",
      prompt: "Você viu algo subir e bateu a vontade de entrar agora. O que está mais forte neste momento?",
      help: "Não existe resposta certa. Só nomear o que está no comando já tira um pouco do piloto automático.",
      options: [
        { value: "urgencia", label: "Aperto de “agora ou nunca” — se eu não entrar já, perco" },
        { value: "inveja", label: "Incômodo de ver os outros ganhando e eu não" },
        { value: "pra_tras", label: "Medo de ser o único que fica pra trás" },
        { value: "tranquilo", label: "Curiosidade tranquila, sem aperto nenhum" },
      ],
    },
    // 2. DESGRUDAR (ativo) — escrever o pensamento exato.
    {
      id: "pensamento",
      type: "write",
      eyebrow: "2 de 6 · Desgrudar",
      prompt: "Escreva, com as suas palavras, o pensamento exato que está te empurrando a entrar agora.",
      help: "Sem filtro, do jeito que ele aparece na sua cabeça. Isto fica só com você, no seu navegador.",
      placeholder: "Ex.: se eu não entrar hoje, vou me arrepender pra sempre / todo mundo vai ficar rico menos eu",
      cta: "Escrevi",
    },
    // 3. DESGRUDAR (ativo) — reler o próprio pensamento, reformulado.
    {
      id: "desfusao",
      type: "choice",
      eyebrow: "3 de 6 · Desgrudar",
      prompt: (a) => {
        const p = (a.pensamento || "").trim();
        return p
          ? `Agora leia de novo, assim: “Estou tendo o pensamento de que ${primeiraMinuscula(p)}.” Repare na diferença. Não é um fato sobre o mundo — é um pensamento que a sua mente te ofereceu. Como ele soa agora?`
          : "Pense no que te empurra a entrar como uma frase que a sua mente te oferece — não como um fato. Como isso soa?";
      },
      help: "Você não precisa acreditar nem brigar com o pensamento. Só percebê-lo como um pensamento já muda quem está no comando.",
      options: [
        { value: "solto", label: "Perde um pouco da força quando vejo que é só um pensamento" },
        { value: "grudado", label: "Continua parecendo verdade, real, urgente" },
        { value: "estranho", label: "Estranho de ler assim — mas faz sentido" },
      ],
    },
    // 4. VOLTAR AO AGORA — o fato, tirando a sensação (escolha → roteamento).
    {
      id: "dinheiro",
      type: "choice",
      eyebrow: "4 de 6 · Voltar ao agora",
      prompt: "Saindo da sensação e olhando o concreto: o dinheiro que você pensa em colocar agora — de onde ele sai?",
      help: "O preço de agora é o lucro de quem entrou antes, não o seu ponto de partida. E de onde vem o dinheiro muda tudo.",
      options: [
        { value: "sobra", label: "Já está parado, sobrando — eu escolheria com consciência" },
        { value: "tirar", label: "Eu teria que tirar de algo: reserva, contas, outra meta" },
        { value: "nao_tenho", label: "Eu não tenho agora — entraria devendo ou alavancado" },
      ],
    },
    // 5. CLAREAR O VALOR (ativo) — elicitação real, não uma linha.
    {
      id: "valor",
      type: "write",
      eyebrow: "5 de 6 · Clarear o valor",
      prompt: "Esquece o preço por um minuto. Daqui a dez anos, olhando pra trás, pra que você vai querer ter usado o seu dinheiro?",
      help: "Não é sobre este ativo. É sobre o que o dinheiro compra na sua vida que importa de verdade — tranquilidade, tempo, cuidar de alguém, uma escolha. O FOMO some quando você lembra disso, porque ele vive de te comparar com os outros, não com a sua vida.",
      placeholder: "Escreva algumas linhas, com as suas palavras…",
      cta: "Continuar",
    },
    // 6. DAR O PASSO (ativo) — compromisso concreto e com prazo.
    {
      id: "passo",
      type: "write",
      eyebrow: "6 de 6 · Dar o passo",
      prompt: "Em uma frase concreta: o que você vai fazer nas próximas 24 horas com essa vontade?",
      help: "Um compromisso específico, não uma intenção vaga. Escrever fixa a decisão antes de a emoção decidir por você.",
      placeholder: "Ex.: não faço nada hoje e reavalio amanhã de manhã, sem a pressa / entro com no máximo R$ ___, que aguento perder sem mudar minha vida",
      cta: "Ver meu resultado",
    },
  ],

  result(a) {
    const record = buildRecord(a);
    const eco = ecoDoValor(a);
    const compromisso = (a.passo || "").trim();
    const ecoPasso = compromisso
      ? `Você se comprometeu com isto: “${compromisso}”. Ele está no seu registro abaixo — releia amanhã, sem a pressa de hoje.`
      : "Você não deixou um compromisso escrito — vale voltar e escrever um. É a diferença entre refletir e decidir.";

    // Ramo 1 — entraria devendo/alavancado: a resposta é não.
    // Próximo passo é utilidade educacional, nunca presente afiliado.
    if (a.dinheiro === "nao_tenho") {
      return {
        verdict: "O passo de hoje é não dar o passo.",
        body: [
          "Entrar devendo ou alavancado por causa de um aperto de pressa é o roteiro mais clássico de transformar FOMO em prejuízo — e em dívida, que dói muito depois que a euforia passa.",
          "Isso não fecha a porta pra sempre. Fecha a porta pra decidir isso agora, com dinheiro que você não tem, empurrado pela sensação. Se a tese for boa, ela continua boa quando você tiver capital que possa perder sem quebrar.",
          eco, ecoPasso,
        ],
        record, safety: safetyNote,
        cta: {
          tipo: "artigo",
          headline: "Antes de qualquer entrada, monte um plano que não dependa de dívida.",
          texto: "Primeiros Passos no Cripto ajuda a separar objetivo, reserva e ritmo de entrada usando o dinheiro que já existe — sem transformar pressa em obrigação.",
          label: "Montar meus primeiros passos →",
          href: "https://primeiros-passos-cripto.dlt.academy/",
          external: false,
        },
      };
    }

    // Ramo 2 — tiraria de reserva/meta. Só utilidade educacional.
    if (a.dinheiro === "tirar") {
      return {
        verdict: "Antes de tirar de outro lugar, olhe o que você trocaria.",
        body: [
          "Tirar da reserva, das contas ou de uma meta que você já tinha para correr atrás desta é trocar um plano por um impulso. Às vezes vale — mas é uma decisão grande demais para ser tomada no aperto.",
          "O teste é simples: se amanhã, sem a pressa de hoje, você ainda achar que faz sentido mover esse dinheiro, ele continua disponível. O que o FOMO não suporta é esperar 24 horas — porque ele sabe que não sobrevive à calma.",
          eco, ecoPasso,
        ],
        record, safety: safetyNote,
        cta: {
          tipo: "artigo",
          headline: "Transforme essa troca num plano antes de mexer na reserva ou em outra meta.",
          texto: "Primeiros Passos no Cripto ajuda a definir objetivo, limite e ritmo de entrada com dinheiro disponível — sem sacrificar o que já tinha destino.",
          label: "Organizar um plano de entrada →",
          href: "https://primeiros-passos-cripto.dlt.academy/",
          external: false,
        },
      };
    }

    // Ramo 3 — dinheiro que sobra, mas quem decide é o aperto.
    if (a.sentimento !== "tranquilo") {
      return {
        verdict: "É dinheiro que sobra — mas quem está decidindo agora é o aperto, não você.",
        body: [
          "Essa é a situação mais escorregadia: como o dinheiro sobra, parece seguro entrar. E pode até ser. Mas você marcou que o que está no comando é a pressa, a inveja ou o medo de ficar pra trás — e nenhum desses é um bom analista.",
          a.desfusao === "grudado"
            ? "Você também sentiu que o pensamento continua parecendo verdade absoluta. Isso é normal — e é justamente o sinal de esperar antes de agir."
            : "Você já sentiu o pensamento perder um pouco da força quando o viu como pensamento. Use isso: a decisão não precisa ser dele.",
          "Faça o teste das 24 horas. Se amanhã, sem o aperto, a ideia ainda fizer sentido, entre — mas com um tamanho que você aguente ver cair 50% no dia seguinte sem perder o sono. Se o aperto passar e a vontade sumir junto, você acabou de economizar o preço de uma lição.",
          eco, ecoPasso,
        ],
        record, safety: safetyNote,
        cta: {
          tipo: "artigo",
          headline: "Se a ideia continuar fazendo sentido amanhã, teste primeiro o tamanho que você suportaria.",
          texto: "Sobrevive ou Quebra? compara cenários e mostra por que reduzir a exposição costuma proteger mais do que tentar acertar a hora.",
          label: "Testar o tamanho antes de agir →",
          href: "https://sobrevive-ou-quebra.dlt.academy/",
          external: false,
        },
      };
    }

    // Ramo 4 — dinheiro que sobra e cabeça tranquila: decisão legítima.
    // A continuação ainda é utilidade; o fluxo não confirmou necessidade
    // nem elegibilidade para uma plataforma, então não há presente direto.
    return {
      verdict: "Decidir com calma, com dinheiro que sobra, é legítimo — inclusive decidir sim.",
      body: [
        "Você marcou que não há aperto e que o dinheiro já está sobrando. Essa é a única combinação em que entrar não é FOMO — é escolha. Aqui o protocolo não te segura.",
        "Se for entrar, entre pensando no tamanho, não no timing: um valor que você aguente ver cair pela metade amanhã sem que isso mude a sua vida. O que protege você não é acertar a hora — é o tamanho da aposta.",
        eco, ecoPasso,
      ],
      record, safety: safetyNote,
      cta: {
        tipo: "artigo",
        headline: "Se for agir, veja quanto a sua exposição aguenta antes de decidir o tamanho.",
        texto: "O que protege não é acertar a hora — é dimensionar. O simulador compara cenários e mostra o impacto de cada tamanho no seu dinheiro.",
        label: "Abrir o Sobrevive ou Quebra? →",
        href: "https://sobrevive-ou-quebra.dlt.academy/",
        external: false,
      },
    };
  },
};

const safetyNote =
  "Se a vontade de entrar em tudo, o tempo todo, virou algo que você sente que não controla mais — isso vai além de uma decisão pontual, e conversar com um profissional de saúde ajuda mais do que qualquer ferramenta. Isto aqui é reflexão, não tratamento.";

function ecoDoValor(a) {
  const v = (a.valor || "").trim();
  return v
    ? "Releia o que você escreveu sobre pra que o seu dinheiro serve, ali embaixo. A pergunta que desarma o FOMO é uma só: este movimento te aproxima disso — ou só alivia, por alguns minutos, o aperto de ficar de fora?"
    : "Você preferiu não escrever pra que o dinheiro serve na sua vida — e tudo bem. Mas vale voltar nisso: o FOMO só perde a força quando você lembra que o dinheiro serve a uma vida, não a um placar contra os outros.";
}

function buildRecord(a) {
  return [
    { q: "O que estava mais forte", value: a.sentimento__label },
    { q: "O pensamento que me empurrava", value: (a.pensamento || "").trim() },
    { q: "Como ele soou quando reli como “um pensamento”", value: a.desfusao__label },
    { q: "De onde sairia o dinheiro", value: a.dinheiro__label },
    { q: "Pra que o meu dinheiro serve, daqui a dez anos", value: (a.valor || "").trim() },
    { q: "Meu compromisso para as próximas 24 horas", value: (a.passo || "").trim() },
  ];
}

function primeiraMinuscula(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

runProtocol(PROTOCOL, "protocol-mount");

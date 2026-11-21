// ============================================================
// Catálogo dos relatórios pagos — dados, não lógica.
//
// O resultado gratuito de cada protocolo é completo em si. O relatório
// pago é o aprofundamento opcional: uma oferta só por protocolo, vendida
// por link de pagamento do Stripe. A entrega fica numa página da DLT
// Academy, fora deste site estático, que confere o pagamento no Stripe
// antes de entregar. Este arquivo só descreve a oferta: não guarda dado
// nem recebe resposta.
//
// Para ativar a oferta: configurar a rota curta de compra no subdomínio de
// relatórios (`https://relatorio.dlt.academy/comprar/<produto>`) e colar em
// `checkoutUrl`. Com o campo vazio, ou fora desse host e caminho, o motor não
// mostra nada.
//
// `perfis` mapeia o perfil devolvido por result() ao capítulo do Dossiê
// que fala daquele caso. Só o nome do perfil viaja do protocolo até
// aqui; nenhuma resposta da pessoa.
// ============================================================

const PAID_REPORT_HOSTS = ["relatorio.dlt.academy"];

const PAID_REPORTS = {
  "decisao-fria": {
    titulo: "Decisão Fria: relatório do seu caso + Dossiê",
    promessa: "Um relatório da decisão que você está prestes a tomar, escrito a partir do que você contar, e o Dossiê com o método completo, para usar nas próximas decisões de dinheiro com risco.",
    conteudo: [
      "Seu veredito, com o nível de frieza da decisão e os pontos cegos do seu caso",
      "O limite em reais, calculado a partir do que você aguenta perder",
      "Três argumentos contra a sua tese, cada um virando condição de saída, e travas com lembretes de revisão de 7, 30 e 90 dias em 1 clique (.ics)",
      "Simulador interativo pós-relatório para testar cenários sem pagar de novo + Dossiê Decisão Fria (24 pág. em PDF com fichas)",
    ],
    preco: "R$ 47",
    formato: "relatório na hora + simulador + Dossiê em PDF",
    botao: "Quero o relatório e o Dossiê →",
    paginaUrl: "/produtos/decisao-fria/",
    botaoPagina: "Ver exemplo do relatório",
    plataforma: "Stripe",
    checkoutUrl: "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=portal&utm_medium=protocolo",
    aviso: "Pagamento via Pix (confirma na hora) ou cartão de crédito pelo Stripe. Nada do que você escreveu aqui vai junto. Depois de pagar, você responde algumas perguntas, testa cenários no simulador na mesma página e baixa o relatório e o Dossiê em PDF (o link de acesso também vai para o seu e-mail). As respostas são enviadas uma vez a um serviço de geração de texto contratado por nós, para escrever o relatório, e não são guardadas por nós. Um relatório por compra. É material educacional, não recomendação de investimento. Você tem 7 dias para pedir reembolso.",
    perfis: {
      recuperacao: {
        capitulo: "Depois da perda",
        porque: "Capítulo do Dossiê para quem quer operar para recuperar um prejuízo: como separar a dor da perda da próxima decisão.",
      },
      alavancagem: {
        capitulo: "Alavancagem com as travas antes do clique",
        porque: "Capítulo do Dossiê sobre garantia, distância até a liquidação e o tamanho que protege, antes de abrir qualquer posição.",
      },
      pressa: {
        capitulo: "Quando a vontade chega antes da tese",
        porque: "Capítulo do Dossiê para quando a pressa, a opinião de alguém ou a sensação estão decidindo por você.",
      },
      metodo: {
        capitulo: "A decisão fria como rotina",
        porque: "Capítulo do Dossiê para quem já decide com calma: transformar o que você fez hoje num processo que se repete.",
      },
    },
  },
  "teto-avancado": {
    titulo: "Teto Financeiro avançado: o plano reescrito com o que a sua vida mostrou",
    promessa: "O aprofundamento do Teto Financeiro: você carrega o arquivo (.md) do seu Teto e o plano é reescrito com o que já aconteceu nos seus dias, e não só com o que você previu.",
    conteudo: [
      "A leitura do seu padrão com as suas próprias palavras e as evidências dos retornos",
      "O plano de 7 e de 90 dias refeito a partir do que travou e do que funcionou",
      "A regra antiga e a regra de trabalho comparadas com o que de fato aconteceu",
      "Um relatório em PDF para guardar e rever, feito no seu navegador a partir do arquivo que você carregar",
    ],
    preco: "R$ 97",
    formato: "relatório na hora + PDF",
    botao: "Quero o Teto avançado →",
    plataforma: "Stripe",
    checkoutUrl: "",
    aviso: "Pagamento via Pix (confirma na hora) ou cartão de crédito pelo Stripe. Nada do que você escreveu no Teto vai junto no link: depois de pagar, você escolhe se carrega o seu arquivo (.md) e, se carregar, as respostas são enviadas uma vez a um serviço de geração de texto contratado por nós, para escrever o relatório, e não são guardadas por nós. É material educacional, não recomendação de investimento. Você tem 7 dias para pedir reembolso.",
    perfis: {
      "ganho-que-escorre": {
        capitulo: "O ganho que escorre",
        porque: "O aprofundamento começa pelo que costuma proteger quem vê o dinheiro de um ganho ir embora: o patamar de casa e a culpa de ter mais.",
      },
      "freio-na-cobranca": {
        capitulo: "O freio na hora de cobrar",
        porque: "O aprofundamento começa pelo que costuma proteger quem adia ou abaixa o preço: a rejeição e a imagem de pessoa boa.",
      },
      "passo-que-nao-sai": {
        capitulo: "O passo que não sai",
        porque: "O aprofundamento começa pelo que costuma proteger quem prepara mais e não dá o passo: o medo de errar e de ser testado.",
      },
      "decisao-no-calor": {
        capitulo: "A decisão no calor",
        porque: "O aprofundamento começa pelo que costuma proteger quem decide com pressa: o alívio imediato e a chance de provar valor rápido.",
      },
      "progresso-sem-trilho": {
        capitulo: "O progresso sem trilho",
        porque: "O aprofundamento começa pelo que costuma proteger quem não deixa um plano virar rotina: a monotonia e o compromisso.",
      },
      "dinheiro-nao-combina": {
        capitulo: "O dinheiro que \"não combina comigo\"",
        porque: "O aprofundamento começa pelo que costuma proteger quem sente que dinheiro não é para si: o pertencimento e a lealdade à origem.",
      },
      "caixa-da-familia": {
        capitulo: "O caixa da família",
        porque: "O aprofundamento começa pelo que costuma proteger quem sustenta os outros: ser necessário e ter lugar na família.",
      },
    },
  },
};

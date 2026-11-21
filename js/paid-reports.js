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
    titulo: "O Mapa do seu Teto: leitura das suas 3 cenas + ajuste no dia 7",
    promessa: "Você carrega o arquivo (.md) do protocolo gratuito, conta mais duas cenas reais e recebe a leitura do que se repete nas três, um plano desenhado para a sua semana e o ajuste do plano de 90 dias no dia 7.",
    conteudo: [
      "O que se repete nas suas 3 cenas reais, com cada conclusão presa às suas próprias frases",
      "Plano de 7 dias montado na sua semana real (e roteiro de conversa nos padrões de cobrança e família)",
      "Ajuste no dia 7: você traz o que aconteceu nos experimentos e o plano de 90 dias é reescrito com evidência",
      "Relatório em PDF + texto (.md) + lembretes quinzenais neutros até o dia 90 (opcionais, 1 clique para sair)",
    ],
    preco: "R$ 97",
    formato: "leitura no dia 0 + ajuste no dia 7 + PDF",
    botao: "Quero o Mapa do meu Teto →",
    paginaUrl: "/produtos/mapa-do-seu-teto/",
    botaoPagina: "Ver exemplo da leitura",
    plataforma: "Stripe",
    checkoutUrl: "",
    aviso: "Pagamento único por ciclo via Pix (confirma na hora) ou cartão pelo Stripe. Nada do que você escreveu aqui vai no link: depois de pagar, você escolhe se carrega o seu arquivo (.md). Suas respostas passam por um serviço de geração de texto contratado por nós apenas para produzir a leitura e ficam acessíveis no seu link por 10 dias para permitir o ajuste no dia 7 (ou você apaga na hora pelo botão da página; os lembretes quinzenais até o dia 90 são opcionais, neutros e com saída em 1 clique). É material educacional sobre hábitos com dinheiro, não é diagnóstico nem recomendação de investimento. Você tem 7 dias para pedir reembolso.",
    perfis: {
      "ganho-que-escorre": {
        capitulo: "O ganho que escorre",
        porque: "A leitura compara três vezes em que um ganho foi embora para achar o sinal que chega antes do gasto e montar o destino do próximo valor antes de ele cair.",
      },
      "freio-na-cobranca": {
        capitulo: "O freio na hora de cobrar",
        porque: "A leitura cruza três cenas em que você adiou ou deu desconto para separar o medo de rejeição do fato — e entrega o roteiro da próxima conversa de preço.",
      },
      "passo-que-nao-sai": {
        capitulo: "O passo que não sai",
        porque: "A leitura identifica o que trava a execução nas três cenas e usa as suas exceções reais para montar dois experimentos pequenos na semana que vem.",
      },
      "decisao-no-calor": {
        capitulo: "A decisão no calor",
        porque: "A leitura mapeia o gatilho exato que acelera a decisão nas três cenas e ajusta a trava de 24 horas para a sua rotina real.",
      },
      "progresso-sem-trilho": {
        capitulo: "O progresso sem trilho",
        porque: "A leitura mostra onde o plano costuma quebrar nas três cenas e substitui o recomeço na segunda por um ritual mínimo testado no dia 7.",
      },
      "dinheiro-nao-combina": {
        capitulo: "O dinheiro que \"não combina comigo\"",
        porque: "A leitura separa lealdade à origem de hábito financeiro e inclui um passo concreto de contribuição sem culpa.",
      },
      "caixa-da-familia": {
        capitulo: "O caixa da família",
        porque: "A leitura cruza três episódios de ajuda financeira à custa de si e entrega um teto mensal definido antes, além de roteiros editáveis de conversa.",
      },
    },
  },
};

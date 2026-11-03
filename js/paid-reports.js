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
      "Três argumentos contra a sua tese, cada um virando uma condição de saída, e as travas com revisão de 7, 30 e 90 dias, em PDF",
      "O Dossiê Decisão Fria em PDF: o método completo, com fichas para preencher",
    ],
    preco: "R$ 47",
    formato: "relatório escrito na hora + Dossiê em PDF",
    botao: "Quero o relatório e o Dossiê →",
    paginaUrl: "/produtos/decisao-fria/",
    botaoPagina: "Ver exemplo do relatório",
    plataforma: "Stripe",
    checkoutUrl: "https://relatorio.dlt.academy/comprar/decisao-fria?utm_source=portal&utm_medium=protocolo",
    aviso: "Pagamento pelo Stripe. Nada do que você escreveu aqui vai junto. Depois de pagar, você responde algumas perguntas e baixa o Dossiê na mesma página. As respostas são enviadas uma vez a um serviço de geração de texto contratado por nós, para escrever o relatório, e não são guardadas por nós. Um relatório por compra. É material educacional, não recomendação de investimento. Você tem 7 dias para pedir reembolso.",
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
};

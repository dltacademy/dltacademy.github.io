// ============================================================
// Catálogo dos relatórios pagos — dados, não lógica.
//
// O resultado gratuito de cada protocolo é completo em si. O relatório
// pago é o aprofundamento opcional, vendido por link de pagamento do
// Stripe. A entrega fica numa página da DLT Academy, fora deste site
// estático, que confere o pagamento no Stripe antes de entregar. Este
// arquivo só descreve os produtos: não guarda dado nem recebe resposta.
//
// Para ativar a oferta: criar o link de pagamento no Stripe e colar em
// `checkoutUrl`. Com o campo vazio, ou com host fora da lista abaixo, o
// motor não mostra nada.
//
// `perfis` mapeia o perfil devolvido por result() ao capítulo do
// relatório que fala daquele caso. Só o nome do perfil viaja do
// protocolo até aqui; nenhuma resposta da pessoa.
// ============================================================

// Os dois modelos usam o Stripe: o estático (PDF pronto, baixado depois
// do pagamento) e o personalizado (o relatório é escrito depois do
// pagamento, a partir das respostas).
const PAID_REPORT_HOSTS = ["buy.stripe.com"];

const PAID_REPORTS = {
  "decisao-fria": {
    titulo: "Dossiê Decisão Fria",
    promessa: "O método completo por trás deste protocolo, para usar em toda decisão de dinheiro com risco, e não só nesta: quanto colocar, quando sair e como revisar sem se enganar.",
    conteudo: [
      "Como definir o valor máximo a partir do que você aguenta perder, e não do que você quer ganhar",
      "As três travas escritas (limite, saída e revisão), com exemplos preenchidos",
      "Os pontos cegos do seu caso e o que fazer com cada um",
      "Fichas para imprimir e o contrato de revisão de 7, 30 e 90 dias",
    ],
    preco: "R$ 29",
    formato: "PDF com fichas para preencher",
    botao: "Quero o Dossiê Decisão Fria →",
    plataforma: "Stripe",
    checkoutUrl: "",
    aviso: "Pagamento pelo Stripe. Depois de pagar, você baixa o PDF numa página da DLT Academy. Nada do que você escreveu aqui vai junto: suas respostas continuam só no seu navegador. Você tem 7 dias para pedir reembolso.",
    perfis: {
      recuperacao: {
        capitulo: "Depois da perda",
        porque: "Para quem quer operar para recuperar um prejuízo: como separar a dor da perda da próxima decisão.",
      },
      alavancagem: {
        capitulo: "Alavancagem com as travas antes do clique",
        porque: "Garantia, distância até a liquidação e o tamanho que protege, antes de abrir qualquer posição.",
      },
      pressa: {
        capitulo: "Quando a vontade chega antes da tese",
        porque: "Para quando a pressa, a opinião de alguém ou a sensação estão decidindo por você.",
      },
      metodo: {
        capitulo: "A decisão fria como rotina",
        porque: "Para quem já decide com calma: transformar o que você fez hoje num processo que se repete.",
      },
    },
  },
  "decisao-fria-premium": {
    titulo: "Relatório do seu caso",
    promessa: "Três leituras da decisão que você está prestes a tomar, escritas a partir do que você contar: o que a emoção está fazendo, o melhor argumento contra e o veredito com as suas travas.",
    conteudo: [
      "Seu veredito, com o nível de frieza da decisão",
      "O limite em reais, calculado a partir do que você aguenta perder",
      "Três argumentos contra a sua tese, cada um virando uma condição de saída",
      "Seu contrato de revisão de 7, 30 e 90 dias, em PDF",
    ],
    preco: "R$ 49",
    formato: "escrito na hora, a partir das suas respostas",
    botao: "Quero o relatório do meu caso →",
    plataforma: "Stripe",
    checkoutUrl: "",
    aviso: "Pagamento pelo Stripe. Depois de pagar, você responde algumas perguntas; as respostas são enviadas uma vez para gerar o relatório com inteligência artificial e não são guardadas por nós. É material educacional, não recomendação de investimento. Você tem 7 dias para pedir reembolso.",
  },
};

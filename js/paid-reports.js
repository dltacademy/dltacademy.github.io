// ============================================================
// Catálogo dos relatórios pagos — dados, não lógica.
//
// O resultado gratuito de cada protocolo é completo em si. O relatório
// pago é o aprofundamento opcional: um produto só por protocolo, vendido
// e entregue por um provedor gerenciado (checkout, pagamento, entrega do
// PDF, nota e reembolso ficam lá). Nenhum servidor nosso, nenhum dado
// guardado aqui.
//
// Para ativar a oferta: criar o produto no provedor e colar o link de
// checkout em `checkoutUrl`. Com o campo vazio, ou com host fora da
// lista abaixo, o motor não mostra nada.
//
// `perfis` mapeia o perfil devolvido por result() ao capítulo do
// relatório que fala daquele caso. Só o nome do perfil viaja do
// protocolo até aqui; nenhuma resposta da pessoa.
// ============================================================

const PAID_REPORT_HOSTS = ["pay.kiwify.com.br", "pay.hotmart.com"];

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
    plataforma: "Kiwify",
    checkoutUrl: "",
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
};

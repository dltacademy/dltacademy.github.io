// ============================================================
// Registry único do portal — ÚNICO arquivo a editar para listar
// conteúdo novo. 1 objeto novo = 1 card no ar.
// Schema: Registry Core V1. O array é JSON ESTRITO (aspas duplas,
// sem comentários dentro, sem trailing comma) — validado por
// validate_registry.py. IDs publicados NUNCA são renomeados.
// type: "tool" | "guide" | "article".
// publishedAt: ISO YYYY-MM-DD, obrigatório para article.
// ============================================================

const CONTENT = [
  {
    "id": "tool-sobrevive-ou-quebra",
    "type": "tool",
    "title": "Sobrevive ou Quebra?",
    "description": "Proteger custa caro; não proteger pode custar mais. Compare não fazer nada, reduzir, travar com futuros e comprar seguro nos mesmos 1.000 cenários.",
    "url": "https://sobrevive-ou-quebra.dlt.academy/",
    "tag": "Proteção de patrimônio",
    "tone": "green",
    "icon": "🛡️",
    "related": ["tool-vender-ou-segurar", "tool-quanto-em-taxas"]
  },
  {
    "id": "tool-quanto-em-taxas",
    "type": "tool",
    "title": "Quanto você paga para operar?",
    "description": "Calcule quanto as taxas consomem do seu dinheiro por mês e por ano, em menos de 30 segundos.",
    "url": "https://quanto-em-taxas.dlt.academy/",
    "tag": "Custos e taxas",
    "tone": "blue",
    "icon": "💸",
    "primaryNext": "tool-sobrevive-ou-quebra"
  },
  {
    "id": "tool-primeiros-passos-cripto",
    "type": "tool",
    "title": "Primeiros Passos no Cripto",
    "description": "Responda 6 perguntas e receba seu plano de entrada personalizado.",
    "url": "https://primeiros-passos-cripto.dlt.academy/",
    "tag": "Iniciante",
    "tone": "blue",
    "icon": "🧭",
    "primaryNext": "guide-conta-binance",
    "related": ["tool-quanto-em-taxas"]
  },
  {
    "id": "tool-vender-ou-segurar",
    "type": "tool",
    "title": "Vender ou Segurar?",
    "description": "4 perguntas pra descobrir se vender agora é decisão ou pânico — e o que fazer a seguir.",
    "url": "https://vender-ou-segurar.dlt.academy/",
    "tag": "Já tem posição",
    "tone": "green",
    "icon": "⚖️",
    "primaryNext": "tool-sobrevive-ou-quebra"
  },
  {
    "id": "protocolo-medo-de-ficar-de-fora",
    "type": "protocolo",
    "title": "Cheguei tarde?",
    "description": "Algo disparou e bateu a vontade de entrar agora. Um protocolo curto para separar a decisão do medo de ficar de fora — e decidir por você, não pelo aperto.",
    "url": "/protocolos/medo-de-ficar-de-fora/",
    "tag": "Decisão sob emoção",
    "tone": "green",
    "icon": "🧭",
    "primaryNext": "tool-sobrevive-ou-quebra",
    "related": ["tool-vender-ou-segurar"]
  },
  {
    "id": "guide-conta-binance",
    "type": "guide",
    "title": "Criar conta com segurança",
    "description": "Um passo por vez para criar e proteger sua conta, sem compartilhar dados sensíveis.",
    "url": "/guias/conta-binance/",
    "tag": "Guia interativo",
    "tone": "blue",
    "icon": "🔐",
    "primaryNext": "tool-quanto-em-taxas"
  },
  {
    "id": "guide-pagamentos-no-exterior",
    "type": "guide",
    "title": "Como pagar no exterior gastando menos",
    "description": "Um mapa prático de cartão, QR, saques, backup, funding e otimizações para montar um setup de viagem sem depender de uma solução só.",
    "url": "/pagamentos-no-exterior/",
    "tag": "Guia central de viagem",
    "tone": "green",
    "icon": "🌍",
    "related": ["article-arq-saques-exterior", "guide-etherfi-cash-viagem", "guide-bybit-pay-vietqr"]
  },
  {
    "id": "guide-bybit-pay-vietqr",
    "type": "guide",
    "title": "Pagar com QR Code no exterior (Bybit Pay)",
    "description": "VietQR e outros QRs locais com Bybit Pay: taxas reais, limites, erros comuns e o que usar quando não funcionar.",
    "url": "/guias/bybit-pay-vietqr/",
    "tag": "Guia de viagem",
    "tone": "green",
    "icon": "📱",
    "related": ["article-bybit-pay-vs-moreta-vietqr", "guide-abastecer-moreta-usdt", "guide-assinaturas-ia-bybit"]
  },
  {
    "id": "guide-assinaturas-ia-bybit",
    "type": "guide",
    "title": "Cashback em assinaturas de IA com o Bybit Card",
    "description": "Quem se qualifica ao reembolso de até 100%, quanto realmente cabe no teto mensal e por que subir de tier costuma piorar o seu resultado.",
    "url": "/guias/assinaturas-ia-bybit/",
    "tag": "Guia de pagamentos",
    "tone": "blue",
    "icon": "🤖",
    "primaryNext": "guide-bybit-pay-vietqr",
    "related": ["article-bybit-pay-vs-moreta-vietqr"]
  },
  {
    "id": "guide-abastecer-moreta-usdt",
    "type": "guide",
    "title": "Abastecer o Moreta Pay com USDT",
    "description": "O caminho barato de funding: comprar USDT na Binance ou Bybit e transferir, evitando a taxa do depósito convencional.",
    "url": "/guias/abastecer-moreta-usdt/",
    "tag": "Guia de viagem",
    "tone": "blue",
    "icon": "💱",
    "related": ["guide-bybit-pay-vietqr", "article-bybit-pay-vs-moreta-vietqr", "guide-pagamentos-no-exterior"]
  },
  {
    "id": "guide-etherfi-cash-viagem",
    "type": "guide",
    "title": "Por que uso o ether.fi Cash no exterior",
    "description": "A pesquisa e a experiência real que fizeram o ether.fi virar meu cartão principal: 3% de cashback, câmbio competitivo, promoções e a limitação dos saques.",
    "url": "/guias/etherfi-cash-viagem/",
    "tag": "Guia de viagem",
    "tone": "green",
    "icon": "💳",
    "primaryNext": "guide-pagamentos-no-exterior",
    "related": ["article-bybit-pay-vs-moreta-vietqr", "guide-abastecer-moreta-usdt", "article-arq-saques-exterior"]
  },
  {
    "id": "article-bem-vindo",
    "type": "article",
    "title": "Bem-vindo ao Blog da DLT Academy",
    "description": "Por que criamos esse blog, o que você vai encontrar aqui, e como ele se conecta com as ferramentas gratuitas da DLT Academy.",
    "url": "/blog/bem-vindo/",
    "tag": "Institucional",
    "publishedAt": "2026-07-15",
    "primaryNext": "tool-primeiros-passos-cripto"
  },
  {
    "id": "article-bybit-pay-vs-moreta-vietqr",
    "type": "article",
    "title": "Bybit Pay ou Moreta Pay: qual saiu mais barato no VietQR?",
    "description": "Teste real no Vietnã e um método para escolher entre os dois em outros países, considerando QR, spread, cashback e funding.",
    "url": "/blog/bybit-pay-vs-moreta-vietqr/",
    "tag": "Teste real",
    "publishedAt": "2026-07-17",
    "primaryNext": "guide-bybit-pay-vietqr"
  },
  {
    "id": "article-topcashback-economia-viagem",
    "type": "article",
    "title": "TopCashback para viagens: cashback em hotéis, voos e compras",
    "description": "Faixas de cashback, exemplos concretos de economia e um método para comparar preço final, bônus, câmbio e elegibilidade antes de reservar.",
    "url": "/blog/topcashback-economia-viagem/",
    "tag": "Economia em viagem",
    "publishedAt": "2026-07-29",
    "primaryNext": "guide-pagamentos-no-exterior",
    "related": ["article-bybit-pay-vs-moreta-vietqr", "guide-abastecer-moreta-usdt"]
  },
  {
    "id": "article-arq-saques-exterior",
    "type": "article",
    "title": "Por que uso o ARQ para sacar dinheiro no exterior",
    "description": "Experiência real com o antigo DolarApp: taxa atual do saque, tarifa do ATM, DCC, cartão físico e Revolut como backup.",
    "url": "/blog/arq-saques-exterior/",
    "tag": "Dinheiro em viagem",
    "publishedAt": "2026-07-29",
    "primaryNext": "guide-pagamentos-no-exterior",
    "related": ["guide-bybit-pay-vietqr", "guide-abastecer-moreta-usdt", "guide-etherfi-cash-viagem"]
  },
  {
    "id": "article-fomo-investimentos-depois-da-alta",
    "type": "article",
    "title": "FOMO nos investimentos: como decidir depois que o preço disparou",
    "description": "Uma alta forte não prova que você deve entrar nem que o topo chegou. Separe urgência, tese, origem do dinheiro e tamanho antes de decidir.",
    "url": "/blog/fomo-investimentos-depois-da-alta/",
    "tag": "Decisão sob emoção",
    "publishedAt": "2026-07-28",
    "primaryNext": "protocolo-medo-de-ficar-de-fora",
    "related": ["tool-primeiros-passos-cripto", "tool-sobrevive-ou-quebra"]
  }
];
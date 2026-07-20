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
    "icon": "🛡️"
  },
  {
    "id": "tool-quanto-em-taxas",
    "type": "tool",
    "title": "Quanto você paga para operar?",
    "description": "Calcule quanto as taxas consomem do seu dinheiro por mês e por ano, em menos de 30 segundos.",
    "url": "https://quanto-em-taxas.dlt.academy/",
    "tag": "Custos e taxas",
    "tone": "blue",
    "icon": "💸"
  },
  {
    "id": "tool-primeiros-passos-cripto",
    "type": "tool",
    "title": "Primeiros Passos no Cripto",
    "description": "Responda 6 perguntas e receba seu plano de entrada personalizado.",
    "url": "https://primeiros-passos-cripto.dlt.academy/",
    "tag": "Iniciante",
    "tone": "blue",
    "icon": "🧭"
  },
  {
    "id": "tool-vender-ou-segurar",
    "type": "tool",
    "title": "Vender ou Segurar?",
    "description": "4 perguntas pra descobrir se vender agora é decisão ou pânico — e o que fazer a seguir.",
    "url": "https://vender-ou-segurar.dlt.academy/",
    "tag": "Já tem posição",
    "tone": "green",
    "icon": "⚖️"
  },
  {
    "id": "guide-conta-binance",
    "type": "guide",
    "title": "Criar conta com segurança",
    "description": "Um passo por vez para criar e proteger sua conta, sem compartilhar dados sensíveis.",
    "url": "/guias/conta-binance/",
    "tag": "Guia interativo",
    "tone": "blue",
    "icon": "🔐"
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
    "related": ["guide-bybit-pay-vietqr", "article-bybit-pay-vs-moreta-vietqr"]
  },
  {
    "id": "article-bem-vindo",
    "type": "article",
    "title": "Bem-vindo ao Blog da DLT Academy",
    "description": "Por que criamos esse blog, o que você vai encontrar aqui, e como ele se conecta com as ferramentas gratuitas da DLT Academy.",
    "url": "/blog/bem-vindo/",
    "tag": "Institucional",
    "publishedAt": "2026-07-15"
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
  }
];

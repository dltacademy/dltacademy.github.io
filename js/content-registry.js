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
    "description": "Simulador de risco de futuros + raio-x do seu histórico de trades.",
    "url": "https://sobrevive-ou-quebra.dlt.academy/",
    "tag": "Trader de futuros",
    "tone": "green",
    "icon": "🛡️"
  },
  {
    "id": "tool-quanto-em-taxas",
    "type": "tool",
    "title": "Quanto você paga para operar?",
    "description": "Calcule o custo mensal e anual das suas taxas de trading em menos de 30 segundos.",
    "url": "https://quanto-em-taxas.dlt.academy/",
    "tag": "Custos do trader",
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
    "icon": "📱"
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
    "title": "Bybit Pay ou Moreta Pay no Vietnã: qual saiu mais barato no VietQR?",
    "description": "Pagamos a mesma compra de 100.000 VND com os dois. Veja o custo real, o cashback e qual usar em cada situação.",
    "url": "/blog/bybit-pay-vs-moreta-vietqr/",
    "tag": "Teste real",
    "publishedAt": "2026-07-17"
  }
];

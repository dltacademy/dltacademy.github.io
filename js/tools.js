// ============================================================
// Registry das ferramentas — ÚNICO arquivo a editar pra listar
// uma ferramenta nova no portal. 1 objeto novo = 1 card no ar.
//
// tone: "green" ou "blue" — só varia a cor da etiqueta (tag), sem
// significado bom/ruim (o design system não tem cor de alerta pra tag).
// category: opcional; sem valor, o item entra em "ferramenta".
// icon: emoji exibido no card (opcional; cai num padrão se faltar).
// ============================================================

const TOOLS = [
  {
    name: "Criar conta com segurança",
    icon: "🔐",
    desc: "Um passo por vez para criar e proteger sua conta, sem compartilhar dados sensíveis.",
    url: "/guias/conta-binance/",
    tag: "Guia interativo",
    tone: "blue",
    category: "guia",
  },
  {
    name: "Sobrevive ou Quebra?",
    icon: "🛡️",
    desc: "Simulador de risco de futuros + raio-x do seu histórico de trades.",
    url: "https://sobrevive-ou-quebra.dlt.academy/",
    tag: "Trader de futuros",
    tone: "green",
    category: "ferramenta",
  },
  {
    name: "Quanto você paga para operar?",
    desc: "Calcule o custo mensal e anual das suas taxas de trading em menos de 30 segundos.",
    url: "https://quanto-em-taxas.dlt.academy/",
    tag: "Custos do trader",
    tone: "blue",
    category: "ferramenta",
  },
  {
    name: "Primeiros Passos no Cripto",
    icon: "🧭",
    desc: "Responda 6 perguntas e receba seu plano de entrada personalizado.",
    url: "https://primeiros-passos-cripto.dlt.academy/",
    tag: "Iniciante",
    tone: "blue",
    category: "ferramenta",
  },
  {
    name: "Vender ou Segurar?",
    icon: "⚖️",
    desc: "4 perguntas pra descobrir se vender agora é decisão ou pânico — e o que fazer a seguir.",
    url: "https://vender-ou-segurar.dlt.academy/",
    tag: "Já tem posição",
    tone: "green",
    category: "ferramenta",
  },
];

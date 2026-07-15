// ============================================================
// Registry das ferramentas — ÚNICO arquivo a editar pra listar
// uma ferramenta nova no portal. 1 objeto novo = 1 card no ar.
//
// tone: "green" ou "blue" — só varia a cor da etiqueta (tag), sem
// significado bom/ruim (o design system não tem cor de alerta pra tag).
// category: opcional; sem valor, o item entra em "ferramenta".
// ============================================================

const TOOLS = [
  {
    name: "Criar conta com segurança",
    desc: "Um passo por vez para criar e proteger sua conta, sem compartilhar dados sensíveis.",
    url: "/guias/conta-binance/",
    tag: "Guia interativo",
    tone: "blue",
    category: "guia",
  },
  {
    name: "Sobrevive ou Quebra?",
    desc: "Simulador de risco de futuros + raio-x do seu histórico de trades.",
    url: "https://sobrevive-ou-quebra.dlt.academy/",
    tag: "Trader de futuros",
    tone: "green",
    category: "ferramenta",
  },
  {
    name: "Primeiros Passos no Cripto",
    desc: "Responda 6 perguntas e receba seu plano de entrada personalizado.",
    url: "https://primeiros-passos-cripto.dlt.academy/",
    tag: "Iniciante",
    tone: "blue",
    category: "ferramenta",
  },
  {
    name: "Vender ou Segurar?",
    desc: "4 perguntas pra descobrir se vender agora é decisão ou pânico — e o que fazer a seguir.",
    url: "https://vender-ou-segurar.dlt.academy/",
    tag: "Já tem posição",
    tone: "green",
    category: "ferramenta",
  },
];

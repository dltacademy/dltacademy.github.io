// ============================================================
// Registry das ferramentas — ÚNICO arquivo a editar pra listar
// uma ferramenta nova no portal. 1 objeto novo = 1 card no ar.
//
// tone: "green" ou "blue" — só varia a cor da etiqueta (tag), sem
// significado bom/ruim (o design system não tem cor de alerta pra tag).
// ============================================================

const TOOLS = [
  {
    name: "Sobrevive ou Quebra?",
    desc: "Simulador de risco de futuros + raio-x do seu histórico de trades.",
    url: "/sobrevive-ou-quebra/",
    tag: "Trader de futuros",
    tone: "green",
  },
  {
    name: "Primeiros Passos no Cripto",
    desc: "Responda 6 perguntas e receba seu plano de entrada personalizado.",
    url: "/primeiros-passos-cripto/",
    tag: "Iniciante",
    tone: "blue",
  },
];

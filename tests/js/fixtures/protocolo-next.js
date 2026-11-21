// Protocolo sintético só para exercitar `next()`: desvio por id, fim antecipado,
// id inexistente (segue em ordem) e passo de escrita no meio do caminho.
const PROTOCOL = {
  id: "protocolo-sintetico-next",
  slug: "sintetico-next",
  title: "Protocolo sintético",
  path: "/protocolos/sintetico-next/",

  steps: [
    {
      id: "a",
      type: "choice",
      prompt: "A: para onde ir?",
      options: [
        { value: "ordem", label: "Em ordem" },
        { value: "pular", label: "Pular para d" },
        { value: "fim", label: "Terminar já" },
      ],
      next: (a) => (a.a === "pular" ? "d" : a.a === "fim" ? null : undefined),
    },
    { id: "b", type: "write", prompt: "B: escreva algo", cta: "Escrevi" },
    {
      id: "c",
      type: "choice",
      prompt: "C: seguir?",
      options: [
        { value: "seguir", label: "Seguir" },
        { value: "inexistente", label: "Id que não existe" },
      ],
      next: (a) => (a.c === "inexistente" ? "nao-existe" : undefined),
    },
    { id: "d", type: "choice", prompt: "D: último", options: [{ value: "x", label: "X" }, { value: "y", label: "Y" }] },
  ],

  result(a) {
    return {
      id: 1,
      grade: a.a === "fim" ? 4 : 1,
      tone: a.a === "fim" ? "bad" : "good",
      verdict: "Fim do sintético",
      body: ["Corpo."],
      record: [{ q: "A", value: a.a__label }, { q: "B", value: a.b }],
    };
  },
};

runProtocol(PROTOCOL, "protocol-mount");

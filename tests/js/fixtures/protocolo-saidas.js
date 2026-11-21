// Protocolo de teste das saídas: seções, sem pílula, blocos marcados, registro em código,
// lembretes (.ics), aviso próprio e nome dos arquivos.
const PROTOCOL = {
  id: "protocolo-saidas-teste",
  slug: "saidas-teste",
  title: "Protocolo de teste das saídas",
  path: "/protocolos/saidas/",
  disclaimer: "Reflexão estruturada da DLT Academy — não é diagnóstico, avaliação psicológica nem recomendação de investimento.",
  importar: { registro: () => ({ erro: null }) },

  steps: [
    { id: "frase", type: "write", prompt: "Escreva uma frase.", maxLength: 300 },
    { id: "escolha", type: "choice", prompt: "Escolha uma.", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
  ],

  result(a) {
    const frase = a.frase || "";
    const codificado = DLTProtocolKit.codificarRegistro({ v: 1, tipo: "demo", escolha: a.escolha, regra: frase }, 2048);
    return {
      id: 1,
      pill: false,
      tone: "good",
      eyebrow: "Seu mapa",
      verdict: "Mapa pronto 😀",
      body: ["Texto do corpo."],
      sections: [
        { id: "fio", title: "O fio", kind: "fio", paragraphs: ["Você escreveu: “" + frase + "”."] },
        { id: "plano7", title: "Plano de 7 dias", kind: "plano", items: [{ title: "Dia 3 · 23/11", text: "Faça o passo → feito ✓." }, "Item solto"] },
      ],
      record: [{ q: "Frase", value: frase }],
      blocks: [
        { id: "demo.ultima_vez", v: 1, titulo: "A última vez", campos: [{ id: "frase", rotulo: "A frase", texto: frase }, { id: "escolha", rotulo: "A escolha", valor: a.escolha, texto: a.escolha__label }] },
        { id: "demo.fio", v: 1, leitura: true, titulo: "O fio", linhas: ["Você escreveu: " + frase] },
        { id: "demo.registro", v: 1, titulo: "Seu registro", json: codificado.objeto, codigo: codificado.codigo },
      ],
      registro: { titulo: "Seu registro", resumo: [{ q: "Frase", value: frase }], objeto: codificado.objeto, codigo: codificado.codigo },
      ics: {
        eventos: [{
          uid: "demo-dia7-abc12345@dlt.academy", inicio: "2026-11-27", hora: "20:00", duracaoMin: 3,
          resumo: "Demonstração: retorno do dia 7", descricao: "Três perguntas rápidas. Abra o link.",
          url: "https://dlt.academy/protocolos/saidas/#volta=dia7",
        }],
      },
      arquivos: { md: "saidas-2026-11-20.md", ics: "saidas-lembretes.ics", pdf: "saidas-2026-11-20.pdf" },
    };
  },
};

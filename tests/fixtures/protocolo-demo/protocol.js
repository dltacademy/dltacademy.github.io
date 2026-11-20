// Protocolo de demonstração: um passo de cada recurso novo do motor, para
// conferir no navegador. Não tem conteúdo de verdade e não vai ao ar.
//
//   frente    choice + complemento em régua     (grupo A)
//   marcas    multi com opção exclusiva         (grupo A)
//   peso      scale de 0 a 100 de 10 em 10      (grupo A)
//   rotina    grade de itens                    (grupo A)
//   tríade    escolha forçada mais/menos        (grupo B)
//   destaque  opções que dependem das respostas (grupo B)
//   ramo      escolha que liga o passo seguinte (grupo B)
//   detalhe   passo condicional, texto pré-preenchido e limitado,
//             complemento escrito opcional      (grupo B)
//   fecho     escrita limitada + complemento em régua (grupo B)

const PROTOCOL = {
  id: "protocolo-demonstracao",
  slug: "protocolo-demo",
  title: "Demonstração dos tipos de passo",
  path: "/tests/fixtures/protocolo-demo/",
  progresso: "grupos",

  steps: [
    {
      id: "frente",
      grupo: "Parte A",
      type: "choice",
      eyebrow: "Escolha com complemento",
      prompt: "Qual destas frases descreve melhor o seu momento?",
      help: "Marcar não avança: o complemento fica na mesma tela e o botão só liga com tudo respondido.",
      options: [
        { value: "calmo", label: "Tudo sob controle por enquanto" },
        { value: "aperto", label: "Um aperto que vem e vai" },
        { value: "pressa", label: "Uma pressa que não sei de onde vem" },
      ],
      followUp: {
        type: "scale",
        id: "frente_peso",
        prompt: "De 0 a 10, o quanto isso pesa hoje?",
        min: 0,
        max: 10,
        step: 1,
        ends: { min: "Nada", max: "Muito" },
      },
    },
    {
      id: "marcas",
      grupo: "Parte A",
      type: "multi",
      eyebrow: "Vários",
      prompt: "O que costuma acontecer nas semanas difíceis? Marque quantas quiser.",
      help: "“Nada disso” é exclusiva: marcá-la solta as outras, e marcar outra solta ela.",
      exclusive: "nada",
      min: 1,
      options: [
        { value: "adia", label: "Adio uma conta" },
        { value: "cartao", label: "Uso o cartão para fechar o mês" },
        { value: "evita", label: "Evito abrir o aplicativo do banco" },
        { value: "nada", label: "Nada disso acontece comigo" },
      ],
    },
    {
      id: "peso",
      grupo: "Parte A",
      type: "scale",
      eyebrow: "Régua",
      prompt: "Quanto você acredita que o próximo mês será melhor que este?",
      help: "Sem valor marcado de saída, para não ancorar a resposta. Escolher não avança: o botão liga depois.",
      min: 0,
      max: 100,
      step: 10,
      format: "%",
      ends: { min: "Nenhuma crença", max: "Certeza" },
    },
    {
      id: "rotina",
      grupo: "Parte A",
      type: "grade",
      eyebrow: "Grade de itens",
      prompt: "Com que frequência cada situação acontece?",
      help: "Uma resposta por linha. O botão liga quando todas as linhas têm resposta.",
      items: [
        { id: "olhar", label: "Olho o saldo antes de comprar" },
        { id: "anotar", label: "Anoto o que gastei" },
        { id: "esperar", label: "Espero um dia antes de uma compra grande" },
      ],
      options: [
        { value: 0, label: "Nunca" },
        { value: 1, label: "Às vezes" },
        { value: 2, label: "Quase sempre" },
        { value: 3, label: "Sempre" },
      ],
    },
    {
      id: "triade",
      grupo: "Parte B",
      type: "triad",
      eyebrow: "Tríade de escolha forçada",
      prompt: "Entre as três frases, qual é a mais parecida com você e qual é a menos?",
      help: "Um item para “mais” e outro, diferente, para “menos”. Tocar de novo desmarca.",
      labels: { mais: "Mais parecida", menos: "Menos parecida" },
      items: [
        { id: "plano", label: "Prefiro ter um plano a improvisar" },
        { id: "momento", label: "Decido melhor no calor do momento" },
        { id: "outros", label: "Costumo seguir o que os outros fazem" },
      ],
    },
    {
      id: "destaque",
      grupo: "Parte B",
      type: "choice",
      eyebrow: "Opções que dependem das respostas",
      prompt: "Qual destas semanas difíceis pesou mais?",
      help: "A lista vem do que você marcou em “Vários”. Sem nenhuma, ela cai num texto de reserva.",
      options: (a) => {
        const marcadas = (a.marcas || []).map((valor, i) => ({ value: valor, label: (a.marcas__labels || [])[i] }))
          .filter((o) => o.value !== "nada");
        return marcadas.length ? marcadas : [{ value: "nenhuma", label: "Nenhuma delas pesou" }];
      },
    },
    {
      id: "ramo",
      grupo: "Parte B",
      type: "choice",
      eyebrow: "Passo condicional",
      prompt: "Quer detalhar a situação em palavras?",
      help: "“Sim” liga o próximo passo. Se você escrever, voltar e trocar para “Não”, o texto some do resultado.",
      options: [
        { value: "sim", label: "Sim, quero detalhar" },
        { value: "nao", label: "Não, seguir adiante" },
      ],
    },
    {
      id: "detalhe",
      grupo: "Parte B",
      type: "write",
      eyebrow: "Escrita pré-preenchida e limitada",
      showIf: (a) => a.ramo === "sim",
      prompt: "Descreva em uma frase.",
      help: "O texto já vem com uma sugestão tirada da resposta anterior; até 120 caracteres.",
      value: (a) => (a.destaque__label ? "Pesou mais: " + a.destaque__label.toLowerCase() + "." : ""),
      maxLength: 120,
      placeholder: "Escreva com suas palavras…",
      followUp: {
        type: "write",
        id: "detalhe_extra",
        prompt: "Algo mais que valha registrar? (opcional)",
        placeholder: "Pode deixar em branco.",
        optional: true,
        maxLength: 80,
      },
    },
    {
      id: "fecho",
      grupo: "Parte B",
      type: "write",
      eyebrow: "Escrita limitada com régua",
      prompt: "Escreva uma frase para fechar.",
      help: "Limite de 200 caracteres e uma régua na mesma tela.",
      maxLength: 200,
      cta: "Ver o resultado da demonstração",
      followUp: {
        type: "scale",
        id: "fecho_nota",
        prompt: "De 1 a 5, o quanto esta tela ficou clara?",
        min: 1,
        max: 5,
        step: 1,
      },
    },
  ],

  result(a) {
    const mostrar = (valor) => (valor === undefined ? "" : JSON.stringify(valor));
    const chaves = ["frente", "frente_peso", "marcas", "peso", "rotina", "triade", "destaque", "ramo", "detalhe", "detalhe_extra", "fecho", "fecho_nota"];
    return {
      id: 1,
      grade: 1,
      tone: "good",
      eyebrow: "Fim da demonstração",
      verdict: "Respostas gravadas, uma por passo.",
      body: [
        "Esta página só existe para conferir os controles. Abaixo está o que cada passo gravou; o que ficou de um ramo abandonado não aparece.",
      ],
      record: chaves.map((chave) => ({ q: chave, value: mostrar(a[chave]) })),
    };
  },
};

runProtocol(PROTOCOL, "protocol-mount");

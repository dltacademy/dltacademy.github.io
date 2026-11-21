// Protocolo de teste do ciclo: passos que não se guardam, um checkpoint, retornos
// por marco e a recuperação por arquivo ou código. Os testes mudam o que precisam
// antes de chamar runProtocol.
const PROTOCOL = {
  id: "protocolo-ciclo-teste",
  slug: "ciclo-teste",
  title: "Protocolo de teste do ciclo",
  path: "/protocolos/teste/",
  progresso: "grupos",
  persist: { versao: 1, diasRetencao: 120, naoGuardar: ["cuidado"], bib: "t-1", rotulo: "um teste guardado" },

  steps: [
    {
      id: "cuidado",
      grupo: "Parte 1",
      type: "multi",
      exclusive: "nenhum",
      prompt: "Algum destes pontos aparece hoje?",
      options: [
        { value: "aperto", label: "Aperto no fim do mês" },
        { value: "nenhum", label: "Nenhum destes" },
      ],
      next: (a) => ((a.cuidado || []).indexOf("aperto") !== -1 ? null : undefined),
    },
    {
      id: "foco",
      grupo: "Parte 1",
      type: "choice",
      prompt: "O que você quer olhar primeiro?",
      options: [
        { value: "a", label: "Foco A" },
        { value: "b", label: "Foco B" },
      ],
    },
    { id: "frase", grupo: "Parte 1", type: "write", prompt: "Escreva uma frase.", maxLength: 80 },
    {
      id: "meio",
      grupo: "Parte 1",
      type: "checkpoint",
      actions: { continuar: "Continuar a parte 2", pausar: "Salvar e continuar depois" },
      render: (a) => ({
        id: 1,
        grade: 1,
        eyebrow: "Fim da parte 1",
        verdict: "Mapa parcial: " + a.foco__label,
        body: ["Você olhou para " + a.foco__label + "."],
      }),
    },
    { id: "regra", grupo: "Parte 2", type: "write", prompt: "Escreva a sua regra.", maxLength: 100 },
    {
      id: "passo",
      grupo: "Parte 2",
      type: "choice",
      prompt: "Qual será o primeiro passo?",
      options: [
        { value: "p1", label: "Passo um" },
        { value: "p2", label: "Passo dois" },
      ],
    },
  ],

  retornos: {
    continuar: { titulo: "Continuar o protocolo" },
    dia3: {
      titulo: "Retorno do dia 3",
      dias: 3,
      codigo: true,
      steps: [
        {
          id: "fez",
          type: "choice",
          prompt: (a) => "Você fez o passo? Sua regra era: " + (a.__estado.respostas.regra || "sem regra") + ".",
          options: [
            { value: "sim", label: "Fiz" },
            { value: "nao", label: "Não fiz" },
          ],
        },
        { id: "nota", type: "scale", min: 0, max: 10, prompt: "De 0 a 10, quanto pesou?" },
      ],
      result: (ctx) => ({
        id: 2,
        grade: 1,
        eyebrow: "Retorno",
        verdict: "Retorno anotado: " + ctx.answers.fez + " (" + ctx.situacao + ")",
        body: ["Em " + ctx.hoje + "."],
        record: [{ q: "nota", value: String(ctx.answers.nota) }],
      }),
    },
    semana: {
      titulo: "Revisão da semana",
      steps: [{ id: "sinal", type: "choice", prompt: "O sinal apareceu?", options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }] }],
      result: (ctx) => ({ id: 3, grade: 1, verdict: "Semana anotada: " + ctx.answers.sinal, body: [] }),
    },
  },

  importar: {
    // O "arquivo" dos testes é JSON puro: { ok, regra, dia0 }.
    md(texto) {
      let o;
      try { o = JSON.parse(texto); } catch (e) { return { erro: "Este arquivo não é do protocolo de teste." }; }
      if (!o || o.ok !== true) return { erro: "Este arquivo não é do protocolo de teste." };
      return {
        estado: {
          etapa: "concluido",
          respostas: { regra: o.regra },
          volta: { n: 1, dia0: o.dia0, registro: { v: 1 }, retornos: {} },
        },
        resumo: "Seu teste de " + o.dia0 + ": regra “" + o.regra + "”.",
      };
    },
    registro(codigo) {
      if (codigo !== "codigoValido123") return { erro: null };
      return { estado: { etapa: "concluido", respostas: { regra: "regra do código" }, volta: { n: 1, dia0: "2026-11-20", registro: { v: 1 }, retornos: {} } } };
    },
  },

  result(a) {
    const cuidado = (a.cuidado || []).indexOf("aperto") !== -1;
    return {
      id: 1,
      grade: cuidado ? 3 : 1,
      verdict: cuidado ? "Primeiro o chão." : "Fim do teste.",
      guardar: !cuidado,
      body: ["Texto do resultado."],
      record: cuidado ? [] : [{ q: "foco", value: a.foco__label }, { q: "regra", value: a.regra }],
      plan: cuidado ? [] : [{ id: "um", title: "Primeiro passo", text: "Faça o passo." }],
    };
  },
};

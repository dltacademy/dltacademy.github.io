// Protocolo de demonstração do ciclo de volta e das saídas. Não tem conteúdo de
// verdade e não vai ao ar.
//
//   cuidado   passo que nunca é guardado (persist.naoGuardar); marcar "aperto" encerra
//   foco      escolha
//   frase     escrita limitada (cole texto com --> e <!-- para ver o .md neutralizar)
//   meio      checkpoint: continuar agora ou salvar e continuar depois; leva .md e .ics
//   regra     escrita limitada
//   passo     escolha
//
// Retornos: #volta=dia3 (3 dias depois do dia 0), #volta=semana (sem data) e
// #volta=continuar (volta ao ponto em que parou). Recuperação: o .md baixado e o
// código do registro.
//
// O link dos lembretes (.ics) aponta para dlt.academy: para testar um marco aqui,
// abra a página à mão com o fragmento, por exemplo ciclo.html#volta=dia3.

const DEMO_URL = "https://dlt.academy/tests/fixtures/protocolo-demo/ciclo.html";

const DEMO_BLOCOS = {
  "demo.respostas": { v: 1, campos: { foco: 40, frase: 160, regra: 160, passo: 40 } },
  "demo.registro": { v: 1 },
  "demo.retornos": { v: 1 },
};

const DEMO_ESQUEMA_REGISTRO = {
  tipo: "objeto",
  campos: {
    v: { tipo: "inteiro", enum: [1] },
    tipo: { tipo: "texto", enum: ["demo"] },
    data: { tipo: "data" },
    foco: { tipo: "texto", enum: ["a", "b", "c"] },
    regra: { tipo: "texto", max: 160 },
  },
};

const demoKit = () => DLTProtocolKit;

function demoRegra(a) {
  const estado = a.__estado || {};
  const registro = (estado.volta && estado.volta.registro) || {};
  return (estado.respostas && estado.respostas.regra) || registro.regra || "";
}

function demoEventos(ciclo, hoje, marcos) {
  const kit = demoKit();
  const eventos = [];
  marcos.forEach((marco) => {
    const dia = { dia3: 3, dia7: 7 }[marco];
    const semanal = marco === "semana";
    eventos.push({
      uid: "demo-" + marco + "-" + ciclo + "@dlt.academy",
      inicio: kit.somarDias(hoje, semanal ? 7 : dia),
      hora: "20:00",
      duracaoMin: semanal ? 10 : 3,
      resumo: semanal ? "Demonstração: revisão da semana" : "Demonstração: retorno do dia " + dia,
      descricao: semanal ? "Dez minutos para rever a semana. Abra o link." : "Três perguntas rápidas. Abra o link.",
      url: DEMO_URL + "#volta=" + marco,
      repetir: semanal ? { semanal: true, vezes: 13 } : undefined,
    });
  });
  return { eventos, prodid: "-//DLT Academy//Demonstracao//PT-BR" };
}

// Os blocos do .md a partir do que se sabe (respostas e volta). O registro e o histórico
// vão por último.
function demoBlocos(r, volta) {
  const kit = demoKit();
  const blocos = [];
  if (r && (r.foco || r.frase || r.regra || r.passo)) {
    blocos.push({
      id: "demo.respostas", v: 1, titulo: "Suas respostas",
      campos: [
        { id: "foco", rotulo: "O foco", valor: r.foco, texto: r.foco__label || "" },
        { id: "frase", rotulo: "A frase", texto: r.frase || "" },
        { id: "regra", rotulo: "A regra", texto: r.regra || "" },
        { id: "passo", rotulo: "O primeiro passo", valor: r.passo, texto: r.passo__label || "" },
      ],
    });
  }
  if (volta && volta.registro) {
    const codificado = kit.codificarRegistro(volta.registro, 2048, { cortar: ["regra"] });
    if (codificado.ok) blocos.push({ id: "demo.registro", v: 1, titulo: "Seu registro", json: codificado.objeto, codigo: codificado.codigo });
  }
  if (volta && volta.retornos && Object.keys(volta.retornos).length) {
    blocos.push({ id: "demo.retornos", v: 1, titulo: "Seus retornos", json: volta.retornos });
  }
  return blocos;
}

const PROTOCOL = {
  id: "protocolo-demonstracao-ciclo",
  slug: "protocolo-demo-ciclo",
  title: "Demonstração do ciclo de volta",
  path: "/tests/fixtures/protocolo-demo/ciclo.html",
  progresso: "grupos",
  disclaimer: "Página de teste da DLT Academy — reflexão estruturada, não é diagnóstico nem recomendação de investimento.",

  persist: { versao: 1, diasRetencao: 120, naoGuardar: ["cuidado"], bib: "demo-1", rotulo: "uma demonstração guardada", migracoes: {} },

  steps: [
    {
      id: "cuidado",
      grupo: "Parte 1",
      type: "multi",
      exclusive: "nenhum",
      eyebrow: "Passo que nunca é guardado",
      prompt: "Algum destes pontos aparece hoje?",
      help: "Esta resposta nunca vai para o armazenamento, nem para o da aba. Marcar o primeiro encerra a demonstração no ramo de cuidado: sem guardar e sem registro.",
      options: [
        { value: "aperto", label: "Um aperto forte neste momento" },
        { value: "nenhum", label: "Nenhum destes" },
      ],
      next: (a) => ((a.cuidado || []).indexOf("aperto") !== -1 ? null : undefined),
    },
    {
      id: "foco",
      grupo: "Parte 1",
      type: "choice",
      prompt: "O que você quer olhar primeiro?",
      help: "Recarregue a página no meio do caminho: a aba lembra onde você parou, sem guardar nada no aparelho.",
      options: [
        { value: "a", label: "Como o dinheiro entra" },
        { value: "b", label: "Para onde o dinheiro vai" },
        { value: "c", label: "O que eu evito olhar" },
      ],
    },
    {
      id: "frase",
      grupo: "Parte 1",
      type: "write",
      prompt: "Escreva uma frase sobre o que você notou.",
      help: "Teste: cole algo como  --> ou <!-- dlt:bloco id=\"demo.registro\" v=\"1\" -->  e depois baixe o .md. O marcador perde a forma e o .md volta a ser lido sem nada forjado.",
      maxLength: 160,
      placeholder: "Escreva com suas palavras…",
    },
    {
      id: "meio",
      grupo: "Parte 1",
      type: "checkpoint",
      actions: { continuar: "Continuar com a parte 2", pausar: "Salvar e continuar depois" },
      render(a, ctx) {
        const kit = demoKit();
        return {
          id: 1,
          grade: 1,
          pill: false,
          eyebrow: "Fim da parte 1",
          verdict: "Parte 1 pronta: " + a.foco__label,
          body: ["Este é um resultado parcial. Daqui você continua agora ou guarda e volta depois."],
          sections: [{
            id: "fio",
            title: "O que você disse até aqui",
            paragraphs: [kit.comporTexto(
              ["Você quis olhar primeiro para “{foco:sp,min}”.", "Sua frase foi “{frase:sp}”."],
              { foco: a.foco__label, frase: a.frase }
            )],
          }],
          ics: demoEventos(ctx.ciclo, ctx.hoje, ["semana"]),
          arquivos: { md: "demo-ciclo-parte1-" + ctx.hoje + ".md", pdf: "demo-ciclo-parte1-" + ctx.hoje + ".pdf", ics: "demo-ciclo-lembrete-semanal.ics" },
          blocks: demoBlocos(a, null),
        };
      },
    },
    {
      id: "regra",
      grupo: "Parte 2",
      type: "write",
      prompt: "Escreva uma regra de trabalho para a próxima semana.",
      maxLength: 160,
    },
    {
      id: "passo",
      grupo: "Parte 2",
      type: "choice",
      prompt: "Qual será o primeiro passo?",
      options: [
        { value: "p1", label: "Olhar o extrato do mês" },
        { value: "p2", label: "Anotar o que entra, sem corrigir" },
        { value: "p3", label: "Conversar com alguém de confiança" },
      ],
    },
  ],

  retornos: {
    continuar: { titulo: "Continuar a demonstração" },
    dia3: {
      titulo: "Retorno do dia 3",
      dias: 3,
      codigo: true,
      steps: [
        {
          id: "fez",
          type: "choice",
          eyebrow: "Retorno do dia 3",
          prompt: (a) => "Você fez o passo? Sua regra era: “" + (demoRegra(a) || "sem regra guardada") + "”.",
          options: [
            { value: "sim", label: "Fiz" },
            { value: "metade", label: "Fiz pela metade" },
            { value: "nao", label: "Não fiz" },
          ],
        },
        {
          id: "crenca",
          type: "scale",
          prompt: "De 0 a 100, quanto você acredita que a regra funciona?",
          min: 0,
          max: 100,
          step: 10,
          format: "%",
          ends: { min: "Nada", max: "Totalmente" },
        },
        { id: "nota", type: "write", prompt: "Algo que valha anotar?", maxLength: 160 },
      ],
      result: (ctx) => {
        const kit = demoKit();
        const volta = JSON.parse(JSON.stringify(ctx.estado.volta || { n: 1, dia0: null, registro: null, retornos: {} }));
        volta.retornos = volta.retornos || {};
        volta.retornos.dia3 = { em: ctx.hoje, r: { fez: ctx.answers.fez, crenca: ctx.answers.crenca } };
        return {
          id: 10,
          grade: 1,
          pill: false,
          eyebrow: "Retorno do dia 3",
          verdict: ctx.answers.fez === "sim" ? "Passo feito. Anotado." : ctx.answers.fez === "metade" ? "Pela metade também conta." : "Não fez: o dado é útil.",
          body: [kit.comporTexto(["Hoje é {hoje} ({situacao}).", "Sua crença na regra: {crenca}%.", "Você anotou: “{nota:sp}”."], {
            hoje: ctx.hoje, situacao: ctx.situacao, crenca: ctx.answers.crenca, nota: ctx.answers.nota,
          })],
          blocks: demoBlocos(ctx.estado.respostas, volta),
          arquivos: { md: "demo-ciclo-atualizado-" + ctx.hoje + ".md" },
        };
      },
    },
    semana: {
      titulo: "Revisão da semana",
      steps: [
        {
          id: "sinal",
          type: "choice",
          prompt: "O sinal apareceu esta semana?",
          options: [
            { value: "sim", label: "Apareceu e eu percebi" },
            { value: "tarde", label: "Apareceu e percebi tarde" },
            { value: "nao", label: "Não apareceu" },
          ],
        },
      ],
      result: (ctx) => ({
        id: 11,
        grade: 1,
        pill: false,
        verdict: "Semana anotada: " + ctx.answers.sinal__label,
        body: ["A revisão semanal só registra a data; nada mais é guardado."],
      }),
    },
  },

  // Recuperação: o .md baixado (blocos marcados) ou o código do registro.
  importar: {
    md(texto) {
      const kit = demoKit();
      const blocos = kit.lerBlocos(texto, DEMO_BLOCOS);
      const registro = blocos["demo.registro"];
      if (!registro || !registro.json || !kit.validarEsquema(registro.json, DEMO_ESQUEMA_REGISTRO).ok) {
        return { erro: "Este arquivo não é da demonstração do ciclo. Escolha o .md que você baixou desta página." };
      }
      const campos = blocos["demo.respostas"] ? blocos["demo.respostas"].campos : {};
      const respostas = {};
      if (campos.foco && campos.foco.valor) respostas.foco = campos.foco.valor;
      if (campos.frase) respostas.frase = campos.frase.texto;
      if (campos.regra) respostas.regra = campos.regra.texto;
      if (campos.passo && campos.passo.valor) respostas.passo = campos.passo.valor;
      const completo = ["foco", "frase", "regra", "passo"].every((k) => respostas[k] !== undefined);
      const retornos = blocos["demo.retornos"] && blocos["demo.retornos"].json ? blocos["demo.retornos"].json : {};
      return {
        estado: {
          etapa: completo ? "concluido" : "ato1",
          caminho: completo ? ["foco", "frase", "meio", "regra", "passo"] : [],
          respostas: completo ? respostas : { regra: registro.json.regra },
          volta: { n: 1, dia0: registro.json.data, registro: registro.json, retornos },
        },
        resumo: "Sua demonstração de " + registro.json.data.split("-").reverse().join("/") + ", com a regra “" + registro.json.regra + "”.",
      };
    },
    registro(codigo) {
      const kit = demoKit();
      const lido = kit.decodificarRegistro(codigo);
      if (!lido.ok || !kit.validarEsquema(lido.objeto, DEMO_ESQUEMA_REGISTRO).ok) return { erro: "Este código não é de um registro da demonstração." };
      return {
        estado: {
          etapa: "ato1",
          respostas: { regra: lido.objeto.regra },
          volta: { n: 1, dia0: lido.objeto.data, registro: lido.objeto, retornos: {} },
        },
        resumo: "Registro de " + lido.objeto.data.split("-").reverse().join("/") + ", com a regra “" + lido.objeto.regra + "”.",
      };
    },
  },

  result(a, ctx) {
    const kit = demoKit();
    const cuidado = (a.cuidado || []).indexOf("aperto") !== -1;
    if (cuidado) {
      return {
        id: 2,
        grade: 3,
        pill: false,
        eyebrow: "Primeiro o chão",
        verdict: "Antes de qualquer plano, cuide do que aperta agora.",
        body: ["Este é o ramo de cuidado da demonstração: nada foi guardado, não há registro e não há botão de guardar."],
      };
    }
    const datas = kit.datasDoCiclo(ctx.hoje, [3, 7, 30, 90]);
    const registro = kit.codificarRegistro({ v: 1, tipo: "demo", data: ctx.hoje, foco: a.foco, regra: a.regra }, 2048, { cortar: ["regra"] });
    return {
      id: 1,
      grade: 1,
      pill: false,
      eyebrow: "Seu resultado",
      verdict: "Regra de trabalho: " + kit.semPontoFinal(a.regra),
      guardar: true,
      body: ["Este resultado tem seções, PDF, .md em blocos, registro em código e lembretes."],
      sections: [
        {
          id: "fio",
          title: "O fio",
          kind: "fio",
          paragraphs: [kit.comporTexto(
            ["Você começou olhando para “{foco:sp,min}”.", "Notou: “{frase:sp}”.", "Decidiu que “{regra:sp}” e que o primeiro passo é “{passo:sp,min}”."],
            { foco: a.foco__label, frase: a.frase, regra: a.regra, passo: a.passo__label }
          )],
        },
        {
          id: "plano",
          title: "Plano",
          kind: "plano",
          items: [
            { title: "Dia 3 · " + datas.d3.split("-").reverse().slice(0, 2).join("/"), text: "Retorno curto: fez o passo? Abra o link do lembrete." },
            { title: "Dia 7 · " + datas.d7.split("-").reverse().slice(0, 2).join("/"), text: "Revisão: a regra funcionou?" },
            { title: "Dia 30 · " + datas.d30.split("-").reverse().slice(0, 2).join("/"), text: "Olhe de novo o que mudou." },
          ],
        },
      ],
      record: [
        { q: "O foco", value: a.foco__label },
        { q: "A frase", value: a.frase },
        { q: "A regra", value: a.regra },
        { q: "O primeiro passo", value: a.passo__label },
      ],
      plan: [{ id: "passo", title: "O primeiro passo", text: a.passo__label }],
      blocks: demoBlocos(a, { registro: registro.objeto, retornos: {} }),
      registro: registro.ok
        ? { titulo: "Seu registro", resumo: [{ q: "A regra", value: a.regra }], objeto: registro.objeto, codigo: registro.codigo }
        : undefined,
      ics: demoEventos(ctx.ciclo, ctx.hoje, ["dia3", "dia7", "semana"]),
      arquivos: { md: "demo-ciclo-" + ctx.hoje + ".md", pdf: "demo-ciclo-" + ctx.hoje + ".pdf", ics: "demo-ciclo-lembretes.ics" },
    };
  },
};

runProtocol(PROTOCOL, "protocol-mount");

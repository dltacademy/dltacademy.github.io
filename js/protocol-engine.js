// ============================================================
// Motor de protocolos — fluxo de reflexão com ramificação.
//
// Um protocolo é a forma pública dos exercícios de decisão: uma
// sequência de passos (escolha ou escrita livre) que termina num
// veredito + registro pessoal. É o padrão do tipo `protocolo` do
// registry, distinto do guia linear e da ferramenta de cálculo.
//
// Princípios inegociáveis desta peça:
//  - Tudo roda no navegador. Nenhuma resposta é enviada a lugar
//    nenhum. O registro é gerado localmente.
//  - Não é terapia. É reflexão estruturada. A copy do protocolo
//    carrega o aviso e a rampa de saída para ajuda profissional.
//  - DOM seguro: só textContent / createElement, zero innerHTML.
//
// Um protocolo define um objeto PROTOCOL (ver /protocolos/<slug>/)
// e chama runProtocol(PROTOCOL, mountId).
// ============================================================

const protocolPdfBrand = {
  asset: null,
  error: null,
  promise: null,
};

function runProtocol(protocol, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const state = { answers: {}, path: [] };
  prepareProtocolPdfBrand();

  // Tipos novos de passo, showIf, followUp e afins usam o kit (js/protocol-kit.js).
  // Protocolo que não declara nada disso roda exatamente como antes e nem precisa
  // do arquivo na página.
  const usesKit = protocolNeedsKit(protocol);
  const kit = typeof DLTProtocolKit !== "undefined" ? DLTProtocolKit : null;
  if (usesKit && !kit) {
    console.error("Este protocolo usa recursos que pedem /js/protocol-kit.js antes do motor.");
    return;
  }

  // ---- helpers de DOM seguro ----
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // Um prompt/help pode ser função das respostas anteriores — é o que
  // permite a defusão ativa: devolver o pensamento que a pessoa escreveu,
  // reformulado, em vez de descrever o movimento em abstrato.
  const resolve = (v) => (typeof v === "function" ? v(state.answers) : v);

  // Único dado que o motor grava: quais itens do plano foram marcados.
  // A chave de cada item é "r<id do desfecho>:<id do item>", sem texto do
  // veredito nem tom. Chaves em outro formato (versões antigas guardavam o
  // veredito) são descartadas na leitura e apagadas do armazenamento.
  const planStorageKey = "dlt-protocol-plan:" + protocol.id;
  const planItemKeyPattern = /^r[0-9]+:[A-Za-z0-9_-]+$/;
  function readPlanState() {
    let saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(planStorageKey) || "{}") || {};
    } catch (error) {
      return {};
    }
    const clean = {};
    let dropped = false;
    Object.keys(saved).forEach((key) => {
      if (planItemKeyPattern.test(key) && saved[key] === true) clean[key] = true;
      else dropped = true;
    });
    if (dropped) {
      if (Object.keys(clean).length) writePlanState(clean);
      else clearPlanState();
    }
    return clean;
  }
  function writePlanState(value) {
    try {
      window.localStorage.setItem(planStorageKey, JSON.stringify(value));
    } catch (error) {
      // A private window or a blocked storage context still leaves the plan usable in memory.
    }
  }
  // Apaga tudo o que este protocolo gravou neste navegador.
  function clearPlanState() {
    try {
      window.localStorage.removeItem(planStorageKey);
    } catch (error) {
      // Sem acesso ao armazenamento não há nada gravado para apagar.
    }
  }

  // ---- fluxos: o principal e os retornos ----------------------------------------
  // Um retorno (`protocol.retornos[marco]`) usa as mesmas telas, com os próprios
  // passos e o próprio resultado. `flow` aponta para o que está na tela.
  const mainFlow = {
    id: "principal",
    steps: protocol.steps,
    progresso: protocol.progresso,
    result: (answers) => protocol.result(answers, cycleContext()),
  };
  let flow = mainFlow;
  const persist = protocol.persist || null;
  const retornos = protocol.retornos || null;
  const importar = protocol.importar || null;
  const cycleEnabled = Boolean(persist || retornos);
  const stateKey = "dlt-protocol-state:" + protocol.id;
  const retentionDays = persist && Number.isInteger(persist.diasRetencao) && persist.diasRetencao > 0 ? persist.diasRetencao : 120;
  const stateSchema = cycleEnabled
    ? { protocolo: protocol.id, versao: (persist && persist.versao) || 1, migracoes: (persist && persist.migracoes) || {} }
    : null;
  const savedLabel = (persist && persist.rotulo) || "uma sessão guardada";

  // Eventos de uso: nomes fixos, que o protocolo declara (`protocol.eventos`), nunca montados de
  // resposta. Com `ativo` diferente de verdadeiro, ou sem `enviar`, nada é emitido: a camada existe e
  // fica desligada até a contagem ser decidida.
  const eventConfig = protocol.eventos || null;
  const emittedOnce = {};
  function emit(key, arg) {
    if (!eventConfig || eventConfig.ativo !== true || typeof eventConfig.enviar !== "function" || !kit) return;
    let name = eventConfig.nomes ? eventConfig.nomes[key] : null;
    if (typeof name === "function") name = name(arg);
    const allowed = kit.nomeDeEvento(name, eventConfig.permitidos);
    if (!allowed) return;
    try {
      eventConfig.enviar(allowed);
    } catch (error) {
      // Contar nunca atrapalha a pessoa.
    }
  }
  function emitOnce(key, arg) {
    const id = key + ":" + String(arg || "");
    if (emittedOnce[id]) return;
    emittedOnce[id] = true;
    emit(key, arg);
  }
  const MAX_IMPORT_BYTES = 256 * 1024;

  // De onde veio o estado em uso: "novo", "sessao", "local" (o que ela guardou),
  // "arquivo" ou "codigo" (trazidos por ela). `base` é o estado lido, para gravar
  // um retorno de volta sem perder o resto.
  const freshMeta = () => ({ ciclo: null, criado: null, volta: null, historico: [], lembrete: null, hora: null, origem: "novo", base: null, patch: null });
  let meta = freshMeta();

  const shortDate = (iso) => (typeof iso === "string" && iso.length >= 10 ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "");
  const todayISO = () => kit.dataISO(new Date());

  // O que o resultado (e o checkpoint) recebe além das respostas: o ciclo, o dia de hoje e o
  // que já está guardado da volta. O ciclo nasce aqui, na primeira vez em que alguém pede.
  function cycleContext() {
    if (!cycleEnabled) return undefined;
    if (!meta.ciclo) meta.ciclo = kit.gerarCiclo(randomBytes());
    return { ciclo: meta.ciclo, hoje: todayISO(), volta: meta.volta, historico: meta.historico, lembrete: meta.lembrete, origem: meta.origem };
  }

  // Armazenamento: qualquer acesso pode falhar (janela privada, bloqueio, cota).
  // Sem ele o protocolo segue em memória.
  function readArea(area, key) {
    try {
      return window[area].getItem(key);
    } catch (error) {
      return null;
    }
  }
  function writeArea(area, key, text) {
    try {
      window[area].setItem(key, text);
      return true;
    } catch (error) {
      return false;
    }
  }
  function removeArea(area, key) {
    try {
      window[area].removeItem(key);
    } catch (error) {
      // Sem acesso ao armazenamento não há nada gravado para apagar.
    }
  }

  // Tudo o que este protocolo gravou: o estado (local e da aba) e o plano.
  function clearStoredState() {
    removeArea("localStorage", stateKey);
    removeArea("sessionStorage", stateKey);
    clearPlanState();
  }

  function randomBytes() {
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        const bytes = new Uint8Array(8);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes);
      }
    } catch (error) {
      // Cai no sorteio simples: o ciclo só distingue um ciclo do outro.
    }
    const bytes = [];
    for (let i = 0; i < 8; i += 1) bytes.push(Math.floor(Math.random() * 256));
    return bytes;
  }

  // As respostas do fluxo em andamento, sem o contexto que os retornos recebem.
  function cleanAnswers() {
    const out = {};
    Object.keys(state.answers).forEach((key) => {
      if (key !== "__estado") out[key] = state.answers[key];
    });
    return out;
  }

  // Valores que o protocolo guarda no lugar de uma resposta que nunca se guarda: só verdadeiro
  // ou falso, calculados das respostas na hora de gravar (`persist.derivar`) e restaurados como estavam.
  const derivedKeys = () => (persist && Array.isArray(persist.derivados) ? persist.derivados : []);
  function deriveValues(answers) {
    if (!derivedKeys().length || typeof persist.derivar !== "function") return {};
    let out = {};
    try {
      out = persist.derivar(answers) || {};
    } catch (error) {
      out = {};
    }
    const safe = {};
    derivedKeys().forEach((key) => { if (out[key] === true) safe[key] = true; });
    return safe;
  }

  const stageFor = () => (state.path.some((i) => protocol.steps[i].type === "checkpoint") ? "ato2" : "ato1");

  // O estado do fluxo principal, como vai para o armazenamento. `stepIndex` é o
  // passo que a pessoa vai ver (null: já terminou).
  function buildState(stepIndex, etapa) {
    const now = new Date();
    const hoje = kit.dataISO(now);
    if (!meta.ciclo) meta.ciclo = kit.gerarCiclo(randomBytes());
    if (!meta.criado) meta.criado = hoje;
    const answers = kit.limparForaDoCaminho(protocol.steps, state.path, cleanAnswers());
    const derived = deriveValues(answers);
    derivedKeys().forEach((key) => { delete answers[key]; });
    Object.assign(answers, derived);
    const estado = {
      esquema: kit.ESQUEMA_ESTADO,
      v: stateSchema.versao,
      protocolo: protocol.id,
      bib: (persist && persist.bib) || null,
      ciclo: meta.ciclo,
      criado: meta.criado,
      atualizado: now.toISOString(),
      expira: kit.somarDias(hoje, retentionDays),
      fluxo: "principal",
      etapa,
      passo: stepIndex !== null && stepIndex < protocol.steps.length ? protocol.steps[stepIndex].id : null,
      caminho: state.path.map((i) => protocol.steps[i].id),
      respostas: answers,
      volta: meta.volta,
      historico: meta.historico,
      lembrete: meta.lembrete,
    };
    return kit.prepararParaGuardar(estado, persist.naoGuardar, protocol.steps);
  }

  const stateText = (estado) => {
    const text = JSON.stringify(estado);
    return kit.bytesUtf8(text) > kit.LIMITE_ESTADO ? null : text;
  };

  // "ok", "grande" (passa de 100 KB) ou "erro" (o navegador não deixou gravar).
  function saveLocal(entrada) {
    // A hora dos lembretes que ela escolheu só entra no que fica guardado por este gesto.
    let estado = entrada;
    if (meta.hora) {
      meta.lembrete = meta.hora;
      estado = Object.assign({}, entrada, { lembrete: meta.hora });
    }
    const text = stateText(estado);
    if (text === null) return "grande";
    if (!writeArea("localStorage", stateKey, text)) return "erro";
    requestPersistentStorage();
    return "ok";
  }

  // Pede ao navegador que não apague o que ela guardou (o Safari limpa o que um script
  // escreve depois de 7 dias sem uso). É um pedido: o navegador pode negar, e nada depende da resposta.
  function requestPersistentStorage() {
    try {
      if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.persist === "function") {
        const asked = navigator.storage.persist();
        if (asked && typeof asked.catch === "function") asked.catch(() => {});
      }
    } catch (error) {
      // Sem a API, o arquivo (.md) continua sendo a reserva.
    }
  }

  // Durante o protocolo as respostas ficam só na aba (sessionStorage): sobrevivem a
  // recarregar a página e somem ao fechar a aba. Nada vai para o localStorage sem
  // uma ação da pessoa.
  function syncSession(index) {
    if (!persist || flow !== mainFlow) return;
    if (!state.path.length) {
      removeArea("sessionStorage", stateKey);
      return;
    }
    const text = stateText(buildState(index, stageFor()));
    if (text === null) removeArea("sessionStorage", stateKey);
    else writeArea("sessionStorage", stateKey, text);
  }

  function readStored(area) {
    const text = readArea(area, stateKey);
    if (text === null) return null;
    const read = kit.lerEstado(text, stateSchema, todayISO());
    if (read.erro) {
      removeArea(area, stateKey);
      return { erro: read.erro };
    }
    return { estado: read.estado };
  }

  // Abrir a página com o que ela guardou conta como uso: o prazo volta a valer a partir de hoje
  // (retenção "desde o último uso"). Não mostra nem muda nenhuma resposta.
  function renewLocalState(estado) {
    const novo = kit.somarDias(todayISO(), retentionDays);
    if (estado.expira >= novo) return estado;
    const renovado = Object.assign({}, estado, { expira: novo });
    if (stateText(renovado) !== null) writeArea("localStorage", stateKey, JSON.stringify(renovado));
    return renovado;
  }

  // Dá ao estado lido (do arquivo, do código) os campos que ele não traz e o passa pela mesma leitura estrita.
  function normalizeImported(base) {
    const now = new Date();
    const hoje = kit.dataISO(now);
    const complete = Object.assign({
      esquema: kit.ESQUEMA_ESTADO,
      v: stateSchema.versao,
      protocolo: protocol.id,
      bib: (persist && persist.bib) || null,
      ciclo: kit.gerarCiclo(randomBytes()),
      criado: hoje,
      atualizado: now.toISOString(),
      expira: kit.somarDias(hoje, retentionDays),
      fluxo: "principal",
      etapa: "concluido",
      passo: null,
      caminho: [],
      respostas: {},
      volta: null,
      historico: [],
      lembrete: null,
    }, base);
    return kit.lerEstadoObjeto(complete, stateSchema, hoje);
  }

  function adoptState(estado, origem) {
    meta = {
      ciclo: estado.ciclo,
      criado: estado.criado,
      volta: estado.volta,
      historico: estado.historico,
      lembrete: estado.lembrete,
      hora: null,
      origem,
      base: estado,
      patch: null,
    };
  }

  // Volta ao fluxo principal no ponto em que a pessoa parou.
  function resumeFrom(estado, origem) {
    flow = mainFlow;
    let restored = null;
    try {
      restored = kit.restaurarProgresso(protocol.steps, estado, persist ? persist.naoGuardar : [], derivedKeys());
    } catch (error) {
      restored = null;
    }
    adoptState(estado, origem);
    if (!restored) {
      state.answers = {};
      state.path = [];
      render(startIndex(), true);
      return;
    }
    state.answers = restored.respostas;
    state.path = restored.caminho;
    render(restored.indice, true);
  }

  // ---- telas do ciclo: guardado, retorno, recuperação -----------------------------
  function showScreen(config) {
    mount.replaceChildren();
    const card = el("div", "protocol-card flow-card protocol-cycle");
    if (config.eyebrow) card.appendChild(el("p", "protocol-eyebrow section-eyebrow", config.eyebrow));
    const title = el("h2", "protocol-q", config.title);
    title.id = "protocol-question";
    title.tabIndex = -1;
    card.appendChild(title);
    (config.paragraphs || []).forEach((text) => card.appendChild(el("p", "protocol-help", text)));
    if (config.extra) config.extra(card);
    if (config.actions && config.actions.length) {
      const row = el("div", "protocol-nav protocol-cycle-actions");
      config.actions.forEach((action) => {
        const button = el("button", "btn " + (action.primary ? "btn-primary" : "btn-secondary"), action.label);
        button.type = "button";
        button.addEventListener("click", action.onClick);
        row.appendChild(button);
      });
      card.appendChild(row);
    }
    mount.appendChild(card);
    title.focus({ preventScroll: true });
    return card;
  }

  function statusLine(card) {
    const status = el("p", "protocol-cycle-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    card.appendChild(status);
    return status;
  }

  function startFresh() {
    flow = mainFlow;
    meta = freshMeta();
    state.answers = {};
    state.path = [];
    render(startIndex(), true);
  }

  // Apagar tudo e dizer, em texto na página, que apagou. Sem diálogo.
  function eraseAndTell() {
    clearStoredState();
    meta = freshMeta();
    showScreen({
      title: "Apagado",
      paragraphs: ["O que estava guardado neste navegador foi apagado. Nada ficou guardado."],
      actions: [{ label: "Começar do início", primary: true, onClick: startFresh }],
    });
  }

  function savedPromptActions(estado, origem) {
    const actions = [];
    const concluded = estado.etapa === "concluido";
    // Um registro trazido sem respostas (só o código) não tem resultado para ver: só os retornos.
    const hasAnswers = Boolean(estado.respostas) && Object.keys(estado.respostas).length > 0;
    if (hasAnswers || !concluded) {
      actions.push({
        label: concluded ? "Ver o meu resultado" : "Continuar de onde parei",
        primary: true,
        onClick: () => resumeFrom(estado, origem),
      });
    }
    if (concluded && retornos) {
      Object.keys(retornos).forEach((marco) => {
        if (Array.isArray(retornos[marco].steps)) {
          actions.push({ label: "Fazer: " + (retornos[marco].titulo || marco), onClick: () => showReturnIntro(marco, estado, origem) });
        }
      });
    }
    actions.push({ label: "Começar de novo", onClick: startFresh });
    if (origem === "local") actions.push({ label: "Apagar o que está guardado", onClick: eraseAndTell });
    if (!actions.some((action) => action.primary)) actions[0].primary = true;
    return actions;
  }

  // Antes de mostrar qualquer resposta: o que está guardado, e o que fazer com isso.
  function showSaved(estado, origem) {
    showScreen({
      title: "Você tem " + savedLabel + " de " + shortDate(estado.criado),
      paragraphs: [
        origem === "local"
          ? "Isto foi guardado só neste navegador, por escolha sua, e vale até " + shortDate(estado.expira) + ". Nenhuma resposta foi enviada a lugar nenhum."
          : "Isto veio do que você trouxe agora. Nada foi enviado a lugar nenhum.",
        "Nenhuma resposta aparece antes de você escolher.",
      ],
      actions: savedPromptActions(estado, origem),
    });
  }

  function returnIntroText(sit, ret) {
    if (sit.situacao === "feito") return "Você fez este retorno em " + shortDate(sit.feitoEm) + ". Pode ver o que respondeu ou refazer.";
    if (sit.situacao === "cedo") return "Este retorno está previsto para " + shortDate(sit.data) + ". Se quiser, pode adiantar.";
    if (sit.situacao === "atrasado") return "Este retorno estava previsto para " + shortDate(sit.data) + ". Pode fazer agora; passar do dia não atrapalha.";
    return sit.data ? "Este retorno é para hoje (" + shortDate(sit.data) + ")." : "Pode começar quando quiser.";
  }

  function showReturnIntro(marco, estado, origem) {
    const ret = retornos[marco];
    if (!ret || !Array.isArray(ret.steps)) {
      // Marco sem passos próprios (o de continuar): volta ao fluxo principal.
      resumeFrom(estado, origem);
      return;
    }
    let sit = kit.situacaoDoMarco(estado.volta, marco, ret.dias, todayISO());
    // Retorno que se repete (a revisão da semana) nunca está "feito": mostra só quando foi a última.
    const lastDone = sit.feitoEm;
    if (ret.recorrente === true && sit.situacao === "feito") sit = { situacao: "no_dia", data: null, feitoEm: lastDone };
    const start = () => startReturn(marco, estado, origem, sit);
    const done = sit.situacao === "feito";
    const intro = [returnIntroText(sit, ret)];
    if (ret.recorrente === true && lastDone) intro.push("A última foi em " + shortDate(lastDone) + ".");
    if (typeof ret.intro === "function") {
      let extra = [];
      try {
        extra = ret.intro(returnContext(estado, marco));
      } catch (error) {
        extra = [];
      }
      (Array.isArray(extra) ? extra : []).forEach((text) => { if (typeof text === "string" && text) intro.push(text); });
    }
    showScreen({
      eyebrow: ret.titulo ? "Retorno" : undefined,
      title: ret.titulo || "Retorno",
      paragraphs: intro,
      extra: done ? (card) => {
        const feito = estado.volta.retornos[marco];
        const list = el("div", "protocol-record");
        kit.resumoDasRespostas(ret.steps, Object.assign({ __estado: returnContext(estado, marco) }, feito.r)).forEach((linha) => {
          const item = el("div", "protocol-record-item");
          item.appendChild(el("span", "protocol-record-q", linha.q));
          item.appendChild(el("span", "protocol-record-a", linha.value));
          list.appendChild(item);
        });
        card.appendChild(list);
      } : undefined,
      actions: [
        { label: done ? "Refazer este retorno" : sit.situacao === "cedo" ? "Adiantar agora" : "Começar", primary: true, onClick: start },
        { label: "Voltar ao início", onClick: () => showSaved(estado, origem) },
      ],
    });
  }

  // O que um retorno enxerga do ciclo guardado (em `answers.__estado` e em `ctx.estado`).
  function returnContext(estado, marco) {
    return JSON.parse(JSON.stringify({
      respostas: estado.respostas,
      volta: estado.volta,
      historico: estado.historico,
      criado: estado.criado,
      ciclo: estado.ciclo,
      marco,
    }));
  }

  function startReturn(marco, estado, origem, sit) {
    const ret = retornos[marco];
    adoptState(estado, origem);
    const context = returnContext(estado, marco);
    const seed = () => ({ __estado: JSON.parse(JSON.stringify(context)) });
    flow = {
      id: "retorno:" + marco,
      marco,
      steps: ret.steps,
      progresso: ret.progresso,
      seed,
      result: () => ret.result({ answers: cleanAnswers(), estado: context, hoje: todayISO(), marco, situacao: sit.situacao }),
      recordContext: () => ({ answers: cleanAnswers(), estado: JSON.parse(JSON.stringify(context)), hoje: todayISO(), marco, situacao: sit.situacao }),
    };
    state.answers = seed();
    state.path = [];
    render(startIndex(), true);
  }

  // As respostas do retorno que podem ir para o ciclo guardado: sem as dos passos que nunca se guardam.
  function storableReturnAnswers() {
    const never = persist && Array.isArray(persist.naoGuardar) ? persist.naoGuardar : [];
    const keep = flow.steps.filter((step) => never.indexOf(step.id) === -1).map((step) => step.id);
    return kit.limparForaDoCaminho(flow.steps, keep, cleanAnswers());
  }

  // O retorno terminado entra no ciclo guardado. Se ela guardou no aparelho, grava;
  // se trouxe de fora, só grava quando ela escolher guardar. O retorno que declara
  // `gravar(ctx)` decide sozinho o que muda (uma volta nova, por exemplo): devolve
  // { volta, historico, respostas?, caminho? } ou null para não mudar nada.
  function recordReturn() {
    const ret = retornos[flow.marco] || {};
    if (typeof ret.gravar === "function") {
      let out = null;
      try {
        out = ret.gravar(flow.recordContext());
      } catch (error) {
        out = null;
      }
      if (!out || typeof out !== "object") return false;
      if (out.volta) meta.volta = out.volta;
      if (Array.isArray(out.historico)) meta.historico = out.historico;
      meta.patch = out.respostas ? { respostas: out.respostas, caminho: Array.isArray(out.caminho) ? out.caminho : [] } : null;
      return true;
    }
    const volta = meta.volta
      ? JSON.parse(JSON.stringify(meta.volta))
      : { n: 1, dia0: null, registro: null, retornos: {} };
    volta.retornos = volta.retornos || {};
    volta.retornos[flow.marco] = { em: todayISO(), r: storableReturnAnswers() };
    meta.volta = volta;
    return true;
  }

  function stateWithReturn() {
    const now = new Date();
    const hoje = kit.dataISO(now);
    const base = meta.base ? JSON.parse(JSON.stringify(meta.base)) : null;
    if (!base) return null;
    base.volta = meta.volta;
    base.historico = meta.historico;
    if (meta.patch) {
      base.respostas = JSON.parse(JSON.stringify(meta.patch.respostas));
      base.caminho = meta.patch.caminho.slice();
      base.etapa = "concluido";
      base.passo = null;
    }
    base.atualizado = now.toISOString();
    base.expira = kit.somarDias(hoje, retentionDays);
    return base;
  }

  // Dados de um registro trazido de fora: arquivo (md) ou código.
  function importState(kind, text) {
    let found = null;
    try {
      found = kind === "md" ? importar.md(text) : importar.registro(text);
    } catch (error) {
      found = null;
    }
    // Qualquer resposta com a chave `erro` é um erro; só vale como mensagem se for texto.
    if (!found || typeof found !== "object" || "erro" in found) return { erro: typeof (found && found.erro) === "string" ? found.erro : null };
    const read = normalizeImported(found.estado || found);
    if (!read.estado) return { erro: null };
    return { estado: read.estado, resumo: typeof found.resumo === "string" ? found.resumo : "" };
  }

  function readFileText(file) {
    if (typeof file.text === "function") return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  const RECOVERY_REASONS = {
    sem_estado: "Não encontramos neste navegador o que você guardou. Isso acontece quando o link é aberto em outro aparelho ou navegador, dentro de um aplicativo, quando os dados do site foram apagados ou quando o prazo passou.",
    ilegivel: "Não conseguimos ler o que estava guardado neste navegador. Você pode trazer o seu arquivo ou o código do registro.",
    expirado: "O que estava guardado neste navegador passou do prazo e foi apagado. Você pode trazer o seu arquivo ou o código do registro.",
    codigo: "Não foi possível ler o código do link. Você pode trazer o seu arquivo ou colar o código do registro.",
  };

  // Estado que sumiu do navegador: três caminhos, todos por ação dela.
  function showRecovery(config) {
    const ret = config.marco && retornos ? retornos[config.marco] : null;
    const canFile = Boolean(importar && typeof importar.md === "function");
    // O código do registro só restaura o que um retorno usa (o registro não leva as respostas): para
    // retomar o protocolo de onde parou, o caminho é o arquivo.
    const canCode = Boolean(importar && typeof importar.registro === "function") && (!ret || ret.codigo === true);
    const afterImport = (estado, origem, resumo) => {
      showScreen({
        title: "Encontramos o que você trouxe, de " + shortDate(estado.criado),
        paragraphs: [resumo || "Quer continuar a partir daqui?"],
        actions: [
          {
            label: "Continuar",
            primary: true,
            onClick: () => {
              if (config.marco) showReturnIntro(config.marco, estado, origem);
              else if (config.codigo) showCodeChoices(estado, origem);
              else showSaved(estado, origem);
            },
          },
          { label: "Não é este", onClick: () => showRecovery(config) },
        ],
      });
    };
    showScreen({
      eyebrow: ret && ret.titulo ? "Retorno" : undefined,
      title: ret && ret.titulo ? ret.titulo : "Recuperar o que você guardou",
      paragraphs: [RECOVERY_REASONS[config.motivo] || RECOVERY_REASONS.sem_estado],
      extra: (card) => {
        const status = statusLine(card);
        const fail = (text) => { status.textContent = text; };
        if (canFile) {
          const label = el("label", "btn btn-secondary protocol-file");
          label.appendChild(el("span", null, "Carregar o meu arquivo (.md)"));
          const input = el("input", "protocol-file-input");
          input.type = "file";
          input.setAttribute("accept", ".md,text/markdown,text/plain");
          input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (!file) return;
            if (file.size > MAX_IMPORT_BYTES) {
              fail("Este arquivo passa de 256 KB. Escolha o arquivo que você baixou deste protocolo.");
              return;
            }
            readFileText(file).then((text) => {
              const read = importState("md", text);
              if (read.estado) {
                emit("recuperacao_md");
                afterImport(read.estado, "arquivo", read.resumo);
              }
              else fail(read.erro || "Não conseguimos ler este arquivo. Escolha o arquivo (.md) que você baixou deste protocolo.");
            }, () => fail("Não conseguimos abrir este arquivo."));
          });
          label.appendChild(input);
          card.appendChild(label);
        }
        if (canCode) {
          const box = el("div", "protocol-recovery-code");
          const field = el("textarea", "protocol-write");
          field.rows = 3;
          field.placeholder = "Cole aqui o código do registro";
          field.setAttribute("aria-label", "Código do registro");
          const use = el("button", "btn btn-secondary", "Usar este código");
          use.type = "button";
          use.addEventListener("click", () => {
            const read = importState("registro", field.value.trim());
            if (read.estado) afterImport(read.estado, "codigo", read.resumo);
            else fail(read.erro || "Este código não é válido. Confira se ele está completo.");
          });
          box.appendChild(field);
          box.appendChild(use);
          card.appendChild(box);
        }
      },
      actions: [{ label: "Fazer o protocolo do começo", primary: !canFile && !canCode, onClick: startFresh }],
    });
  }

  // Depois de um `#c=`: o que ela quer fazer com o registro que veio no link.
  function showCodeChoices(estado, origem) {
    const actions = [];
    Object.keys(retornos || {}).forEach((marco) => {
      const ret = retornos[marco];
      if (ret.codigo === true && Array.isArray(ret.steps)) {
        actions.push({ label: ret.titulo || marco, primary: actions.length === 0, onClick: () => showReturnIntro(marco, estado, origem) });
      }
    });
    if (!actions.length) {
      showSaved(estado, origem);
      return;
    }
    actions.push({ label: "Começar de novo", onClick: startFresh });
    showScreen({ title: "O que você quer fazer agora?", paragraphs: ["Isto usa só o registro que veio no link."], actions });
  }

  function cleanHash() {
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (error) {
      // Sem history o endereço fica como está.
    }
  }

  function readHash() {
    try {
      return String(window.location.hash || "");
    } catch (error) {
      return "";
    }
  }

  const reasonOf = (erro) => (erro === "expirado" ? "expirado" : "ilegivel");

  // Primeira tela dos protocolos com ciclo: o endereço (#volta=, #c=), o que ficou
  // guardado e o que sobrou da aba decidem por onde começar.
  function boot() {
    const hash = readHash();
    const found = kit.lerMarco(hash, retornos ? Object.keys(retornos) : []);
    // Só o que é nosso é limpo da barra: marco que não existe, código ou o #c= recusado.
    if (/^#?(?:volta|c)=/.test(hash) && !(found && found.marco)) cleanHash();
    const local = readStored("localStorage");
    if (local && local.estado) local.estado = renewLocalState(local.estado);

    if (found && found.marco) {
      if (local && local.estado) showReturnIntro(found.marco, local.estado, "local");
      else showRecovery({ marco: found.marco, motivo: local && local.erro ? reasonOf(local.erro) : "sem_estado" });
      return;
    }
    if (found && found.codigo && importar && typeof importar.registro === "function") {
      const read = importState("registro", found.codigo);
      if (read.estado) {
        showScreen({
          title: "Encontramos o registro que veio no link",
          paragraphs: [read.resumo || "Quer continuar a partir dele?"],
          actions: [
            { label: "Continuar", primary: true, onClick: () => showCodeChoices(read.estado, "codigo") },
            { label: "Começar do início", onClick: startFresh },
          ],
        });
      } else {
        showRecovery({ motivo: "codigo", codigo: true });
      }
      return;
    }

    const session = persist ? readStored("sessionStorage") : null;
    if (session && session.estado) {
      resumeFrom(session.estado, "sessao");
      return;
    }
    if (local && local.estado) showSaved(local.estado, "local");
    else if (local && local.erro) showRecovery({ motivo: reasonOf(local.erro) });
    else render(startIndex());
  }

  function currentStep(index) {
    return flow.steps[index];
  }

  // Um passo pode declarar um `next(answers)` para ramificar; senão segue em ordem.
  function nextIndex(index) {
    if (usesKit) return kit.proximoIndice(flow.steps, index, state.answers);
    const step = currentStep(index);
    if (typeof step.next === "function") {
      const target = step.next(state.answers);
      if (target === null) return flow.steps.length; // fim antecipado
      if (typeof target === "string") {
        const i = flow.steps.findIndex((s) => s.id === target);
        return i === -1 ? index + 1 : i;
      }
    }
    return index + 1;
  }

  // O primeiro passo a mostrar: o primeiro visível, quando há showIf.
  function startIndex() {
    return usesKit ? kit.proximoIndice(flow.steps, -1, state.answers) : 0;
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // `moveFocus`: depois de uma ação da pessoa, o foco vai para a pergunta nova
  // (o teclado não fica solto na tela que sumiu).
  function render(index, moveFocus) {
    mount.replaceChildren();
    if (index >= flow.steps.length) return renderResult(moveFocus);
    syncSession(index);
    if (flow === mainFlow && state.path.length === 0 && index === startIndex()) emitOnce("inicio");

    const step = currentStep(index);
    if (step.type === "checkpoint") return renderCheckpoint(step, index, moveFocus);
    const card = el("div", "protocol-card flow-card");

    let progress;
    if (usesKit) {
      progress = buildKitProgress(el, flow, kit, index, state.answers);
    } else {
      progress = el("div", "protocol-progress");
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-valuemin", "1");
      progress.setAttribute("aria-valuemax", String(flow.steps.length));
      progress.setAttribute("aria-valuenow", String(Math.min(index + 1, flow.steps.length)));
      const progressLabel = el("span", "protocol-progress-label", "Passo " + Math.min(index + 1, flow.steps.length) + " de " + flow.steps.length);
      progress.appendChild(progressLabel);
      const progressDots = el("span", "protocol-progress-dots");
      flow.steps.forEach((_, dotIndex) => {
        const dot = el("span", "protocol-progress-dot" + (dotIndex < index ? " is-done" : dotIndex === index ? " is-current" : ""));
        dot.setAttribute("aria-hidden", "true");
        progressDots.appendChild(dot);
      });
      progress.appendChild(progressDots);
    }
    card.appendChild(progress);

    if (step.eyebrow) card.appendChild(el("p", "protocol-eyebrow section-eyebrow", step.eyebrow));
    const question = el("h2", "protocol-q", resolve(step.prompt));
    question.id = "protocol-question";
    question.tabIndex = -1;
    card.appendChild(question);
    const help = resolve(step.help);
    if (help) card.appendChild(el("p", "protocol-help", help));

    if (usesKit && stepUsesControls(step)) {
      renderKitStep(step, index, card);
    } else if (step.type === "choice") {
      // Cada opção é uma linha de escolha (.choice-row) com estado marcado.
      // Clicar marca a linha e segue para o próximo passo, como antes; ao
      // voltar, a resposta já dada aparece marcada.
      const group = el("div", "protocol-options choice-list");
      group.setAttribute("role", "group");
      group.setAttribute("aria-labelledby", "protocol-question");
      let chosen = false;
      resolve(step.options).forEach((opt) => {
        const b = el("button", "choice-row");
        b.type = "button";
        const dot = el("span", "choice-dot");
        dot.setAttribute("aria-hidden", "true");
        b.appendChild(dot);
        b.appendChild(el("span", "choice-label", opt.label));
        b.setAttribute("aria-pressed", String(state.answers[step.id] === opt.value));
        b.addEventListener("click", () => {
          if (chosen) return;
          chosen = true;
          state.answers[step.id] = opt.value;
          state.answers[step.id + "__label"] = opt.label;
          state.path.push(index);
          group.querySelectorAll(".choice-row").forEach((row) => row.setAttribute("aria-pressed", String(row === b)));
          const advance = () => {
            render(nextIndex(index), true);
            window.scrollTo({ top: mount.offsetTop - 20, behavior: prefersReducedMotion() ? "auto" : "smooth" });
          };
          // Um instante para a marca ser vista; sem espera para quem pede menos movimento.
          if (prefersReducedMotion()) advance();
          else window.setTimeout(advance, 160);
        });
        group.appendChild(b);
      });
      card.appendChild(group);
    } else if (step.type === "write") {
      const numInputs = [];
      if (Array.isArray(step.camposNumericos) && step.camposNumericos.length) {
        const box = el("fieldset", "protocol-num-group");
        box.appendChild(el("legend", "protocol-num-legend", resolve(step.camposNumericosTitulo) || "Opcional: confira quanto cabe em reais"));
        const numHelp = resolve(step.camposNumericosAjuda);
        if (numHelp) box.appendChild(el("p", "protocol-num-help", numHelp));
        const grid = el("div", "protocol-num-grid");
        let preview = null;
        const atualizarPreview = () => {
          if (!preview || typeof step.previewNumerico !== "function") return;
          const valores = {};
          numInputs.forEach((item) => { valores[item.id] = item.input.value.trim(); });
          const resumo = step.previewNumerico(valores, state.answers);
          preview.textContent = resumo ? resumo.texto : "";
          preview.dataset.estado = resumo && resumo.estado ? resumo.estado : "";
          preview.hidden = !resumo || !resumo.texto;
        };
        step.camposNumericos.forEach((campo) => {
          const wrap = el("label", "protocol-num-field");
          wrap.appendChild(el("span", "protocol-num-label", resolve(campo.label)));
          const inp = el("input", "protocol-num-input");
          inp.type = "number";
          inp.setAttribute("inputmode", "decimal");
          inp.setAttribute("min", String(campo.min != null ? campo.min : 0));
          inp.setAttribute("step", String(campo.step || "any"));
          if (campo.placeholder) inp.placeholder = campo.placeholder;
          inp.value = state.answers[campo.id] || "";
          inp.addEventListener("input", atualizarPreview);
          wrap.appendChild(inp);
          grid.appendChild(wrap);
          numInputs.push({ id: campo.id, input: inp });
        });
        box.appendChild(grid);
        if (typeof step.previewNumerico === "function") {
          preview = el("p", "protocol-num-preview");
          preview.setAttribute("aria-live", "polite");
          preview.hidden = true;
          box.appendChild(preview);
          atualizarPreview();
        }
        card.appendChild(box);
      }
      const ta = el("textarea", "protocol-write");
      ta.rows = 4;
      ta.placeholder = step.placeholder || "Escreva com suas palavras…";
      ta.value = state.answers[step.id] || "";
      card.appendChild(ta);
      const row = el("div", "protocol-nav");
      const cont = el("button", "btn btn-primary", step.cta || "Continuar");
      cont.type = "button";
      cont.addEventListener("click", () => {
        numInputs.forEach((item) => {
          const val = item.input.value.trim();
          if (val) state.answers[item.id] = val;
          else delete state.answers[item.id];
        });
        state.answers[step.id] = ta.value.trim();
        state.path.push(index);
        render(nextIndex(index), true);
        window.scrollTo({ top: mount.offsetTop - 20, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      });
      row.appendChild(cont);
      card.appendChild(row);
    }

    // Voltar fica visível em todas as telas. No primeiro passo ele não
    // tem histórico, mas a affordance continua previsível para teclado e mobile.
    card.appendChild(buildBack());

    mount.appendChild(card);
    if (moveFocus) question.focus({ preventScroll: true });
  }

  function buildBack() {
    const back = el("button", "protocol-back", "← Voltar");
    back.type = "button";
    back.setAttribute("aria-disabled", String(!state.path.length));
    back.addEventListener("click", () => {
      if (!state.path.length) return;
      const prev = state.path.pop();
      render(prev, true);
    });
    return back;
  }

  // Checkpoint: um resultado parcial no meio do protocolo, com a escolha de
  // continuar agora ou guardar e continuar depois.
  function renderCheckpoint(step, index, moveFocus) {
    const answers = kit.limparForaDoCaminho(flow.steps, state.path, state.answers);
    const result = step.render(answers, cycleContext());
    const grade = resultGrade(result);
    const toneClass = result.tone === "good" ? "is-good" : result.tone === "bad" ? "is-bad" : "is-mixed";
    const card = el("div", "protocol-card protocol-result protocol-checkpoint " + toneClass);
    card.dataset.grade = String(grade);
    const verdictHeading = appendResultHead(card, result, grade, el);
    emitOnce("ato1_fim");
    if (result.safety) card.appendChild(el("p", "protocol-safety", result.safety));

    const labels = Object.assign({ continuar: "Continuar", pausar: "Salvar e continuar depois" }, step.actions);
    const row = el("div", "protocol-actions protocol-checkpoint-actions");
    const go = el("button", "btn btn-primary", labels.continuar);
    go.type = "button";
    go.addEventListener("click", () => {
      state.path.push(index);
      render(nextIndex(index), true);
      window.scrollTo({ top: mount.offsetTop - 20, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    row.appendChild(go);
    if (persist) {
      const pause = el("button", "btn btn-secondary", labels.pausar);
      pause.type = "button";
      pause.addEventListener("click", () => pauseAt(step, index, result));
      row.appendChild(pause);
    }
    card.appendChild(row);
    if (persist) {
      card.appendChild(el("p", "protocol-privacy privacy-line",
        "Salvar guarda as suas respostas só neste navegador, por até " + retentionDays + " dias, e só se você tocar no botão. Você apaga quando quiser."));
    }
    card.appendChild(buildDelivery(result, card, { partial: true }));
    card.appendChild(buildBack());
    mount.appendChild(card);
    appendCheckpointPaidOffer(mount, result, emit, el);
    if (moveFocus) verdictHeading.focus({ preventScroll: true });
  }

  // "Salvar e continuar depois": guarda o estado no aparelho, por ação dela, e despede.
  function pauseAt(step, index, result) {
    emit("pausa");
    state.path.push(index);
    const next = nextIndex(index);
    const estado = buildState(next, "pausa");
    const saved = saveLocal(estado);
    removeArea("sessionStorage", stateKey);
    if (saved === "ok") meta.origem = "local";
    const goOn = () => render(next, true);
    if (saved === "ok") {
      showScreen({
        title: "Guardado neste aparelho",
        paragraphs: [
          "Suas respostas ficam só neste navegador, até " + shortDate(estado.expira) + ". Para continuar, volte a esta página neste mesmo navegador: ela abre no ponto em que você parou.",
          "Nada foi enviado a lugar nenhum.",
        ],
        extra: (card) => card.appendChild(buildDelivery(result, card, { partial: true, skip: { pdf: true, copy: true } })),
        actions: [
          { label: "Continuar agora", primary: true, onClick: goOn },
          { label: "Apagar o que guardei", onClick: eraseAndTell },
        ],
      });
    } else {
      showScreen({
        title: "Não conseguimos guardar",
        paragraphs: [
          saved === "grande"
            ? "O que você escreveu passou do limite do que este navegador guarda aqui."
            : "Neste navegador não foi possível guardar (isso acontece em janela privada ou com o armazenamento bloqueado).",
          "Você pode continuar agora. Se quiser levar o que já fez para continuar depois, baixe o seu arquivo abaixo.",
        ],
        extra: (card) => card.appendChild(buildDelivery(result, card, { partial: true, skip: { pdf: true, copy: true } })),
        actions: [{ label: "Continuar agora", primary: true, onClick: goOn }],
      });
    }
  }

  // Passo com controle novo (multi, scale, grade, triad), com complemento
  // (followUp) ou com texto pré-preenchido/limitado. Nada aqui avança sozinho:
  // a pessoa marca e toca em "Continuar", que só habilita com a resposta válida.
  function renderKitStep(step, index, card) {
    const ctx = { el, kit, answers: state.answers, resolve, changed: () => refresh() };
    const parts = [buildMainControl(step, ctx)];
    card.appendChild(parts[0].node);
    if (step.followUp) {
      const follow = buildFollowUpControl(step.followUp, ctx);
      parts.push(follow);
      card.appendChild(follow.node);
    }
    const row = el("div", "protocol-nav");
    const cont = el("button", "btn btn-primary", step.cta || "Continuar");
    cont.type = "button";
    const refresh = () => { cont.disabled = !parts.every((part) => part.ready()); };
    cont.addEventListener("click", () => {
      if (!parts.every((part) => part.ready())) return;
      parts.forEach((part) => part.commit(state.answers));
      state.path.push(index);
      render(nextIndex(index), true);
      window.scrollTo({ top: mount.offsetTop - 20, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    row.appendChild(cont);
    card.appendChild(row);
    refresh();
  }

  // O que o resultado muda no armazenamento. Fluxo principal: com `result.guardar` a
  // aba guarda o resultado (sobrevive a recarregar); sem ele, nada fica. Retorno: entra
  // no ciclo e, se o ciclo foi guardado neste aparelho por ela, grava de volta.
  // Devolve uma linha de aviso (ou null).
  function settleStorageAtResult(result) {
    if (!persist) return null;
    if (flow === mainFlow) {
      if (result.guardar === true) {
        const text = stateText(buildState(null, "concluido"));
        if (text !== null) writeArea("sessionStorage", stateKey, text);
      } else {
        removeArea("sessionStorage", stateKey);
      }
      return null;
    }
    if (result.guardar === false) return null;
    if (!recordReturn()) return null;
    if (meta.origem !== "local") return null;
    const estado = stateWithReturn();
    const saved = estado ? saveLocal(estado) : "erro";
    const line = el("p", "protocol-save-status");
    line.setAttribute("role", "status");
    line.textContent = saved === "ok"
      ? "Este retorno ficou guardado neste aparelho."
      : "Neste navegador não conseguimos guardar este retorno. Baixe o seu arquivo para não perder.";
    return line;
  }

  function voltaDoResultado(result) {
    const base = meta.volta || { n: 1, dia0: null, registro: null, retornos: {} };
    const hint = result.volta || {};
    const objeto = result.registro && typeof result.registro.objeto === "object" ? result.registro.objeto : null;
    return {
      n: Number.isInteger(hint.n) ? hint.n : base.n,
      dia0: hint.dia0 || base.dia0 || todayISO(),
      registro: objeto || base.registro,
      retornos: base.retornos || {},
    };
  }

  // Botão "Guardar neste aparelho": só existe quando o protocolo guarda (persist), só
  // grava por ação dela e diz o que fez em texto. Retorno que veio de fora também pode ser guardado.
  function buildSaveControl(result) {
    if (!persist) return null;
    const offer = flow === mainFlow ? result.guardar === true : meta.origem !== "local" && result.guardar !== false;
    if (!offer) return null;
    const button = el("button", "btn btn-secondary protocol-save", "Guardar neste aparelho para os retornos");
    button.type = "button";
    const status = el("p", "protocol-save-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const note = el("p", "protocol-privacy privacy-line",
      "Guardar é opcional: o que você escreveu fica só neste navegador, por até " + retentionDays + " dias, e você apaga quando quiser.");
    button.addEventListener("click", () => {
      let estado = null;
      if (flow === mainFlow) {
        meta.volta = voltaDoResultado(result);
        estado = buildState(null, "concluido");
      } else {
        estado = stateWithReturn();
      }
      const saved = estado ? saveLocal(estado) : "erro";
      if (saved === "ok") {
        meta.origem = "local";
        button.textContent = "Guardado neste aparelho";
        button.disabled = true;
        status.textContent = "Guardado só neste navegador, até " + shortDate(estado.expira) + ". Você pode apagar quando quiser.";
      } else {
        status.textContent = saved === "grande"
          ? "O que você escreveu passou do limite do que este navegador guarda aqui. Baixe o seu arquivo para não perder."
          : "Neste navegador não conseguimos guardar. Baixe o seu arquivo para continuar depois.";
      }
    });
    return { button, status, note };
  }

  // Lembretes (.ics): montados aqui, no aparelho. O arquivo só leva o lembrete e o link do
  // marco; o aviso diz isso, porque o calendário costuma sincronizar com serviços de terceiros.
  // `result.ics.escolhaHora`: { rotulo, opcoes: [{ rotulo, hora: "HH:MM" }] }, opcional. A hora
  // escolhida troca o horário de todos os eventos ao baixar e fica só em `meta.hora`; ela só
  // vai para o estado guardado quando a pessoa guarda (saveLocal). Nunca vai para endereço.
  function buildIcsHourChoice(result) {
    const escolha = result.ics.escolhaHora;
    const options = icsHourOptions(escolha);
    if (options.length < 2) return null;
    const group = el("div", "protocol-ics-hora");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", typeof escolha.rotulo === "string" && escolha.rotulo ? escolha.rotulo : "Hora dos lembretes");
    if (typeof escolha.rotulo === "string" && escolha.rotulo) group.appendChild(el("p", "protocol-ics-hora-label", escolha.rotulo));
    const row = el("div", "protocol-ics-hora-options");
    const current = () => {
      const wanted = meta.hora || result.ics.eventos[0].hora;
      return options.some((opt) => opt.hora === wanted) ? wanted : null;
    };
    const buttons = options.map((opt) => {
      const b = el("button", "btn btn-outline protocol-ics-hora-opt", opt.rotulo);
      b.type = "button";
      b.setAttribute("aria-pressed", String(current() === opt.hora));
      b.addEventListener("click", () => {
        meta.hora = opt.hora;
        buttons.forEach((other) => other.node.setAttribute("aria-pressed", String(other.hora === opt.hora)));
      });
      row.appendChild(b);
      return { node: b, hora: opt.hora };
    });
    group.appendChild(row);
    return group;
  }

  function buildIcsControl(result) {
    if (!result.ics || !Array.isArray(result.ics.eventos) || !result.ics.eventos.length || !kit) return null;
    const label = result.ics.rotulo || "Baixar lembretes (.ics)";
    const button = el("button", "btn btn-secondary protocol-ics", label);
    button.type = "button";
    const choice = buildIcsHourChoice(result);
    button.addEventListener("click", () => {
      try {
        const chosen = choice && meta.hora && icsHourOptions(result.ics.escolhaHora).some((opt) => opt.hora === meta.hora) ? meta.hora : null;
        const eventos = chosen ? result.ics.eventos.map((e) => Object.assign({}, e, { hora: chosen })) : result.ics.eventos;
        const text = kit.montarIcs({ eventos, prodid: result.ics.prodid, agora: new Date() });
        downloadTextFile(fileNameFor(result, "ics", protocol.slug + ".ics"), text, "text/calendar;charset=utf-8");
        emit("ics");
        button.textContent = "Lembretes baixados";
      } catch (error) {
        console.error("Não foi possível montar os lembretes.", error);
        button.textContent = "Não foi possível baixar os lembretes";
      }
      window.setTimeout(() => { if (button.isConnected) button.textContent = label; }, 1800);
    });
    const note = el("p", "protocol-privacy privacy-line",
      "O arquivo de lembretes vai para o seu calendário, e o calendário pode sincronizar com serviços de terceiros. Por isso ele leva só o lembrete e o link do retorno, nada do que você respondeu.");
    return { button, note, choice };
  }

  // O registro em código: o resumo, o código para copiar e, se a página sabe lê-lo de volta,
  // o link que o carrega. O link só existe quando ela toca no botão; a barra de endereço nunca o recebe.
  function buildRegistroSection(registro) {
    const section = el("section", "protocol-record protocol-registro");
    section.setAttribute("aria-labelledby", "protocol-registro-title");
    const title = el("h3", null, registro.titulo || "Seu registro");
    title.id = "protocol-registro-title";
    section.appendChild(title);
    (registro.resumo || []).forEach((linha) => {
      if (typeof linha === "string") {
        section.appendChild(el("p", "protocol-body", linha));
        return;
      }
      if (!linha || !linha.value) return;
      const item = el("div", "protocol-record-item");
      item.appendChild(el("span", "protocol-record-q", linha.q));
      item.appendChild(el("span", "protocol-record-a", linha.value));
      section.appendChild(item);
    });
    if (!/^[A-Za-z0-9_-]{1,2048}$/.test(registro.codigo)) return section;
    const details = el("details", "protocol-registro-details");
    details.appendChild(el("summary", null, "Ver o código do registro"));
    const field = el("textarea", "protocol-write protocol-registro-code");
    field.rows = 4;
    field.setAttribute("readonly", "");
    field.setAttribute("aria-label", "Código do registro");
    field.value = registro.codigo;
    details.appendChild(field);
    section.appendChild(details);
    const row = el("div", "protocol-actions");
    const copy = (button, text, doneLabel, label) => {
      button.type = "button";
      button.addEventListener("click", () => {
        const done = () => {
          button.textContent = doneLabel;
          window.setTimeout(() => { if (button.isConnected) button.textContent = label; }, 1800);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(text()).then(done, done);
        else done();
      });
      row.appendChild(button);
    };
    copy(el("button", "btn btn-secondary", "Copiar o código do registro"), () => registro.codigo, "Código copiado", "Copiar o código do registro");
    if (importar && typeof importar.registro === "function") {
      copy(
        el("button", "btn btn-secondary", "Copiar o link do meu registro"),
        () => window.location.origin + window.location.pathname + "#c=" + registro.codigo,
        "Link copiado",
        "Copiar o link do meu registro"
      );
    }
    section.appendChild(row);
    section.appendChild(el("p", "protocol-privacy privacy-line",
      "O código é o seu registro em texto: guarde-o junto com o PDF. O link leva esse mesmo registro, então quem tiver o link consegue ler o que está nele. Compartilhe só com quem você quiser."));
    return section;
  }

  // "Leve este resultado com você": PDF, .md, copiar, os lembretes (.ics) e, no resultado
  // final, guardar, refazer e apagar. `opts.partial`: o resultado parcial do checkpoint, só
  // com o que se leva; `opts.skip`: botões a deixar de fora ({ pdf, md, copy }).
  function buildDelivery(result, card, opts) {
    const partial = Boolean(opts && opts.partial);
    const skip = (opts && opts.skip) || {};
    const delivery = el("section", "protocol-delivery result-actions");
    delivery.appendChild(el("h3", "protocol-delivery-title result-actions-title", "Leve este resultado com você"));
    delivery.appendChild(el("p", "protocol-delivery-text",
      "Os arquivos são montados localmente no seu navegador e não incluem recomendações ou ofertas exibidas depois do resultado."));

    const actions = el("div", "protocol-actions result-actions-row");
    const pdf = el("button", "btn btn-outline", "Preparando o PDF…");
    pdf.type = "button";
    pdf.disabled = true;
    pdf.setAttribute("aria-busy", "true");

    const enablePdf = () => {
      if (!pdf.isConnected) return;
      if (protocolPdfBrand.asset && window.jspdf && window.jspdf.jsPDF) {
        pdf.disabled = false;
        pdf.removeAttribute("aria-busy");
        pdf.textContent = "Baixar meu resultado em PDF";
        return;
      }
      if (protocolPdfBrand.error || !window.jspdf || !window.jspdf.jsPDF) {
        pdf.disabled = false;
        pdf.removeAttribute("aria-busy");
        pdf.textContent = "Tentar baixar meu resultado em PDF";
      }
    };

    enablePdf();
    if (protocolPdfBrand.promise) {
      protocolPdfBrand.promise.then(enablePdf).catch(enablePdf);
    }

    pdf.addEventListener("click", () => {
      const previousLabel = pdf.textContent;
      pdf.disabled = true;
      pdf.textContent = "Gerando PDF…";
      try {
        if (!protocolPdfBrand.asset) {
          throw new Error("O logo da DLT Academy ainda não foi carregado.");
        }
        downloadProtocolPdf(protocol, result, protocolPdfBrand.asset);
        emit("pdf");
        pdf.textContent = "PDF baixado";
      } catch (error) {
        console.error("Não foi possível gerar o PDF do protocolo.", error);
        pdf.textContent = "Não foi possível baixar — tentar novamente";
      } finally {
        window.setTimeout(() => {
          if (!pdf.isConnected) return;
          pdf.disabled = false;
          pdf.textContent = previousLabel || "Baixar meu resultado em PDF";
        }, 1800);
      }
    });

    const md = el("button", "btn btn-secondary", "Baixar como texto (.md)");
    md.type = "button";
    md.addEventListener("click", () => {
      downloadTextFile(fileNameFor(result, "md", protocol.slug + ".md"), buildMarkdown(protocol, result, state.answers));
      emit("md");
    });

    const copyResult = el("button", "btn btn-secondary", "Copiar resultado");
    copyResult.type = "button";
    copyResult.addEventListener("click", () => {
      const text = buildMarkdown(protocol, result, state.answers);
      const done = () => {
        copyResult.textContent = "Resultado copiado";
        window.setTimeout(() => { if (copyResult.isConnected) copyResult.textContent = "Copiar resultado"; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
      else done();
    });

    const restart = el("button", "btn btn-secondary", "Refazer o protocolo");
    restart.type = "button";
    restart.addEventListener("click", () => {
      clearPlanState();
      state.answers = flow.seed ? flow.seed() : {};
      state.path = [];
      if (flow === mainFlow) meta = freshMeta();
      render(startIndex(), true);
      window.scrollTo({ top: mount.offsetTop - 20, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });

    const save = partial ? null : buildSaveControl(result);

    // Apagar: remove o que o protocolo gravou neste navegador e desmarca o
    // plano na tela. A confirmação é texto na página, sem diálogo.
    const eraseStatus = el("p", "protocol-erase-status");
    eraseStatus.setAttribute("role", "status");
    eraseStatus.setAttribute("aria-live", "polite");
    const erase = el("button", "btn btn-secondary protocol-erase", "Apagar minhas respostas");
    erase.type = "button";
    erase.addEventListener("click", () => {
      clearPlanState();
      if (cycleEnabled) clearStoredState();
      card.querySelectorAll("[data-plan-key]").forEach((check) => {
        check.checked = false;
        const item = check.closest(".protocol-plan-item");
        if (item) item.classList.remove("is-done");
      });
      eraseStatus.textContent = "Respostas apagadas deste navegador.";
    });

    const ics = buildIcsControl(result);
    const cardButtons = partial ? [] : buildCardButtons(result);

    if (!skip.pdf) actions.appendChild(pdf);
    if (!skip.md) actions.appendChild(md);
    if (!skip.copy) actions.appendChild(copyResult);
    if (ics) actions.appendChild(ics.button);
    cardButtons.forEach((button) => actions.appendChild(button));
    if (save) actions.appendChild(save.button);
    if (!partial) actions.appendChild(restart);
    if (!partial) actions.appendChild(erase);
    delivery.appendChild(actions);
    if (ics && ics.choice) delivery.appendChild(ics.choice);
    if (ics) delivery.appendChild(ics.note);
    if (!partial) delivery.appendChild(eraseStatus);
    if (save) {
      delivery.appendChild(save.status);
      delivery.appendChild(save.note);
    }
    if (opts.returnSave) delivery.appendChild(opts.returnSave);
    delivery.appendChild(el("p", "protocol-privacy privacy-line",
      "Tudo isto rodou no seu navegador. Nenhuma resposta foi enviada a lugar nenhum — os arquivos são gerados no seu dispositivo."));
    return delivery;
  }

  function renderResult(moveFocus) {
    // Resposta de um ramo abandonado (a pessoa voltou e trocou de caminho) não chega ao resultado.
    if (usesKit) state.answers = kit.limparForaDoCaminho(flow.steps, state.path, state.answers);
    const result = flow.result(state.answers);
    const grade = resultGrade(result);
    const returnSave = settleStorageAtResult(result);
    if (flow === mainFlow) {
      if (result.guardar === true) emitOnce("fim");
    } else {
      emitOnce("retorno", flow.marco);
    }
    const toneClass = result.tone === "good" ? "is-good" : result.tone === "bad" ? "is-bad" : "is-mixed";
    // Uma superfície só: o cartão do resultado. Dentro dele, grupos separados
    // por espaço e fio. A cor de acento (data-grade) vem do grau, não do azul.
    const card = el("div", "protocol-card protocol-result " + toneClass);
    card.dataset.grade = String(grade);

    const verdictHeading = appendResultHead(card, result, grade, el);

    // Registro pessoal do que a pessoa escreveu/escolheu.
    if (result.record && result.record.length) {
      const rec = el("section", "protocol-record");
      rec.setAttribute("aria-labelledby", "protocol-record-title");
      const recTitle = el("h3", null, "O que você registrou");
      recTitle.id = "protocol-record-title";
      rec.appendChild(recTitle);
      result.record.forEach((r) => {
        if (!r.value) return;
        const item = el("div", "protocol-record-item");
        item.appendChild(el("span", "protocol-record-q", r.q));
        item.appendChild(el("span", "protocol-record-a", r.value));
        rec.appendChild(item);
      });
      card.appendChild(rec);
    }

    if (result.plan && result.plan.length) {
      const planState = readPlanState();
      const plan = el("section", "protocol-plan");
      plan.setAttribute("aria-labelledby", "protocol-plan-title");
      const planTitle = el("h3", null, "Seu plano a partir de agora");
      planTitle.id = "protocol-plan-title";
      plan.appendChild(planTitle);
      plan.appendChild(el("p", "protocol-plan-intro", "Marque conforme fizer. A lista fica somente neste navegador e pode ser retomada depois."));
      const list = el("div", "protocol-plan-list");
      const resultKey = "r" + (Number.isInteger(result.id) ? result.id : 0);
      result.plan.forEach((item, index) => {
        const itemId = String(item.id || index).replace(/[^A-Za-z0-9_-]/g, "");
        const key = resultKey + ":" + (itemId || index);
        const label = el("label", "protocol-plan-item");
        const check = el("input");
        check.type = "checkbox";
        check.checked = Boolean(planState[key]);
        check.setAttribute("data-plan-key", key);
        const textWrap = el("span");
        textWrap.appendChild(el("span", "protocol-plan-num", "Passo " + (index + 1)));
        textWrap.appendChild(el("strong", "protocol-plan-title", item.title));
        textWrap.appendChild(el("span", "protocol-plan-text", item.text));
        label.appendChild(check);
        label.appendChild(textWrap);
        if (check.checked) label.classList.add("is-done");
        check.addEventListener("change", () => {
          const next = readPlanState();
          if (check.checked) next[key] = true;
          else delete next[key];
          if (Object.keys(next).length) writePlanState(next);
          else clearPlanState();
          label.classList.toggle("is-done", check.checked);
        });
        list.appendChild(label);
      });
      plan.appendChild(list);
      card.appendChild(plan);
    }

    // Seções que só vêm depois do plano (por exemplo, o plano de 90 dias, depois do de 7).
    (result.sections || []).forEach((section, i) => {
      if (section.depoisDoPlano) card.appendChild(buildSection(section, i, el));
    });

    if (result.registro && typeof result.registro.codigo === "string") card.appendChild(buildRegistroSection(result.registro));

    if (result.safety) card.appendChild(el("p", "protocol-safety", result.safety));

    card.appendChild(buildDelivery(result, card, { returnSave }));

    const share = el("section", "share-row protocol-share");
    share.setAttribute("aria-label", "Compartilhar o protocolo");
    share.appendChild(el("p", null, "Compartilhe a ferramenta, não as suas respostas."));
    const shareActions = el("div", "share-actions");
    const shareCopy = el("button", null, "Copiar link");
    shareCopy.type = "button";
    const publicUrl = window.location.origin + window.location.pathname;
    const shareTitle = document.title.replace(/ — DLT Academy$/, "");
    const shareLinks = {
      telegram: "https://t.me/share/url?url=" + encodeURIComponent(publicUrl) + "&text=" + encodeURIComponent(shareTitle),
      whatsapp: "https://wa.me/?text=" + encodeURIComponent(shareTitle + " " + publicUrl),
    };
    shareCopy.addEventListener("click", () => {
      const done = () => {
        shareCopy.textContent = "Link copiado";
        shareCopy.classList.add("is-done");
        window.setTimeout(() => { if (shareCopy.isConnected) { shareCopy.textContent = "Copiar link"; shareCopy.classList.remove("is-done"); } }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(publicUrl).then(done, done);
      else done();
    });
    shareActions.appendChild(shareCopy);
    Object.keys(shareLinks).forEach((channel) => {
      const link = el("a", null, channel === "telegram" ? "Telegram" : "WhatsApp");
      link.href = shareLinks[channel];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("referrerpolicy", "no-referrer");
      shareActions.appendChild(link);
    });
    share.appendChild(shareActions);
    card.appendChild(share);

    mount.replaceChildren(card);

    // Próximo passo pelo grafo do registry (mesmo componente dos guias).
    // O mount nasce aqui, antes do CTA, para manter a ordem do modelo:
    // reflexão → registro → próximo passo útil → presente/CTA. Ele entra na
    // página depois da escada, que reúne grátis → executar → pago.
    const nextMount = el("div");
    nextMount.id = "next-step-mount";
    nextMount.dataset.contentId = protocol.id;

    // CTA por veredito — bloco separado, só na tela, nunca no arquivo nem
    // tecido na reflexão. O modo "artigo" também pode apontar para guia ou
    // ferramenta de utilidade; "presente" é reservado a oferta elegível.
    const cta = result.cta;
    const hasCta = Boolean(cta && cta.tipo && cta.tipo !== "none");

    // Relatório pago — o último degrau, separado do resultado.
    // O resultado gratuito já está completo acima; o relatório é
    // aprofundamento opcional. Sem produto configurado, nada aparece.
    // Um produto, ou uma lista (degraus: método e relatório do caso).
    // `result.oferta` é o mesmo que `result.relatorio`: um protocolo que não pode escrever a segunda
    // palavra (a oferta entra depois, por uma função à parte) declara a primeira.
    const offered = result.relatorio || result.oferta;
    const refs = Array.isArray(offered) ? offered : offered ? [offered] : [];
    const cards = refs.map((ref) => {
      const offerCard = buildPaidReportOffer(ref, el);
      if (offerCard) {
        offerCard.querySelectorAll(".protocol-paid-actions a").forEach((link) => {
          link.addEventListener("click", () => emit("oferta", ref.produto));
        });
      }
      return offerCard;
    }).filter(Boolean);
    // Um botão cheio por tela: com oferta paga, o primário é o dela (o da
    // primeira, se houver mais de uma), exceto em alerta (grau 4, NÃO):
    // contenção antes de conversão, então a oferta vira contorno e o
    // primário é o do próximo passo. Sem oferta, o primário é o do próximo passo.
    const paidIsPrimary = cards.length > 0 && grade < 4;
    cards.slice(paidIsPrimary ? 1 : 0).forEach(demoteOfferButton);

    const steps = [];
    steps.push({ kind: "free", title: "Grátis agora", sub: result.eyebrow || "Seu resultado" });
    if (hasCta) {
      const box = el("div", "protocol-cta");
      box.appendChild(el("p", "protocol-cta-eyebrow",
        cta.tipo === "presente" ? "Um presente por ter chegado até aqui" : "Próximo passo útil"));
      if (cta.headline) box.appendChild(el("p", "protocol-cta-headline", cta.headline));
      if (cta.texto) box.appendChild(el("p", "protocol-cta-texto", cta.texto));
      const a = el("a", "btn btn-md " + (paidIsPrimary ? "btn-outline" : "btn-primary"), cta.label);
      a.href = cta.href;
      if (cta.external) {
        a.target = "_blank";
        a.rel = "nofollow noopener noreferrer";
        a.setAttribute("referrerpolicy", "no-referrer");
      }
      box.appendChild(a);
      if (cta.disclosure) box.appendChild(el("p", "protocol-cta-disclosure", cta.disclosure));
      steps.push({ kind: "guide", title: "Para executar", content: box });
    }
    if (cards.length) {
      let paid = cards[0];
      if (cards.length > 1) {
        paid = el("div", "protocol-paid-offers");
        cards.forEach((c) => paid.appendChild(c));
      }
      steps.push({ kind: "paid", title: "Se o valor pesar", content: paid });
    }

    if (steps.length > 1) mount.appendChild(buildLadder(steps, el));
    mount.appendChild(nextMount);
    if (typeof renderNextStep === "function") renderNextStep();

    if (moveFocus) verdictHeading.focus({ preventScroll: true });
  }

  if (cycleEnabled) boot();
  else render(startIndex());
}

// Oferta opcional no checkpoint intermediário (ex.: fim do Ato 1): aparece em bloco
// separado abaixo do card de entrega, sem entrar nos downloads (.md, PDF, .ics).
function appendCheckpointPaidOffer(mountNode, result, emitFn, el) {
  const offered = result && (result.relatorio || result.oferta);
  if (!offered) return;
  const refs = Array.isArray(offered) ? offered : [offered];
  const cards = refs.map((ref) => {
    const offerCard = buildPaidReportOffer(ref, el);
    if (offerCard) {
      offerCard.querySelectorAll(".protocol-paid-actions a").forEach((link) => {
        link.addEventListener("click", () => emitFn("oferta", ref.produto));
      });
    }
    return offerCard;
  }).filter(Boolean);
  if (!cards.length) return;
  const section = el("section", "protocol-checkpoint-offer");
  cards.forEach((c) => section.appendChild(c));
  mountNode.appendChild(section);
}

// Grau do veredito (1 a 4): SIGA, AJUSTE, ESPERE, NÃO. O desfecho declara
// `grade` explicitamente; sem ele, o tom antigo vira grau (good 1, mixed 2,
// bad 4), para os protocolos que ainda não declaram.
const PROTOCOL_GRADE_WORDS = { 1: "SIGA", 2: "AJUSTE", 3: "ESPERE", 4: "NÃO" };

function resultGrade(result) {
  if (Number.isInteger(result.grade) && result.grade >= 1 && result.grade <= 4) return result.grade;
  return result.tone === "good" ? 1 : result.tone === "bad" ? 4 : 2;
}

// Pílula do veredito: cor, palavra e pontos dizem o mesmo grau
// (padrão .verdict-pill de dlt-patterns.css).
function buildVerdictPill(grade, el) {
  const pill = el("span", "verdict-pill", PROTOCOL_GRADE_WORDS[grade]);
  pill.dataset.grade = String(grade);
  const dots = el("span", "verdict-dots");
  dots.setAttribute("role", "img");
  dots.setAttribute("aria-label", "grau " + grade + " de 4");
  for (let i = 0; i < 4; i += 1) dots.appendChild(document.createElement("i"));
  pill.appendChild(dots);
  return pill;
}

// Escada de degraus (padrão .ladder): o primeiro é o resultado, já feito;
// o último, quando existe, é o pago. Cada degrau traz o conteúdo que já existia.
function buildLadder(steps, el) {
  const section = el("section", "protocol-ladder");
  const list = el("ol", "ladder");
  steps.forEach((step, i) => {
    const li = el("li", "ladder-step " + (step.kind === "free" ? "is-free" : step.kind === "paid" ? "is-paid" : "is-guide"));
    const rail = el("div", "ladder-rail");
    const node = el("span", "ladder-node", step.kind === "free" ? "✓" : String(i + 1));
    node.setAttribute("aria-hidden", "true");
    rail.appendChild(node);
    if (i < steps.length - 1) rail.appendChild(el("span", "ladder-line")).setAttribute("aria-hidden", "true");
    const body = el("div", "ladder-body");
    body.appendChild(el("h3", "ladder-title", step.title));
    if (step.sub) body.appendChild(el("p", "ladder-sub", step.sub));
    if (step.content) body.appendChild(step.content);
    li.appendChild(rail);
    li.appendChild(body);
    list.appendChild(li);
  });
  section.appendChild(list);
  return section;
}

// Oferta que não é a principal vira botão de contorno.
function demoteOfferButton(card) {
  const button = card.querySelector(".protocol-paid-buy .btn-primary");
  if (!button) return;
  button.classList.remove("btn-primary");
  button.classList.add("btn-outline");
}

// Monta a oferta do relatório pago a partir do catálogo (js/paid-reports.js).
// Recebe só { produto, perfil } — nenhuma resposta da pessoa. O link vai
// para o checkout do provedor, sem parâmetro derivado das respostas.
// Configuração ausente ou inválida não gera oferta (SECURITY_BASELINE).
function buildPaidReportOffer(ref, el) {
  if (!ref || typeof PAID_REPORTS === "undefined") return null;
  const product = PAID_REPORTS[ref.produto];
  if (!product) return null;
  const checkout = paidReportCheckoutUrl(product.checkoutUrl);
  if (!checkout) return null;
  const profile = (product.perfis || {})[ref.perfil];

  const box = el("section", "protocol-paid-report ladder-card");
  const titleId = "protocol-paid-report-title-" + String(ref.produto).replace(/[^a-z0-9-]/gi, "");
  box.setAttribute("aria-labelledby", titleId);
  box.appendChild(el("p", "protocol-paid-eyebrow", "Para ir além deste resultado"));
  const title = el("h4", "protocol-paid-title", product.titulo);
  title.id = titleId;
  box.appendChild(title);
  if (product.promessa) box.appendChild(el("p", "protocol-paid-text", product.promessa));

  if (profile && profile.capitulo) {
    const chapter = el("p", "protocol-paid-profile");
    chapter.appendChild(el("span", "protocol-paid-profile-label", "Inclui o capítulo do seu caso"));
    chapter.appendChild(el("strong", null, profile.capitulo));
    if (profile.porque) chapter.appendChild(el("span", "protocol-paid-profile-why", profile.porque));
    box.appendChild(chapter);
  }

  if (product.conteudo && product.conteudo.length) {
    const list = el("ul", "protocol-paid-list");
    product.conteudo.forEach((item) => list.appendChild(el("li", null, item)));
    box.appendChild(list);
  }

  // Lembrete do catálogo para levar o arquivo do resultado ao pago (texto fixo, sem respostas).
  if (product.lembreteMd) box.appendChild(el("p", "protocol-paid-text protocol-paid-lembrete", product.lembreteMd));

  const buy = el("div", "protocol-paid-buy");
  buy.appendChild(el("p", "protocol-paid-price", product.preco + (product.formato ? " · " + product.formato : "")));
  const actions = el("div", "protocol-paid-actions");
  const pagina = paidReportPageUrl(product.paginaUrl);
  const preferirPagina = Boolean(product.preferirPagina && pagina);

  if (preferirPagina) {
    const ver = el("a", "btn btn-md btn-primary", product.botaoPagina || "Ver exemplo do relatório");
    ver.href = appendPaidOfferUtms(pagina, false);
    actions.appendChild(ver);
  }

  const a = el("a", preferirPagina ? "btn btn-ghost" : "btn btn-md btn-primary", product.botao || "Quero o relatório completo →");
  a.href = appendPaidOfferUtms(checkout, true);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("referrerpolicy", "no-referrer");
  actions.appendChild(a);

  if (!preferirPagina && pagina) {
    const ver = el("a", "btn btn-ghost", product.botaoPagina || "Ver exemplo do relatório");
    ver.href = appendPaidOfferUtms(pagina, false);
    actions.appendChild(ver);
  }
  buy.appendChild(actions);
  box.appendChild(buy);

  // Aviso padrão do modelo estático; o personalizado declara o próprio,
  // porque nele as respostas são enviadas depois do pagamento.
  box.appendChild(el("p", "protocol-paid-disclosure", product.aviso ||
    ("Produto da DLT Academy, vendido e entregue pela " + product.plataforma + ". " +
    "Nada do que você escreveu aqui vai junto: suas respostas continuam só no seu navegador. " +
    "Você tem 7 dias para pedir reembolso.")));
  return box;
}

/**
 * O que faz: Valida o endereço de compra do relatório pago e devolve a URL normalizada ou null.
 * Por quê: Impede que o catálogo abra esquema inseguro, host não autorizado, rota fora de /comprar/<produto> ou parâmetros fora de utm_*.
 * Erro e ataque: Strings vazias, URLs malformadas, http:, credenciais, porta, hash, parâmetros fora de utm_* ou hosts externos retornam null.
 * Prova: tests/test_paid_reports.py (test_catalogo_usa_link_curto_oficial_de_compra, test_validadores_rejeitam_entradas_hostis).
 */
function paidReportCheckoutUrl(value) {
  if (typeof value !== "string" || !value) return null;
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password || url.port || url.hash) return null;
  if (!/^\/comprar\/[a-z0-9-]+$/.test(url.pathname)) return null;
  if (url.search && !/^\?utm_[a-z0-9_]+=[a-z0-9_-]+(?:&utm_[a-z0-9_]+=[a-z0-9_-]+)*$/.test(url.search)) return null;
  const hosts = typeof PAID_REPORT_HOSTS === "undefined" ? [] : PAID_REPORT_HOSTS;
  return hosts.indexOf(url.hostname) === -1 ? null : url.href;
}

/**
 * O que faz: Valida o caminho interno opcional da página pública de apresentação do produto (/produtos/<id>/).
 * Por quê: Garante que o link secundário de exemplo aponte apenas para página estática própria sem carregar dados da sessão.
 * Erro e ataque: Rejeita URLs absolutas, esquemas como javascript:, travessia de diretório, parâmetros ou fragmentos; retorna null quando inválido.
 * Prova: tests/test_paid_reports.py (test_motor_valida_https_e_host_antes_de_mostrar_oferta, test_pagina_de_vendas_nao_fica_orfa_no_portal).
 */
function paidReportPageUrl(value) {
  if (typeof value !== "string" || !value) return null;
  return /^\/produtos\/[a-z0-9-]+\/$/.test(value) ? value : null;
}

/**
 * O que faz: Repassa os parametros utm_* da visita atual para os links de oferta e checkout.
 * Por que: Preserva a origem de campanha sem carregar nenhuma resposta ou dado pessoal na URL.
 * Erro e ataque: Aceita apenas chaves utm_source/medium/campaign/content/term com caracteres [a-z0-9_-] ate 200 chars e revalida o destino no checkout.
 * Prova: tests/test_paid_reports.py (test_oferta_propaga_utms_para_checkout_e_pagina).
 */
function appendPaidOfferUtms(rawUrl, isCheckout) {
  if (typeof rawUrl !== "string" || !rawUrl) return rawUrl;
  if (typeof window === "undefined" || !window.location || !window.location.search) return rawUrl;
  const ALLOWED = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  let visita;
  try {
    visita = new URLSearchParams(window.location.search);
  } catch (error) {
    return rawUrl;
  }
  const limpo = (v) => {
    if (typeof v !== "string") return "";
    const norm = v.trim().toLowerCase();
    return /^[a-z0-9_-]{1,200}$/.test(norm) ? norm : "";
  };
  const extras = ALLOWED.map((k) => [k, limpo(visita.get(k))]).filter((par) => par[1] !== "");
  if (!extras.length) return rawUrl;
  let parsed;
  try {
    parsed = isCheckout ? new URL(rawUrl) : new URL(rawUrl, "https://dlt.academy");
  } catch (error) {
    return rawUrl;
  }
  const origContent = parsed.searchParams.get("utm_content");
  ALLOWED.forEach((k) => parsed.searchParams.delete(k));
  extras.forEach((par) => parsed.searchParams.set(par[0], par[1]));
  if (isCheckout && origContent && !parsed.searchParams.has("utm_term")) {
    parsed.searchParams.set("utm_term", origContent);
  }
  if (isCheckout) return paidReportCheckoutUrl(parsed.href) || rawUrl;
  return parsed.pathname + parsed.search;
}

function prepareProtocolPdfBrand() {
  if (protocolPdfBrand.promise) return protocolPdfBrand.promise;

  protocolPdfBrand.promise = loadLocalImageAsDataUrl("/assets/dlt-logo.png")
    .then((asset) => {
      protocolPdfBrand.asset = asset;
      return asset;
    })
    .catch((error) => {
      protocolPdfBrand.error = error;
      return null;
    });

  return protocolPdfBrand.promise;
}

function loadLocalImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D indisponível.");
        context.drawImage(image, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Não foi possível carregar a marca do PDF."));
    image.src = src;
  });
}

// Monta e baixa um PDF paginado. Recebe apenas resultado + registro + aviso:
// CTA, cupom, disclosure e próximos passos nunca entram no arquivo pessoal.
function downloadProtocolPdf(protocol, result, brandAsset) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("jsPDF não está disponível.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);
  const contentBottom = pageHeight - 25;
  const blue = [30, 79, 216];
  const lightBlue = [74, 141, 248];
  const ink = [24, 34, 52];
  const muted = [82, 94, 116];
  const border = [221, 226, 235];
  let y = 16;
  // Protocolo com os recursos novos limpa o texto pela regra do kit (emoji e símbolos que a fonte não tem).
  const pdfText = protocolNeedsKit(protocol) && typeof DLTProtocolKit !== "undefined" ? DLTProtocolKit.textoSeguroPdf : safePdfText;

  doc.setProperties({
    title: protocol.title,
    subject: protocol.pdfSubject || "Reflexão estruturada",
    author: "DLT Academy",
    creator: "dlt.academy",
  });

  const ensureSpace = (height) => {
    if (y + height <= contentBottom) return;
    doc.addPage();
    y = 19;
    doc.setDrawColor(...lightBlue);
    doc.setLineWidth(0.7);
    doc.line(margin, 13, pageWidth - margin, 13);
  };

  const writeLines = (text, options = {}) => {
    const fontSize = options.fontSize || 10.5;
    const lineHeight = options.lineHeight || 5.1;
    const width = options.width || contentWidth;
    const x = options.x || margin;
    const color = options.color || ink;
    const fontStyle = options.fontStyle || "normal";
    const lines = doc.splitTextToSize(pdfText(text), width);

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    lines.forEach((line) => {
      ensureSpace(lineHeight + 0.5);
      doc.text(line, x, y);
      y += lineHeight;
    });
    return lines.length;
  };

  const pen = {
    doc,
    margin,
    pageWidth,
    contentWidth,
    colors: { blue, ink, muted, border },
    writeLines,
    ensureSpace,
    get y() { return y; },
    set y(value) { y = value; },
  };

  const logoHeight = 15;
  const logoRatio = brandAsset.width / brandAsset.height;
  const logoWidth = Math.min(48, logoHeight * logoRatio);
  doc.addImage(brandAsset.dataUrl, "PNG", margin, y, logoWidth, logoHeight, undefined, "FAST");
  y += logoHeight + 6;
  doc.setDrawColor(...blue);
  doc.setLineWidth(1.1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...blue);
  doc.text("SEU RESULTADO", margin, y);
  y += 7;

  writeLines(protocol.title, { fontSize: 11, lineHeight: 5.2, fontStyle: "bold", color: ink });
  writeLines("Gerado em " + new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()), {
    fontSize: 8.8,
    lineHeight: 4.4,
    color: muted,
  });
  y += 3;

  writeLines(result.verdict, {
    fontSize: 18,
    lineHeight: 7.6,
    fontStyle: "bold",
    color: blue,
  });
  y += 4;

  const stats = (result.stats || []).slice(0, 3);
  if (stats.length) {
    ensureSpace(25);
    const gap = 4;
    const boxWidth = (contentWidth - gap * (stats.length - 1)) / stats.length;
    stats.forEach((stat, index) => {
      const x = margin + (boxWidth + gap) * index;
      doc.setFillColor(246, 248, 252);
      doc.setDrawColor(...border);
      doc.roundedRect(x, y - 3, boxWidth, 17, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...blue);
      doc.text(pdfText(stat.value), x + 4, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...muted);
      doc.text(pdfText(stat.label), x + 4, y + 10);
    });
    y += 22;
  }

  (result.body || []).forEach((paragraph) => {
    writeLines(paragraph, { fontSize: 10.5, lineHeight: 5.2, color: ink });
    y += 3.2;
  });

  (result.sections || []).forEach((section) => {
    if (!section.depoisDoPlano) writeSection(pen, section);
  });

  const records = (result.record || []).filter((item) => item.value);
  if (records.length) {
    ensureSpace(16);
    y += 2;
    doc.setDrawColor(...border);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 9;
    writeLines("O que você registrou", {
      fontSize: 14,
      lineHeight: 6.5,
      fontStyle: "bold",
      color: ink,
    });
    y += 2;

    records.forEach((item) => {
      ensureSpace(14);
      doc.setFillColor(246, 248, 252);
      doc.roundedRect(margin, y - 4.2, contentWidth, 7, 1.5, 1.5, "F");
      writeLines(item.q, {
        x: margin + 3,
        width: contentWidth - 6,
        fontSize: 8.6,
        lineHeight: 4.3,
        fontStyle: "bold",
        color: blue,
      });
      y += 1.5;
      writeLines(item.value, {
        x: margin + 3,
        width: contentWidth - 6,
        fontSize: 10.2,
        lineHeight: 5,
        color: ink,
      });
      y += 5;
    });
  }

  const plan = result.plan || [];
  if (plan.length) {
    ensureSpace(18);
    y += 2;
    doc.setDrawColor(...border);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 9;
    writeLines("Seu plano", { fontSize: 14, lineHeight: 6.5, fontStyle: "bold", color: ink });
    y += 2;
    plan.forEach((item, index) => {
      ensureSpace(15);
      writeLines("[ ] Passo " + (index + 1) + ": " + item.title, {
        fontSize: 9.5,
        lineHeight: 4.8,
        fontStyle: "bold",
        color: blue,
      });
      writeLines(item.text, { fontSize: 9.5, lineHeight: 4.8, color: ink });
      y += 2.5;
    });
  }

  (result.sections || []).forEach((section) => {
    if (section.depoisDoPlano) writeSection(pen, section);
  });

  if (result.safety) {
    ensureSpace(20);
    y += 1;
    doc.setDrawColor(229, 188, 88);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 8);
    writeLines("Aviso de segurança", {
      x: margin + 4,
      width: contentWidth - 4,
      fontSize: 9,
      lineHeight: 4.6,
      fontStyle: "bold",
      color: muted,
    });
    y += 1;
    writeLines(result.safety, {
      x: margin + 4,
      width: contentWidth - 4,
      fontSize: 8.8,
      lineHeight: 4.5,
      color: muted,
    });
  }

  if (result.registro && typeof result.registro.codigo === "string") writeRegistro(pen, result.registro);

  const totalPages = doc.getNumberOfPages();
  const pageUrl = "dlt.academy" + String(protocol.path || "/").replace(/\/$/, "");
  const customDisclaimer = typeof protocol.disclaimer === "string" && protocol.disclaimer ? pdfText(protocol.disclaimer) : "";
  const disclaimerLines = customDisclaimer
    ? doc.splitTextToSize(customDisclaimer, contentWidth - 14).slice(0, 2)
    : ["Conteúdo educacional · Reflexão estruturada — não é terapia nem recomendação de investimento"];

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.35);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...muted);
    doc.text(pageUrl, margin, pageHeight - 12.5);
    disclaimerLines.forEach((line, i) => doc.text(line, margin, pageHeight - 8.5 + i * 3.3));
    doc.text(`${page}/${totalPages}`, pageWidth - margin, pageHeight - 8.5, { align: "right" });
  }

  doc.save(fileNameFor(result, "pdf", protocol.slug + "-resultado.pdf"));
}

function safePdfText(value) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n");
}

// Monta o registro pessoal em Markdown — a versão editável/journalável.
function buildMarkdown(protocol, result, answers) {
  const linhas = [];
  linhas.push("# " + protocol.title);
  linhas.push("Gerado em " + new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()));
  linhas.push("");
  linhas.push("> " + result.verdict);
  linhas.push("");
  if (result.stats && result.stats.length) {
    linhas.push("## Resumo");
    linhas.push("");
    result.stats.slice(0, 3).forEach((stat) => {
      linhas.push("- **" + stat.value + "** — " + stat.label);
    });
    linhas.push("");
  }
  (result.body || []).forEach((p) => { linhas.push(p); linhas.push(""); });
  // Com blocos marcados, são eles que levam as seções; sem blocos, as seções saem como texto.
  const marked = Array.isArray(result.blocks) && result.blocks.length > 0 && typeof DLTProtocolKit !== "undefined";
  if (!marked) (result.sections || []).forEach((section) => {
    if (!section.depoisDoPlano) markdownSection(section).forEach((l) => linhas.push(l));
  });
  if (result.record && result.record.length) {
    linhas.push("## O que você registrou");
    linhas.push("");
    result.record.forEach((r) => {
      if (!r.value) return;
      linhas.push("**" + r.q + "**");
      linhas.push(r.value);
      linhas.push("");
    });
  }
  if (result.plan && result.plan.length) {
    linhas.push("## Seu plano");
    linhas.push("");
    result.plan.forEach((item, index) => {
      linhas.push("- [ ] Passo " + (index + 1) + ": " + item.title);
      linhas.push("  " + item.text);
    });
    linhas.push("");
  }
  if (!marked) (result.sections || []).forEach((section) => {
    if (section.depoisDoPlano) markdownSection(section).forEach((l) => linhas.push(l));
  });
  if (marked) {
    // O texto dela fora dos blocos também perde o que pareceria um marcador de máquina.
    const human = DLTProtocolKit.neutralizar(linhas.join("\n")).split("\n");
    linhas.length = 0;
    human.forEach((l) => linhas.push(l));
    linhas.push(DLTProtocolKit.escreverBlocos(result.blocks));
    linhas.push("");
  }
  linhas.push("---");
  linhas.push(typeof protocol.disclaimer === "string" && protocol.disclaimer
    ? protocol.disclaimer
    : "Reflexão estruturada da DLT Academy — não é terapia nem recomendação de investimento.");
  linhas.push("dlt.academy" + (protocol.path || ""));
  return linhas.join("\n");
}

// Download de arquivo de texto client-side. Nada é transmitido. O tipo padrão é Markdown.
function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type: type || "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// As horas que `result.ics.escolhaHora.opcoes` oferece: { rotulo, hora: "HH:MM" } válidas,
// sem hora repetida, no máximo seis. Qualquer protocolo com `ics` pode usar.
function icsHourOptions(escolha) {
  if (!escolha || typeof escolha !== "object" || !Array.isArray(escolha.opcoes)) return [];
  const seen = {};
  return escolha.opcoes.filter((opt) => {
    const ok = opt && typeof opt.rotulo === "string" && opt.rotulo && typeof opt.hora === "string"
      && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(opt.hora) && !seen[opt.hora];
    if (ok) seen[opt.hora] = true;
    return ok;
  }).slice(0, 6);
}

// ---- cartões em PNG (`result.cartoes`) --------------------------------------------------------------
// Cada cartão: { id, rotulo, arquivo, formato, eyebrow, titulo, linhas, secoes: [{ titulo, itens }], rodape }.
// O desenho usa generateCard e downloadCanvasAsPng (blog/js/canvas-cards.js); sem eles, não há botão.
// Baixar é ação da pessoa e o cartão sai do aparelho dela, nada é enviado.

// Quebra o texto em linhas que cabem em `largura`, com a função de medida `medir(texto)`.
function wrapCardText(texto, largura, medir) {
  const linhas = [];
  let atual = "";
  String(texto).split(" ").forEach((palavra) => {
    const teste = atual ? atual + " " + palavra : palavra;
    if (atual && medir(teste) > largura) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  });
  if (atual) linhas.push(atual);
  return linhas;
}

// Onde cada linha das seções do cartão cai, do topo à base, no maior tamanho de letra que
// cabe (e, no menor, só as linhas que cabem). `medir(texto, tamanho, peso)` mede o texto.
// Devolve [{ tipo: "titulo" | "item", texto, x, y, tamanho, peso }].
function layoutCartao(spec, largura, altura, medir) {
  const margem = Math.round(largura * 0.08);
  const larguraUtil = largura - margem * 2;
  const topo = Math.round(altura * 0.37);
  const base = Math.round(altura * 0.86);
  const secoes = Array.isArray(spec.secoes) ? spec.secoes : [];
  const maior = Math.round(largura * 0.04);
  const menor = Math.round(largura * 0.022);

  const montar = (tamanho) => {
    const linhas = [];
    let y = topo;
    secoes.forEach((secao) => {
      if (secao.titulo) {
        y += Math.round(tamanho * 0.5);
        linhas.push({ tipo: "titulo", texto: String(secao.titulo), x: margem, y, tamanho: Math.round(tamanho * 0.78), peso: 700 });
        y += Math.round(tamanho * 1.15);
      }
      (secao.itens || []).forEach((item) => {
        const comMarca = (secao.itens || []).length > 1;
        const texto = (comMarca ? "\u2022 " : "") + String(item);
        wrapCardText(texto, larguraUtil, (t) => medir(t, tamanho, 500)).forEach((linha, i) => {
          linhas.push({ tipo: "item", texto: i > 0 && comMarca ? "  " + linha : linha, x: margem, y, tamanho, peso: 500 });
          y += Math.round(tamanho * 1.35);
        });
        y += Math.round(tamanho * 0.25);
      });
    });
    return { linhas, fim: y };
  };

  let tamanho = maior;
  let montado = montar(tamanho);
  while (montado.fim > base && tamanho > menor) {
    tamanho -= 2;
    montado = montar(tamanho);
  }
  return montado.linhas.filter((linha) => linha.y <= base);
}

function buildCardCanvas(spec) {
  const format = spec.formato === "square" ? "square" : "story";
  return generateCard({
    format,
    eyebrow: spec.eyebrow,
    headline: spec.titulo,
    headlineColor: "#E8EDF7",
    lines: spec.linhas || [],
    showFooter: false,
    customDraw: (ctx, width, height) => {
      const medir = (texto, tamanho, peso) => {
        ctx.font = peso + " " + tamanho + "px system-ui, sans-serif";
        return ctx.measureText(texto).width;
      };
      ctx.textAlign = "left";
      layoutCartao(spec, width, height, medir).forEach((linha) => {
        ctx.font = linha.peso + " " + linha.tamanho + "px system-ui, sans-serif";
        ctx.fillStyle = linha.tipo === "titulo" ? "#4A8DF8" : "#E8EDF7";
        ctx.fillText(linha.texto, linha.x, linha.y);
      });
      ctx.textAlign = "center";
      ctx.font = "500 " + Math.round(width * 0.026) + "px system-ui, sans-serif";
      ctx.fillStyle = "#9AA7C2";
      (spec.rodape || []).forEach((linha, i) => ctx.fillText(String(linha), width / 2, height * (0.9 + i * 0.035)));
    },
  });
}

// Os botões de baixar cartão, um por `result.cartoes`, só se o desenho estiver na página.
function buildCardButtons(result) {
  const cards = Array.isArray(result.cartoes) ? result.cartoes : [];
  if (!cards.length || typeof generateCard !== "function" || typeof downloadCanvasAsPng !== "function") return [];
  return cards
    .filter((spec) => spec && typeof spec.rotulo === "string" && spec.rotulo && typeof spec.titulo === "string")
    .map((spec) => {
      const label = spec.rotulo;
      const button = document.createElement("button");
      button.className = "btn btn-secondary protocol-card-png";
      button.type = "button";
      button.dataset.card = String(spec.id || "");
      button.textContent = label;
      button.addEventListener("click", () => {
        try {
          const name = typeof spec.arquivo === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(spec.arquivo) ? spec.arquivo : "cartao.png";
          downloadCanvasAsPng(buildCardCanvas(spec), name);
          button.textContent = "Cartão baixado";
        } catch (error) {
          console.error("Não foi possível montar o cartão.", error);
          button.textContent = "Não foi possível baixar o cartão";
        }
        window.setTimeout(() => { if (button.isConnected) button.textContent = label; }, 1800);
      });
      return button;
    });
}

// Nome do arquivo que o resultado pede (`result.arquivos.pdf|md|ics`), se vier num formato
// seguro; senão o padrão.
function fileNameFor(result, kind, fallback) {
  const name = result && result.arquivos && result.arquivos[kind];
  return typeof name === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(name) ? name : fallback;
}

// Uma seção do resultado em Markdown (título, parágrafos e itens).
function markdownSection(section) {
  const linhas = ["## " + section.title, ""];
  if (section.painelDecisao && Array.isArray(section.painelDecisao.linhasMd)) {
    section.painelDecisao.linhasMd.forEach((l) => linhas.push("- " + l));
    if (section.painelDecisao.linhasMd.length) linhas.push("");
  }
  (section.paragraphs || []).forEach((p) => { linhas.push(p); linhas.push(""); });
  (section.items || []).forEach((item) => {
    if (item && typeof item === "object") linhas.push("- **" + item.title + "**" + (item.text ? " — " + item.text : ""));
    else linhas.push("- " + item);
  });
  if (section.items && section.items.length) linhas.push("");
  return linhas;
}

// Uma seção no PDF. `pen` é o que downloadProtocolPdf expõe: o documento, a posição
// vertical (`y`), as cores e os métodos de escrever e de abrir página.
function writeSection(pen, section) {
  if (!section || !section.title) return;
  pen.ensureSpace(18);
  pen.y += 2;
  pen.doc.setDrawColor(...pen.colors.border);
  pen.doc.setLineWidth(0.4);
  pen.doc.line(pen.margin, pen.y, pen.pageWidth - pen.margin, pen.y);
  pen.y += 9;
  pen.writeLines(section.title, { fontSize: 14, lineHeight: 6.5, fontStyle: "bold", color: pen.colors.ink });
  pen.y += 2;
  if (section.curva) writeCurvaTetoPdf(pen, section.curva);
  if (section.painelDecisao) writePainelDecisaoPdf(pen, section.painelDecisao);
  (section.paragraphs || []).forEach((paragraph) => {
    pen.writeLines(paragraph, { fontSize: 10.5, lineHeight: 5.2, color: pen.colors.ink });
    pen.y += 3.2;
  });
  (section.items || []).forEach((item) => {
    pen.ensureSpace(12);
    if (item && typeof item === "object") {
      pen.writeLines(item.title, { fontSize: 9.8, lineHeight: 4.9, fontStyle: "bold", color: pen.colors.blue });
      if (item.text) pen.writeLines(item.text, { fontSize: 9.8, lineHeight: 4.9, color: pen.colors.ink });
    } else {
      pen.writeLines("- " + item, { fontSize: 9.8, lineHeight: 4.9, color: pen.colors.ink });
    }
    pen.y += 2.2;
  });
}

// Desenha a curva personalizada de resistência no PDF do protocolo (componente reutilizável do kit).
function writeCurvaTetoPdf(pen, c) {
  if (!c || typeof c !== "object") return;
  const doc = pen.doc;
  const modo = c.modo === "devolve" ? "devolve" : "estagna";
  const m = pen.margin;
  const w = pen.contentWidth;
  const boxH = 52;
  pen.ensureSpace(boxH + 16);
  const y = pen.y;

  doc.setFillColor(10, 17, 32);
  doc.roundedRect(m, y, w, boxH, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4);
  doc.setTextColor(242, 245, 251);
  doc.text(safePdfText(c.titulo || "Curva do seu teto"), m + 5, y + 6.8);
  doc.setFontSize(7.4);
  doc.setTextColor(...(modo === "devolve" ? [252, 165, 165] : [253, 186, 116]));
  doc.text(safePdfText(String(c.selo || "").toUpperCase()), m + w - 5, y + 6.8, { align: "right" });

  const px = m + 5, py = y + 10.5, pw = w - 10, ph = 36.5;
  doc.setFillColor(6, 9, 15);
  doc.setDrawColor(30, 44, 78);
  doc.setLineWidth(0.25);
  doc.roundedRect(px, py, pw, ph, 2, 2, "FD");
  const sx = (vx) => px + (vx / 420) * pw;
  const sy = (vy) => py + (vy / 218) * ph;

  doc.setDrawColor(46, 62, 96);
  doc.setLineWidth(0.2);
  doc.line(sx(16), sy(168), sx(404), sy(168));
  doc.setFillColor(42, 34, 18);
  if (typeof doc.rect === "function") doc.rect(sx(16), sy(58), sx(404) - sx(16), sy(70) - sy(58), "F");
  else doc.roundedRect(sx(16), sy(58), sx(404) - sx(16), sy(70) - sy(58), 0, 0, "F");
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.5);
  if (typeof doc.setLineDashPattern === "function") doc.setLineDashPattern([2.2, 1.8], 0);
  doc.line(sx(16), sy(64), sx(404), sy(64));
  if (typeof doc.setLineDashPattern === "function") doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.6);
  doc.setTextColor(251, 191, 36);
  doc.text(safePdfText(String(c.rotuloTeto || "TETO").slice(0, 26)), sx(18), sy(54));

  const tracar = (pts, cor) => {
    doc.setDrawColor(...cor);
    doc.setLineWidth(0.8);
    for (let i = 0; i < pts.length - 1; i += 1) {
      doc.line(sx(pts[i][0]), sy(pts[i][1]), sx(pts[i + 1][0]), sy(pts[i + 1][1]));
    }
  };
  const ponto = (cx, cy, cor) => {
    doc.setFillColor(6, 9, 15);
    doc.setDrawColor(...cor);
    doc.setLineWidth(0.5);
    if (typeof doc.circle === "function") doc.circle(sx(cx), sy(cy), 1.3, "FD");
    else doc.roundedRect(sx(cx) - 1.3, sy(cy) - 1.3, 2.6, 2.6, 1.3, 1.3, "FD");
  };
  const verde = [74, 222, 128], laranja = [251, 146, 60], vermelho = [248, 113, 113], ambar = [251, 191, 36];

  if (modo === "devolve") {
    tracar([[20, 164], [44, 144], [56, 149], [82, 110], [94, 116], [122, 66]], verde);
    tracar([[122, 66], [138, 106], [146, 100], [160, 144], [166, 139], [176, 162]], vermelho);
    tracar([[176, 162], [200, 144], [212, 148], [238, 110], [250, 115], [274, 68], [292, 40]], verde);
    tracar([[292, 40], [310, 66], [326, 110], [336, 103], [360, 146], [370, 140], [392, 160]], vermelho);
    ponto(122, 66, vermelho); ponto(176, 162, vermelho); ponto(292, 40, verde); ponto(392, 160, vermelho);
    doc.setTextColor(253, 230, 138); doc.text(safePdfText(c.toque || "bate no teto"), sx(122), sy(44), { align: "center" });
    doc.setTextColor(252, 165, 165); doc.text(safePdfText(c.recuo || "devolve o ganho"), sx(176), sy(188), { align: "center" });
    doc.setTextColor(134, 239, 172); doc.text(safePdfText(c.pico2 || "passa um pouco"), sx(292), sy(23), { align: "center" });
    doc.setTextColor(252, 165, 165); doc.text(safePdfText(c.fim || "cai de novo"), sx(366), sy(188), { align: "center" });
  } else {
    tracar([[20, 164], [40, 148], [52, 153], [76, 116], [88, 122], [114, 66]], verde);
    tracar([[114, 66], [130, 98], [146, 95], [164, 102], [182, 97], [200, 101]], laranja);
    tracar([[200, 101], [216, 84], [224, 88], [242, 66]], verde);
    tracar([[242, 66], [260, 100], [278, 96], [296, 103], [314, 98], [332, 101]], laranja);
    tracar([[332, 101], [348, 84], [356, 88], [374, 66]], verde);
    tracar([[374, 66], [388, 94], [400, 96]], laranja);
    ponto(114, 66, ambar); ponto(242, 66, ambar); ponto(374, 66, ambar);
    doc.setTextColor(253, 230, 138);
    doc.text(safePdfText(c.toque || "1º toque"), sx(114), sy(44), { align: "center" });
    doc.text(safePdfText(c.pico2 || "2º toque"), sx(242), sy(44), { align: "center" });
    doc.text(safePdfText("3º toque"), sx(374), sy(44), { align: "center" });
    doc.setTextColor(253, 186, 116);
    doc.text(safePdfText(c.recuo || "recua e estagna"), sx(164), sy(134), { align: "center" });
    doc.text(safePdfText(c.fim || "estagna de novo"), sx(296), sy(134), { align: "center" });
  }
  doc.setFont("helvetica", "normal");
  doc.setTextColor(154, 167, 194);
  doc.text(safePdfText(String(c.rotuloBase || "Patamar anterior").slice(0, 32)), sx(16), sy(209));
  doc.text("Ciclo no tempo ->", sx(404), sy(209), { align: "right" });

  pen.y = y + boxH + 4;
  if (c.legenda) {
    pen.writeLines(c.legenda, { fontSize: 9.2, lineHeight: 4.5, color: pen.colors.muted });
    pen.y += 2.5;
  }
}

/**
 * O que faz: Desenha no PDF o painel vetorial personalizado do Decisão Fria (barras de limite em reais ou barras dos 4 eixos de sinais).
 * Por quê: Garante que o arquivo baixado entregue a mesma prova visual exibida na tela, sem depender de captura de imagem nem texto genérico.
 * Erro e ataque: Limita proporções entre 0 e 1, higieniza todo rótulo via safePdfText e usa fallback de roundedRect caso doc.rect não exista.
 * Prova: tests/js/decisao-fria-limite.test.mjs.
 */
function writePainelDecisaoPdf(pen, p) {
  if (!p || !Array.isArray(p.barras) || !p.barras.length) return;
  const doc = pen.doc;
  const m = pen.margin;
  const w = pen.contentWidth;
  const barras = p.barras.slice(0, 4);
  const boxH = 16 + barras.length * 11.5;
  pen.ensureSpace(boxH + 16);
  const y = pen.y;

  const cores = {
    verde: [74, 222, 128],
    azul: [96, 165, 250],
    ambar: [251, 191, 36],
    vermelho: [248, 113, 113],
  };
  const corTom = (tom) => cores[tom] || cores.azul;

  doc.setFillColor(10, 17, 32);
  doc.roundedRect(m, y, w, boxH, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4);
  doc.setTextColor(242, 245, 251);
  doc.text(safePdfText(p.titulo || "Painel visual da decisão"), m + 5, y + 6.8);
  if (p.selo) {
    doc.setFontSize(7.4);
    doc.setTextColor(...corTom(p.seloTom || "azul"));
    doc.text(safePdfText(String(p.selo).toUpperCase()), m + w - 5, y + 6.8, { align: "right" });
  }

  const bx = m + 5;
  const bw = w - 10;
  let ry = y + 13.5;
  barras.forEach((b) => {
    const pct = Math.max(0.04, Math.min(1, Number(b.proporcao) || 0));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(216, 224, 239);
    doc.text(safePdfText(b.rotulo || ""), bx, ry);
    doc.setTextColor(...corTom(b.tom));
    doc.text(safePdfText(b.valorTexto || ""), bx + bw, ry, { align: "right" });

    doc.setFillColor(20, 31, 56);
    doc.roundedRect(bx, ry + 1.8, bw, 3.6, 1.4, 1.4, "F");
    doc.setFillColor(...corTom(b.tom));
    doc.roundedRect(bx, ry + 1.8, Math.max(3, bw * pct), 3.6, 1.4, 1.4, "F");
    ry += 11.2;
  });

  pen.y = y + boxH + 4;
  if (p.legenda) {
    pen.writeLines(p.legenda, { fontSize: 9.2, lineHeight: 4.5, color: pen.colors.muted });
    pen.y += 2.5;
  }
}

// O registro no PDF: o resumo legível e o código em courier pequeno, quebrado em linhas
// sem espaço (quem lê junta as linhas).
function writeRegistro(pen, registro) {
  pen.ensureSpace(30);
  pen.y += 2;
  pen.doc.setDrawColor(...pen.colors.border);
  pen.doc.setLineWidth(0.4);
  pen.doc.line(pen.margin, pen.y, pen.pageWidth - pen.margin, pen.y);
  pen.y += 9;
  pen.writeLines(registro.titulo || "Seu registro", { fontSize: 14, lineHeight: 6.5, fontStyle: "bold", color: pen.colors.ink });
  pen.y += 2;
  (registro.resumo || []).forEach((linha) => {
    if (typeof linha === "string") {
      pen.writeLines(linha, { fontSize: 10, lineHeight: 5, color: pen.colors.ink });
    } else if (linha && linha.value) {
      pen.writeLines(linha.q, { fontSize: 8.6, lineHeight: 4.3, fontStyle: "bold", color: pen.colors.blue });
      pen.writeLines(linha.value, { fontSize: 10, lineHeight: 5, color: pen.colors.ink });
    }
    pen.y += 2;
  });
  if (!/^[A-Za-z0-9_-]{1,2048}$/.test(registro.codigo || "")) return;
  pen.y += 1;
  pen.writeLines("Código do registro (copie sem as quebras de linha para recuperar este resultado):", {
    fontSize: 8.6,
    lineHeight: 4.3,
    color: pen.colors.muted,
  });
  pen.y += 1.5;
  pen.doc.setFont("courier", "normal");
  pen.doc.setFontSize(8);
  pen.doc.setTextColor(...pen.colors.ink);
  for (let i = 0; i < registro.codigo.length; i += 96) {
    pen.ensureSpace(4.2);
    pen.doc.text(registro.codigo.slice(i, i + 96), pen.margin, pen.y);
    pen.y += 3.7;
  }
  pen.y += 2;
}

// Cabeça do resultado (e do checkpoint): a chamada, o veredito, os números e o texto.
// Devolve o título do veredito, que recebe o foco.
function appendResultHead(card, result, grade, el) {
  card.appendChild(el("p", "protocol-eyebrow section-eyebrow", result.eyebrow || "Seu resultado"));

  const verdictPanel = el("div", "protocol-verdict-panel");
  if (result.pill !== false) verdictPanel.appendChild(buildVerdictPill(grade, el));
  const verdictHeading = el("h2", "protocol-verdict", result.verdict);
  verdictHeading.tabIndex = -1;
  verdictPanel.appendChild(verdictHeading);
  card.appendChild(verdictPanel);

  if (result.stats && result.stats.length) {
    const stats = el("div", "protocol-result-stats");
    stats.setAttribute("role", "group");
    stats.setAttribute("aria-label", "Indicadores do resultado");
    result.stats.slice(0, 3).forEach((stat) => {
      const cell = el("div", "protocol-stat");
      cell.appendChild(el("span", "num-label", stat.label));
      cell.appendChild(el("strong", "num-value tnum", stat.value));
      stats.appendChild(cell);
    });
    card.appendChild(stats);
  }

  const copy = el("div", "protocol-result-copy");
  (result.body || []).forEach((p) => copy.appendChild(el("p", "protocol-body", p)));
  card.appendChild(copy);
  (result.sections || []).forEach((section, i) => {
    if (!section.depoisDoPlano) card.appendChild(buildSection(section, i, el));
  });
  return verdictHeading;
}

// Seção do resultado: título, parágrafos e itens (texto, ou { title, text }). `kind` só
// marca o tipo na classe, para o estilo.
function buildSection(section, index, el) {
  const kind = typeof section.kind === "string" && /^[a-z0-9-]{1,24}$/.test(section.kind) ? section.kind : "";
  const box = el("section", "protocol-section" + (kind ? " is-" + kind : ""));
  if (kind) box.dataset.kind = kind;
  const titleId = "protocol-section-" + (safeDomId(section.id == null ? index : section.id) || index);
  box.setAttribute("aria-labelledby", titleId);
  const title = el("h3", "protocol-section-title", section.title);
  title.id = titleId;
  box.appendChild(title);
  if (section.curva) box.appendChild(buildCurvaTeto(section.curva, el));
  if (section.painelDecisao) box.appendChild(buildPainelDecisao(section.painelDecisao, section.id == null ? index : section.id, el));
  (section.paragraphs || []).forEach((p) => box.appendChild(el("p", "protocol-body", p)));
  if (section.items && section.items.length) {
    const list = el("ul", "protocol-section-items");
    section.items.forEach((item) => {
      const li = el("li");
      if (item && typeof item === "object") {
        li.appendChild(el("strong", "protocol-section-item-title", item.title));
        if (item.text) li.appendChild(el("span", "protocol-section-item-text", item.text));
      } else {
        li.textContent = String(item);
      }
      list.appendChild(li);
    });
    box.appendChild(list);
  }
  return box;
}

const PROTOCOL_SVG_NS = "http://www.w3.org/2000/svg";
function protocolSvgEl(tag, attrs, text) {
  const node = typeof document.createElementNS === "function"
    ? document.createElementNS(PROTOCOL_SVG_NS, tag)
    : document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach((k) => {
      if (attrs[k] !== undefined && attrs[k] !== null) node.setAttribute(k, String(attrs[k]));
    });
  }
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

/**
 * O que faz: Renderiza a curva personalizada de resistência de um protocolo em SVG acessível com animação opt-in, repetição controlada e controles de repetir/pausar.
 * Por quê: Torna o gráfico personalizado de teto um componente visual padrão do kit de protocolos no navegador, sem HTML cru nem estilo inline.
 * Erro e ataque: Aceita apenas modos "estagna" ou "devolve", escapa todo texto via textContent e preserva o estado completo visível sob movimento reduzido.
 * Prova: tests/test_paid_reports.py e tests/js/teto-ato1.test.mjs.
 */
function buildCurvaTeto(curva, el) {
  const modo = curva && curva.modo === "devolve" ? "devolve" : "estagna";
  const fig = el("figure", "protocol-curva protocol-curva-" + modo);
  const topo = el("div", "protocol-curva-topo");
  topo.appendChild(el("p", "protocol-curva-titulo", curva.titulo || (modo === "devolve" ? "Curva do seu teto · Bate e devolve" : "Curva do seu teto · Empaca no marco")));
  topo.appendChild(el("span", "protocol-curva-selo protocol-curva-selo-" + modo, curva.selo || (modo === "devolve" ? "Toca e devolve" : "Toca e estagna")));
  fig.appendChild(topo);

  const palco = el("div", "protocol-curva-palco");
  const uid = Math.random().toString(36).slice(2, 7);
  const gradId = "pc-grad-" + modo + "-" + uid;
  const titleId = "pc-title-" + uid;
  const svg = protocolSvgEl("svg", { class: "protocol-curva-svg", viewBox: "0 0 420 218", role: "img", "aria-labelledby": titleId });
  svg.appendChild(protocolSvgEl("title", { id: titleId }, (curva.titulo || "Curva do seu teto") + ". " + (curva.legenda || "")));

  const defs = protocolSvgEl("defs");
  const grad = protocolSvgEl("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1" });
  const stopCor = modo === "devolve" ? "#f87171" : "#fbbf24";
  grad.appendChild(protocolSvgEl("stop", { offset: "0%", "stop-color": stopCor, "stop-opacity": "0.17" }));
  grad.appendChild(protocolSvgEl("stop", { offset: "100%", "stop-color": stopCor, "stop-opacity": "0" }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  const eixos = protocolSvgEl("g", { "aria-hidden": "true" });
  eixos.appendChild(protocolSvgEl("line", { class: "pc-ref", x1: "16", y1: "116", x2: "404", y2: "116" }));
  eixos.appendChild(protocolSvgEl("line", { class: "pc-base", x1: "16", y1: "168", x2: "404", y2: "168" }));
  eixos.appendChild(protocolSvgEl("rect", { class: "pc-faixa", x: "16", y: "57", width: "388", height: "14", rx: "2" }));
  eixos.appendChild(protocolSvgEl("line", { class: "pc-teto", x1: "16", y1: "64", x2: "404", y2: "64" }));
  eixos.appendChild(protocolSvgEl("line", { class: "pc-teto-pulso pc-pulso-" + modo, x1: "16", y1: "64", x2: "404", y2: "64" }));
  eixos.appendChild(protocolSvgEl("text", { class: "pc-teto-rot", x: "18", y: "54" }, String(curva.rotuloTeto || "TETO").slice(0, 26)));
  eixos.appendChild(protocolSvgEl("text", { class: "pc-eixo", x: "16", y: "208" }, String(curva.rotuloBase || "Patamar anterior").slice(0, 34)));
  eixos.appendChild(protocolSvgEl("text", { class: "pc-eixo pc-eixo-dir", x: "404", y: "208" }, "Ciclo no tempo →"));
  svg.appendChild(eixos);

  const marcadores = protocolSvgEl("g", { "aria-hidden": "true" });
  if (modo === "devolve") {
    svg.appendChild(protocolSvgEl("path", { class: "pc-area", fill: "url(#" + gradId + ")", d: "M 20 164 L 44 144 L 56 149 L 82 110 L 94 116 L 122 66 L 138 106 L 146 100 L 160 144 L 166 139 L 176 162 L 200 144 L 212 148 L 238 110 L 250 115 L 274 68 L 292 40 L 310 66 L 326 110 L 336 103 L 360 146 L 370 140 L 392 160 L 392 168 L 20 168 Z" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-subida pc-d-s1", pathLength: "100", d: "M 20 164 L 44 144 L 56 149 L 82 110 L 94 116 L 122 66" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-queda pc-d-s2", pathLength: "100", d: "M 122 66 L 138 106 L 146 100 L 160 144 L 166 139 L 176 162" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-subida pc-d-s3", pathLength: "100", d: "M 176 162 L 200 144 L 212 148 L 238 110 L 250 115 L 274 68 L 292 40" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-queda pc-d-s4", pathLength: "100", d: "M 292 40 L 310 66 L 326 110 L 336 103 L 360 146 L 370 140 L 392 160" }));

    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-anel pc-anel-queda pc-d-m1", cx: "122", cy: "66", r: "9" }));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-queda pc-d-m1", cx: "122", cy: "66", r: "3.8" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-teto pc-d-m1", x: "122", y: "45" }, String(curva.toque || "bate no teto").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-queda pc-d-t1", cx: "176", cy: "162", r: "3.5" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-queda pc-d-t1", x: "176", y: "186" }, String(curva.recuo || "devolve o ganho").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-anel pc-anel-pico pc-d-m2", cx: "292", cy: "40", r: "9" }));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-pico pc-d-m2", cx: "292", cy: "40", r: "3.8" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-pico pc-d-m2", x: "292", y: "22" }, String(curva.pico2 || "passa um pouco").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-queda pc-d-t2", cx: "392", cy: "160", r: "3.5" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-queda pc-d-t2", x: "366", y: "186" }, String(curva.fim || "cai de novo").slice(0, 22)));
  } else {
    svg.appendChild(protocolSvgEl("path", { class: "pc-area", fill: "url(#" + gradId + ")", d: "M 20 164 L 40 148 L 52 153 L 76 116 L 88 122 L 114 66 L 130 98 L 146 95 L 164 102 L 182 97 L 200 101 L 216 84 L 224 88 L 242 66 L 260 100 L 278 96 L 296 103 L 314 98 L 332 101 L 348 84 L 356 88 L 374 66 L 388 94 L 400 96 L 400 168 L 20 168 Z" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-subida pc-e-s1", pathLength: "100", d: "M 20 164 L 40 148 L 52 153 L 76 116 L 88 122 L 114 66" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-estagna pc-e-s2", pathLength: "100", d: "M 114 66 L 130 98 L 146 95 L 164 102 L 182 97 L 200 101" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-subida pc-e-s3", pathLength: "100", d: "M 200 101 L 216 84 L 224 88 L 242 66" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-estagna pc-e-s4", pathLength: "100", d: "M 242 66 L 260 100 L 278 96 L 296 103 L 314 98 L 332 101" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-subida pc-e-s5", pathLength: "100", d: "M 332 101 L 348 84 L 356 88 L 374 66" }));
    svg.appendChild(protocolSvgEl("path", { class: "pc-seg pc-estagna pc-e-s6", pathLength: "100", d: "M 374 66 L 388 94 L 400 96" }));

    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-anel pc-anel-teto pc-e-m1", cx: "114", cy: "66", r: "9" }));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-teto pc-e-m1", cx: "114", cy: "66", r: "3.8" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-teto pc-e-m1", x: "114", y: "45" }, String(curva.toque || "1º toque").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-estagna pc-e-t1", x: "164", y: "134" }, String(curva.recuo || "recua e estagna").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-anel pc-anel-teto pc-e-m2", cx: "242", cy: "66", r: "9" }));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-teto pc-e-m2", cx: "242", cy: "66", r: "3.8" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-teto pc-e-m2", x: "242", y: "45" }, String(curva.pico2 || "2º toque").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-estagna pc-e-t2", x: "296", y: "134" }, String(curva.fim || "estagna de novo").slice(0, 22)));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-anel pc-anel-teto pc-e-m3", cx: "374", cy: "66", r: "9" }));
    marcadores.appendChild(protocolSvgEl("circle", { class: "pc-ponto pc-ponto-teto pc-e-m3", cx: "374", cy: "66", r: "3.8" }));
    marcadores.appendChild(protocolSvgEl("text", { class: "pc-nota pc-nota-teto pc-e-m3", x: "374", y: "45" }, "3º toque"));
  }
  svg.appendChild(marcadores);
  palco.appendChild(svg);
  fig.appendChild(palco);
  if (curva.legenda) fig.appendChild(el("figcaption", "protocol-curva-legenda", curva.legenda));

  const reduzido = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduzido) {
    const acoes = el("div", "protocol-curva-acoes");
    const btnRepetir = el("button", "btn btn-secondary protocol-curva-btn", "Ver de novo");
    btnRepetir.type = "button";
    const btnPausar = el("button", "btn btn-secondary protocol-curva-btn", "Pausar animação");
    btnPausar.type = "button";
    let pausado = false;
    let timer = null;
    const limpar = () => { if (timer) { window.clearTimeout(timer); timer = null; } };
    const tocar = () => {
      limpar();
      fig.classList.remove("tocando");
      void fig.offsetWidth;
      fig.classList.add("tocando");
      if (!pausado) {
        timer = window.setTimeout(() => {
          if (!fig.isConnected || pausado || document.visibilityState !== "visible") return;
          tocar();
        }, 9200);
      }
    };
    btnRepetir.addEventListener("click", tocar);
    btnPausar.addEventListener("click", () => {
      pausado = !pausado;
      btnPausar.textContent = pausado ? "Reproduzir animação" : "Pausar animação";
      if (pausado) {
        limpar();
        fig.classList.remove("tocando");
        delete fig.dataset.pcPronto;
      } else {
        fig.dataset.pcPronto = "1";
        tocar();
      }
    });
    acoes.appendChild(btnRepetir);
    acoes.appendChild(btnPausar);
    fig.appendChild(acoes);
    fig.dataset.pcPronto = "1";
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => window.requestAnimationFrame(tocar));
    } else {
      tocar();
    }
  }
  return fig;
}

/**
 * O que faz: Renderiza o painel visual SVG personalizado do Decisão Fria (barras de limite em reais ou leitura dos 4 eixos da decisão) com IDs determinísticos.
 * Por quê: Entrega visualização imediata na versão básica gratuita, respeitando prefers-reduced-motion e mantendo o DOM seguro e determinístico para testes.
 * Erro e ataque: Limita proporções a [0, 1], valida classes de tom contra lista fixa e escapa todo texto via textContent sem HTML cru.
 * Prova: tests/js/decisao-fria-limite.test.mjs e tests/js/golden.test.mjs.
 */
function buildPainelDecisao(dados, domKey, el) {
  const modo = dados && dados.modo === "limite" ? "limite" : "sinais";
  const barras = Array.isArray(dados && dados.barras) ? dados.barras.slice(0, 4) : [];
  const TONS = { verde: "verde", azul: "azul", ambar: "ambar", vermelho: "vermelho" };
  const tomSeguro = (t) => TONS[t] || "azul";

  const fig = el("figure", "protocol-df-graf protocol-df-" + modo);
  const topo = el("div", "protocol-curva-topo");
  topo.appendChild(el("p", "protocol-curva-titulo", dados.titulo || "Painel visual desta decisão"));
  if (dados.selo) {
    topo.appendChild(el("span", "protocol-df-selo is-" + tomSeguro(dados.seloTom), dados.selo));
  }
  fig.appendChild(topo);

  const palco = el("div", "protocol-curva-palco");
  const titleId = "pdf-graf-title-" + (safeDomId(domKey) || "0");
  const altura = 18 + barras.length * 42;
  const svg = protocolSvgEl("svg", {
    class: "protocol-df-svg",
    viewBox: "0 0 420 " + altura,
    role: "img",
    "aria-labelledby": titleId,
  });
  svg.appendChild(protocolSvgEl("title", { id: titleId }, (dados.titulo || "Painel visual") + ". " + (dados.legenda || "")));

  const x0 = 14;
  const largura = 392;
  const guia = typeof dados.linhaLimite === "number" && dados.linhaLimite > 0 && dados.linhaLimite <= 1
    ? x0 + Math.round(largura * dados.linhaLimite)
    : null;

  if (guia !== null) {
    svg.appendChild(protocolSvgEl("line", {
      class: "pdf-guia-limite",
      x1: guia,
      y1: 12,
      x2: guia,
      y2: altura - 8,
      "aria-hidden": "true",
    }));
  }

  barras.forEach((b, i) => {
    const gy = 18 + i * 42;
    const pct = Math.max(0.03, Math.min(1, Number(b.proporcao) || 0));
    const w = Math.max(10, Math.round(largura * pct));
    const tom = tomSeguro(b.tom);
    const g = protocolSvgEl("g", { class: "pdf-linha", "aria-hidden": "true" });
    g.appendChild(protocolSvgEl("text", { class: "pdf-rot", x: x0, y: gy }, String(b.rotulo || "")));
    g.appendChild(protocolSvgEl("text", { class: "pdf-val is-" + tom, x: x0 + largura, y: gy }, String(b.valorTexto || "")));
    g.appendChild(protocolSvgEl("rect", { class: "pdf-trilho", x: x0, y: gy + 7, width: largura, height: 11, rx: 5.5 }));
    g.appendChild(protocolSvgEl("rect", {
      class: "pdf-barra is-" + tom + " pdf-b-" + (i + 1),
      x: x0,
      y: gy + 7,
      width: w,
      height: 11,
      rx: 5.5,
    }));
    svg.appendChild(g);
  });

  palco.appendChild(svg);
  fig.appendChild(palco);
  if (dados.legenda) fig.appendChild(el("figcaption", "protocol-curva-legenda", dados.legenda));
  return fig;
}

// ---- recursos novos (usam o kit): tipos de passo, progresso e complemento ----
// Cada controle devolve { node, ready(), commit(answers) }: `ready` diz se a
// resposta dele já é válida e `commit` a grava em `answers`. Só createElement e
// textContent; nenhum texto vira HTML.

const PROTOCOL_KIT_STEP_TYPES = ["multi", "scale", "grade", "triad"];

// O protocolo declara algo que só o kit sabe tratar?
function protocolNeedsKit(protocol) {
  if (protocol.progresso === "grupos" || protocol.persist || protocol.retornos || protocol.importar) return true;
  return (protocol.steps || []).some((step) =>
    PROTOCOL_KIT_STEP_TYPES.indexOf(step.type) !== -1 ||
    step.type === "checkpoint" ||
    typeof step.showIf === "function" ||
    Boolean(step.followUp) ||
    Boolean(step.grupo) ||
    typeof step.value === "function" ||
    typeof step.maxLength === "number"
  );
}

// O passo precisa de um controle próprio, em vez do clique que avança sozinho?
function stepUsesControls(step) {
  if (PROTOCOL_KIT_STEP_TYPES.indexOf(step.type) !== -1 || step.followUp) return true;
  return step.type === "write" && (typeof step.value === "function" || typeof step.maxLength === "number");
}

function safeDomId(texto) {
  return String(texto).replace(/[^A-Za-z0-9_-]/g, "");
}

// Progresso dos protocolos que usam o kit: conta só os passos visíveis e, com
// `protocol.progresso = "grupos"`, mostra "Ato 1 · 5 de 20" com uma barra.
// Os pontos ficam para 12 passos ou menos.
function buildKitProgress(el, protocol, kit, index, answers) {
  const step = protocol.steps[index];
  const grouped = protocol.progresso === "grupos" && Boolean(step.grupo);
  const pos = grouped
    ? kit.posicaoNoGrupo(protocol.steps, index, answers)
    : kit.posicaoNoProtocolo(protocol.steps, index, answers);
  const progress = el("div", "protocol-progress");
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-valuemin", "1");
  progress.setAttribute("aria-valuemax", String(pos.total));
  progress.setAttribute("aria-valuenow", String(pos.posicao));
  progress.appendChild(el("span", "protocol-progress-label",
    grouped ? pos.grupo + " · " + pos.posicao + " de " + pos.total : "Passo " + pos.posicao + " de " + pos.total));
  if (grouped) {
    const track = el("span", "protocol-progress-track");
    track.setAttribute("aria-hidden", "true");
    const fill = el("span", "protocol-progress-fill");
    fill.style.width = Math.round((pos.posicao / pos.total) * 100) + "%";
    track.appendChild(fill);
    progress.appendChild(track);
  } else if (pos.total <= 12) {
    const dots = el("span", "protocol-progress-dots");
    for (let i = 1; i <= pos.total; i += 1) {
      const dot = el("span", "protocol-progress-dot" + (i < pos.posicao ? " is-done" : i === pos.posicao ? " is-current" : ""));
      dot.setAttribute("aria-hidden", "true");
      dots.appendChild(dot);
    }
    progress.appendChild(dots);
  }
  return progress;
}

// Botão de marcar (aria-pressed), no mesmo gesto do .choice-row.
function buildToggleRow(ctx, label, pressed, onClick, extraClass) {
  const b = ctx.el("button", "choice-row" + (extraClass ? " " + extraClass : ""));
  b.type = "button";
  const dot = ctx.el("span", "choice-dot");
  dot.setAttribute("aria-hidden", "true");
  b.appendChild(dot);
  b.appendChild(ctx.el("span", "choice-label", label));
  b.setAttribute("aria-pressed", String(pressed));
  b.addEventListener("click", onClick);
  return b;
}

function buildOptionsGroup(ctx, labelledBy) {
  const group = ctx.el("div", "protocol-options choice-list");
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", labelledBy);
  return group;
}

function buildMainControl(step, ctx) {
  if (step.type === "choice") return buildChoiceControl(step, ctx);
  if (step.type === "multi") return buildMultiControl(step, ctx);
  if (step.type === "scale") return buildScaleControl(step, ctx, step.id, "protocol-question");
  if (step.type === "grade") return buildGradeControl(step, ctx);
  if (step.type === "triad") return buildTriadControl(step, ctx);
  return buildWriteControl(step, ctx, step.id, "protocol-question", false);
}

// Escolha que não avança sozinha (tem complemento): marca e espera "Continuar".
function buildChoiceControl(step, ctx) {
  const options = ctx.kit.opcoesDoPasso(step, ctx.answers);
  const saved = ctx.answers[step.id];
  let selected = options.find((o) => o.value === saved) || null;
  const group = buildOptionsGroup(ctx, "protocol-question");
  const rows = options.map((opt) => {
    const b = buildToggleRow(ctx, opt.label, selected === opt, () => {
      selected = opt;
      rows.forEach((row) => row.setAttribute("aria-pressed", String(row === b)));
      ctx.changed();
    });
    group.appendChild(b);
    return b;
  });
  return {
    node: group,
    ready: () => selected !== null,
    commit(answers) {
      answers[step.id] = selected.value;
      answers[step.id + "__label"] = selected.label;
    },
  };
}

// Vários: marca e desmarca; a opção `exclusive` limpa as outras (e é limpa por elas).
function buildMultiControl(step, ctx) {
  const options = ctx.kit.opcoesDoPasso(step, ctx.answers);
  const first = ctx.kit.validarResposta(step, ctx.answers[step.id], ctx.answers);
  let chosen = first.ok ? first.valor.slice() : [];
  const group = buildOptionsGroup(ctx, "protocol-question");
  const rows = options.map((opt) => {
    const b = buildToggleRow(ctx, opt.label, chosen.indexOf(opt.value) !== -1, () => {
      if (chosen.indexOf(opt.value) !== -1) {
        chosen = chosen.filter((v) => v !== opt.value);
      } else if (step.exclusive !== undefined && opt.value === step.exclusive) {
        chosen = [opt.value];
      } else {
        chosen = chosen.filter((v) => v !== step.exclusive).concat([opt.value]);
      }
      rows.forEach((row, i) => row.setAttribute("aria-pressed", String(chosen.indexOf(options[i].value) !== -1)));
      ctx.changed();
    }, "choice-multi");
    group.appendChild(b);
    return b;
  });
  const ordered = () => options.filter((o) => chosen.indexOf(o.value) !== -1);
  return {
    node: group,
    ready: () => ctx.kit.validarResposta(step, ordered().map((o) => o.value), ctx.answers).ok,
    commit(answers) {
      const picked = ordered();
      answers[step.id] = picked.map((o) => o.value);
      answers[step.id + "__labels"] = picked.map((o) => o.label);
    },
  };
}

// Régua em botões (sem <input type="range">): nenhum valor vem marcado, para não ancorar a resposta.
function buildScaleControl(cfg, ctx, key, labelledBy) {
  const min = typeof cfg.min === "number" ? cfg.min : 0;
  const max = typeof cfg.max === "number" ? cfg.max : 10;
  const stepSize = typeof cfg.step === "number" && cfg.step > 0 ? cfg.step : 1;
  const check = { type: "scale", min, max, step: stepSize };
  const saved = ctx.kit.validarResposta(check, ctx.answers[key]);
  let value = saved.ok ? saved.valor : null;
  const wrap = ctx.el("div", "protocol-scale");
  const group = ctx.el("div", "protocol-scale-row");
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", labelledBy);
  const buttons = [];
  for (let v = min; v <= max + 1e-9; v += stepSize) {
    const n = Math.round(v * 1e6) / 1e6;
    const b = ctx.el("button", "protocol-scale-btn", String(n) + (cfg.format || ""));
    b.type = "button";
    b.setAttribute("aria-pressed", String(value === n));
    b.addEventListener("click", () => {
      value = n;
      buttons.forEach((other) => other.btn.setAttribute("aria-pressed", String(other.n === value)));
      ctx.changed();
    });
    buttons.push({ btn: b, n });
    group.appendChild(b);
  }
  wrap.appendChild(group);
  if (cfg.ends && (cfg.ends.min || cfg.ends.max)) {
    const ends = ctx.el("p", "protocol-scale-ends");
    ends.appendChild(ctx.el("span", null, cfg.ends.min || ""));
    ends.appendChild(ctx.el("span", null, cfg.ends.max || ""));
    wrap.appendChild(ends);
  }
  return {
    node: wrap,
    ready: () => value !== null,
    commit(answers) { answers[key] = value; },
  };
}

// Grade: uma linha por item, as mesmas opções (ou as do item) em cada uma.
function buildGradeControl(step, ctx) {
  const saved = ctx.kit.validarResposta(step, ctx.answers[step.id], ctx.answers);
  const current = {};
  if (saved.ok) Object.keys(saved.valor).forEach((k) => { current[k] = saved.valor[k]; });
  const wrap = ctx.el("div", "protocol-grade");
  ctx.kit.itensDoPasso(step, ctx.answers).forEach((item) => {
    const row = ctx.el("div", "protocol-grade-item");
    const labelId = "protocol-grade-" + safeDomId(step.id) + "-" + safeDomId(item.id);
    const label = ctx.el("p", "protocol-grade-label", item.label);
    label.id = labelId;
    row.appendChild(label);
    const group = ctx.el("div", "protocol-grade-options");
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", labelId);
    const options = ctx.kit.opcoesDoPasso(item.options ? item : step, ctx.answers);
    const buttons = options.map((opt) => {
      const b = ctx.el("button", "protocol-grade-btn", opt.label);
      b.type = "button";
      b.setAttribute("aria-pressed", String(current[item.id] === opt.value));
      b.addEventListener("click", () => {
        current[item.id] = opt.value;
        buttons.forEach((other, i) => other.setAttribute("aria-pressed", String(options[i].value === opt.value)));
        ctx.changed();
      });
      group.appendChild(b);
      return b;
    });
    row.appendChild(group);
    wrap.appendChild(row);
  });
  return {
    node: wrap,
    ready: () => ctx.kit.validarResposta(step, current, ctx.answers).ok,
    commit(answers) { answers[step.id] = ctx.kit.validarResposta(step, current, ctx.answers).valor; },
  };
}

// Tríade de escolha forçada: um item é o "mais", outro o "menos", nunca o mesmo.
function buildTriadControl(step, ctx) {
  const labels = Object.assign({ mais: "Mais como eu", menos: "Menos como eu" }, step.labels);
  const saved = ctx.kit.validarResposta(step, ctx.answers[step.id]);
  const picks = { mais: saved.ok ? saved.valor.mais : null, menos: saved.ok ? saved.valor.menos : null };
  const wrap = ctx.el("div", "protocol-triad");
  const buttons = [];
  const paint = () => buttons.forEach((b) => b.node.setAttribute("aria-pressed", String(picks[b.kind] === b.id)));
  step.items.forEach((item) => {
    const row = ctx.el("div", "protocol-triad-item");
    const labelId = "protocol-triad-" + safeDomId(step.id) + "-" + safeDomId(item.id);
    const label = ctx.el("p", "protocol-triad-label", item.label);
    label.id = labelId;
    row.appendChild(label);
    const group = ctx.el("div", "protocol-triad-options");
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", labelId);
    ["mais", "menos"].forEach((kind) => {
      const other = kind === "mais" ? "menos" : "mais";
      const b = ctx.el("button", "protocol-triad-btn is-" + kind, labels[kind]);
      b.type = "button";
      b.setAttribute("aria-label", labels[kind] + ": " + item.label);
      b.addEventListener("click", () => {
        if (picks[kind] === item.id) picks[kind] = null;
        else {
          picks[kind] = item.id;
          if (picks[other] === item.id) picks[other] = null;
        }
        paint();
        ctx.changed();
      });
      buttons.push({ node: b, kind, id: item.id });
      group.appendChild(b);
    });
    row.appendChild(group);
    wrap.appendChild(row);
  });
  paint();
  return {
    node: wrap,
    ready: () => ctx.kit.validarResposta(step, picks).ok,
    commit(answers) { answers[step.id] = ctx.kit.validarResposta(step, picks).valor; },
  };
}

// Escrita. Passo principal: pode seguir em branco, como sempre. Complemento
// (`isFollowUp`): só em branco quando declara `optional`. O texto vem
// pré-preenchido por `value(answers)` só enquanto não há resposta.
function buildWriteControl(cfg, ctx, key, labelledBy, isFollowUp) {
  const ta = ctx.el("textarea", "protocol-write");
  ta.rows = isFollowUp ? 3 : 4;
  ta.placeholder = cfg.placeholder || "Escreva com suas palavras…";
  ta.setAttribute("aria-labelledby", labelledBy);
  if (typeof cfg.maxLength === "number") ta.maxLength = cfg.maxLength;
  const saved = ctx.answers[key];
  if (typeof saved === "string") ta.value = saved;
  else if (typeof cfg.value === "function") ta.value = String(cfg.value(ctx.answers) || "");
  ta.addEventListener("input", () => ctx.changed());
  const normalized = () => {
    const rule = isFollowUp ? ctx.kit.validarComplemento : ctx.kit.validarResposta;
    return rule({ type: "write", maxLength: cfg.maxLength, optional: cfg.optional }, ta.value);
  };
  return {
    node: ta,
    ready: () => normalized().ok,
    commit(answers) { answers[key] = normalized().valor; },
  };
}

// Complemento na mesma tela: um texto curto ou uma régua, com a própria pergunta.
function buildFollowUpControl(followUp, ctx) {
  const box = ctx.el("section", "protocol-followup");
  const labelId = "protocol-followup-" + safeDomId(followUp.id);
  const label = ctx.el("p", "protocol-followup-q", ctx.resolve(followUp.prompt));
  label.id = labelId;
  box.appendChild(label);
  const control = followUp.type === "scale"
    ? buildScaleControl(followUp, ctx, followUp.id, labelId)
    : buildWriteControl(followUp, ctx, followUp.id, labelId, true);
  box.appendChild(control.node);
  return { node: box, ready: control.ready, commit: control.commit };
}

// No navegador estas funções são globais; no Node os testes as carregam por require().
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    runProtocol,
    resultGrade,
    buildVerdictPill,
    buildLadder,
    buildPaidReportOffer,
    paidReportCheckoutUrl,
    paidReportPageUrl,
    safePdfText,
    buildMarkdown,
    downloadTextFile,
    layoutCartao,
    buildCardButtons,
    downloadProtocolPdf,
    buildSection,
    fileNameFor,
    protocolNeedsKit,
    stepUsesControls,
  };
}

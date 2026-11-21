/* Funções puras dos protocolos: o que decide qual passo vem a seguir, quais
   respostas valem e o que sai do caminho. Sem DOM, sem relógio, sem rede.
   O navegador usa window.DLTProtocolKit; os testes usam require() no Node.
   O motor (js/protocol-engine.js) só chama este arquivo nos protocolos que
   declaram os recursos novos; os demais não carregam nem precisam dele. */
(function (root) {
  "use strict";

  var TIPOS_NOVOS = ["multi", "scale", "grade", "triad"];

  function resolverValor(valor, answers) {
    return typeof valor === "function" ? valor(answers) : valor;
  }

  function ehObjetoSimples(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  // ---- passo visível e próximo passo -------------------------------------

  // Sem showIf o passo sempre aparece. Com showIf, aparece quando a função
  // devolve verdadeiro para as respostas até aqui.
  function passoVisivel(step, answers) {
    if (!step || typeof step.showIf !== "function") return true;
    return Boolean(step.showIf(answers || {}));
  }

  // Índice do próximo passo a mostrar depois de `indice` (-1 para o primeiro).
  // `next()` do passo manda para um id (string) ou encerra (null); sem ele o
  // fluxo segue em ordem. Passos ocultos por showIf são pulados. Devolve
  // steps.length quando não há mais passo.
  function proximoIndice(steps, indice, answers) {
    var atual = steps[indice];
    var alvo = indice + 1;
    if (atual && typeof atual.next === "function") {
      var destino = atual.next(answers);
      if (destino === null) return steps.length;
      if (typeof destino === "string") {
        var achado = -1;
        for (var i = 0; i < steps.length; i += 1) {
          if (steps[i].id === destino) { achado = i; break; }
        }
        alvo = achado === -1 ? indice + 1 : achado;
      }
    }
    while (alvo < steps.length && !passoVisivel(steps[alvo], answers)) alvo += 1;
    return alvo;
  }

  // Ids dos passos visíveis, na ordem; com `grupo`, só os desse grupo.
  function passosVisiveis(steps, answers, grupo) {
    var ids = [];
    steps.forEach(function (step) {
      if (grupo !== undefined && step.grupo !== grupo) return;
      if (passoVisivel(step, answers)) ids.push(step.id);
    });
    return ids;
  }

  // Onde o passo está entre os visíveis do `grupo` (ou de todos, sem grupo):
  // { grupo, posicao, total }.
  function posicaoEm(steps, indice, answers, grupo) {
    var step = steps[indice];
    var ids = passosVisiveis(steps, answers, grupo);
    var posicao = ids.indexOf(step ? step.id : undefined) + 1;
    if (posicao === 0) {
      posicao = 1;
      for (var i = 0; i < indice; i += 1) {
        if ((grupo === undefined || steps[i].grupo === grupo) && passoVisivel(steps[i], answers)) posicao += 1;
      }
    }
    return { grupo: grupo, posicao: posicao, total: Math.max(ids.length, posicao) };
  }

  function posicaoNoGrupo(steps, indice, answers) {
    return posicaoEm(steps, indice, answers, steps[indice] ? steps[indice].grupo : undefined);
  }

  function posicaoNoProtocolo(steps, indice, answers) {
    return posicaoEm(steps, indice, answers, undefined);
  }

  // ---- respostas que ficaram fora do caminho ------------------------------

  // Chaves de `answers` que pertencem a um passo: a resposta, o rótulo e a do
  // complemento.
  function chavesDoPasso(step) {
    var chaves = [step.id, step.id + "__label", step.id + "__labels"];
    if (step.followUp && step.followUp.id) chaves.push(step.followUp.id, step.followUp.id + "__label");
    return chaves;
  }

  // Cópia de `answers` sem as respostas dos passos que não estão no caminho.
  // `caminho` lista os passos respondidos, por id ou por índice. Chave que não
  // pertence a nenhum passo fica como está.
  function limparForaDoCaminho(steps, caminho, answers) {
    var noCaminho = {};
    (caminho || []).forEach(function (item) {
      var step = typeof item === "number" ? steps[item] : steps.filter(function (s) { return s.id === item; })[0];
      if (step) noCaminho[step.id] = true;
    });
    var dosPassos = {};
    var doCaminho = {};
    steps.forEach(function (step) {
      chavesDoPasso(step).forEach(function (chave) {
        dosPassos[chave] = true;
        if (noCaminho[step.id]) doCaminho[chave] = true;
      });
    });
    var limpo = {};
    Object.keys(answers || {}).forEach(function (chave) {
      if (!dosPassos[chave] || doCaminho[chave]) limpo[chave] = answers[chave];
    });
    return limpo;
  }

  // ---- validação de cada resposta -----------------------------------------

  // Opções do passo (ou de um item da grade) já resolvidas.
  function opcoesDoPasso(step, answers) {
    var lista = resolverValor(step.options, answers);
    return Array.isArray(lista) ? lista : [];
  }

  function valoresDe(opcoes) {
    return opcoes.map(function (o) { return o.value; });
  }

  // O texto sem espaço nas pontas e cortado em `max` unidades, sem deixar meio
  // par substituto para trás.
  function cortarTexto(texto, max) {
    var t = String(texto).trim();
    if (!(max > 0) || t.length <= max) return t;
    var corte = t.slice(0, max);
    var ultimo = corte.charCodeAt(corte.length - 1);
    if (ultimo >= 0xd800 && ultimo <= 0xdbff) corte = corte.slice(0, -1);
    return corte;
  }

  function validarEscala(cfg, valor) {
    var min = typeof cfg.min === "number" ? cfg.min : 0;
    var max = typeof cfg.max === "number" ? cfg.max : 10;
    var passo = typeof cfg.step === "number" && cfg.step > 0 ? cfg.step : 1;
    if (typeof valor !== "number" || !isFinite(valor)) return { ok: false, erro: "tipo" };
    if (valor < min || valor > max) return { ok: false, erro: "faixa" };
    var k = (valor - min) / passo;
    if (Math.abs(k - Math.round(k)) > 1e-9) return { ok: false, erro: "passo" };
    return { ok: true, valor: valor };
  }

  function validarGrade(step, valor, answers) {
    if (!ehObjetoSimples(valor)) return { ok: false, erro: "tipo" };
    var itens = step.items || [];
    var ids = itens.map(function (i) { return i.id; });
    var chaves = Object.keys(valor);
    for (var c = 0; c < chaves.length; c += 1) {
      if (ids.indexOf(chaves[c]) === -1) return { ok: false, erro: "item" };
    }
    var saida = {};
    for (var i = 0; i < itens.length; i += 1) {
      var item = itens[i];
      if (!Object.prototype.hasOwnProperty.call(valor, item.id)) return { ok: false, erro: "incompleto" };
      var opcoes = valoresDe(opcoesDoPasso(item.options ? item : step, answers));
      if (opcoes.indexOf(valor[item.id]) === -1) return { ok: false, erro: "opcao" };
      saida[item.id] = valor[item.id];
    }
    return { ok: true, valor: saida };
  }

  function validarTriade(step, valor) {
    if (!ehObjetoSimples(valor)) return { ok: false, erro: "tipo" };
    var ids = (step.items || []).map(function (i) { return i.id; });
    if (ids.indexOf(valor.mais) === -1 || ids.indexOf(valor.menos) === -1) return { ok: false, erro: "item" };
    if (valor.mais === valor.menos) return { ok: false, erro: "igual" };
    return { ok: true, valor: { mais: valor.mais, menos: valor.menos } };
  }

  function validarMulti(step, valor, answers) {
    if (!Array.isArray(valor)) return { ok: false, erro: "tipo" };
    var opcoes = opcoesDoPasso(step, answers);
    var permitidos = valoresDe(opcoes);
    for (var i = 0; i < valor.length; i += 1) {
      if (permitidos.indexOf(valor[i]) === -1) return { ok: false, erro: "opcao" };
    }
    var unicos = permitidos.filter(function (v) { return valor.indexOf(v) !== -1; });
    if (unicos.length !== valor.length) return { ok: false, erro: "repetida" };
    if (step.exclusive !== undefined && unicos.indexOf(step.exclusive) !== -1 && unicos.length > 1) {
      return { ok: false, erro: "exclusivo" };
    }
    var minimo = typeof step.min === "number" ? step.min : 1;
    if (unicos.length < minimo) return { ok: false, erro: "poucas" };
    if (typeof step.max === "number" && unicos.length > step.max) return { ok: false, erro: "muitas" };
    return { ok: true, valor: unicos };
  }

  // { ok, valor } com a resposta normalizada, ou { ok: false, erro }.
  // `step` pode ser um passo ou o complemento (followUp), que tem o mesmo formato.
  // `answers` só é preciso quando as opções são uma função das respostas.
  function validarResposta(step, valor, answers) {
    switch (step.type) {
      case "choice": {
        var permitidos = valoresDe(opcoesDoPasso(step, answers));
        return permitidos.indexOf(valor) === -1 ? { ok: false, erro: "opcao" } : { ok: true, valor: valor };
      }
      case "multi": return validarMulti(step, valor, answers);
      case "scale": return validarEscala(step, valor);
      case "grade": return validarGrade(step, valor, answers);
      case "triad": return validarTriade(step, valor);
      case "write": {
        if (typeof valor !== "string") return { ok: false, erro: "tipo" };
        return { ok: true, valor: cortarTexto(valor, step.maxLength) };
      }
      default:
        return { ok: false, erro: "tipo" };
    }
  }

  // O complemento (followUp) tem o formato de um passo de escrita ou de régua.
  // Escrito, ele só pode ficar em branco quando declara `optional: true`.
  function validarComplemento(complemento, valor) {
    var r = validarResposta(complemento, valor);
    if (r.ok && complemento.type === "write" && complemento.optional !== true && r.valor === "") {
      return { ok: false, erro: "vazio" };
    }
    return r;
  }

  var api = {
    TIPOS_NOVOS: TIPOS_NOVOS,
    passoVisivel: passoVisivel,
    proximoIndice: proximoIndice,
    passosVisiveis: passosVisiveis,
    posicaoNoGrupo: posicaoNoGrupo,
    posicaoNoProtocolo: posicaoNoProtocolo,
    chavesDoPasso: chavesDoPasso,
    limparForaDoCaminho: limparForaDoCaminho,
    opcoesDoPasso: opcoesDoPasso,
    cortarTexto: cortarTexto,
    validarResposta: validarResposta,
    validarComplemento: validarComplemento,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DLTProtocolKit = api;
})(typeof self !== "undefined" ? self : this);

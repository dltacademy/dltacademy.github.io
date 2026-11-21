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

  // Ids dos passos visíveis, na ordem; com `grupo`, só os desse grupo. O
  // checkpoint é uma tela de resultado parcial, não uma pergunta: não entra na conta.
  function passosVisiveis(steps, answers, grupo) {
    var ids = [];
    steps.forEach(function (step) {
      if (step.type === "checkpoint") return;
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

  // Itens de uma grade: uma lista fixa ou uma função das respostas (a grade das frases,
  // por exemplo, só sabe quais itens mostrar depois das tríades).
  function itensDoPasso(step, answers) {
    var lista = resolverValor(step.items, answers);
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
    var itens = itensDoPasso(step, answers);
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

  // ---- texto e bytes -------------------------------------------------------

  // Quantos bytes o texto ocupa em UTF-8 (par substituto solto vale U+FFFD, 3 bytes).
  function bytesUtf8(texto) {
    var t = String(texto);
    var total = 0;
    for (var i = 0; i < t.length; i += 1) {
      var c = t.charCodeAt(i);
      if (c < 0x80) total += 1;
      else if (c < 0x800) total += 2;
      else if (c >= 0xd800 && c <= 0xdbff && i + 1 < t.length && t.charCodeAt(i + 1) >= 0xdc00 && t.charCodeAt(i + 1) <= 0xdfff) {
        total += 4;
        i += 1;
      } else total += 3;
    }
    return total;
  }

  // ---- datas civis (AAAA-MM-DD), sem fuso ----------------------------------

  var RE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

  function dataParaUtc(dataISO) {
    var m = typeof dataISO === "string" ? RE_DATA.exec(dataISO) : null;
    if (!m) return NaN;
    var ano = Number(m[1]);
    var mes = Number(m[2]);
    var dia = Number(m[3]);
    var ms = Date.UTC(ano, mes - 1, dia);
    var d = new Date(ms);
    return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia ? ms : NaN;
  }

  function dataValida(dataISO) {
    return !isNaN(dataParaUtc(dataISO));
  }

  function doisDigitos(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function utcParaData(ms) {
    var d = new Date(ms);
    return String(d.getUTCFullYear()).padStart(4, "0") + "-" + doisDigitos(d.getUTCMonth() + 1) + "-" + doisDigitos(d.getUTCDate());
  }

  // A data civil de `n` dias depois (ou antes, se negativo); null se a entrada não é uma data.
  function somarDias(dataISO, n) {
    var ms = dataParaUtc(dataISO);
    if (isNaN(ms) || !Number.isInteger(n)) return null;
    return utcParaData(ms + n * 86400000);
  }

  // Dias corridos de `a` até `b` (positivo quando b é depois); null se alguma não é data.
  function diasEntre(a, b) {
    var x = dataParaUtc(a);
    var y = dataParaUtc(b);
    if (isNaN(x) || isNaN(y)) return null;
    return Math.round((y - x) / 86400000);
  }

  // As datas de um ciclo: { d0, d<n> ... } para cada n de `dias`.
  function datasDoCiclo(dia0, dias) {
    if (!dataValida(dia0)) return null;
    var saida = { d0: dia0 };
    (dias || []).forEach(function (n) {
      saida["d" + n] = somarDias(dia0, n);
    });
    return saida;
  }

  // A data civil local de um Date (o dia que a pessoa está vivendo).
  function dataISO(data) {
    return String(data.getFullYear()).padStart(4, "0") + "-" + doisDigitos(data.getMonth() + 1) + "-" + doisDigitos(data.getDate());
  }

  // ---- cópia segura de dados lidos de fora ---------------------------------

  var CHAVES_PERIGOSAS = ["__proto__", "constructor", "prototype"];

  function novoObjeto() {
    return Object.create(null);
  }

  function chaveSegura(chave) {
    return typeof chave === "string" && chave.length > 0 && chave.length <= 96 && CHAVES_PERIGOSAS.indexOf(chave) === -1;
  }

  // Cópia só com o que o JSON tem de seguro: nulo, booleano, número finito, texto
  // (até 20 mil unidades), lista (até 500) e objeto (até 300 chaves, sem as de
  // protótipo), em até 6 níveis. Qualquer folha fora disso derruba a chave que a
  // contém; no mais, devolve undefined. Objetos saem sem protótipo.
  function copiaSegura(valor, profundidade) {
    var nivel = profundidade === undefined ? 0 : profundidade;
    if (valor === null) return null;
    var tipo = typeof valor;
    if (tipo === "boolean") return valor;
    if (tipo === "number") return isFinite(valor) ? valor : undefined;
    if (tipo === "string") return valor.length <= 20000 ? valor : undefined;
    if (nivel >= 6) return undefined;
    if (Array.isArray(valor)) {
      if (valor.length > 500) return undefined;
      var lista = [];
      for (var i = 0; i < valor.length; i += 1) {
        var item = copiaSegura(valor[i], nivel + 1);
        if (item === undefined) return undefined;
        lista.push(item);
      }
      return lista;
    }
    if (tipo === "object") {
      var proto = Object.getPrototypeOf(valor);
      if (proto !== Object.prototype && proto !== null) return undefined;
      var chaves = Object.keys(valor);
      if (chaves.length > 300) return undefined;
      var saida = novoObjeto();
      chaves.forEach(function (chave) {
        if (!chaveSegura(chave)) return;
        var v = copiaSegura(valor[chave], nivel + 1);
        if (v !== undefined) saida[chave] = v;
      });
      return saida;
    }
    return undefined;
  }

  // ---- o estado salvo no aparelho ------------------------------------------

  var ESQUEMA_ESTADO = "dlt.protocolo.estado";
  var LIMITE_ESTADO = 100 * 1024;
  var ETAPAS = ["ato1", "pausa", "ato2", "concluido"];
  var RE_ID = /^[A-Za-z0-9_-]{1,64}$/;
  var RE_CICLO = /^[a-z0-9]{8}$/;
  var RE_FLUXO = /^(?:principal|volta|retorno:[a-z0-9]{1,24})$/;
  var RE_MARCO = /^[a-z0-9]{1,24}$/;
  var RE_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  var RE_INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

  // 8 caracteres [a-z0-9] a partir de 8 bytes aleatórios que quem chama fornece.
  // O ciclo só vive no aparelho e no identificador do lembrete; nunca é enviado.
  function gerarCiclo(bytes) {
    var alfabeto = "abcdefghijklmnopqrstuvwxyz0123456789";
    var saida = "";
    for (var i = 0; i < 8; i += 1) saida += alfabeto.charAt(((bytes && bytes[i]) || 0) % alfabeto.length);
    return saida;
  }

  function copiaJson(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  // Leva o estado de uma versão antiga até a atual, aplicando `migracoes[n]`
  // (a que sai da versão n para a n+1) em cadeia. Sem `versaoAtual`, segue
  // enquanto houver migração para a versão em que está. { estado } ou { erro: "versao" }.
  function migrarEstado(estado, migracoes, versaoAtual) {
    if (!ehObjetoSimples(estado) || !Number.isInteger(estado.v)) return { erro: "versao" };
    var atual = estado;
    var chave = function (v) {
      return migracoes && Object.prototype.hasOwnProperty.call(migracoes, v) && typeof migracoes[v] === "function" ? migracoes[v] : null;
    };
    var guarda = 0;
    while (versaoAtual === undefined ? chave(atual.v) !== null : atual.v < versaoAtual) {
      var passo = chave(atual.v);
      if (passo === null || guarda > 50) return { erro: "versao" };
      var seguinte;
      try {
        seguinte = passo(copiaJson(atual));
      } catch (erro) {
        return { erro: "versao" };
      }
      if (!ehObjetoSimples(seguinte)) return { erro: "versao" };
      seguinte.v = atual.v + 1;
      atual = seguinte;
      guarda += 1;
    }
    return { estado: atual };
  }

  function idOuNulo(valor) {
    return valor === null || valor === undefined ? null : (typeof valor === "string" && RE_ID.test(valor) ? valor : false);
  }

  // Copia só o que o esquema do estado conhece, com cada campo no formato certo.
  // { estado } ou { erro: "invalido" }.
  function sanearEstado(bruto, esquema) {
    var invalido = { erro: "invalido" };
    if (!Number.isInteger(bruto.v) || bruto.v !== esquema.versao) return invalido;
    if (typeof bruto.atualizado !== "string" || !RE_INSTANTE.test(bruto.atualizado) || isNaN(Date.parse(bruto.atualizado))) return invalido;
    if (!dataValida(bruto.expira)) return invalido;
    var criado = bruto.criado === undefined ? bruto.atualizado.slice(0, 10) : bruto.criado;
    if (!dataValida(criado)) return invalido;
    if (typeof bruto.ciclo !== "string" || !RE_CICLO.test(bruto.ciclo)) return invalido;
    if (ETAPAS.indexOf(bruto.etapa) === -1) return invalido;
    var fluxo = bruto.fluxo === undefined ? "principal" : bruto.fluxo;
    if (typeof fluxo !== "string" || !RE_FLUXO.test(fluxo)) return invalido;
    var bib = bruto.bib === undefined ? null : bruto.bib;
    if (bib !== null && (typeof bib !== "string" || bib.length > 32)) return invalido;
    var passo = idOuNulo(bruto.passo);
    if (passo === false) return invalido;
    if (!Array.isArray(bruto.caminho) || bruto.caminho.length > 400) return invalido;
    for (var i = 0; i < bruto.caminho.length; i += 1) {
      if (typeof bruto.caminho[i] !== "string" || !RE_ID.test(bruto.caminho[i])) return invalido;
    }
    if (!ehObjetoSimples(bruto.respostas)) return invalido;
    var respostas = novoObjeto();
    Object.keys(bruto.respostas).forEach(function (chave) {
      if (!chaveSegura(chave) || !RE_ID.test(chave)) return;
      var v = copiaSegura(bruto.respostas[chave]);
      if (v !== undefined) respostas[chave] = v;
    });
    var lembrete = bruto.lembrete === undefined ? null : bruto.lembrete;
    if (lembrete !== null && (typeof lembrete !== "string" || !RE_HORA.test(lembrete))) return invalido;

    var volta = null;
    if (bruto.volta !== undefined && bruto.volta !== null) {
      var vb = bruto.volta;
      if (!ehObjetoSimples(vb) || !Number.isInteger(vb.n) || vb.n < 1 || vb.n > 99) return invalido;
      var dia0 = vb.dia0 === undefined ? null : vb.dia0;
      if (dia0 !== null && !dataValida(dia0)) return invalido;
      var registro = vb.registro === undefined || vb.registro === null ? null : copiaSegura(vb.registro);
      if (registro === undefined || (registro !== null && !ehObjetoSimples(registro))) return invalido;
      var retornos = novoObjeto();
      if (vb.retornos !== undefined && vb.retornos !== null) {
        if (!ehObjetoSimples(vb.retornos)) return invalido;
        var marcos = Object.keys(vb.retornos);
        for (var m = 0; m < marcos.length; m += 1) {
          var item = vb.retornos[marcos[m]];
          if (!RE_MARCO.test(marcos[m]) || !ehObjetoSimples(item) || !dataValida(item.em)) return invalido;
          var r = copiaSegura(item.r === undefined ? {} : item.r);
          if (r === undefined || !ehObjetoSimples(r)) return invalido;
          retornos[marcos[m]] = { em: item.em, r: r };
        }
      }
      volta = { n: vb.n, dia0: dia0, registro: registro, retornos: retornos };
    }

    var historico = [];
    if (bruto.historico !== undefined && bruto.historico !== null) {
      if (!Array.isArray(bruto.historico) || bruto.historico.length > 24) return invalido;
      for (var h = 0; h < bruto.historico.length; h += 1) {
        var entrada = copiaSegura(bruto.historico[h]);
        if (entrada === undefined || !ehObjetoSimples(entrada)) return invalido;
        historico.push(entrada);
      }
    }

    return {
      estado: {
        esquema: ESQUEMA_ESTADO,
        v: bruto.v,
        protocolo: esquema.protocolo,
        bib: bib,
        ciclo: bruto.ciclo,
        criado: criado,
        atualizado: bruto.atualizado,
        expira: bruto.expira,
        fluxo: fluxo,
        etapa: bruto.etapa,
        passo: passo,
        caminho: bruto.caminho.slice(),
        respostas: respostas,
        volta: volta,
        historico: historico,
        lembrete: lembrete,
      },
    };
  }

  // Lê o estado de um objeto já lido (de um arquivo, por exemplo): mesmas regras de lerEstado.
  function lerEstadoObjeto(bruto, esquema, hoje) {
    if (!ehObjetoSimples(bruto) || !esquema) return { erro: "invalido" };
    if (bruto.esquema !== ESQUEMA_ESTADO || bruto.protocolo !== esquema.protocolo) return { erro: "invalido" };
    if (!Number.isInteger(bruto.v) || bruto.v < 1) return { erro: "invalido" };
    if (bruto.v > esquema.versao) return { erro: "versao" };
    if (!dataValida(bruto.expira)) return { erro: "invalido" };
    if (typeof hoje === "string" && bruto.expira < hoje) return { erro: "expirado" };
    var atual = bruto;
    if (bruto.v < esquema.versao) {
      var migrado = migrarEstado(bruto, esquema.migracoes, esquema.versao);
      if (migrado.erro) return migrado;
      atual = migrado.estado;
    }
    return sanearEstado(atual, esquema);
  }

  // O que está salvo, em texto, passado a limpo. `esquema` = { protocolo, versao, migracoes };
  // `hoje` = AAAA-MM-DD. { estado } ou { erro: "invalido" | "versao" | "expirado" }.
  function lerEstado(texto, esquema, hoje) {
    if (typeof texto !== "string" || !texto || bytesUtf8(texto) > LIMITE_ESTADO) return { erro: "invalido" };
    var bruto;
    try {
      bruto = JSON.parse(texto);
    } catch (erro) {
      return { erro: "invalido" };
    }
    return lerEstadoObjeto(bruto, esquema, hoje);
  }

  // Cópia do estado pronta para gravar: sem as respostas dos passos que nunca são
  // guardados (nem os rótulos e os complementos deles, se `steps` vier), sem os
  // rótulos (voltam a ser calculados ao ler) e sem esses passos no caminho.
  function prepararParaGuardar(estado, naoGuardar, steps) {
    var copia = copiaJson(estado);
    var ids = Array.isArray(naoGuardar) ? naoGuardar : [];
    var fora = {};
    ids.forEach(function (id) {
      fora[id] = true;
      fora[id + "__label"] = true;
      fora[id + "__labels"] = true;
    });
    (steps || []).forEach(function (step) {
      if (ids.indexOf(step.id) !== -1) chavesDoPasso(step).forEach(function (chave) { fora[chave] = true; });
    });
    if (copia.respostas && typeof copia.respostas === "object") {
      Object.keys(copia.respostas).forEach(function (chave) {
        if (fora[chave] === true || /__labels?$/.test(chave)) delete copia.respostas[chave];
      });
    }
    if (Array.isArray(copia.caminho)) copia.caminho = copia.caminho.filter(function (id) { return ids.indexOf(id) === -1; });
    return copia;
  }

  // Recalcula o rótulo da opção marcada (o estado guardado só tem os valores).
  function rotular(step, respostas) {
    if (step.type === "choice") {
      opcoesDoPasso(step, respostas).forEach(function (o) {
        if (o.value === respostas[step.id]) respostas[step.id + "__label"] = o.label;
      });
    } else if (step.type === "multi") {
      var marcadas = respostas[step.id];
      respostas[step.id + "__labels"] = opcoesDoPasso(step, respostas)
        .filter(function (o) { return marcadas.indexOf(o.value) !== -1; })
        .map(function (o) { return o.label; });
    }
  }

  // Põe em `destino` a resposta guardada do passo, se ela ainda vale (o complemento
  // incluído). Devolve se valeu. O checkpoint não tem resposta.
  function aplicarRespostaGuardada(step, guardadas, destino) {
    if (step.type === "checkpoint") return true;
    var principal = validarResposta(step, guardadas[step.id], destino);
    if (!principal.ok) return false;
    destino[step.id] = principal.valor;
    rotular(step, destino);
    var f = step.followUp;
    if (f && f.id) {
      var complemento = validarComplemento(f, guardadas[f.id]);
      if (!complemento.ok) {
        chavesDoPasso(step).forEach(function (chave) { delete destino[chave]; });
        return false;
      }
      destino[f.id] = complemento.valor;
    }
    return true;
  }

  // Refaz o ponto em que a pessoa estava a partir do estado guardado: percorre o
  // fluxo desde o começo e aceita cada passo do `caminho` enquanto ele for o passo
  // que o fluxo mostraria e a resposta ainda valer (passo ou opção que saiu do
  // protocolo derruba a resposta e leva ao primeiro passo sem resposta). Os passos
  // de `naoGuardar` nunca estão no estado: são pulados, e quem parou dentro do
  // bloco deles (o `passo` do estado está nele) recomeça no primeiro. Devolve { respostas, caminho (índices),
  // indice (steps.length = tudo respondido), descartou }.
  function restaurarProgresso(steps, estado, naoGuardar, derivados) {
    var nao = Array.isArray(naoGuardar) ? naoGuardar : [];
    var respostas = {};
    var caminho = [];
    var ids = estado && Array.isArray(estado.caminho) ? estado.caminho : [];
    var guardadas = estado && estado.respostas ? estado.respostas : {};
    var pos = 0;
    var indice = proximoIndice(steps, -1, respostas);
    while (indice < steps.length) {
      var step = steps[indice];
      if (nao.indexOf(step.id) !== -1) {
        indice = proximoIndice(steps, indice, respostas);
        continue;
      }
      if (ids[pos] !== step.id) break;
      if (!aplicarRespostaGuardada(step, guardadas, respostas)) break;
      caminho.push(indice);
      pos += 1;
      indice = proximoIndice(steps, indice, respostas);
    }
    // Quem parou dentro do bloco que não se guarda recomeça no primeiro passo dele.
    if (estado && nao.indexOf(estado.passo) !== -1) {
      var primeiro = -1;
      steps.forEach(function (s, i) {
        if (primeiro === -1 && nao.indexOf(s.id) !== -1) primeiro = i;
      });
      if (primeiro !== -1 && indice >= primeiro) {
        indice = primeiro;
        caminho = caminho.filter(function (i) { return i < primeiro; });
      }
    }
    // Valores derivados que o protocolo guarda no lugar da resposta que nunca se guarda (um
    // verdadeiro ou falso): voltam como estavam, só se forem verdadeiros.
    (Array.isArray(derivados) ? derivados : []).forEach(function (chave) {
      if (typeof chave === "string" && RE_ID.test(chave) && guardadas[chave] === true) respostas[chave] = true;
    });
    return { respostas: respostas, caminho: caminho, indice: indice, descartou: pos < ids.length };
  }

  // Onde está um marco de retorno: { situacao, data, feitoEm }. `dias` = quantos dias
  // depois do dia 0 ele cai (sem `dias`, o marco não tem data e vale sempre).
  // situacao: "feito" | "cedo" | "no_dia" | "atrasado".
  function situacaoDoMarco(volta, marco, dias, hoje) {
    var feito = volta && volta.retornos && Object.prototype.hasOwnProperty.call(volta.retornos, marco) ? volta.retornos[marco] : null;
    var data = volta && volta.dia0 && typeof dias === "number" ? somarDias(volta.dia0, dias) : null;
    if (feito) return { situacao: "feito", data: data, feitoEm: feito.em };
    if (!data || typeof hoje !== "string") return { situacao: "no_dia", data: data, feitoEm: null };
    if (hoje < data) return { situacao: "cedo", data: data, feitoEm: null };
    return { situacao: hoje === data ? "no_dia" : "atrasado", data: data, feitoEm: null };
  }

  // O endereço da página aberto com `#volta=<marco>` ou `#c=<código>`. Lê só o
  // fragmento inteiro nesses dois formatos: `{ marco }` se o marco está em
  // `permitidos`; `{ codigo }` para um código de até 2048 caracteres em
  // base64url; `{ recusado: "codigo" }` se o `#c=` é grande demais ou tem outros
  // caracteres; null para o resto (inclusive marco que não está na lista).
  var LIMITE_CODIGO = 2048;

  function lerMarco(hash, permitidos) {
    if (typeof hash !== "string") return null;
    var h = hash.charAt(0) === "#" ? hash.slice(1) : hash;
    if (h.slice(0, 6) === "volta=") {
      var marco = h.slice(6);
      return Array.isArray(permitidos) && RE_MARCO.test(marco) && permitidos.indexOf(marco) !== -1 ? { marco: marco } : null;
    }
    if (h.slice(0, 2) === "c=") {
      var codigo = h.slice(2);
      return codigo.length >= 1 && codigo.length <= LIMITE_CODIGO && /^[A-Za-z0-9_-]+$/.test(codigo)
        ? { codigo: codigo }
        : { recusado: "codigo" };
    }
    return null;
  }

  // As respostas de um fluxo como texto para ler: [{ q, value }], um por passo
  // respondido, com o rótulo da opção em vez do valor.
  function resumoDasRespostas(steps, answers) {
    var saida = [];
    steps.forEach(function (step) {
      if (step.type === "checkpoint" || !Object.prototype.hasOwnProperty.call(answers, step.id)) return;
      var valor = answers[step.id];
      var texto;
      var rotuloDe = function (v) {
        var achada = opcoesDoPasso(step, answers).filter(function (o) { return o.value === v; })[0];
        return achada ? achada.label : String(v);
      };
      if (step.type === "choice") texto = answers[step.id + "__label"] !== undefined ? answers[step.id + "__label"] : rotuloDe(valor);
      else if (step.type === "multi") {
        texto = (Array.isArray(answers[step.id + "__labels"]) ? answers[step.id + "__labels"] : (Array.isArray(valor) ? valor : []).map(rotuloDe)).join(", ");
      }
      else if (step.type === "grade" && ehObjetoSimples(valor)) {
        texto = itensDoPasso(step, answers).map(function (item) {
          var o = opcoesDoPasso(item.options ? item : step, answers).filter(function (x) { return x.value === valor[item.id]; })[0];
          return item.label + ": " + (o ? o.label : valor[item.id]);
        }).join("; ");
      } else if (step.type === "triad" && ehObjetoSimples(valor)) {
        var nome = function (id) {
          var item = (step.items || []).filter(function (i) { return i.id === id; })[0];
          return item ? item.label : id;
        };
        texto = "mais: " + nome(valor.mais) + "; menos: " + nome(valor.menos);
      } else texto = String(valor) + (step.type === "scale" && step.format ? step.format : "");
      if (texto === undefined || texto === "") return;
      var pergunta;
      try {
        pergunta = resolverValor(step.prompt, answers);
      } catch (erro) {
        pergunta = step.id;
      }
      var linha = { q: String(pergunta), value: String(texto) };
      if (step.followUp && step.followUp.id && answers[step.followUp.id] !== undefined && answers[step.followUp.id] !== "") {
        linha.value += " — " + answers[step.followUp.id] + (step.followUp.type === "scale" && step.followUp.format ? step.followUp.format : "");
      }
      saida.push(linha);
    });
    return saida;
  }

  // ---- utilidades de texto -------------------------------------------------

  // Tira a pontuação final, para o eco entre aspas não sair com ".”.".
  function semPontoFinal(texto) {
    return String(texto == null ? "" : texto).trim().replace(/[.!?…;,\s]+$/, "");
  }

  function primeiraMinuscula(texto) {
    var t = String(texto == null ? "" : texto);
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  // O texto cortado para caber em `maxBytes` em UTF-8, sem partir um caractere ao meio.
  function cortarPorBytes(texto, maxBytes) {
    var t = String(texto);
    if (!(maxBytes > 0)) return "";
    var total = 0;
    var fim = 0;
    var i = 0;
    while (i < t.length) {
      var ponto = t.codePointAt(i);
      var unidades = ponto > 0xffff ? 2 : 1;
      var b = ponto < 0x80 ? 1 : ponto < 0x800 ? 2 : ponto < 0x10000 ? 3 : 4;
      if (total + b > maxBytes) break;
      total += b;
      i += unidades;
      fim = i;
    }
    return t.slice(0, fim);
  }

  // O que a fonte padrão do PDF (WinAnsi) desenha, além de Latin-1.
  var PDF_EXTRAS = "\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178";
  var PDF_TROCAS = {
    "\u2192": "->", "\u2190": "<-", "\u2194": "<->", "\u21d2": "=>", "\u2713": "v", "\u2714": "v",
    "\u2717": "x", "\u2718": "x", "\u2715": "x", "\u2265": ">=", "\u2264": "<=", "\u2260": "!=",
    "\u2212": "-", "\u00d7": "x", "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2015": "-",
    "\u00a0": " ", "\u2009": " ", "\u202f": " ", "\u2007": " ", "\u2002": " ", "\u2003": " ",
  };

  // O texto como o PDF consegue desenhar: emoji e símbolos que a fonte padrão não tem
  // saem (ou viram o equivalente simples); o resto fora da fonte vira "?". O .md mantém o original.
  function textoSeguroPdf(valor) {
    var t = String(valor == null ? "" : valor).replace(/\r\n?/g, "\n");
    if (typeof t.normalize === "function") t = t.normalize("NFC");
    var saida = "";
    for (var i = 0; i < t.length; i += 1) {
      var ponto = t.codePointAt(i);
      if (ponto > 0xffff) {
        i += 1;
        continue;
      }
      var c = t.charAt(i);
      if (c === "\n") saida += c;
      else if (c === "\t") saida += " ";
      else if (ponto < 0x20 || ponto === 0x7f) continue;
      else if (ponto < 0x7f || (ponto >= 0xa0 && ponto <= 0xff && ponto !== 0xa0 && ponto !== 0xad)) saida += c;
      else if (PDF_EXTRAS.indexOf(c) !== -1) saida += c;
      else if (Object.prototype.hasOwnProperty.call(PDF_TROCAS, c)) saida += PDF_TROCAS[c];
      else if ((ponto >= 0x200b && ponto <= 0x200f) || ponto === 0x2060 || ponto === 0xfeff || ponto === 0xad ||
               (ponto >= 0xfe00 && ponto <= 0xfe0f) || (ponto >= 0x0300 && ponto <= 0x036f) ||
               (ponto >= 0x2190 && ponto <= 0x2bff) || (ponto >= 0x2600 && ponto <= 0x27bf) ||
               (ponto >= 0xe000 && ponto <= 0xf8ff) || (ponto >= 0xd800 && ponto <= 0xdfff)) continue;
      else saida += "?";
    }
    return saida;
  }

  // Frases com lacunas. Cada segmento é um texto com campos entre chaves ({frase},
  // {frase:sp} sem ponto final, {frase:min} com a primeira letra minúscula, ou os dois
  // com {frase:sp,min}). O segmento cujo campo está vazio sai inteiro: nunca sobra
  // "undefined", aspas vazias ou frase pela metade. Segmento sem campo fica sempre.
  function comporTexto(segmentos, valores) {
    var dados = valores || {};
    var partes = [];
    (segmentos || []).forEach(function (segmento) {
      var texto = typeof segmento === "string" ? segmento : segmento && typeof segmento.texto === "string" ? segmento.texto : "";
      if (!texto) return;
      var vazio = false;
      var preenchido = texto.replace(/\{([A-Za-z0-9_]+)(?::([a-z,]+))?\}/g, function (inteiro, nome, modos) {
        var bruto = Object.prototype.hasOwnProperty.call(dados, nome) ? dados[nome] : undefined;
        var valor = typeof bruto === "string" ? bruto.trim() : typeof bruto === "number" && isFinite(bruto) ? String(bruto) : "";
        (modos ? modos.split(",") : []).forEach(function (modo) {
          if (modo === "sp") valor = semPontoFinal(valor);
          else if (modo === "min") valor = primeiraMinuscula(valor);
        });
        if (valor === "") vazio = true;
        return valor;
      });
      if (!vazio) partes.push(preenchido.trim());
    });
    return partes.filter(function (p) { return p !== ""; }).join(" ");
  }

  // ---- UTF-8 e base64url, sem depender do navegador ----------------------------

  function bytesDoTexto(texto) {
    var t = String(texto);
    var saida = [];
    for (var i = 0; i < t.length; i += 1) {
      var ponto = t.codePointAt(i);
      if (ponto > 0xffff) i += 1;
      if (ponto >= 0xd800 && ponto <= 0xdfff) ponto = 0xfffd;
      if (ponto < 0x80) saida.push(ponto);
      else if (ponto < 0x800) saida.push(0xc0 | (ponto >> 6), 0x80 | (ponto & 63));
      else if (ponto < 0x10000) saida.push(0xe0 | (ponto >> 12), 0x80 | ((ponto >> 6) & 63), 0x80 | (ponto & 63));
      else saida.push(0xf0 | (ponto >> 18), 0x80 | ((ponto >> 12) & 63), 0x80 | ((ponto >> 6) & 63), 0x80 | (ponto & 63));
    }
    return saida;
  }

  // Decodifica UTF-8 estrito; devolve null para byte solto, sequência curta, forma
  // longa demais, par substituto ou ponto acima de U+10FFFF.
  function textoDosBytes(bytes) {
    var saida = "";
    var i = 0;
    while (i < bytes.length) {
      var b = bytes[i];
      var ponto;
      var extra;
      var minimo;
      if (b < 0x80) { ponto = b; extra = 0; minimo = 0; }
      else if (b >= 0xc2 && b <= 0xdf) { ponto = b & 0x1f; extra = 1; minimo = 0x80; }
      else if (b >= 0xe0 && b <= 0xef) { ponto = b & 0x0f; extra = 2; minimo = 0x800; }
      else if (b >= 0xf0 && b <= 0xf4) { ponto = b & 0x07; extra = 3; minimo = 0x10000; }
      else return null;
      for (var k = 1; k <= extra; k += 1) {
        var c = bytes[i + k];
        if (c === undefined || (c & 0xc0) !== 0x80) return null;
        ponto = (ponto << 6) | (c & 0x3f);
      }
      if (ponto < minimo || ponto > 0x10ffff || (ponto >= 0xd800 && ponto <= 0xdfff)) return null;
      saida += String.fromCodePoint(ponto);
      i += extra + 1;
    }
    return saida;
  }

  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  function base64urlDeBytes(bytes) {
    var saida = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var a = bytes[i];
      var b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      saida += B64.charAt(a >> 2) + B64.charAt(((a & 3) << 4) | (b >> 4));
      if (i + 1 < bytes.length) saida += B64.charAt(((b & 15) << 2) | (c >> 6));
      if (i + 2 < bytes.length) saida += B64.charAt(c & 63);
    }
    return saida;
  }

  // null se o texto não é base64url sem preenchimento.
  function bytesDeBase64url(texto) {
    if (!/^[A-Za-z0-9_-]*$/.test(texto) || texto.length % 4 === 1) return null;
    var bytes = [];
    for (var i = 0; i < texto.length; i += 4) {
      var v = [0, 0, 0, 0];
      var n = Math.min(4, texto.length - i);
      for (var k = 0; k < n; k += 1) v[k] = B64.indexOf(texto.charAt(i + k));
      bytes.push((v[0] << 2) | (v[1] >> 4));
      if (n > 2) bytes.push(((v[1] & 15) << 4) | (v[2] >> 2));
      if (n > 3) bytes.push(((v[2] & 3) << 6) | v[3]);
    }
    return bytes;
  }

  // ---- o registro em código ---------------------------------------------------------

  // As folhas de texto do objeto, para poder cortá-las: { texto, bytes, dono, chave }.
  function folhasDeTexto(valor, permitidas, saida) {
    if (typeof valor === "string") return saida;
    if (valor === null || typeof valor !== "object") return saida;
    Object.keys(valor).forEach(function (chave) {
      var v = valor[chave];
      if (typeof v === "string") {
        if (!permitidas || permitidas.indexOf(chave) !== -1) saida.push({ dono: valor, chave: chave, bytes: bytesUtf8(v) });
      } else {
        folhasDeTexto(v, permitidas, saida);
      }
    });
    return saida;
  }

  // O objeto em JSON UTF-8 e base64url, com no máximo `maxCaracteres` (2048 por padrão).
  // Se passar, corta os textos pelo limite em bytes (o mais longo primeiro, nivelando
  // por baixo) até caber; `opcoes.cortar` limita o corte a essas chaves.
  // { ok, codigo, objeto (o que foi codificado, já cortado), cortado } ou { ok: false, erro }.
  function codificarRegistro(obj, maxCaracteres, opcoes) {
    if (!ehObjetoSimples(obj)) return { ok: false, erro: "tipo" };
    var max = Number.isInteger(maxCaracteres) && maxCaracteres > 0 ? maxCaracteres : LIMITE_CODIGO;
    var trabalho;
    try {
      trabalho = copiaJson(obj);
    } catch (erro) {
      return { ok: false, erro: "tipo" };
    }
    var maxBytes = Math.floor(max / 4) * 3 + [0, 0, 1, 2][max % 4];
    var permitidas = opcoes && Array.isArray(opcoes.cortar) ? opcoes.cortar : null;
    var cortado = false;
    for (var volta = 0; volta < 20000; volta += 1) {
      var json = JSON.stringify(trabalho);
      var total = bytesUtf8(json);
      if (total <= maxBytes) {
        return { ok: true, codigo: base64urlDeBytes(bytesDoTexto(json)), objeto: trabalho, cortado: cortado };
      }
      var folhas = folhasDeTexto(trabalho, permitidas, [])
        .filter(function (f) { return f.bytes > 0; })
        .sort(function (a, b) { return b.bytes - a.bytes; });
      if (!folhas.length) return { ok: false, erro: "grande" };
      var maior = folhas[0];
      var segundo = folhas.length > 1 ? folhas[1].bytes : 0;
      var tirar = Math.max(1, Math.min(total - maxBytes, maior.bytes - segundo));
      maior.dono[maior.chave] = cortarPorBytes(maior.dono[maior.chave], maior.bytes - tirar);
      cortado = true;
    }
    return { ok: false, erro: "grande" };
  }

  // O contrário, com leitura estrita: texto, no máximo `maxCaracteres` (2048), só
  // [A-Za-z0-9_-], base64 que fecha, UTF-8 válido e um objeto JSON. Nenhuma chave de
  // protótipo passa e os objetos saem sem protótipo.
  // { ok, objeto } ou { ok: false, erro: "tipo" | "vazio" | "grande" | "caracteres" | "base64" | "utf8" | "json" }.
  function decodificarRegistro(codigo, maxCaracteres) {
    var max = Number.isInteger(maxCaracteres) && maxCaracteres > 0 ? maxCaracteres : LIMITE_CODIGO;
    if (typeof codigo !== "string") return { ok: false, erro: "tipo" };
    if (codigo.length === 0) return { ok: false, erro: "vazio" };
    if (codigo.length > max) return { ok: false, erro: "grande" };
    if (!/^[A-Za-z0-9_-]+$/.test(codigo)) return { ok: false, erro: "caracteres" };
    var bytes = bytesDeBase64url(codigo);
    if (bytes === null) return { ok: false, erro: "base64" };
    var texto = textoDosBytes(bytes);
    if (texto === null) return { ok: false, erro: "utf8" };
    var bruto;
    try {
      bruto = JSON.parse(texto);
    } catch (erro) {
      return { ok: false, erro: "json" };
    }
    if (!ehObjetoSimples(bruto)) return { ok: false, erro: "json" };
    var objeto = copiaSegura(bruto);
    return objeto === undefined ? { ok: false, erro: "json" } : { ok: true, objeto: objeto };
  }

  // ---- esquema: o objeto está no formato? ------------------------------------------------

  var MAX_ERROS = 50;

  function contarCaracteres(texto) {
    var n = 0;
    for (var i = 0; i < texto.length; i += 1) {
      var c = texto.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < texto.length) i += 1;
      n += 1;
    }
    return n;
  }

  function ehObjetoPuro(v) {
    if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
    var proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  }

  function validarRegra(valor, regra, caminho, erros) {
    var onde = caminho || "(raiz)";
    var falha = function (mensagem) { if (erros.length < MAX_ERROS) erros.push(onde + ": " + mensagem); };
    if (valor === null) {
      if (!regra.nulo) falha("não pode ser nulo");
      return;
    }
    switch (regra.tipo) {
      case "texto": {
        if (typeof valor !== "string") return falha("tem de ser texto");
        if (regra.enum && regra.enum.indexOf(valor) === -1) return falha("valor fora da lista");
        if (typeof regra.max === "number" && contarCaracteres(valor) > regra.max) return falha("passa de " + regra.max + " caracteres");
        if (typeof regra.min === "number" && contarCaracteres(valor) < regra.min) return falha("tem menos de " + regra.min + " caracteres");
        if (typeof regra.maxBytes === "number" && bytesUtf8(valor) > regra.maxBytes) return falha("passa de " + regra.maxBytes + " bytes");
        if (regra.padrao && !new RegExp(regra.padrao).test(valor)) return falha("formato inválido");
        return;
      }
      case "inteiro":
      case "numero": {
        if (typeof valor !== "number" || !isFinite(valor)) return falha("tem de ser número");
        if (regra.tipo === "inteiro" && !Number.isInteger(valor)) return falha("tem de ser inteiro");
        if (regra.enum && regra.enum.indexOf(valor) === -1) return falha("valor fora da lista");
        if (typeof regra.min === "number" && valor < regra.min) return falha("abaixo do mínimo " + regra.min);
        if (typeof regra.max === "number" && valor > regra.max) return falha("acima do máximo " + regra.max);
        if (typeof regra.casas === "number" && Math.abs(valor * Math.pow(10, regra.casas) - Math.round(valor * Math.pow(10, regra.casas))) > 1e-9) {
          return falha("mais de " + regra.casas + " casas decimais");
        }
        return;
      }
      case "booleano":
        if (typeof valor !== "boolean") falha("tem de ser verdadeiro ou falso");
        return;
      case "data":
        if (!dataValida(valor)) falha("não é uma data AAAA-MM-DD");
        return;
      case "lista": {
        if (!Array.isArray(valor)) return falha("tem de ser lista");
        if (typeof regra.max === "number" && valor.length > regra.max) return falha("mais de " + regra.max + " itens");
        if (typeof regra.min === "number" && valor.length < regra.min) return falha("menos de " + regra.min + " itens");
        if (regra.item) valor.forEach(function (item, i) { validarRegra(item, regra.item, onde + "[" + i + "]", erros); });
        return;
      }
      case "objeto": {
        if (!ehObjetoPuro(valor)) return falha("tem de ser objeto");
        var campos = regra.campos || {};
        Object.keys(valor).forEach(function (chave) {
          if (!Object.prototype.hasOwnProperty.call(campos, chave)) falha("chave desconhecida \"" + chave + "\"");
        });
        Object.keys(campos).forEach(function (chave) {
          var filho = campos[chave];
          if (!Object.prototype.hasOwnProperty.call(valor, chave)) {
            if (!filho.opcional) falha("falta \"" + chave + "\"");
            return;
          }
          validarRegra(valor[chave], filho, caminho ? caminho + "." + chave : chave, erros);
        });
        return;
      }
      case "mapa": {
        if (!ehObjetoPuro(valor)) return falha("tem de ser objeto");
        var chaves = Object.keys(valor);
        if (typeof regra.max === "number" && chaves.length > regra.max) return falha("mais de " + regra.max + " chaves");
        chaves.forEach(function (chave) {
          var permitida = regra.chaves ? regra.chaves.indexOf(chave) !== -1 : regra.padraoChave ? new RegExp(regra.padraoChave).test(chave) : false;
          if (!permitida) falha("chave desconhecida \"" + chave + "\"");
          else if (regra.valor) validarRegra(valor[chave], regra.valor, (caminho ? caminho + "." : "") + chave, erros);
        });
        if (regra.completo && regra.chaves) {
          regra.chaves.forEach(function (chave) {
            if (!Object.prototype.hasOwnProperty.call(valor, chave)) falha("falta \"" + chave + "\"");
          });
        }
        return;
      }
      default:
        falha("regra desconhecida");
    }
  }

  // Confere `obj` contra o descritor (uma regra, normalmente do tipo "objeto"). Tipos de
  // regra: texto (enum, min, max, maxBytes, padrao), inteiro e numero (min, max, enum,
  // casas), booleano, data, lista (item, min, max), objeto (campos; chave de fora é erro;
  // `opcional: true` deixa faltar) e mapa (chaves ou padraoChave, valor, max, completo).
  // `nulo: true` aceita null. { ok, erros: [texto] }.
  function validarEsquema(obj, descritor) {
    var erros = [];
    if (!descritor || typeof descritor !== "object") return { ok: false, erros: ["descritor inválido"] };
    validarRegra(obj, descritor, "", erros);
    return { ok: erros.length === 0, erros: erros };
  }

  // ---- o .md em blocos marcados ---------------------------------------------------------

  var RE_ID_BLOCO = /^[a-z0-9_.-]{1,64}$/;
  var LIMITE_MD = 256 * 1024;
  var LIMITE_CAMPO = 5000;
  var LIMITE_JSON_BLOCO = 64 * 1024;

  function idDeBlocoValido(id) {
    return typeof id === "string" && RE_ID_BLOCO.test(id) && CHAVES_PERIGOSAS.indexOf(id) === -1;
  }

  // No texto dela, o que fecharia ou abriria um comentário de máquina perde a forma.
  function neutralizar(texto) {
    var t = String(texto == null ? "" : texto).replace(/\r\n?/g, "\n");
    while (/<!--|-->/.test(t)) t = t.replace(/<!--/g, "< !--").replace(/-->/g, "-- >");
    return t;
  }

  function umaLinha(texto) {
    return neutralizar(texto).replace(/\n+/g, " ").trim();
  }

  function valorDeMaquina(valor) {
    var t = Array.isArray(valor) ? valor.join(",") : valor == null ? "" : String(valor);
    return t.replace(/[^a-z0-9_,.-]/g, "");
  }

  // Cada bloco: { id, v, titulo, leitura, campos: [{ id, rotulo, valor, texto }], linhas, json, codigo }.
  // Campos levam o texto dela (neutralizado) depois do rótulo em negrito; `valor` é o
  // valor de máquina ([a-z0-9_,.-]); `linhas` é texto só de leitura humana; `json` vai
  // em bloco cercado (com < e > escapados) e `codigo` numa linha própria.
  function escreverBlocos(blocos) {
    var partes = [];
    (Array.isArray(blocos) ? blocos : []).forEach(function (bloco) {
      if (!bloco || !idDeBlocoValido(bloco.id)) return;
      var v = Number.isInteger(bloco.v) && bloco.v >= 1 ? bloco.v : 1;
      var l = [];
      l.push('<!-- dlt:bloco id="' + bloco.id + '" v="' + v + '"' + (bloco.leitura ? ' leitura="1"' : "") + " -->");
      if (bloco.titulo) {
        l.push("## " + umaLinha(bloco.titulo));
        l.push("");
      }
      (Array.isArray(bloco.campos) ? bloco.campos : []).forEach(function (campo) {
        if (!campo || !idDeBlocoValido(campo.id)) return;
        var valor = valorDeMaquina(campo.valor);
        l.push('<!-- dlt:campo id="' + campo.id + '"' + (valor ? ' valor="' + valor + '"' : "") + " -->");
        l.push("**" + (umaLinha(campo.rotulo || campo.id) || campo.id) + "**");
        var texto = neutralizar(campo.texto).replace(/\s+$/, "");
        if (texto) l.push(texto);
        l.push("");
      });
      (Array.isArray(bloco.linhas) ? bloco.linhas : []).forEach(function (linha) {
        l.push(neutralizar(linha).replace(/\n+/g, " "));
      });
      if (Array.isArray(bloco.linhas) && bloco.linhas.length) l.push("");
      if (bloco.json !== undefined) {
        l.push("<!-- dlt:json -->");
        l.push("```json");
        l.push(JSON.stringify(bloco.json, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"));
        l.push("```");
        l.push("");
      }
      if (typeof bloco.codigo === "string" && /^[A-Za-z0-9_-]{1,2048}$/.test(bloco.codigo)) {
        l.push("<!-- dlt:codigo -->");
        l.push("codigo: " + bloco.codigo);
        l.push("");
      }
      l.push('<!-- /dlt:bloco id="' + bloco.id + '" -->');
      partes.push(l.join("\n"));
    });
    return partes.join("\n\n");
  }

  var RE_ABRE = /^<!-- dlt:bloco id="([a-z0-9_.-]{1,64})" v="(\d{1,3})"( leitura="1")? -->$/;
  var RE_FECHA = /^<!-- \/dlt:bloco id="([a-z0-9_.-]{1,64})" -->$/;
  var RE_CAMPO = /^<!-- dlt:campo id="([a-z0-9_.-]{1,64})"(?: valor="([a-z0-9_,.-]*)")? -->$/;

  // Lê o que `escreverBlocos` escreveu. `ids`: lista de ids conhecidos (versão 1), ou
  // { <id>: { v, campos: { <campo>: limiteDeCaracteres } } } para fixar a versão e os
  // campos de cada bloco. Só entram blocos conhecidos, na versão conhecida e sem
  // `leitura="1"`; campo desconhecido (com `campos` declarado) é descartado e cada texto
  // é cortado no limite. Nada é interpretado como HTML, e marcador só vale na linha inteira.
  // Devolve { <idDoBloco>: { v, campos: { <id>: { valor, texto } }, json, codigo } }.
  function lerBlocos(textoMd, ids) {
    var saida = novoObjeto();
    if (typeof textoMd !== "string" || textoMd.length > LIMITE_MD) return saida;
    var conhecidos = novoObjeto();
    if (Array.isArray(ids)) {
      ids.forEach(function (id) { if (idDeBlocoValido(id)) conhecidos[id] = { v: 1, campos: null }; });
    } else if (ids && typeof ids === "object") {
      Object.keys(ids).forEach(function (id) {
        if (!idDeBlocoValido(id)) return;
        var d = ids[id] || {};
        conhecidos[id] = { v: Number.isInteger(d.v) ? d.v : 1, campos: d.campos && typeof d.campos === "object" ? d.campos : null };
      });
    }
    var linhas = textoMd.split(/\r\n|\r|\n/);
    var atual = null;
    var ignorando = null;
    var campo = null;

    function fecharCampo() {
      if (!campo || !atual) { campo = null; return; }
      var limite = atual.limites && typeof atual.limites[campo.id] === "number" ? atual.limites[campo.id] : LIMITE_CAMPO;
      var permitido = !atual.limites || Object.prototype.hasOwnProperty.call(atual.limites, campo.id);
      if (permitido && Object.keys(atual.campos).length < 200 && !Object.prototype.hasOwnProperty.call(atual.campos, campo.id)) {
        atual.campos[campo.id] = { valor: campo.valor, texto: cortarTexto(campo.linhas.join("\n"), limite) };
      }
      campo = null;
    }

    for (var i = 0; i < linhas.length; i += 1) {
      var linha = linhas[i];
      var abre = RE_ABRE.exec(linha);
      if (ignorando !== null) {
        var fecha = RE_FECHA.exec(linha);
        if (fecha && fecha[1] === ignorando) ignorando = null;
        else if (abre) { ignorando = null; i -= 1; }
        continue;
      }
      if (abre) {
        atual = null;
        campo = null;
        var conhecido = Object.prototype.hasOwnProperty.call(conhecidos, abre[1]) ? conhecidos[abre[1]] : null;
        if (!conhecido || Number(abre[2]) !== conhecido.v || abre[3] || Object.prototype.hasOwnProperty.call(saida, abre[1])) {
          ignorando = abre[1];
        } else {
          atual = { id: abre[1], v: conhecido.v, limites: conhecido.campos, campos: novoObjeto(), json: null, codigo: null };
        }
        continue;
      }
      if (!atual) continue;
      var fechaAtual = RE_FECHA.exec(linha);
      if (fechaAtual) {
        fecharCampo();
        if (fechaAtual[1] === atual.id) saida[atual.id] = { v: atual.v, campos: atual.campos, json: atual.json, codigo: atual.codigo };
        atual = null;
        continue;
      }
      var abreCampo = RE_CAMPO.exec(linha);
      if (abreCampo) {
        fecharCampo();
        campo = { id: abreCampo[1], valor: abreCampo[2] === undefined ? null : abreCampo[2], linhas: [], esperaRotulo: true };
        continue;
      }
      if (linha === "<!-- dlt:json -->") {
        fecharCampo();
        var cerca = linhas[i + 1] === "```json" ? i + 2 : -1;
        if (cerca !== -1) {
          var corpo = [];
          var j = cerca;
          while (j < linhas.length && linhas[j] !== "```") { corpo.push(linhas[j]); j += 1; }
          var textoJson = corpo.join("\n");
          if (j < linhas.length && textoJson.length <= LIMITE_JSON_BLOCO) {
            try {
              var lido = copiaSegura(JSON.parse(textoJson));
              atual.json = lido === undefined ? null : lido;
            } catch (erro) {
              atual.json = null;
            }
          }
          i = j;
        }
        continue;
      }
      if (linha === "<!-- dlt:codigo -->") {
        fecharCampo();
        var m = /^codigo: ([A-Za-z0-9_-]{1,2048})$/.exec(linhas[i + 1] || "");
        if (m) { atual.codigo = m[1]; i += 1; }
        continue;
      }
      if (campo) {
        if (campo.esperaRotulo) {
          campo.esperaRotulo = false;
          if (/^\*\*.*\*\*$/.test(linha)) continue;
        }
        campo.linhas.push(linha);
      }
    }
    return saida;
  }

  // ---- o .ics ---------------------------------------------------------------------------

  var RE_URL_EVENTO = /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?\/[A-Za-z0-9\/._~-]*(?:#volta=[a-z0-9]{1,24})?$/;

  // Quebra a linha em 75 octetos UTF-8; as seguintes começam com um espaço.
  function dobrarLinha(linha) {
    var saida = [];
    var atual = "";
    var bytes = 0;
    for (var i = 0; i < linha.length; i += 1) {
      var ponto = linha.codePointAt(i);
      var ch = String.fromCodePoint(ponto);
      if (ponto > 0xffff) i += 1;
      var b = ponto < 0x80 ? 1 : ponto < 0x800 ? 2 : ponto < 0x10000 ? 3 : 4;
      if (bytes + b > 75) {
        saida.push(atual);
        atual = " ";
        bytes = 1;
      }
      atual += ch;
      bytes += b;
    }
    saida.push(atual);
    return saida;
  }

  function escaparIcs(texto) {
    return String(texto == null ? "" : texto)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r\n|\r|\n/g, "\\n");
  }

  function instanteIcs(agora) {
    var d = agora instanceof Date ? agora : new Date(agora);
    if (isNaN(d.getTime())) throw new TypeError("agora inválido");
    return d.getUTCFullYear() + doisDigitos(d.getUTCMonth() + 1) + doisDigitos(d.getUTCDate()) +
      "T" + doisDigitos(d.getUTCHours()) + doisDigitos(d.getUTCMinutes()) + doisDigitos(d.getUTCSeconds()) + "Z";
  }

  function duracaoIcs(minutos) {
    var m = Number.isInteger(minutos) && minutos >= 1 && minutos <= 1440 ? minutos : 10;
    var h = Math.floor(m / 60);
    var r = m % 60;
    return "PT" + (h ? h + "H" : "") + (r || !h ? r + "M" : "");
  }

  // Calendário iCalendar (RFC 5545) com linhas CRLF dobradas em 75 octetos. Cada evento:
  // { uid, inicio: "AAAA-MM-DD", hora: "HH:MM" (hora flutuante, sem fuso), duracaoMin,
  // resumo, descricao, url, repetir: { semanal: true, vezes } }. A `url` só pode ser
  // https, sem "?", e no máximo com o fragmento #volta=<marco>: nada que a pessoa respondeu.
  // Evento fora do formato levanta TypeError.
  function montarIcs(config) {
    var cfg = config || {};
    var prodid = typeof cfg.prodid === "string" && /^[A-Za-z0-9 \/._-]{1,100}$/.test(cfg.prodid) ? cfg.prodid : "-//DLT Academy//Protocolo//PT-BR";
    var carimbo = instanteIcs(cfg.agora);
    var linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:" + prodid, "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    (Array.isArray(cfg.eventos) ? cfg.eventos : []).forEach(function (e) {
      if (!e || typeof e.uid !== "string" || !/^[A-Za-z0-9@._-]{1,128}$/.test(e.uid)) throw new TypeError("uid do evento inválido");
      if (!dataValida(e.inicio)) throw new TypeError("data do evento inválida");
      if (typeof e.hora !== "string" || !RE_HORA.test(e.hora)) throw new TypeError("hora do evento inválida");
      if (typeof e.resumo !== "string" || !e.resumo.trim() || e.resumo.length > 200) throw new TypeError("resumo do evento inválido");
      if (e.descricao !== undefined && (typeof e.descricao !== "string" || e.descricao.length > 1000)) throw new TypeError("descrição do evento inválida");
      if (e.url !== undefined && (typeof e.url !== "string" || !RE_URL_EVENTO.test(e.url))) throw new TypeError("link do evento inválido");
      linhas.push("BEGIN:VEVENT");
      linhas.push("UID:" + e.uid);
      linhas.push("DTSTAMP:" + carimbo);
      linhas.push("DTSTART:" + e.inicio.replace(/-/g, "") + "T" + e.hora.replace(":", "") + "00");
      linhas.push("DURATION:" + duracaoIcs(e.duracaoMin));
      linhas.push("SUMMARY:" + escaparIcs(e.resumo));
      if (e.descricao) linhas.push("DESCRIPTION:" + escaparIcs(e.descricao));
      if (e.url) linhas.push("URL:" + e.url);
      if (e.repetir && e.repetir.semanal === true) {
        var vezes = Number.isInteger(e.repetir.vezes) && e.repetir.vezes >= 1 && e.repetir.vezes <= 60 ? e.repetir.vezes : 1;
        linhas.push("RRULE:FREQ=WEEKLY;COUNT=" + vezes);
      }
      linhas.push("BEGIN:VALARM");
      linhas.push("ACTION:DISPLAY");
      linhas.push("DESCRIPTION:" + escaparIcs(e.resumo));
      linhas.push("TRIGGER:-PT0M");
      linhas.push("END:VALARM");
      linhas.push("END:VEVENT");
    });
    linhas.push("END:VCALENDAR");
    var saida = [];
    linhas.forEach(function (linha) { dobrarLinha(linha).forEach(function (parte) { saida.push(parte); }); });
    return saida.join("\r\n") + "\r\n";
  }

  // O nome de um evento de uso, se estiver na lista fixa do protocolo; senão null. Nenhum nome
  // se monta a partir de resposta: só os da lista passam.
  function nomeDeEvento(nome, permitidos) {
    if (typeof nome !== "string" || !/^[a-z0-9_-]{1,64}$/.test(nome)) return null;
    return Array.isArray(permitidos) && permitidos.indexOf(nome) !== -1 ? nome : null;
  }

  var api = {
    TIPOS_NOVOS: TIPOS_NOVOS,
    nomeDeEvento: nomeDeEvento,
    passoVisivel: passoVisivel,
    proximoIndice: proximoIndice,
    passosVisiveis: passosVisiveis,
    posicaoNoGrupo: posicaoNoGrupo,
    posicaoNoProtocolo: posicaoNoProtocolo,
    chavesDoPasso: chavesDoPasso,
    limparForaDoCaminho: limparForaDoCaminho,
    opcoesDoPasso: opcoesDoPasso,
    itensDoPasso: itensDoPasso,
    cortarTexto: cortarTexto,
    validarResposta: validarResposta,
    validarComplemento: validarComplemento,
    bytesUtf8: bytesUtf8,
    dataValida: dataValida,
    somarDias: somarDias,
    diasEntre: diasEntre,
    datasDoCiclo: datasDoCiclo,
    dataISO: dataISO,
    copiaSegura: copiaSegura,
    gerarCiclo: gerarCiclo,
    lerEstado: lerEstado,
    lerEstadoObjeto: lerEstadoObjeto,
    migrarEstado: migrarEstado,
    prepararParaGuardar: prepararParaGuardar,
    restaurarProgresso: restaurarProgresso,
    situacaoDoMarco: situacaoDoMarco,
    lerMarco: lerMarco,
    resumoDasRespostas: resumoDasRespostas,
    semPontoFinal: semPontoFinal,
    primeiraMinuscula: primeiraMinuscula,
    cortarPorBytes: cortarPorBytes,
    textoSeguroPdf: textoSeguroPdf,
    comporTexto: comporTexto,
    codificarRegistro: codificarRegistro,
    decodificarRegistro: decodificarRegistro,
    validarEsquema: validarEsquema,
    neutralizar: neutralizar,
    escreverBlocos: escreverBlocos,
    lerBlocos: lerBlocos,
    montarIcs: montarIcs,
    ESQUEMA_ESTADO: ESQUEMA_ESTADO,
    LIMITE_ESTADO: LIMITE_ESTADO,
    LIMITE_CODIGO: LIMITE_CODIGO,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DLTProtocolKit = api;
})(typeof self !== "undefined" ? self : this);

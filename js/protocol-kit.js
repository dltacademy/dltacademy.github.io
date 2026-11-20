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
  function restaurarProgresso(steps, estado, naoGuardar) {
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
      if (step.type === "choice") texto = answers[step.id + "__label"];
      else if (step.type === "multi") texto = (answers[step.id + "__labels"] || []).join(", ");
      else if (step.type === "grade" && ehObjetoSimples(valor)) {
        texto = (step.items || []).map(function (item) {
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
      var pergunta = resolverValor(step.prompt, answers);
      var linha = { q: String(pergunta), value: String(texto) };
      if (step.followUp && step.followUp.id && answers[step.followUp.id] !== undefined && answers[step.followUp.id] !== "") {
        linha.value += " — " + answers[step.followUp.id] + (step.followUp.type === "scale" && step.followUp.format ? step.followUp.format : "");
      }
      saida.push(linha);
    });
    return saida;
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
    ESQUEMA_ESTADO: ESQUEMA_ESTADO,
    LIMITE_ESTADO: LIMITE_ESTADO,
    LIMITE_CODIGO: LIMITE_CODIGO,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DLTProtocolKit = api;
})(typeof self !== "undefined" ? self : this);

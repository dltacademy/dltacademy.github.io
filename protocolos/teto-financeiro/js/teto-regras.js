/* Regras do Protocolo do Teto Financeiro, sem DOM: cuidado, notas dos padrões e das
   famílias, sugestão do teto, variante, trilha e vazamento, o que o resultado não
   indica, degraus do plano, trava, planos de 7 e 90 dias, sinais, registro e, por fim, o
   que a pessoa leva: o fio, os blocos do .md, os lembretes, os cartões e o resultado.
   Cada função recebe as respostas (por id de passo) e a biblioteca e devolve dados.
   Constantes e textos vêm da biblioteca; aqui só a conta.
   O navegador usa window.TetoRegras; os testes usam require() no Node. */
(function (root) {
  "use strict";

  var kit = typeof module !== "undefined" && module.exports ? require("../../../js/protocol-kit.js") : root.DLTProtocolKit;

  var FAMILIAS = ["evitar", "idolatrar", "status", "vigilancia", "lealdade"];
  var AREAS = ["ganhar", "guardar", "decidir", "dar"];
  var TRILHAS = ["ganho", "retencao"];
  var PADROES = [
    "ganho-que-escorre", "freio-na-cobranca", "passo-que-nao-sai", "decisao-no-calor",
    "progresso-sem-trilho", "dinheiro-nao-combina", "caixa-da-familia",
  ];
  var VARIANTES = ["medo-de-errar", "nao-estou-pronto", "emocao-do-momento", "virar-o-jogo"];
  var EPS = 1e-9;
  var HORA_PADRAO = "20:00";
  var PRODID = "-//DLT Academy//Teto Financeiro//PT-BR";
  var SINAIS_AJUDA_PADRAO = ["apostar_sem_parar", "recuperar_perda", "esconder", "comprar_sem_parar", "nada_vai_melhorar"];

  // ---- apoio ------------------------------------------------------------------------------

  function lista(valor) {
    return Array.isArray(valor) ? valor : [];
  }

  function objeto(valor) {
    return valor !== null && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
  }

  function tem(arr, valor) {
    return lista(arr).indexOf(valor) !== -1;
  }

  function arredonda2(n) {
    return Math.round(n * 100) / 100;
  }

  function regra(bib, nome, padrao) {
    var regras = objeto(objeto(bib).regras);
    return typeof regras[nome] === "number" ? regras[nome] : padrao;
  }

  // Os ids dos padrões na ordem fixa da biblioteca (a ordem de 1 a 7).
  function ordemDosPadroes(bib) {
    var ids = Object.keys(objeto(bib.padroes));
    ids.sort(function (a, b) { return bib.padroes[a].ordem - bib.padroes[b].ordem; });
    return ids;
  }

  // valor da opção → { opcao, cena } de todas as cenas.
  function indiceDeOpcoes(bib) {
    var indice = {};
    lista(bib.cenas).forEach(function (cena) {
      lista(cena.opcoes).forEach(function (o) { indice[o.value] = { opcao: o, cena: cena }; });
    });
    return indice;
  }

  // As marcas válidas por cena: só valores que a cena oferece, sem "nao_acontece".
  function marcasPorCena(r, bib) {
    var saida = [];
    lista(bib.cenas).forEach(function (cena) {
      var validos = lista(cena.opcoes).map(function (o) { return o.value; });
      lista(objeto(r)[cena.id]).forEach(function (v) {
        if (validos.indexOf(v) !== -1) saida.push({ cena: cena, valor: v });
      });
    });
    return saida;
  }

  function opcoesMarcadas(r, bib) {
    var indice = indiceDeOpcoes(bib);
    return marcasPorCena(r, bib).map(function (m) { return indice[m.valor].opcao; });
  }

  function capitalizar(texto) {
    var t = String(texto || "");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  }

  function dataCurta(dataISO) {
    var p = String(dataISO || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] : "";
  }

  function dataBR(dataISO) {
    var p = String(dataISO || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
  }

  function aparar(valor) {
    return typeof valor === "string" ? valor.trim() : "";
  }

  function aspas(texto) {
    return "\u201c" + kit.semPontoFinal(texto) + "\u201d";
  }

  // O nome do padrão ("O ganho que escorre", "A decisão no calor") já traz o artigo: no começo
  // de uma frase fica como está; no meio, a primeira letra vai para minúscula.
  function comNome(texto, nome) {
    return String(texto || "")
      .replace(/(^|[.!?]\s+)\{nome\}/g, function (m, inicio) { return inicio + nome; })
      .replace(/\{nome\}/g, kit.primeiraMinuscula(nome));
  }

  // "a", "a e b", "a, b e c".
  function listaNatural(itens, e) {
    var t = lista(itens).filter(function (x) { return x !== ""; });
    if (t.length <= 1) return t.join("");
    return t.slice(0, -1).join(", ") + " " + (e || "e") + " " + t[t.length - 1];
  }

  // ---- cuidado ----------------------------------------------------------------------------

  // { ramo: "ajuda" | "chao" | null, avisoHumor, degrauAbaixo }.
  // Ramo diferente de null: fim antecipado, sem cenas, sem registro, sem guardar, sem oferta.
  function avaliarCuidado(r, bib) {
    var resp = objeto(r);
    var cuidado = objeto(bib.cuidado);
    var ajudaIds = lista(objeto(cuidado.sinais_risco).ajuda);
    if (!ajudaIds.length) ajudaIds = SINAIS_AJUDA_PADRAO;
    var ajuda = lista(resp.sinais_risco).some(function (v) { return ajudaIds.indexOf(v) !== -1; });
    var chaoResp = objeto(resp.chao);
    var alerta = objeto(objeto(cuidado.chao).alerta);
    var chao = Object.keys(alerta).some(function (item) { return tem(alerta[item], chaoResp[item]); });
    var humor = objeto(resp.humor);
    var humorAtivo = objeto(cuidado.humor).ativo === true;
    var soma = (typeof humor.interesse === "number" ? humor.interesse : 0) + (typeof humor.animo === "number" ? humor.animo : 0);
    var avisoHumor = humorAtivo && soma >= regra(bib, "HUMOR_AVISO", 3);
    return { ramo: ajuda ? "ajuda" : chao ? "chao" : null, avisoHumor: avisoHumor, degrauAbaixo: avisoHumor };
  }

  // ---- notas dos padrões ------------------------------------------------------------------

  // { padrao: { n, f, c, s } }: n marcas de sinal, f a fração das opções de sinal marcadas,
  // c 1 se o custo escolhido é um sinal do padrão, s = f + peso do custo.
  function pontuarPadroes(r, bib) {
    var resp = objeto(r);
    var indice = indiceDeOpcoes(bib);
    var peso = regra(bib, "PESO_CUSTO", 1);
    var total = {};
    var n = {};
    lista(bib.cenas).forEach(function (cena) {
      lista(cena.opcoes).forEach(function (o) {
        if (o.tipo === "sinal") total[o.padrao] = (total[o.padrao] || 0) + 1;
      });
    });
    marcasPorCena(resp, bib).forEach(function (m) {
      var o = indice[m.valor].opcao;
      if (o.tipo === "sinal") n[o.padrao] = (n[o.padrao] || 0) + 1;
    });
    var custo = typeof resp.custo === "string" && resp.custo !== "nenhuma" && indice[resp.custo] ? indice[resp.custo].opcao : null;
    var saida = {};
    ordemDosPadroes(bib).forEach(function (p) {
      var np = n[p] || 0;
      var f = total[p] ? arredonda2(np / total[p]) : 0;
      var c = custo && custo.padrao === p ? 1 : 0;
      saida[p] = { n: np, f: f, c: c, s: arredonda2(f + peso * c) };
    });
    return saida;
  }

  // ---- famílias de crença -----------------------------------------------------------------

  function familiaDoItem(bib, id) {
    var item = objeto(bib.itens)[id];
    return item ? item.familia : null;
  }

  function triadeValida(t, a) {
    return a && typeof a === "object" && a.mais !== a.menos && tem(t.itens, a.mais) && tem(t.itens, a.menos);
  }

  // Modo tríade (saldo por aparição, de -1 a 1) ou, sem nenhuma tríade válida e com
  // `grade_crencas` ({ item: 0..3 }), modo grade (média dos níveis, de 0 a 3).
  // { modo, norm: { familia: número | null }, nivel: { item: nível }, saldo, aparicoes }.
  function pontuarFamilias(r, bib) {
    var resp = objeto(r);
    var saldo = {};
    var aparicoes = {};
    var nivel = {};
    FAMILIAS.forEach(function (f) { saldo[f] = 0; aparicoes[f] = 0; });
    var validas = 0;
    lista(bib.triades).forEach(function (t) {
      var a = resp[t.id];
      if (!triadeValida(t, a)) return;
      validas += 1;
      t.itens.forEach(function (i) {
        var f = familiaDoItem(bib, i);
        if (f && aparicoes[f] !== undefined) aparicoes[f] += 1;
        nivel[i] = 0;
      });
      nivel[a.mais] = 1;
      nivel[a.menos] = -1;
      var fm = familiaDoItem(bib, a.mais);
      var fn = familiaDoItem(bib, a.menos);
      if (fm && saldo[fm] !== undefined) saldo[fm] += 1;
      if (fn && saldo[fn] !== undefined) saldo[fn] -= 1;
    });
    var norm = {};
    if (validas > 0) {
      FAMILIAS.forEach(function (f) { norm[f] = aparicoes[f] > 0 ? saldo[f] / aparicoes[f] : null; });
      return { modo: "triade", norm: norm, nivel: nivel, saldo: saldo, aparicoes: aparicoes };
    }
    var grade = objeto(resp.grade_crencas);
    var soma = {};
    var qtd = {};
    FAMILIAS.forEach(function (f) { soma[f] = 0; qtd[f] = 0; });
    var nivelGrade = {};
    Object.keys(grade).forEach(function (i) {
      var f = familiaDoItem(bib, i);
      var v = grade[i];
      if (!f || typeof v !== "number" || v < 0 || v > 3 || Math.floor(v) !== v) return;
      nivelGrade[i] = v;
      soma[f] += v;
      qtd[f] += 1;
    });
    FAMILIAS.forEach(function (f) { norm[f] = qtd[f] > 0 ? soma[f] / qtd[f] : null; });
    var modo = Object.keys(nivelGrade).length > 0 ? "grade" : "triade";
    return { modo: modo, norm: norm, nivel: nivelGrade, saldo: soma, aparicoes: qtd };
  }

  // `norm` pode ser o resultado inteiro de pontuarFamilias (traz o modo) ou só o mapa.
  function desembrulhar(norm, modo) {
    if (norm && typeof norm === "object" && norm.norm && typeof norm.norm === "object") {
      return { mapa: norm.norm, modo: norm.modo || modo || "triade" };
    }
    return { mapa: objeto(norm), modo: modo || "triade" };
  }

  // A família de maior nota, se passa do limiar e está sozinha no topo; senão null.
  function familiaForte(norm, bib, modo) {
    var d = desembrulhar(norm, modo);
    var limiar = d.modo === "grade" ? regra(bib, "LIMIAR_FAMILIA_GRADE", 2) : regra(bib, "LIMIAR_FAMILIA", 0.5);
    var melhor = null;
    var empate = false;
    FAMILIAS.forEach(function (f) {
      var v = d.mapa[f];
      if (typeof v !== "number") return;
      if (melhor === null || v > d.mapa[melhor] + EPS) {
        melhor = f;
        empate = false;
      } else if (Math.abs(v - d.mapa[melhor]) <= EPS) {
        empate = true;
      }
    });
    if (melhor === null || empate || d.mapa[melhor] < limiar - EPS) return null;
    return melhor;
  }

  // Até duas famílias de menor nota, com nota no limiar de fraca ou abaixo; empate pela ordem fixa.
  function familiasFracas(norm, bib, modo) {
    var d = desembrulhar(norm, modo);
    var limiar = d.modo === "grade" ? regra(bib, "LIMIAR_FRACA_GRADE", 0.5) : regra(bib, "LIMIAR_FRACA", -0.5);
    var candidatas = FAMILIAS.filter(function (f) { return typeof d.mapa[f] === "number" && d.mapa[f] <= limiar + EPS; });
    candidatas.sort(function (a, b) {
      var dif = d.mapa[a] - d.mapa[b];
      return Math.abs(dif) > EPS ? dif : FAMILIAS.indexOf(a) - FAMILIAS.indexOf(b);
    });
    return candidatas.slice(0, 2);
  }

  // ---- sugestão do teto -------------------------------------------------------------------

  function afinidade(bib, padrao, familia) {
    return familia && tem(objeto(bib.padroes[padrao]).familias_ligadas, familia) ? 1 : 0;
  }

  // O espelho: até dois candidatos (nota ≥ limiar), ordenados por nota, custo, marcas,
  // afinidade com a família forte e ordem fixa. A pessoa escolhe; a sugestão só ordena.
  // Com menos marcas que o mínimo e sem custo escolhido, não há candidato.
  function sugerir(notas, familia, bib) {
    var ordemFixa = ordemDosPadroes(bib);
    var soma = 0;
    var custo = false;
    ordemFixa.forEach(function (p) {
      var nota = objeto(notas)[p];
      if (!nota) return;
      soma += nota.n;
      if (nota.c === 1) custo = true;
    });
    if (soma < regra(bib, "MIN_MARCAS", 2) && !custo) return { candidatos: [], dominante: null, ordem: [] };
    var ordem = ordemFixa.filter(function (p) { return objeto(notas)[p]; });
    ordem.sort(function (a, b) {
      var x = notas[a];
      var y = notas[b];
      if (Math.abs(y.s - x.s) > EPS) return y.s - x.s;
      if (y.c !== x.c) return y.c - x.c;
      if (y.n !== x.n) return y.n - x.n;
      var dif = afinidade(bib, b, familia) - afinidade(bib, a, familia);
      if (dif !== 0) return dif;
      return bib.padroes[a].ordem - bib.padroes[b].ordem;
    });
    var limiar = regra(bib, "LIMIAR_TETO", 0.34);
    var candidatos = ordem.filter(function (p) { return notas[p].s >= limiar - EPS; }).slice(0, 2);
    return { candidatos: candidatos, dominante: candidatos.length ? candidatos[0] : null, ordem: ordem };
  }

  // As frases (rótulos) que ela marcou como sinal de um padrão, para o espelho.
  function marcasDoPadrao(r, padrao, bib) {
    return opcoesMarcadas(r, bib)
      .filter(function (o) { return o.padrao === padrao && o.tipo === "sinal"; })
      .map(function (o) { return { value: o.value, label: o.label }; });
  }

  // A variante que as marcas apontam; empate ou nenhuma marca dá null.
  function sugerirVariante(padrao, r, bib) {
    var variantes = lista(objeto(bib.padroes[padrao]).variantes);
    if (!variantes.length) return null;
    var conta = {};
    variantes.forEach(function (v) { conta[v] = 0; });
    opcoesMarcadas(r, bib).forEach(function (o) {
      if (o.padrao === padrao && o.tipo === "sinal" && conta[o.variante] !== undefined) conta[o.variante] += 1;
    });
    var melhor = null;
    var empate = false;
    variantes.forEach(function (v) {
      if (melhor === null || conta[v] > conta[melhor]) {
        melhor = v;
        empate = false;
      } else if (conta[v] === conta[melhor]) {
        empate = true;
      }
    });
    return melhor === null || empate || conta[melhor] === 0 ? null : melhor;
  }

  // A variante respondida, se vale para o padrão; senão a sugerida pelas marcas.
  function varianteFinal(padrao, r, bib) {
    var variantes = lista(objeto(bib.padroes[padrao]).variantes);
    if (!variantes.length) return null;
    var resp = objeto(r).variante;
    return tem(variantes, resp) ? resp : sugerirVariante(padrao, r, bib);
  }

  // { trilha, trilhasPerto, vazamento }: o vazamento é o padrão de maior nota da OUTRA
  // trilha, se passa do limiar.
  function trilhaEVazamento(padrao, notas, bib) {
    var ordemFixa = ordemDosPadroes(bib);
    var trilha = bib.padroes[padrao].trilha;
    var limiarTeto = regra(bib, "LIMIAR_TETO", 0.34);
    function maxDa(t) {
      var m = 0;
      ordemFixa.forEach(function (q) {
        if (bib.padroes[q].trilha === t && notas[q] && notas[q].s > m) m = notas[q].s;
      });
      return m;
    }
    var a = maxDa("ganho");
    var b = maxDa("retencao");
    var perto = a >= limiarTeto - EPS && b >= limiarTeto - EPS && Math.abs(a - b) <= regra(bib, "DELTA_TRILHAS", 0.25) + EPS;
    var melhor = null;
    ordemFixa.forEach(function (q) {
      if (bib.padroes[q].trilha === trilha || !notas[q]) return;
      if (melhor === null || notas[q].s > notas[melhor].s + EPS) melhor = q;
    });
    var vazamento = melhor !== null && notas[melhor].s >= regra(bib, "LIMIAR_VAZAMENTO", 0.5) - EPS ? melhor : null;
    return { trilha: trilha, trilhasPerto: perto, vazamento: vazamento };
  }

  // A faixa de cada área do Raio-X: 3 (nota ≥ 1), 2 (≥ limiar do teto), 1 (> 0), 0.
  function areasDoRaioX(notas, bib) {
    var limiar = regra(bib, "LIMIAR_TETO", 0.34);
    var saida = {};
    AREAS.forEach(function (area) {
      var m = 0;
      ordemDosPadroes(bib).forEach(function (p) {
        if (bib.padroes[p].area === area && notas[p] && notas[p].s > m) m = notas[p].s;
      });
      saida[area] = m >= 1 - EPS ? 3 : m >= limiar - EPS ? 2 : m > 0 ? 1 : 0;
    });
    return saida;
  }

  // ---- o que o resultado não indica ---------------------------------------------------------

  // Até 2 padrões e 2 famílias que as respostas descartam, cada um com a resposta que
  // descartou. Padrão: nota 0 e uma opção "contra" marcada (primeiro) ou "isso não acontece"
  // na cena dele. Família: a mais fraca, com o item que ela marcou como "menos" (ou o de
  // menor nível, na grade). Sem evidência, nada entra.
  function naoIndica(notas, r, norm, bib) {
    var resp = objeto(r);
    var indice = indiceDeOpcoes(bib);
    var porContra = [];
    var porCena = [];
    ordemDosPadroes(bib).forEach(function (p) {
      if (!notas[p] || notas[p].s !== 0) return;
      var contra = null;
      marcasPorCena(resp, bib).forEach(function (m) {
        var o = indice[m.valor].opcao;
        if (contra === null && o.padrao === p && o.tipo === "contra") contra = { padrao: p, evidencia: "contra", resposta: o.label, valor: o.value, cena: m.cena.id };
      });
      if (contra) {
        porContra.push(contra);
        return;
      }
      lista(bib.cenas).some(function (cena) {
        if (cena.padrao_principal === p && tem(resp[cena.id], objeto(cena.nao_acontece).value)) {
          porCena.push({ padrao: p, evidencia: "nao_acontece", resposta: cena.nao_acontece.label, valor: cena.nao_acontece.value, cena: cena.id, empurrao: cena.empurrao });
          return true;
        }
        return false;
      });
    });
    var padroes = porContra.concat(porCena).slice(0, 2);

    var d = desembrulhar(norm);
    var menos = {};
    lista(bib.triades).forEach(function (t) {
      var a = resp[t.id];
      if (triadeValida(t, a)) menos[a.menos] = (menos[a.menos] || 0) + 1;
    });
    var familias = [];
    familiasFracas(norm, bib, d.modo).forEach(function (f) {
      var itensDaFamilia = lista(objeto(bib.familias[f]).itens);
      var escolhido = null;
      if (d.modo === "grade") {
        var niveis = norm && norm.nivel ? norm.nivel : {};
        itensDaFamilia.forEach(function (i) {
          if (typeof niveis[i] !== "number") return;
          if (escolhido === null || niveis[i] < niveis[escolhido]) escolhido = i;
        });
      } else {
        itensDaFamilia.forEach(function (i) {
          if (!menos[i]) return;
          if (escolhido === null || menos[i] > menos[escolhido]) escolhido = i;
        });
      }
      if (escolhido !== null) familias.push({ familia: f, item: escolhido, resposta: bib.itens[escolhido].texto });
    });
    return { padroes: padroes, familias: familias.slice(0, 2) };
  }

  // ---- degraus do plano ---------------------------------------------------------------------

  function escadaDoPadrao(padrao, variante, bib) {
    var p = objeto(bib.padroes[padrao]);
    var porVariante = objeto(p.escada_por_variante);
    if (variante && porVariante[variante]) return porVariante[variante];
    if (p.escada) return p.escada;
    var primeira = lista(p.variantes)[0];
    return primeira ? porVariante[primeira] : null;
  }

  // O texto do experimento (degrau 1) que ela escolheu, ou o que escreveu.
  function textoDoExperimento(escada, r) {
    var resp = objeto(r);
    var opcoes = lista(escada && escada.degrau1);
    if (resp.experimento === "outro" && typeof resp.experimento_texto === "string" && resp.experimento_texto.trim()) {
      return resp.experimento_texto.trim();
    }
    for (var i = 0; i < opcoes.length; i += 1) {
      if (opcoes[i].value === resp.experimento) return opcoes[i].label;
    }
    return opcoes.length ? opcoes[0].label : "";
  }

  // O passo de cada marco. Degrau 0 no dia 3 (e o degrau 1 vai para o dia 5) quando a
  // confiança está abaixo do mínimo, o terreno marcou estresse E mês apertado, ela disse que
  // agora não ao desconforto, ou o humor pediu um degrau abaixo.
  // { menor, motivos, dia3, dia5, noventa }, cada passo com { degrau, texto }.
  function escolherDegraus(padrao, variante, r, cuidado, bib) {
    var resp = objeto(r);
    var escada = escadaDoPadrao(padrao, variante, bib);
    if (!escada) return null;
    var motivos = [];
    if (typeof resp.confianca === "number" && resp.confianca < regra(bib, "CONFIANCA_MINIMA", 6)) motivos.push("confianca");
    if (tem(resp.terreno, "estresse") && tem(resp.terreno, "mes_apertado")) motivos.push("terreno");
    if (resp.desconforto === "nao") motivos.push("desconforto");
    if (cuidado && cuidado.degrauAbaixo) motivos.push("humor");
    var menor = motivos.length > 0;
    var experimento = textoDoExperimento(escada, resp);
    if (menor) {
      return {
        menor: true,
        motivos: motivos,
        dia3: { degrau: 0, texto: escada.degrau0 },
        dia5: { degrau: 1, texto: experimento },
        noventa: { degrau: 2, texto: escada.degrau2 },
      };
    }
    return {
      menor: false,
      motivos: motivos,
      dia3: { degrau: 1, texto: experimento },
      dia5: { degrau: 2, texto: escada.degrau2 },
      noventa: { degrau: 3, texto: escada.degrau3 },
    };
  }

  // A trava do fim do Ato 1. Retenção: o atrito do padrão (nos padrões 1 e 5, no tipo de
  // renda dela). Ganho: o texto e um campo opcional para escrever o preço-alvo ou a menor ação.
  function travaImediata(padrao, variante, renda, bib) {
    var p = objeto(bib.padroes[padrao]);
    var trava = objeto(p.trava);
    var porRenda = objeto(trava.por_renda);
    var texto = trava.texto || "";
    var campo = null;
    if (p.trilha === "retencao") {
      if (typeof renda === "string" && typeof porRenda[renda] === "string" && porRenda[renda]) texto = porRenda[renda];
    } else {
      var modelo = objeto(objeto(bib.textos).trava_campo);
      campo = { id: modelo.id || "alvo", label: modelo.label || "", opcional: modelo.opcional !== false };
    }
    return { padrao: padrao, variante: variante || null, trilha: p.trilha, texto: texto, campo: campo };
  }

  // ---- planos de 7 e 90 dias -----------------------------------------------------------------

  function preencher(texto, valores) {
    return String(texto || "").replace(/\{([a-z0-9_]+)\}/g, function (m, chave) {
      return Object.prototype.hasOwnProperty.call(valores, chave) ? valores[chave] : m;
    });
  }

  // Os planos com as datas já calculadas: o dia n cai em dia0 + n.
  function montarPlanos(dia0, degraus, r, bib) {
    if (!kit.dataValida(dia0) || !degraus) return null;
    var resp = objeto(r);
    var planos = objeto(bib.planos);
    var padrao = objeto(bib.padroes)[resp.espelho];
    var fam = pontuarFamilias(resp, bib);
    var forte = familiaForte(fam, bib);
    var nomeDoPadrao = padrao ? padrao.nome : "";
    var valores = {
      dia3: capitalizar(kit.semPontoFinal(degraus.dia3.texto)),
      dia5: capitalizar(kit.semPontoFinal(degraus.dia5.texto)),
      noventa: kit.semPontoFinal(degraus.noventa.texto),
    };
    var rotulosDegrau = objeto(planos.rotulo_por_degrau);
    var arco7 = lista(planos.arco7).map(function (d) {
      var data = kit.somarDias(dia0, d.dia);
      var rotulo = d.por_degrau && degraus[d.por_degrau] && rotulosDegrau[degraus[d.por_degrau].degrau] ? rotulosDegrau[degraus[d.por_degrau].degrau] : d.rotulo;
      var texto = comNome(preencher(d.texto, valores), nomeDoPadrao);
      if (d.extra && tem(d.extra.familias, forte)) texto += " " + d.extra.texto;
      return { dia: d.dia, data: data, titulo: "Dia " + d.dia + " · " + dataCurta(data), rotulo: rotulo, texto: texto };
    });
    var nov = objeto(planos.noventa);
    return {
      dia0: dia0,
      datas: kit.datasDoCiclo(dia0, [7, 30, 60, 90]),
      arco7: arco7,
      noventa: {
        foco: preencher(nov.foco, valores),
        etapas: lista(nov.etapas).map(function (e) {
          return {
            rotulo: e.rotulo,
            de: kit.somarDias(dia0, e.de),
            ate: kit.somarDias(dia0, e.ate),
            texto: e.texto,
          };
        }),
        ritual_semanal: nov.ritual_semanal || "",
        revisoes: lista(nov.revisoes).map(function (v) {
          var data = kit.somarDias(dia0, v.dia);
          return { dia: v.dia, data: data, titulo: "Dia " + v.dia + " · " + dataCurta(data), pergunta: v.pergunta };
        }),
      },
    };
  }

  // ---- o cartão dos sinais --------------------------------------------------------------------

  function rotuloDe(opcoes, valor) {
    var achada = lista(opcoes).filter(function (o) { return o.value === valor; })[0];
    return achada ? achada.label : null;
  }

  // Os sinais gerais do padrão e os dela (sinais, frase, terreno, empurrão) e as duas regras.
  function montarSinais(padrao, r, bib) {
    var p = objeto(bib.padroes[padrao]);
    var resp = objeto(r);
    var textos = objeto(bib.textos);
    var card = objeto(textos.sinais_card);
    var sinais = [];
    lista(resp.sinais).forEach(function (v) {
      var rotulo = rotuloDe(p.sinais_opcoes, v);
      if (rotulo) sinais.push(rotulo);
    });
    if (tem(resp.sinais, "outro") && typeof resp.sinais_outro === "string" && resp.sinais_outro.trim()) sinais.push(resp.sinais_outro.trim());
    var terrenoOpcoes = objeto(objeto(bib.telas).terreno).opcoes;
    var terreno = [];
    lista(resp.terreno).forEach(function (v) {
      if (v === "nada") return;
      var rotulo = rotuloDe(terrenoOpcoes, v);
      if (rotulo) terreno.push(rotulo);
    });
    return {
      padrao: padrao,
      nome: p.nome || "",
      titulo: card.titulo || "",
      gerais: lista(p.sinais_gerais).concat(lista(textos.sinais_gerais)),
      dela: {
        empurrao: p.empurrao || "",
        sinais: sinais,
        frase: typeof resp.frase === "string" ? resp.frase.trim() : "",
        terreno: terreno,
      },
      regras: { na_hora: card.na_hora || "", quando_voltar: card.quando_voltar || "" },
    };
  }

  // ---- registro do teto -----------------------------------------------------------------------

  var DATA_REGRA = { tipo: "data" };

  function mapaDe(chaves, valor) {
    return { tipo: "mapa", chaves: chaves, completo: true, valor: valor };
  }

  // Descritor do registro v1 (tipo "padrao"): enums fixos, faixas, textos no limite.
  // Nenhum campo de cuidado (chão, humor, sinais de risco) existe aqui.
  var esquemaDoRegistro = {
    tipo: "objeto",
    campos: {
      v: { tipo: "inteiro", enum: [1] },
      tipo: { tipo: "texto", enum: ["padrao"] },
      produto: { tipo: "texto", enum: ["teto-financeiro"] },
      origem: { tipo: "texto", enum: ["gratis"] },
      bib: { tipo: "texto", padrao: "^[0-9]{4}\\.[0-9]{2}-[0-9]{1,3}$", max: 20 },
      data: DATA_REGRA,
      volta: { tipo: "inteiro", min: 1, max: 99 },
      ato: { tipo: "inteiro", enum: [1, 2] },
      padrao: { tipo: "texto", enum: PADROES },
      variante: { tipo: "texto", enum: VARIANTES, nulo: true },
      trilha: { tipo: "texto", enum: TRILHAS },
      trilhas_perto: { tipo: "booleano" },
      vazamento: { tipo: "texto", enum: PADROES, nulo: true },
      familia: { tipo: "texto", enum: FAMILIAS, nulo: true },
      modo_crenca: { tipo: "texto", enum: ["triade", "grade"] },
      notas: mapaDe(PADROES, {
        tipo: "objeto",
        campos: {
          f: { tipo: "numero", min: 0, max: 1, casas: 2 },
          c: { tipo: "inteiro", min: 0, max: 1 },
        },
      }),
      itens: { tipo: "mapa", padraoChave: "^(evitar|idolatrar|status|vigilancia|lealdade)_[1-9]$", max: 15, valor: { tipo: "inteiro", min: -1, max: 3 } },
      familias: mapaDe(FAMILIAS, { tipo: "numero", min: -1, max: 3, casas: 2 }),
      areas: mapaDe(AREAS, { tipo: "inteiro", min: 0, max: 3 }),
      regra_trabalho: { tipo: "texto", max: 160, opcional: true },
      se_entao: { tipo: "texto", max: 200, opcional: true },
      previsao: { tipo: "texto", max: 140, opcional: true },
      datas: {
        tipo: "objeto",
        campos: { d0: DATA_REGRA, d7: DATA_REGRA, d30: DATA_REGRA, d60: DATA_REGRA, d90: DATA_REGRA },
      },
    },
  };

  // Tudo o que as regras calculam de uma vez, a partir das respostas. O padrão é o que ela
  // escolheu no espelho; "nenhum" ou sem escolha dá null.
  function calcular(r, bib) {
    var resp = objeto(r);
    var cuidado = avaliarCuidado(resp, bib);
    var notas = pontuarPadroes(resp, bib);
    var fam = pontuarFamilias(resp, bib);
    var forte = familiaForte(fam, bib);
    var sugestao = sugerir(notas, forte, bib);
    var padrao = typeof resp.espelho === "string" && objeto(bib.padroes)[resp.espelho] ? resp.espelho : null;
    var variante = padrao ? varianteFinal(padrao, resp, bib) : null;
    var tv = padrao ? trilhaEVazamento(padrao, notas, bib) : null;
    return {
      cuidado: cuidado,
      notas: notas,
      familias: fam,
      familia: forte,
      fracas: familiasFracas(fam, bib),
      sugestao: sugestao,
      padrao: padrao,
      variante: variante,
      trilha: tv ? tv.trilha : null,
      trilhasPerto: tv ? tv.trilhasPerto : false,
      vazamento: tv ? tv.vazamento : null,
      areas: areasDoRaioX(notas, bib),
    };
  }

  function nivelDoItem(modo, valor) {
    return modo === "grade" ? valor >= 0 && valor <= 3 : valor >= -1 && valor <= 1;
  }

  function textoDaResposta(valor, max) {
    return typeof valor === "string" ? kit.cortarTexto(valor, max) : "";
  }

  // O registro do teto v1, validado no esquema e já em código base64url (até 2048
  // caracteres, cortando só os três textos livres). Sem registro no ramo de cuidado e sem padrão.
  // `calculos` é o que `calcular` devolve; `volta` é o número da volta (1 na primeira).
  // { ok, objeto, codigo, cortado } ou { ok: false, erro, erros? }.
  function montarRegistro(r, calculos, dia0, volta, bib) {
    var resp = objeto(r);
    var c = calculos || calcular(resp, bib);
    if (c.cuidado && c.cuidado.ramo) return { ok: false, erro: "cuidado" };
    if (!c.padrao) return { ok: false, erro: "sem_padrao" };
    if (!kit.dataValida(dia0)) return { ok: false, erro: "data" };
    var fam = c.familias;
    var ato = typeof resp.regra_trabalho === "string" && resp.regra_trabalho.trim() ? 2 : typeof resp.se_entao === "string" && resp.se_entao.trim() ? 2 : 1;
    if (c.ato === 1 || c.ato === 2) ato = c.ato;
    var notas = {};
    PADROES.forEach(function (p) {
      var n = c.notas[p] || { f: 0, c: 0 };
      notas[p] = { f: arredonda2(n.f), c: n.c ? 1 : 0 };
    });
    var itens = {};
    Object.keys(fam.nivel).forEach(function (i) { itens[i] = fam.nivel[i]; });
    var familias = {};
    FAMILIAS.forEach(function (f) {
      familias[f] = typeof fam.norm[f] === "number" ? arredonda2(fam.norm[f]) : null;
    });
    var registro = {
      v: 1,
      tipo: "padrao",
      produto: "teto-financeiro",
      origem: "gratis",
      bib: bib.versao,
      data: dia0,
      volta: volta,
      ato: ato,
      padrao: c.padrao,
      variante: c.variante || null,
      trilha: c.trilha,
      trilhas_perto: Boolean(c.trilhasPerto),
      vazamento: c.vazamento || null,
      familia: c.familia || null,
      modo_crenca: fam.modo,
      notas: notas,
      itens: itens,
      familias: familias,
      areas: c.areas,
    };
    if (ato === 2) {
      var regraTrabalho = textoDaResposta(resp.regra_trabalho, 160);
      var seEntao = textoDaResposta(resp.se_entao, 200);
      var previsao = textoDaResposta(resp.previsao, 140);
      if (regraTrabalho) registro.regra_trabalho = regraTrabalho;
      if (seEntao) registro.se_entao = seEntao;
      if (previsao) registro.previsao = previsao;
    }
    registro.datas = kit.datasDoCiclo(dia0, [7, 30, 60, 90]);
    var valido = kit.validarEsquema(registro, esquemaDoRegistro);
    if (!valido.ok) return { ok: false, erro: "esquema", erros: valido.erros };
    var forado = Object.keys(registro.itens).filter(function (i) { return !nivelDoItem(fam.modo, registro.itens[i]); });
    if (forado.length) return { ok: false, erro: "esquema", erros: ["nível fora da faixa do modo: " + forado.join(", ")] };
    var cod = kit.codificarRegistro(registro, 2048, { cortar: ["regra_trabalho", "se_entao", "previsao"] });
    if (!cod.ok) return { ok: false, erro: cod.erro };
    return { ok: true, objeto: cod.objeto, codigo: cod.codigo, cortado: cod.cortado };
  }

  // ---- o que a pessoa escreveu e escolheu, em texto -----------------------------------------

  function textosDaBib(bib) {
    return objeto(objeto(bib).textos);
  }

  // As marcas de sinal de todas as cenas, na ordem das cenas.
  function sinaisMarcados(r, bib) {
    var resp = objeto(r);
    var saida = [];
    lista(objeto(bib).cenas).forEach(function (cena) {
      var marcadas = lista(resp[cena.id]);
      lista(cena.opcoes).forEach(function (o) {
        if (o.tipo === "sinal" && marcadas.indexOf(o.value) !== -1) saida.push({ value: o.value, label: o.label });
      });
    });
    return saida;
  }

  // Os dois itens "mais verdadeiros" das tríades, da família mais forte para a mais fraca.
  function itensDasFrases(r, bib) {
    var resp = objeto(r);
    var familias = pontuarFamilias(resp, bib);
    if (familias.modo !== "triade") return [];
    var mais = [];
    lista(bib.triades).forEach(function (t) {
      if (triadeValida(t, resp[t.id])) mais.push(resp[t.id].mais);
    });
    return mais
      .map(function (id, i) {
        var nota = familias.norm[bib.itens[id].familia];
        return { id: id, i: i, nota: typeof nota === "number" ? nota : -2 };
      })
      .sort(function (x, y) { return (y.nota - x.nota) || (x.i - y.i); })
      .slice(0, 2)
      .map(function (x) { return { id: x.id, label: bib.itens[x.id].texto }; });
  }

  // A regra antiga, no texto da escolha dela: a frase da última vez, o item mais alto das
  // frases ou o que ela escreveu.
  function regraAntiga(r, bib) {
    var resp = objeto(r);
    if (resp.regra_antiga === "frase") return aparar(resp.frase);
    if (resp.regra_antiga === "item") {
      var itens = itensDasFrases(resp, bib);
      return itens.length ? itens[0].label : "";
    }
    if (resp.regra_antiga === "outra") return aparar(resp.regra_antiga_texto) || aparar(resp.frase);
    return "";
  }

  // O primeiro sinal dela, para o rascunho do "se, então".
  function primeiroSinal(r, bib) {
    var resp = objeto(r);
    var p = objeto(objeto(bib.padroes)[resp.espelho]);
    var achado = lista(resp.sinais).filter(function (v) { return v !== "outro"; }).map(function (v) { return rotuloDe(p.sinais_opcoes, v); }).filter(Boolean)[0];
    if (achado) return achado;
    return tem(resp.sinais, "outro") ? aparar(resp.sinais_outro) : "";
  }

  // O rascunho do "se, então" com o sinal, o ponto de escolha e a exceção dela; sem a exceção,
  // o exemplo do padrão. Ela reescreve como quiser.
  function rascunhoSeEntao(r, bib) {
    var resp = objeto(r);
    var modelo = objeto(textosDaBib(bib).se_entao);
    var valores = { sinal: primeiroSinal(resp, bib), ponto: aparar(resp.ponto_escolha), excecao: aparar(resp.excecao) };
    var completo = lista(modelo.exige).every(function (k) { return valores[k] !== ""; });
    if (completo) return capitalizar(kit.comporTexto(modelo.segmentos, valores));
    var escada = escadaDoPadrao(resp.espelho, varianteFinal(resp.espelho, resp, bib), bib);
    return capitalizar(escada && escada.se_entao_exemplo ? escada.se_entao_exemplo : "");
  }

  // ---- o fio ------------------------------------------------------------------------------------

  function valoresDoFio(r, bib) {
    var resp = objeto(r);
    var telas = objeto(bib.telas);
    var padrao = objeto(objeto(bib.padroes)[resp.espelho]);
    var juncao = objeto(objeto(textosDaBib(bib).fio)).juncao || "e";
    var minuscula = kit.primeiraMinuscula;
    var terreno = lista(resp.terreno).filter(function (v) { return v !== "nada"; })
      .map(function (v) { return rotuloDe(objeto(telas.terreno).opcoes, v); }).filter(Boolean).map(minuscula);
    var sinais = lista(resp.sinais).filter(function (v) { return v !== "outro"; })
      .map(function (v) { return rotuloDe(padrao.sinais_opcoes, v); }).filter(Boolean).map(minuscula);
    if (tem(resp.sinais, "outro") && aparar(resp.sinais_outro)) sinais.push(kit.semPontoFinal(resp.sinais_outro));
    var alivio = resp.alivio !== "nada" ? rotuloDe(objeto(telas.alivio).opcoes, resp.alivio) : null;
    var paraQue = resp.para_que !== "nao_sei" ? rotuloDe(objeto(telas.para_que).opcoes, resp.para_que) : null;
    var clima = resp.clima_casa !== "outro" ? rotuloDe(objeto(telas.clima_casa).opcoes, resp.clima_casa) : null;
    var previsao = aparar(resp.previsao);
    var importancia = typeof resp.importancia === "number" && isFinite(resp.importancia) ? resp.importancia : "";
    return {
      cena: aparar(resp.cena),
      terreno: listaNatural(terreno, juncao),
      sinais: listaNatural(sinais, juncao),
      frase: aparar(resp.frase),
      ponto: aparar(resp.ponto_escolha),
      alivio: alivio ? minuscula(alivio) : "",
      alivio_texto: aparar(resp.alivio_texto),
      custo: aparar(resp.custo_depois),
      para_que: paraQue ? minuscula(paraQue) : "",
      para_que_texto: aparar(resp.para_que_texto),
      clima: clima ? minuscula(clima) : "",
      clima_texto: aparar(resp.clima_texto),
      regra: regraAntiga(resp, bib),
      excecao: aparar(resp.excecao),
      previsao: previsao,
      crenca: previsao && typeof resp.crenca_previsao === "number" && isFinite(resp.crenca_previsao) ? resp.crenca_previsao : "",
      regra_trabalho: aparar(resp.regra_trabalho),
      importancia: importancia,
      motivos: aparar(resp.motivos),
      dia_um_ano: aparar(resp.dia_um_ano),
    };
  }

  function nomesDasLacunas(segmento) {
    var nomes = [];
    String(segmento).replace(/\{([A-Za-z0-9_]+)(?::[a-z,]+)?\}/g, function (m, nome) { nomes.push(nome); return m; });
    return nomes;
  }

  // Os cinco blocos do fio: "Como ele funciona em você", "Para que ele serve", "O que já funciona",
  // "A sua aposta" e "Por que mudar". Só o texto dela e os conectores fixos da biblioteca: cada
  // lacuna é uma resposta dela, o segmento com lacuna vazia sai inteiro e o bloco sem nada dela
  // não existe. Cada bloco: { id, titulo, paragrafos, lacunas } (só as lacunas que entraram).
  function montarFio(r, bib) {
    var modelo = lista(objeto(textosDaBib(bib).fio).blocos);
    var valores = valoresDoFio(r, bib);
    var saida = [];
    modelo.forEach(function (bloco) {
      var partes = [];
      var usadas = {};
      lista(bloco.segmentos).forEach(function (segmento) {
        var texto = kit.comporTexto([segmento], valores);
        if (!texto) return;
        partes.push(texto);
        nomesDasLacunas(segmento).forEach(function (nome) { usadas[nome] = valores[nome]; });
      });
      if (!partes.length) return;
      lista(bloco.fechos).forEach(function (fecho) {
        if (lista(fecho.exige).every(function (k) { return valores[k] !== "" && valores[k] !== undefined; })) partes.push(fecho.texto);
      });
      saida.push({ id: bloco.id, titulo: bloco.titulo, paragrafos: [partes.join(" ")], lacunas: usadas });
    });
    return saida;
  }

  // ---- as seções do resultado --------------------------------------------------------------------

  function marcasEmAspas(r, padrao, bib) {
    return marcasDoPadrao(r, padrao, bib).map(function (m) { return aspas(m.label); });
  }

  function secaoDoTeto(r, calc, bib, titulo) {
    var t = textosDaBib(bib).resultado.mapa;
    var frases = marcasEmAspas(r, calc.padrao, bib);
    var paragrafos = [t.trilha[calc.trilha]];
    if (calc.trilhasPerto) paragrafos.push(t.perto);
    if (frases.length) paragrafos.push(t.frases_marcadas);
    return { id: "teto", title: titulo || "Onde o seu teto pega", kind: "teto", paragraphs: paragrafos, items: frases };
  }

  function secaoDaFamilia(calc, bib) {
    var t = textosDaBib(bib).resultado.mapa;
    if (calc.familia) {
      return { id: "familia", title: t.familia + bib.familias[calc.familia].nome, kind: "familia", paragraphs: [bib.familias[calc.familia].leitura] };
    }
    return { id: "familia", title: "A crença que mais pesa", kind: "familia", paragraphs: [t.sem_familia] };
  }

  function secaoDoVazamento(r, calc, bib) {
    if (!calc.vazamento) return null;
    var t = textosDaBib(bib).resultado.mapa;
    var outro = bib.padroes[calc.vazamento];
    return {
      id: "vazamento",
      title: t.vazamento_titulo,
      kind: "vazamento",
      paragraphs: [comNome(t.vazamento, outro.nome), t.vazamento_nota],
      items: marcasEmAspas(r, calc.vazamento, bib),
    };
  }

  function secaoDoQueNaoIndica(r, calc, bib) {
    var nao = naoIndica(calc.notas, r, calc.familias, bib);
    var modelos = textosDaBib(bib).nao_indica;
    var descartes = [];
    nao.padroes.forEach(function (d) {
      var nome = bib.padroes[d.padrao].nome;
      descartes.push(d.evidencia === "contra"
        ? comNome(preencher(modelos.por_contra, { resposta: kit.semPontoFinal(d.resposta) }), nome)
        : comNome(preencher(modelos.por_nao_acontece, { cena: d.empurrao || "" }), nome));
    });
    nao.familias.forEach(function (d) {
      descartes.push(comNome(preencher(modelos.por_familia, { resposta: kit.semPontoFinal(d.resposta) }), bib.familias[d.familia].nome));
    });
    return descartes.length ? { id: "nao_indica", title: modelos.titulo, kind: "nao-indica", items: descartes } : null;
  }

  // Os 60 segundos. No mapa, a regra de trabalho é o exemplo do padrão; no fim do Ato 2, é a dela
  // (e o "se, então" dela fecha o último passo).
  function secaoDosSessentaSegundos(calc, bib, r) {
    var padrao = bib.padroes[calc.padrao];
    var sessenta = textosDaBib(bib).sessenta_segundos;
    var t = textosDaBib(bib).resultado.mapa;
    var fim = textosDaBib(bib).resultado.final;
    var dela = r ? objeto(r) : null;
    return {
      id: "sessenta",
      title: sessenta.titulo,
      kind: "sessenta",
      items: sessenta.passos.map(function (p) {
        var texto = comNome(p.texto, padrao.nome);
        if (p.id === "regra" && dela && aparar(dela.regra_trabalho)) return texto + preencher(fim.sessenta_regra, { regra: kit.semPontoFinal(dela.regra_trabalho) });
        if (p.id === "passo" && dela && aparar(dela.se_entao)) return texto + preencher(fim.sessenta_se_entao, { se_entao: kit.semPontoFinal(dela.se_entao) });
        return p.id === "regra" && padrao.regra_trabalho_exemplo && !dela
          ? texto + preencher(t.sessenta_regra, { exemplo: kit.semPontoFinal(padrao.regra_trabalho_exemplo) })
          : texto;
      }),
    };
  }

  function secaoDaTrava(r, trava, bib) {
    var t = textosDaBib(bib).resultado.mapa;
    var paragrafos = [trava.texto];
    if (aparar(objeto(r).alvo)) paragrafos.push(t.trava_alvo + aspas(r.alvo));
    return { id: "trava", title: t.trava_titulo, kind: "trava", paragraphs: paragrafos };
  }

  // Os sinais do padrão e, no fim do Ato 2 (`dela`), os dela: os sinais, a frase e o terreno.
  function secaoDosSinais(padrao, r, bib, dela) {
    var t = textosDaBib(bib).resultado.mapa;
    var fim = textosDaBib(bib).resultado.final;
    var sinais = montarSinais(padrao, r, bib);
    var paragrafos = [];
    if (sinais.dela.empurrao) paragrafos.push(preencher(t.sinais_empurrao, { empurrao: kit.semPontoFinal(sinais.dela.empurrao) }));
    if (dela) {
      var juncao = objeto(textosDaBib(bib).fio).juncao || "e";
      if (sinais.dela.sinais.length) paragrafos.push(preencher(fim.sinais_dela, { sinais: listaNatural(sinais.dela.sinais.map(kit.primeiraMinuscula), juncao) }));
      if (sinais.dela.frase) paragrafos.push(preencher(fim.sinais_frase, { frase: kit.semPontoFinal(sinais.dela.frase) }));
      if (sinais.dela.terreno.length) paragrafos.push(preencher(fim.sinais_terreno, { terreno: listaNatural(sinais.dela.terreno.map(kit.primeiraMinuscula), juncao) }));
    }
    paragrafos.push(sinais.regras.na_hora, sinais.regras.quando_voltar);
    var gerais = lista(sinais.gerais).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    return { id: "sinais", title: sinais.titulo, kind: "sinais", paragraphs: paragrafos.filter(Boolean), items: gerais };
  }

  // O Raio-X: a faixa de cada área, a crença que mais pesa e o clima da casa.
  function secaoDoRaioX(r, calc, bib) {
    var t = textosDaBib(bib);
    var raiox = objeto(t.resultado.raiox);
    var fim = objeto(t.resultado.final);
    var resp = objeto(r);
    var itens = AREAS.map(function (area) {
      return preencher(raiox.linha, { area: objeto(raiox.areas)[area], faixa: lista(raiox.faixas)[calc.areas[area]] });
    });
    var paragrafos = [];
    var clima = resp.clima_casa !== "outro" ? rotuloDe(objeto(bib.telas.clima_casa).opcoes, resp.clima_casa) : null;
    if (clima) paragrafos.push(preencher(fim.raiox_clima, { clima: kit.primeiraMinuscula(clima) }));
    if (aparar(resp.clima_texto)) paragrafos.push(preencher(clima ? fim.raiox_clima_texto : fim.raiox_clima_so_texto, { texto: kit.semPontoFinal(resp.clima_texto) }));
    return { id: "raiox", title: raiox.titulo, kind: "raiox", paragraphs: paragrafos, items: itens };
  }

  function secaoDaLeitura(calc, bib) {
    var padrao = bib.padroes[calc.padrao];
    var paragrafos = [padrao.leitura.base];
    if (calc.variante && padrao.leitura.por_variante && padrao.leitura.por_variante[calc.variante]) paragrafos.push(padrao.leitura.por_variante[calc.variante]);
    return { id: "leitura", title: textosDaBib(bib).resultado.final.titulo_leitura, kind: "leitura", paragraphs: paragrafos };
  }

  function secoesDoFio(r, bib) {
    return montarFio(r, bib).map(function (b) {
      return { id: "fio_" + b.id, title: b.titulo, kind: "fio", paragraphs: b.paragrafos };
    });
  }

  function textoDoAjuste(degraus, bib) {
    var fim = textosDaBib(bib).resultado.final;
    var minimo = regra(bib, "CONFIANCA_MINIMA", 6);
    var motivos = lista(degraus.motivos).map(function (m) { return preencher(objeto(fim.ajuste_motivos)[m], { minimo: minimo }); });
    return preencher(fim.ajuste, { motivos: listaNatural(motivos, fim.ajuste_juncao) });
  }

  function secaoDoPlano90(planos, bib) {
    var fim = textosDaBib(bib).resultado.final;
    var n = planos.noventa;
    var itens = n.etapas.map(function (e) {
      return { title: e.rotulo + " · " + dataCurta(e.de) + " a " + dataCurta(e.ate), text: e.texto };
    });
    if (n.ritual_semanal) itens.push({ title: "Toda semana", text: n.ritual_semanal });
    n.revisoes.forEach(function (v) { itens.push({ title: v.titulo, text: v.pergunta }); });
    var d = objeto(bib.planos.deslize);
    if (d.titulo) {
      itens.push({
        title: d.titulo,
        text: [d.pergunta].concat(lista(d.noventa_segundos)).concat([d.passo, d.nota]).filter(Boolean).join(" "),
      });
    }
    return { id: "plano90", title: fim.titulo_plano90, kind: "plano90", paragraphs: [n.foco], items: itens, depoisDoPlano: true };
  }

  function itensDoPlano7(planos) {
    return planos.arco7.map(function (d) {
      return { id: "d" + d.dia, title: d.titulo + ": " + d.rotulo, text: d.texto };
    });
  }

  // ---- o registro na tela --------------------------------------------------------------------------

  function resumoDoRegistro(reg, calc, r, dia0, bib) {
    var t = textosDaBib(bib).resultado.registro;
    var padrao = bib.padroes[calc.padrao];
    var linhas = [
      { q: t.teto, value: padrao.nome },
      { q: t.trilha, value: calc.trilha === "ganho" ? "ganho" : "retenção" },
      { q: t.familia, value: calc.familia ? bib.familias[calc.familia].nome : "" },
    ];
    if (objeto(reg.objeto).regra_trabalho) linhas.push({ q: t.regra, value: reg.objeto.regra_trabalho });
    linhas.push({ q: t.data, value: dataBR(dia0) });
    return { titulo: t.titulo, resumo: linhas, objeto: reg.objeto, codigo: reg.codigo };
  }

  // ---- os lembretes (.ics) ------------------------------------------------------------------------

  function horaDoLembrete(estado) {
    return typeof objeto(estado).lembrete === "string" && /^\d\d:\d\d$/.test(estado.lembrete) ? estado.lembrete : HORA_PADRAO;
  }

  function eventoSemanal(estado, dia0, bib) {
    var t = textosDaBib(bib).resultado.app.semana;
    return {
      uid: "teto-semana-" + estado.ciclo + "@dlt.academy",
      inicio: kit.somarDias(dia0, 7),
      hora: horaDoLembrete(estado),
      duracaoMin: 10,
      resumo: t.resumo,
      descricao: t.descricao,
      url: estado.pagina + "#volta=semana",
      repetir: { semanal: true, vezes: 13 },
    };
  }

  // O fim do Ato 1: a revisão semanal e, se ela pausar, o lembrete de continuar.
  function eventosDoMapa(estado, bib) {
    var ctx = objeto(estado);
    if (!ctx.pagina || !ctx.ciclo || !kit.dataValida(ctx.hoje)) return null;
    var app = textosDaBib(bib).resultado.app;
    return {
      prodid: PRODID,
      rotulo: app.rotulo,
      eventos: [
        eventoSemanal(ctx, ctx.hoje, bib),
        {
          uid: "teto-continuar-" + ctx.ciclo + "@dlt.academy",
          inicio: kit.somarDias(ctx.hoje, 1),
          hora: horaDoLembrete(ctx),
          duracaoMin: 15,
          resumo: app.continuar.resumo,
          descricao: app.continuar.descricao,
          url: ctx.pagina + "#volta=continuar",
        },
      ],
    };
  }

  function perguntasDoMarco(marco, bib) {
    var ret = objeto(objeto(bib.retornos)[marco]);
    var perguntas = lista(ret.perguntas).map(function (p) { return p.prompt; });
    if (perguntas.length) return perguntas;
    var revisao = lista(objeto(bib.planos.noventa).revisoes).filter(function (v) { return "dia" + v.dia === marco; })[0];
    return revisao ? [revisao.pergunta] : [];
  }

  // O fim do Ato 2: os dias 3, 7, 30 e 90 e a revisão semanal. Só o título do marco, as
  // perguntas fixas dele e o link com o marco; nada do que ela respondeu.
  function eventosDosRetornos(estado, dia0, bib) {
    var ctx = objeto(estado);
    if (!ctx.pagina || !ctx.ciclo || !kit.dataValida(dia0)) return null;
    var app = textosDaBib(bib).resultado.app;
    var eventos = [3, 7, 30, 90].map(function (dias) {
      var marco = "dia" + dias;
      var titulo = objeto(bib.retornos[marco]).titulo || marco;
      return {
        uid: "teto-" + marco + "-" + ctx.ciclo + "@dlt.academy",
        inicio: kit.somarDias(dia0, dias),
        hora: horaDoLembrete(ctx),
        duracaoMin: 3,
        resumo: app.retorno.prefixo + kit.primeiraMinuscula(titulo),
        descricao: perguntasDoMarco(marco, bib).concat([app.retorno.abrir]).join(" "),
        url: ctx.pagina + "#volta=" + marco,
      };
    });
    eventos.push(eventoSemanal(ctx, dia0, bib));
    return { prodid: PRODID, rotulo: app.rotulo, eventos: eventos };
  }

  // ---- os cartões em PNG --------------------------------------------------------------------------

  function cartaoDosSinais(padrao, sinais, bib) {
    var c = textosDaBib(bib).resultado.cartoes.sinais;
    var dela = [];
    if (sinais.dela.empurrao) dela.push(capitalizar(sinais.dela.empurrao));
    sinais.dela.sinais.forEach(function (s) { dela.push(s); });
    if (sinais.dela.frase) dela.push(aspas(sinais.dela.frase));
    if (sinais.dela.terreno.length) dela.push(capitalizar(sinais.dela.terreno.join(", ")));
    var secoes = [];
    var gerais = lista(sinais.gerais).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 5);
    if (gerais.length) secoes.push({ titulo: c.gerais, itens: gerais });
    if (dela.length) secoes.push({ titulo: c.dela, itens: dela });
    secoes.push({ titulo: c.na_hora, itens: [sinais.regras.na_hora] });
    secoes.push({ titulo: c.voltar, itens: [sinais.regras.quando_voltar] });
    return {
      id: "sinais",
      rotulo: c.rotulo,
      arquivo: c.arquivo,
      formato: "story",
      eyebrow: c.eyebrow,
      titulo: sinais.titulo,
      linhas: [bib.padroes[padrao].nome],
      secoes: secoes,
      rodape: lista(c.rodape).slice(),
    };
  }

  // Só o nome do padrão e o endereço público da ferramenta.
  function cartaoParaCompartilhar(padrao, bib) {
    var c = textosDaBib(bib).resultado.cartoes.compartilhar;
    return {
      id: "compartilhar",
      rotulo: c.rotulo,
      arquivo: c.arquivo,
      formato: "story",
      eyebrow: c.eyebrow,
      titulo: bib.padroes[padrao].nome,
      linhas: [c.frase, c.pergunta],
      secoes: [],
      rodape: lista(c.rodape).slice(),
    };
  }

  // ---- os blocos marcados do .md --------------------------------------------------------------------

  function opcaoDe(opcoes, valor) {
    return lista(opcoes).filter(function (o) { return o.value === valor; })[0] || null;
  }

  function campoTexto(id, rotulo, valor) {
    return { id: id, rotulo: rotulo, texto: typeof valor === "string" ? valor : "" };
  }

  function campoEscolha(id, rotulo, valor, opcoes) {
    var o = opcaoDe(opcoes, valor);
    return { id: id, rotulo: rotulo, valor: typeof valor === "string" ? valor : "", texto: o ? o.label : "" };
  }

  function campoNumero(id, rotulo, valor, sufixo) {
    var ok = typeof valor === "number" && isFinite(valor);
    return { id: id, rotulo: rotulo, valor: ok ? String(valor) : "", texto: ok ? valor + (sufixo || "") : "" };
  }

  function campoVarios(id, rotulo, valores, opcoes, linhas) {
    var marcados = lista(valores);
    var rotulos = lista(opcoes).filter(function (o) { return marcados.indexOf(o.value) !== -1; }).map(function (o) { return o.label; });
    return { id: id, rotulo: rotulo, valor: marcados.join(","), texto: linhas ? rotulos.map(function (x) { return "- " + x; }).join("\n") : rotulos.join(", ") };
  }

  function blocoDaLeitura(id, titulo, linhas) {
    return { id: id, v: 1, titulo: titulo, leitura: true, linhas: linhas };
  }

  function linhasDeSecoes(secoes) {
    var linhas = [];
    secoes.forEach(function (s) {
      linhas.push("**" + s.title + "**");
      lista(s.paragraphs).forEach(function (p) { linhas.push(p); });
      lista(s.items).forEach(function (i) { linhas.push("- " + (i && typeof i === "object" ? i.title + (i.text ? ": " + i.text : "") : i)); });
    });
    return linhas;
  }

  function blocoDoPadrao(r, calc, bib) {
    var resp = objeto(r);
    var padrao = bib.padroes[calc.padrao];
    var trava = travaImediata(calc.padrao, calc.variante, resp.renda, bib);
    var frases = marcasDoPadrao(resp, calc.padrao, bib);
    return {
      id: "teto.padrao", v: 1, titulo: "O seu teto",
      campos: [
        { id: "padrao", rotulo: "O teto", valor: calc.padrao, texto: padrao.nome },
        { id: "variante", rotulo: "O detalhe", valor: calc.variante || "", texto: calc.variante ? bib.variantes[calc.variante].nome : "" },
        { id: "trilha", rotulo: "O tipo de teto", valor: calc.trilha, texto: calc.trilha === "ganho" ? "ganho" : "retenção" },
        { id: "vazamento", rotulo: "O vazamento em observação", valor: calc.vazamento || "", texto: calc.vazamento ? bib.padroes[calc.vazamento].nome : "" },
        { id: "espelho", rotulo: "As frases que você marcou", texto: frases.map(function (f) { return "- " + f.label; }).join("\n") },
        { id: "trava", rotulo: "A trava de hoje", texto: trava.texto },
        campoEscolha("renda", "Como o dinheiro entra", resp.renda, objeto(bib.telas.renda).opcoes),
        campoTexto("alvo", "O que você escreveu para a trava", resp.alvo),
      ],
    };
  }

  function blocoDosFatos(r, bib) {
    var fatos = objeto(objeto(r).fatos);
    return {
      id: "teto.fatos", v: 1, titulo: "Os últimos 30 dias",
      campos: lista(bib.fatos).map(function (f) {
        var valor = fatos[f.id];
        var o = opcaoDe(f.opcoes.concat([f.na]), valor);
        return { id: f.id, rotulo: f.label, valor: valor === undefined ? "" : String(valor), texto: o ? o.label : "" };
      }),
    };
  }

  function blocoDoRaioX(r, calc, bib, comClima) {
    var resp = objeto(r);
    var nivel = calc.familias.nivel || {};
    var ordemItens = Object.keys(bib.itens).filter(function (id) { return Object.prototype.hasOwnProperty.call(nivel, id); });
    var campos = [
      { id: "familia", rotulo: "A crença que mais pesa", valor: calc.familia || "", texto: calc.familia ? bib.familias[calc.familia].nome : "" },
      { id: "itens", rotulo: "Os itens e o nível de cada um", texto: ordemItens.map(function (id) { return id + ": " + nivel[id]; }).join("\n") },
      {
        id: "areas", rotulo: "As áreas",
        valor: Object.keys(calc.areas).map(function (k) { return k + "." + calc.areas[k]; }).join(","),
        texto: Object.keys(calc.areas).map(function (k) { return k + ": " + calc.areas[k]; }).join("\n"),
      },
    ];
    if (comClima) {
      campos.push(campoEscolha("clima", "O clima do dinheiro na casa", resp.clima_casa, objeto(bib.telas.clima_casa).opcoes));
      campos.push(campoTexto("clima_texto", "O clima, com as suas palavras", resp.clima_texto));
    }
    return { id: "teto.raiox", v: 1, titulo: "A relação com o dinheiro", campos: campos };
  }

  function blocoDasCenas(r, bib) {
    var resp = objeto(r);
    var campos = lista(bib.cenas).map(function (cena) {
      var marcadas = lista(resp[cena.id]);
      var rotulos = cena.opcoes.concat([cena.nao_acontece]).filter(function (o) { return marcadas.indexOf(o.value) !== -1; }).map(function (o) { return "- " + o.label; });
      return { id: cena.id, rotulo: cena.empurrao, valor: marcadas.join(","), texto: rotulos.join("\n") };
    });
    var custo = sinaisMarcados(resp, bib).concat([bib.telas.custo.nenhuma]).filter(function (o) { return o.value === resp.custo; })[0];
    campos.push({ id: "custo", rotulo: "O que custou mais", valor: resp.custo || "", texto: custo ? custo.label : "" });
    return { id: "teto.cenas", v: 1, titulo: "As cenas", campos: campos };
  }

  function blocoDasFrases(r, bib) {
    var resp = objeto(r);
    var campos = lista(bib.triades).map(function (t) {
      var a = resp[t.id];
      var ok = triadeValida(t, a);
      return {
        id: t.id,
        rotulo: "As frases " + t.id.replace("triade_", ""),
        valor: ok ? [a.mais, a.menos].join(",") : "",
        texto: ok ? "Mais: " + bib.itens[a.mais].texto + "\nMenos: " + bib.itens[a.menos].texto : "",
      };
    });
    var niveis = objeto(resp.frases_nivel);
    campos.push({
      id: "frases_nivel",
      rotulo: "O quanto as duas mais verdadeiras soam",
      valor: Object.keys(niveis).map(function (id) { return id + "." + niveis[id]; }).join(","),
      texto: Object.keys(niveis).filter(function (id) { return bib.itens[id]; }).map(function (id) { return bib.itens[id].texto + ": " + niveis[id]; }).join("\n"),
    });
    return { id: "teto.frases", v: 1, titulo: "As frases", campos: campos };
  }

  function blocoDaUltimaVez(r, bib) {
    var resp = objeto(r);
    var telas = objeto(bib.telas);
    var p = objeto(objeto(bib.padroes)[resp.espelho]);
    var sinaisOpcoes = lista(p.sinais_opcoes).concat([objeto(telas.sinais).outro]);
    return {
      id: "teto.ultima_vez", v: 1, titulo: "A última vez",
      campos: [
        campoTexto("cena", "A cena", resp.cena),
        campoVarios("terreno", "O terreno do dia", resp.terreno, objeto(telas.terreno).opcoes, false),
        campoVarios("sinais", "Os sinais", resp.sinais, sinaisOpcoes, true),
        campoTexto("sinais_outro", "Outro sinal", resp.sinais_outro),
        campoTexto("frase", "A frase que passou pela cabeça", resp.frase),
        campoTexto("ponto_escolha", "O ponto de escolha", resp.ponto_escolha),
        campoEscolha("alivio", "O que isso tirou na hora", resp.alivio, objeto(telas.alivio).opcoes),
        campoTexto("alivio_texto", "O alívio, com as suas palavras", resp.alivio_texto),
        campoTexto("custo_depois", "O que custou depois", resp.custo_depois),
        campoEscolha("para_que", "Para que serviu", resp.para_que, objeto(telas.para_que).opcoes),
        campoTexto("para_que_texto", "Para que serviu, com as suas palavras", resp.para_que_texto),
        campoTexto("excecao", "A exceção", resp.excecao),
      ],
    };
  }

  function opcoesDaRegraAntiga(r, bib) {
    var resp = objeto(r);
    var saida = [];
    if (aparar(resp.frase)) saida.push({ value: "frase", label: aspas(resp.frase) });
    var itens = itensDasFrases(resp, bib);
    if (itens.length) saida.push({ value: "item", label: aspas(itens[0].label) });
    saida.push(objeto(bib.telas.regra_antiga).outra);
    return saida;
  }

  function blocoDoRessignificar(r, bib) {
    var resp = objeto(r);
    var telas = objeto(bib.telas);
    var regraEscolhida = campoEscolha("regra_antiga", "A regra antiga", resp.regra_antiga, opcoesDaRegraAntiga(resp, bib));
    regraEscolhida.texto = regraAntiga(resp, bib);
    return {
      id: "teto.ressignificar", v: 1, titulo: "Ressignificar",
      campos: [
        campoEscolha("desgrudar", "Como o pensamento soa agora", resp.desgrudar, objeto(telas.desgrudar).opcoes),
        regraEscolhida,
        campoTexto("regra_antiga_texto", "A regra, com as suas palavras", resp.regra_antiga_texto),
        campoTexto("regra_origem", "De onde veio a regra", resp.regra_origem),
        campoTexto("previsao", "O que a regra prevê", resp.previsao),
        campoNumero("crenca_previsao", "Quanto você acredita na previsão", resp.crenca_previsao, "%"),
        campoTexto("dia_um_ano", "Um dia daqui a um ano", resp.dia_um_ano),
        campoNumero("importancia", "A importância de mudar", resp.importancia, "/10"),
        campoTexto("motivos", "Por que esse número", resp.motivos),
        campoTexto("regra_trabalho", "A sua regra de trabalho", resp.regra_trabalho),
      ],
    };
  }

  function blocoDoPlano(r, calc, bib) {
    var resp = objeto(r);
    var telas = objeto(bib.telas);
    var escada = escadaDoPadrao(calc.padrao, calc.variante, bib);
    var experimento = campoEscolha("experimento", "O primeiro experimento", resp.experimento, lista(escada && escada.degrau1).concat([objeto(telas.experimento).outro]));
    experimento.texto = textoDoExperimento(escada, resp);
    return {
      id: "teto.plano", v: 1, titulo: "O plano",
      campos: [
        campoEscolha("desconforto", "O desconforto que vai junto", resp.desconforto, objeto(telas.desconforto).opcoes),
        experimento,
        campoTexto("experimento_texto", "O experimento, com as suas palavras", resp.experimento_texto),
        campoTexto("se_entao", "O se, então", resp.se_entao),
        campoNumero("confianca", "A confiança", resp.confianca, "/10"),
        campoTexto("sobe_um_ponto", "O que faria subir 1 ponto", resp.sobe_um_ponto),
        campoTexto("proximas_24h", "As próximas 24 horas", resp.proximas_24h),
      ],
    };
  }

  // O .md do fim do Ato 2, em blocos marcados: as respostas por id (o que o importar lê), a
  // leitura para uma pessoa (o fio, os sinais, os planos) e, por último, o registro.
  // `partes` (fio, planos, sinais, registro) é opcional: o que já foi calculado para o resultado.
  function montarBlocos(r, calculos, estado, bib, partes) {
    var resp = objeto(r);
    var ctx = objeto(estado);
    var c = calculos || calcular(resp, bib);
    if (!c.padrao || (c.cuidado && c.cuidado.ramo)) return [];
    var dia0 = ctx.dia0 || ctx.hoje;
    var p = objeto(partes);
    var fio = p.fio || montarFio(resp, bib);
    var sinais = p.sinais || montarSinais(c.padrao, resp, bib);
    var degraus = p.degraus || escolherDegraus(c.padrao, c.variante, resp, c.cuidado, bib);
    var planos = p.planos || montarPlanos(dia0, degraus, resp, bib);
    var reg = p.registro || montarRegistro(resp, Object.assign({}, c, { ato: 2 }), dia0, ctx.volta || 1, bib);
    var blocos = [];
    blocos.push(blocoDoPadrao(resp, c, bib));
    blocos.push(blocoDaLeitura("teto.fio", "O fio", fio.reduce(function (acc, b) { return acc.concat(["**" + b.titulo + "**"], b.paragrafos); }, [])));
    blocos.push(blocoDoRaioX(resp, c, bib, true));
    blocos.push(blocoDaUltimaVez(resp, bib));
    blocos.push(blocoDoRessignificar(resp, bib));
    blocos.push(blocoDoPlano(resp, c, bib));
    blocos.push(blocoDaLeitura("teto.sinais", sinais.titulo, linhasDeSecoes([secaoDosSinais(c.padrao, resp, bib, true)])));
    if (planos) {
      blocos.push(blocoDaLeitura("teto.plano7", textosDaBib(bib).resultado.final.titulo_plano7,
        planos.arco7.map(function (d) { return d.titulo + ": " + d.rotulo + ". " + d.texto; })));
      blocos.push(blocoDaLeitura("teto.plano90", textosDaBib(bib).resultado.final.titulo_plano90, linhasDeSecoes([secaoDoPlano90(planos, bib)])));
    }
    blocos.push(blocoDosFatos(resp, bib));
    blocos.push(blocoDasCenas(resp, bib));
    blocos.push(blocoDasFrases(resp, bib));
    if (reg && reg.ok) blocos.push({ id: "teto.registro", v: 1, titulo: "O registro do teto", json: reg.objeto, codigo: reg.codigo });
    return blocos;
  }

  // O .md do fim do Ato 1: o mapa para ler, as respostas do Ato 1 e o registro.
  function blocosDoMapa(r, calc, secoes, reg, bib) {
    var blocos = [];
    blocos.push(blocoDaLeitura("teto.mapa", "O seu mapa", linhasDeSecoes(secoes)));
    blocos.push(blocoDoPadrao(r, calc, bib));
    blocos.push(blocoDosFatos(r, bib));
    blocos.push(blocoDoRaioX(r, calc, bib, false));
    blocos.push(blocoDasCenas(r, bib));
    blocos.push(blocoDasFrases(r, bib));
    if (reg && reg.ok) blocos.push({ id: "teto.registro", v: 1, titulo: "O registro do teto", json: reg.objeto, codigo: reg.codigo });
    return blocos;
  }

  // ---- o resultado ------------------------------------------------------------------------------------

  // Sem plano de romper nada, sem registro, sem guardar, sem lembrete e sem oferta.
  function resultadoDeCuidado(cuidado, bib) {
    var textos = objeto(bib.cuidado).textos;
    var t = textosDaBib(bib).resultado;
    var base = { grade: 3, tone: "mixed", pill: false, eyebrow: t.cuidado.eyebrow };
    if (cuidado.ramo === "ajuda") {
      return Object.assign({ id: 901, verdict: textos.ajuda.titulo, body: textos.ajuda.paragrafos.slice() }, base);
    }
    var chao = bib.planos.chao_primeiro;
    var plano = chao.arco7.map(function (linha, i) {
      var m = /^(Dia \d+):\s*(.+)$/.exec(linha);
      return m ? { id: "d" + (i + 1), title: m[1], text: capitalizar(m[2]) } : { id: "d" + (i + 1), title: "Passo " + (i + 1), text: linha };
    });
    var resultado = Object.assign({
      id: 902,
      verdict: textos.chao_primeiro.titulo,
      body: textos.chao_primeiro.paragrafos.slice(),
      plan: plano,
      sections: [{ id: "noventa", title: t.cuidado.noventa, paragraphs: [capitalizar(String(chao.noventa || "").replace(/^Nos 90 dias:\s*/, ""))] }],
    }, base);
    if (cuidado.avisoHumor) resultado.safety = textos.aviso_humor;
    return resultado;
  }

  // "Nenhum padrão domina": um resultado honesto, sem inventar um teto, sem oferta.
  function resultadoNenhum(bib) {
    var nenhum = textosDaBib(bib).nenhum;
    var curto = bib.planos.gerais_nenhum;
    var t = textosDaBib(bib).resultado;
    return {
      id: 903,
      grade: 2,
      tone: "mixed",
      pill: false,
      eyebrow: t.nenhum.eyebrow,
      verdict: nenhum.titulo,
      body: nenhum.paragrafos.slice(),
      sections: [
        { id: "plano_curto", title: curto.titulo, kind: "plano", items: curto.passos.slice() },
        { id: "voltar", title: t.nenhum.voltar, kind: "sinais", items: lista(textosDaBib(bib).sinais_gerais).slice() },
      ],
      safety: t.mapa.seguranca,
    };
  }

  function avisoDeSeguranca(calc, bib) {
    return calc.cuidado.avisoHumor ? bib.cuidado.textos.aviso_humor : textosDaBib(bib).resultado.mapa.seguranca;
  }

  // O resultado do fim do Ato 1 (o checkpoint): o mapa, a trava e o que se leva.
  // `estado`: { ciclo, hoje, pagina, lembrete }.
  function montarParcial(r, estado, bib) {
    var resp = objeto(r);
    var ctx = objeto(estado);
    var calc = calcular(resp, bib);
    var t = textosDaBib(bib).resultado.mapa;
    var padrao = bib.padroes[calc.padrao];
    var trava = travaImediata(calc.padrao, calc.variante, resp.renda, bib);
    var secoes = [
      secaoDoTeto(resp, calc, bib),
      secaoDaFamilia(calc, bib),
      secaoDoVazamento(resp, calc, bib),
      secaoDoQueNaoIndica(resp, calc, bib),
      secaoDosSessentaSegundos(calc, bib),
      secaoDaTrava(resp, trava, bib),
      secaoDosSinais(calc.padrao, resp, bib),
    ].filter(Boolean);
    var reg = montarRegistro(resp, calc, ctx.hoje, 1, bib);
    var leitura = [padrao.leitura.base];
    if (calc.variante && padrao.leitura.por_variante && padrao.leitura.por_variante[calc.variante]) leitura.push(padrao.leitura.por_variante[calc.variante]);
    var resultado = {
      id: 10,
      grade: 1,
      tone: "good",
      pill: false,
      eyebrow: t.eyebrow,
      verdict: t.verdict + padrao.nome,
      body: leitura.concat([t.parte2]),
      sections: secoes,
      safety: avisoDeSeguranca(calc, bib),
      blocks: blocosDoMapa(resp, calc, secoes, reg, bib),
      arquivos: { md: t.arquivo + "-" + ctx.hoje + ".md", pdf: t.arquivo + "-" + ctx.hoje + ".pdf", ics: "teto-financeiro-lembretes.ics" },
    };
    var ics = eventosDoMapa(ctx, bib);
    if (ics) resultado.ics = ics;
    if (reg.ok) resultado.registro = resumoDoRegistro(reg, calc, resp, ctx.hoje, bib);
    return resultado;
  }

  // Onde a oferta do aprofundamento entra no resultado: nenhuma por enquanto.
  function ofertaDoAprofundamento() {
    return null;
  }

  // O resultado do fim do Ato 2, na ordem: o teto, o fio, o Raio-X, o que não indica, a
  // leitura, os 60 segundos, os sinais, o plano de 7 dias, o de 90, e o que se leva.
  // `estado`: { ciclo, hoje, pagina, lembrete, volta }. O dia 0 é o da volta já guardada
  // (para os dias do plano não andarem ao reabrir) ou, na primeira vez, o de hoje.
  function montarResultado(r, estado, bib, hoje) {
    var resp = objeto(r);
    var ctx = objeto(estado);
    var calc = calcular(resp, bib);
    if (calc.cuidado.ramo) return resultadoDeCuidado(calc.cuidado, bib);
    if (!calc.padrao) return resultadoNenhum(bib);

    var agora = kit.dataValida(hoje) ? hoje : ctx.hoje;
    var volta = objeto(ctx.volta);
    var guardada = objeto(volta.registro).ato === 2 && kit.dataValida(volta.dia0);
    var dia0 = guardada ? volta.dia0 : agora;
    var n = Number.isInteger(volta.n) && volta.n >= 1 ? volta.n : 1;
    var t = textosDaBib(bib).resultado;
    var fim = t.final;
    var padrao = bib.padroes[calc.padrao];

    var degraus = escolherDegraus(calc.padrao, calc.variante, resp, calc.cuidado, bib);
    var planos = montarPlanos(dia0, degraus, resp, bib);
    var fio = montarFio(resp, bib);
    var sinais = montarSinais(calc.padrao, resp, bib);
    var reg = montarRegistro(resp, Object.assign({}, calc, { ato: 2 }), dia0, n, bib);

    var secoes = [secaoDoTeto(resp, calc, bib)];
    secoes = secoes.concat(secoesDoFio(resp, bib));
    secoes.push(secaoDoRaioX(resp, calc, bib));
    secoes.push(secaoDaFamilia(calc, bib));
    secoes.push(secaoDoVazamento(resp, calc, bib));
    secoes.push(secaoDoQueNaoIndica(resp, calc, bib));
    secoes.push(secaoDaLeitura(calc, bib));
    secoes.push(secaoDosSessentaSegundos(calc, bib, resp));
    secoes.push(secaoDosSinais(calc.padrao, resp, bib, true));
    if (degraus && degraus.menor) secoes.push({ id: "ajuste", title: fim.titulo_ajuste, kind: "ajuste", paragraphs: [textoDoAjuste(degraus, bib)] });
    if (planos) secoes.push(secaoDoPlano90(planos, bib));
    secoes = secoes.filter(Boolean);

    var resultado = {
      id: n,
      grade: 1,
      tone: "good",
      pill: false,
      eyebrow: fim.eyebrow,
      verdict: t.mapa.verdict + padrao.nome,
      body: [],
      sections: secoes,
      safety: avisoDeSeguranca(calc, bib),
      arquivos: { md: fim.arquivo + "-" + dia0 + ".md", pdf: fim.arquivo + "-" + dia0 + ".pdf", ics: fim.arquivo_ics + ".ics" },
      cartoes: [cartaoDosSinais(calc.padrao, sinais, bib), cartaoParaCompartilhar(calc.padrao, bib)],
      guardar: true,
      volta: { n: n, dia0: dia0 },
    };
    if (planos) resultado.plan = itensDoPlano7(planos);
    if (reg.ok) {
      resultado.registro = resumoDoRegistro(reg, calc, resp, dia0, bib);
      resultado.blocks = montarBlocos(resp, calc, { dia0: dia0, hoje: agora, volta: n }, bib, { fio: fio, sinais: sinais, degraus: degraus, planos: planos, registro: reg });
    }
    var ics = eventosDosRetornos(ctx, dia0, bib);
    if (ics) resultado.ics = ics;
    var oferta = ofertaDoAprofundamento(calc.padrao, ctx);
    if (oferta) resultado.oferta = oferta;
    return resultado;
  }

  var api = {
    FAMILIAS: FAMILIAS,
    PADROES: PADROES,
    avaliarCuidado: avaliarCuidado,
    pontuarPadroes: pontuarPadroes,
    pontuarFamilias: pontuarFamilias,
    familiaForte: familiaForte,
    familiasFracas: familiasFracas,
    sugerir: sugerir,
    marcasDoPadrao: marcasDoPadrao,
    sugerirVariante: sugerirVariante,
    varianteFinal: varianteFinal,
    trilhaEVazamento: trilhaEVazamento,
    areasDoRaioX: areasDoRaioX,
    naoIndica: naoIndica,
    escolherDegraus: escolherDegraus,
    travaImediata: travaImediata,
    montarPlanos: montarPlanos,
    montarSinais: montarSinais,
    calcular: calcular,
    montarRegistro: montarRegistro,
    esquemaDoRegistro: esquemaDoRegistro,
    comNome: comNome,
    sinaisMarcados: sinaisMarcados,
    itensDasFrases: itensDasFrases,
    escadaDoPadrao: escadaDoPadrao,
    textoDoExperimento: textoDoExperimento,
    regraAntiga: regraAntiga,
    opcoesDaRegraAntiga: opcoesDaRegraAntiga,
    rascunhoSeEntao: rascunhoSeEntao,
    montarFio: montarFio,
    montarBlocos: montarBlocos,
    montarParcial: montarParcial,
    montarResultado: montarResultado,
    cartaoDosSinais: cartaoDosSinais,
    cartaoParaCompartilhar: cartaoParaCompartilhar,
    eventosDoMapa: eventosDoMapa,
    eventosDosRetornos: eventosDosRetornos,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TetoRegras = api;
})(typeof self !== "undefined" ? self : this);

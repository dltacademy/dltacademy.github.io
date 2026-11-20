/* Regras do Protocolo do Teto Financeiro, sem DOM: cuidado, notas dos padrões e das
   famílias, sugestão do teto, variante, trilha e vazamento, o que o resultado não
   indica, degraus do plano, trava, planos de 7 e 90 dias, sinais e registro.
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
    var valores = {
      nome: padrao ? padrao.nome : "",
      dia3: capitalizar(kit.semPontoFinal(degraus.dia3.texto)),
      dia5: capitalizar(kit.semPontoFinal(degraus.dia5.texto)),
      noventa: kit.semPontoFinal(degraus.noventa.texto),
    };
    var rotulosDegrau = objeto(planos.rotulo_por_degrau);
    var arco7 = lista(planos.arco7).map(function (d) {
      var data = kit.somarDias(dia0, d.dia);
      var rotulo = d.por_degrau && degraus[d.por_degrau] && rotulosDegrau[degraus[d.por_degrau].degrau] ? rotulosDegrau[degraus[d.por_degrau].degrau] : d.rotulo;
      var texto = preencher(d.texto, valores);
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
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TetoRegras = api;
})(typeof self !== "undefined" ? self : this);

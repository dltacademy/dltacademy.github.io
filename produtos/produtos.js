// ============================================================
// Páginas de vendas — interações compartilhadas, ligadas por atributos
// data-* no HTML. Nada sai do navegador: a calculadora não envia nem
// guarda o que a pessoa digita. DOM seguro: só textContent.
//
//   [data-calc-limite]  calculadora do limite em reais (mesma conta do
//                       relatório: perda aceita ÷ queda de teste)
//   [data-calc-queda]   teste de queda da carteira (mesma conta do relatório
//                       A Carteira Aguenta?: 80% do alto risco + 30% do
//                       diversificado; a parte segura não cai)
//   [data-abas]         abas de exemplo (role=tablist + busca na página)
//   [data-medidor]      barra que enche até data-valor (0–100) ao aparecer
//   [data-ancora]       frase que compara o preço com a perda aceita (ou,
//                       com data-ancora-base="queda", com a perda no teste)
//   [data-enxame]       nós de agentes acendendo sobre o caso, animado
//   [data-teto-graficos] dois gráficos animados da linha de resistência
//                       no Mapa do seu Teto (estagnação e queda no pico)
//   [data-barra-fixa]   barra de compra no celular, escondida no topo,
//                       perto da oferta e no rodapé
//   botões de compra    os links para relatorio.dlt.academy/comprar/ herdam
//                       os utm_* com que a pessoa chegou (o vídeo, o anúncio)
// ============================================================
(function () {
  "use strict";

  const brl = (v) => "R$ " + new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
  const num = (el) => {
    if (!el || (el.validity && el.validity.badInput)) return NaN;
    const texto = String(el.value || "").trim().replace(",", ".");
    if (!texto) return NaN;
    const v = Number(texto);
    return Number.isFinite(v) && v >= 0 ? v : NaN;
  };
  const suportaUntilFound = typeof document !== "undefined" && Boolean(document.body) && "onbeforematch" in document.body;

  let perdaInformada = NaN;
  let perdaNoTeste = NaN;
  let gapTeto = NaN;
  document.querySelectorAll("[data-ancora]").forEach((el) => {
    el.dataset.padrao = (el.textContent || "").trim();
  });

  /**
   * O que faz: Calcula ao vivo o limite em reais a partir do valor planejado, da perda aceita e da alavancagem.
   * Por quê: Entrega utilidade imediata antes da compra usando a mesma regra determinística do relatório pago.
   * Erro e ataque: Campos vazios, com entrada inválida, negativos ou não numéricos mantêm a saída recolhida; submit é bloqueado sem recarregar.
   * Prova: tests/test_paid_reports.py (test_calculadora_da_pagina_de_vendas_ignora_vazio_e_bloqueia_submit).
   */
  function calculadora(raiz) {
    const valor = raiz.querySelector("[data-valor]");
    const perda = raiz.querySelector("[data-perda]");
    const alav = raiz.querySelector("[data-alavancagem]");
    const saida = raiz.querySelector("[data-saida]");
    const limiteEl = raiz.querySelector("[data-limite]");
    const barra = raiz.querySelector("[data-barra]");
    const barraI = barra && barra.querySelector("i");
    const msg = raiz.querySelector("[data-msg]");
    const resto = raiz.querySelector("[data-resto]");

    raiz.addEventListener("submit", (e) => e.preventDefault());

    function atualizar() {
      const v = num(valor);
      const p = num(perda);
      perdaInformada = p;
      ancorar();
      if (!(v > 0) || !(p >= 0) || Number.isNaN(p)) {
        if (saida) saida.hidden = true;
        return;
      }
      if (saida) saida.hidden = false;
      const queda = alav && alav.checked ? 1 : 0.7;
      const limite = Math.floor(p / queda);
      if (limiteEl) limiteEl.textContent = brl(limite);
      const passa = v > limite;
      const proporcao = limite > 0 ? Math.min(1, limite / v) : 0;
      // Cor pelo grau (1 verde, 4 vermelho): passar do limite em reais é o "não" da conta.
      const grau = passa ? "4" : "1";
      if (saida) saida.dataset.grade = grau;
      if (barra) barra.dataset.grade = grau;
      if (barraI) barraI.style.width = (passa ? proporcao * 100 : 100) + "%";
      if (msg) {
        msg.className = "sp-msg " + (passa ? "passa" : "ok");
        msg.textContent = passa
          ? "Os " + brl(v) + " passam " + brl(v - limite) + " do que cabe na perda que você aceita, num tombo de " + Math.round(queda * 100) + "%."
          : "Cabe: num tombo de " + Math.round(queda * 100) + "%, você perderia no máximo " + brl(Math.round(v * queda)) + ".";
      }
      if (resto) {
        resto.textContent = passa
          ? "Essa é só a primeira conta. O relatório mostra o que está empurrando o valor para cima e escreve as travas para não passar do limite."
          : "O número cabe. Falta o resto: o que a emoção está fazendo, o melhor argumento contra e as travas de saída.";
      }
    }
    [valor, perda, alav].forEach((el) => el && el.addEventListener("input", atualizar));
    atualizar();
  }

  /**
   * O que faz: Calcula ao vivo o teste de queda da carteira: 80% do alto risco e 30% do diversificado, a parte segura não cai.
   * Por quê: Entrega de graça a primeira conta do A Carteira Aguenta?, com a mesma regra do relatório pago (QUEDA_POR_CLASSE, PERDA_FRAGIL, PERDA_QUEBRA).
   * Erro e ataque: Campos vazios, inválidos ou negativos contam como zero; carteira zerada mantém a saída recolhida; submit é bloqueado sem recarregar. Nada sai do navegador.
   * Prova: tests/test_paid_reports.py (test_teste_de_queda_da_pagina_de_vendas).
   */
  function testeDeQueda(raiz) {
    const segura = raiz.querySelector("[data-segura]");
    const divers = raiz.querySelector("[data-diversificada]");
    const alto = raiz.querySelector("[data-alto]");
    const gasto = raiz.querySelector("[data-gasto]");
    const saida = raiz.querySelector("[data-saida]");
    const perdaEl = raiz.querySelector("[data-perda-teste]");
    const mesesBloco = raiz.querySelector("[data-meses-bloco]");
    const mesesEl = raiz.querySelector("[data-meses]");
    const barra = raiz.querySelector("[data-barra]");
    const barraI = barra && barra.querySelector("i");
    const msg = raiz.querySelector("[data-msg]");
    const resto = raiz.querySelector("[data-resto]");
    const zero = (v) => (Number.isNaN(v) ? 0 : v);

    raiz.addEventListener("submit", (e) => e.preventDefault());

    function atualizar() {
      const s = zero(num(segura)), d = zero(num(divers)), a = zero(num(alto));
      const total = s + d + a;
      if (!(total > 0)) {
        perdaNoTeste = NaN;
        ancorar();
        if (saida) saida.hidden = true;
        return;
      }
      const perda = Math.round(d * 0.3 + a * 0.8);
      const fracao = perda / total;
      perdaNoTeste = perda;
      ancorar();
      if (saida) saida.hidden = false;
      if (perdaEl) perdaEl.textContent = brl(perda);
      const pe = Math.round((1 - fracao) * 100);
      // Grau da queda, o mesmo das frases abaixo: de pé = 1 (verde), mais de um terço = 3 (laranja), mais da metade = 4 (vermelho).
      const grau = fracao > 0.5 ? "4" : fracao > 0.33 ? "3" : "1";
      if (saida) saida.dataset.grade = grau;
      if (barra) barra.dataset.grade = grau;
      if (barraI) barraI.style.width = pe + "%";
      const pctTxt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(fracao * 100) + "%";
      const g = num(gasto);
      const mesesTxt = g > 0 ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(perda / g) : "";
      const meses = g > 0 ? " Isso é " + mesesTxt + " meses dos seus gastos." : "";
      if (mesesBloco) mesesBloco.hidden = !(g > 0);
      if (mesesEl) mesesEl.textContent = g > 0 ? mesesTxt + " meses" : "";
      if (msg) {
        const grave = fracao > 0.5, fragil = fracao > 0.33;
        msg.className = "sp-msg " + (fragil ? "passa" : "ok");
        msg.textContent = (grave
          ? "A queda levaria " + pctTxt + " da carteira, mais da metade."
          : fragil
            ? "A queda levaria " + pctTxt + " da carteira, mais de um terço."
            : "Na queda de preço, a carteira fica de pé: a perda seria " + pctTxt + " dela.") + meses;
      }
      if (resto) {
        resto.textContent = "Essa é só a queda de preço. O relatório soma também o que cai junto (o mesmo ativo, o mesmo ecossistema), o que fica preso se uma plataforma travar e a que queda cada alavancagem é liquidada.";
      }
    }
    [segura, divers, alto, gasto].forEach((el) => el && el.addEventListener("input", atualizar));
    atualizar();
  }

  /**
   * O que faz: Calcula ao vivo a distância mensal e anual entre o melhor mês (pico) e a média dos últimos 12 meses.
   * Por quê: Entrega a conta de 20 segundos na própria página de vendas do Mapa usando apenas cálculos locais no navegador.
   * Erro e ataque: Campos vazios, inválidos, negativos ou pico não positivo mantêm a saída recolhida; submit é bloqueado sem recarregar. Só usa textContent.
   * Prova: tests/test_paid_reports.py (test_calculadora_pico_media_do_mapa_do_teto).
   */
  function testeTeto(raiz) {
    const picoEl = raiz.querySelector("[data-pico]");
    const mediaEl = raiz.querySelector("[data-media]");
    const saida = raiz.querySelector("[data-saida]");
    const gapEl = raiz.querySelector("[data-gap]");
    const anualEl = raiz.querySelector("[data-gap-anual]");
    const barra = raiz.querySelector("[data-barra]");
    const barraI = barra && barra.querySelector("i");
    const msg = raiz.querySelector("[data-msg]");
    const resto = raiz.querySelector("[data-resto]");

    raiz.addEventListener("submit", (e) => e.preventDefault());

    function atualizar() {
      const pico = num(picoEl);
      const media = num(mediaEl);
      if (!(pico > 0) || !(media >= 0) || Number.isNaN(media)) {
        gapTeto = NaN;
        ancorar();
        if (saida) saida.hidden = true;
        return;
      }
      if (saida) saida.hidden = false;
      if (pico <= media) {
        gapTeto = NaN;
        ancorar();
        if (saida) saida.dataset.grade = "1";
        if (barra) barra.dataset.grade = "1";
        if (barraI) barraI.style.width = "100%";
        if (gapEl) gapEl.textContent = "R$ 0/mês";
        if (anualEl) anualEl.textContent = "Sem distância";
        if (msg) {
          msg.className = "sp-msg ok";
          msg.textContent = "Sua média já acompanha o seu melhor mês. Se mesmo assim o crescimento empaca sempre no mesmo valor, o teto aparece na hora de dar o próximo salto.";
        }
        if (resto) {
          resto.textContent = "O Mapa cruza 3 cenas reais da sua rotina para achar o freio que segura o próximo patamar e instala 3 travas antes da hora H.";
        }
        return;
      }
      const gap = Math.round(pico - media);
      const anual = gap * 12;
      gapTeto = gap;
      ancorar();
      const grau = gap / pico >= 0.25 ? "3" : "2";
      if (saida) saida.dataset.grade = grau;
      if (barra) barra.dataset.grade = grau;
      if (barraI) barraI.style.width = Math.max(8, Math.min(100, Math.round((media / pico) * 100))) + "%";
      if (gapEl) gapEl.textContent = brl(gap) + "/mês";
      if (anualEl) anualEl.textContent = brl(anual) + "/ano";
      if (msg) {
        msg.className = "sp-msg passa";
        msg.textContent = "Seu pico de " + brl(pico) + " mostra o que você já consegue fazer. A distância até a média de " + brl(media) + " é onde algo puxa de volta.";
      }
      if (resto) {
        resto.textContent = "O Mapa do seu Teto marca esse número na sua curva personalizada, mostra o que puxa o freio nas suas 3 cenas e instala 3 travas para o próximo pico.";
      }
    }
    [picoEl, mediaEl].forEach((el) => el && el.addEventListener("input", atualizar));
    atualizar();
  }

  /**
   * O que faz: Atualiza o comparativo entre o preço do relatório e a perda aceita informada na calculadora.
   * Por quê: Mantém uma âncora concreta visível desde o carregamento e personalizada quando há perda positiva digitada.
   * Erro e ataque: Se perda for vazia, zero, NaN ou preço inválido, restaura o texto padrão do HTML.
   * Prova: tests/test_paid_reports.py (test_calculadora_da_pagina_de_vendas_ignora_vazio_e_bloqueia_submit).
   */
  function ancorar() {
    document.querySelectorAll("[data-ancora]").forEach((el) => {
      const preco = Number(el.getAttribute("data-preco"));
      const padrao = el.dataset.padrao || "";
      const base = el.getAttribute("data-ancora-base");
      if (base === "teto") {
        if (!(gapTeto > 0) || !(preco > 0)) {
          el.textContent = padrao;
          el.hidden = !padrao;
          return;
        }
        const pt = (preco / gapTeto) * 100;
        el.hidden = false;
        el.textContent = "Com uma distância de " + brl(gapTeto) + "/mês entre o seu pico e a sua média, o ciclo completo do Mapa custa " +
          (pt < 0.1 ? "menos de 0,1%" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(pt) + "%") +
          " de um único mês desse teto.";
        return;
      }
      if (base === "queda") {
        if (!(perdaNoTeste > 0) || !(preco > 0)) {
          el.textContent = padrao;
          el.hidden = !padrao;
          return;
        }
        const pq = (preco / perdaNoTeste) * 100;
        el.hidden = false;
        el.textContent = "Numa queda que levaria " + brl(perdaNoTeste) + ", o relatório custa " +
          (pq < 0.1 ? "menos de 0,1%" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(pq) + "%") +
          " desse valor.";
        return;
      }
      if (!(perdaInformada > 0) || !(preco > 0)) {
        el.textContent = padrao;
        el.hidden = !padrao;
        return;
      }
      const pct = (preco / perdaInformada) * 100;
      el.hidden = false;
      el.textContent = "Para quem aceita perder " + brl(perdaInformada) + ", o relatório custa " +
        (pct < 0.1 ? "menos de 0,1%" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(pct) + "%") +
        " desse valor.";
    });
  }

  /**
   * O que faz: Alterna os painéis de exemplo por clique, teclado (setas/Home/End) e busca nativa na página (beforematch).
   * Por quê: Sem JS ambos os exemplos permanecem visíveis; com JS viram abas acessíveis sem sair do localizar do navegador.
   * Erro e ataque: Ignora controles sem painel correspondente e faz fallback para hidden booleano onde until-found não existir.
   * Prova: Verificação de teclado/ARIA e ausência de caixa vazia com [hidden="until-found"].
   */
  function abas(raiz) {
    const botoes = Array.from(raiz.querySelectorAll("[role=tab]"));
    if (!botoes.length) return;
    raiz.dataset.pronto = "1";
    function mostrar(botao) {
      botoes.forEach((b) => {
        const ativo = b === botao;
        b.setAttribute("aria-selected", String(ativo));
        b.tabIndex = ativo ? 0 : -1;
        const painel = document.getElementById(b.getAttribute("aria-controls"));
        if (!painel) return;
        if (ativo) {
          painel.removeAttribute("hidden");
          painel.querySelectorAll("[data-medidor]").forEach(encher);
        } else if (suportaUntilFound) {
          painel.setAttribute("hidden", "until-found");
        } else {
          painel.hidden = true;
        }
      });
    }
    botoes.forEach((b, i) => {
      const painel = document.getElementById(b.getAttribute("aria-controls"));
      if (painel) {
        if (b.getAttribute("aria-selected") !== "true") {
          if (suportaUntilFound) painel.setAttribute("hidden", "until-found");
          else painel.hidden = true;
        }
        painel.addEventListener("beforematch", () => mostrar(b));
      }
      b.addEventListener("click", () => mostrar(b));
      b.addEventListener("keydown", (e) => {
        let idx = -1;
        if (e.key === "ArrowRight") idx = (i + 1) % botoes.length;
        else if (e.key === "ArrowLeft") idx = (i - 1 + botoes.length) % botoes.length;
        else if (e.key === "Home") idx = 0;
        else if (e.key === "End") idx = botoes.length - 1;
        if (idx === -1) return;
        e.preventDefault();
        botoes[idx].focus();
        mostrar(botoes[idx]);
      });
    });
  }

  /**
   * O que faz: Preenche a largura percentual das barras [data-medidor] limitando o valor ao intervalo 0–100.
   * Por quê: Dá leitura visual imediata ao índice de frieza sem depender de estilos inline no HTML.
   * Erro e ataque: Valores ausentes, negativos ou acima de 100 são truncados com segurança entre 0% e 100%.
   * Prova: Verificação de CSP estrita (style-src 'self' no HTML).
   */
  function encher(el) {
    const i = el.querySelector("i");
    const v = Math.max(0, Math.min(100, Number(el.getAttribute("data-valor")) || 0));
    if (i) {
      i.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = v + "%"; }));
    }
  }

  /**
   * O que faz: Exibe a barra fixa de compra em telas menores apenas quando topo, oferta e rodapé estão fora da tela.
   * Por quê: Mantém o caminho de compra à mão durante a leitura sem cobrir o CTA principal, a oferta nem os links legais do rodapé.
   * Erro e ataque: Em navegadores sem IntersectionObserver a barra permanece oculta sem lançar exceção.
   * Prova: Inspeção em viewport móvel (390px/320px).
   */
  function barraFixa(barra) {
    const topo = document.querySelector("[data-topo]");
    const oferta = document.querySelector("[data-oferta]");
    const rodape = document.querySelector("footer");
    if (!("IntersectionObserver" in window)) return;
    let topoVisivel = true;
    let ofertaVisivel = false;
    let rodapeVisivel = false;
    const aplicar = () => barra.classList.toggle("visivel", !topoVisivel && !ofertaVisivel && !rodapeVisivel);
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.target === topo) topoVisivel = e.isIntersecting;
        if (e.target === oferta) ofertaVisivel = e.isIntersecting;
        if (e.target === rodape) rodapeVisivel = e.isIntersecting;
      });
      aplicar();
    });
    if (topo) obs.observe(topo);
    if (oferta) obs.observe(oferta);
    if (rodape) obs.observe(rodape);
  }

  // ---- enxame: nós de agentes acendendo sobre o caso ------------------
  // Decorativo (aria-hidden): os nós e as ligações são desenhados aqui. As
  // fases e o resultado já estão no HTML; sem JS ou com movimento reduzido,
  // aparecem prontos.
  function enxame(raiz) {
    const campo = raiz.querySelector("[data-enx-campo]");
    const status = raiz.querySelector("[data-enx-status]");
    const fases = Array.from(raiz.querySelectorAll("[data-enx-fases] li"));
    const resultado = raiz.querySelector("[data-enx-resultado]");
    const reduzido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 75");
    svg.setAttribute("preserveAspectRatio", "none");
    campo.appendChild(svg);

    // Nós em anéis em volta do centro (o caso), com um pouco de desordem.
    const pontos = [{ x: 50, y: 37.5, centro: true }];
    let semente = 7;
    const acaso = () => { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; };
    [[14, 8], [26, 14], [37, 20]].forEach(([r, n]) => {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + acaso() * 0.4;
        const rr = r + (acaso() - 0.5) * 5;
        pontos.push({ x: 50 + Math.cos(a) * rr * 1.25, y: 37.5 + Math.sin(a) * rr * 0.85 });
      }
    });
    const nos = pontos.map((p) => {
      const n = document.createElement("span");
      n.className = "sp-enx-no" + (p.centro ? " centro" : "");
      n.style.left = p.x + "%";
      n.style.top = (p.y / 75) * 100 + "%";
      campo.appendChild(n);
      return n;
    });
    // Ligações: cada nó ao vizinho mais próximo de dentro e ao centro.
    const linhas = [];
    pontos.forEach((p, i) => {
      if (p.centro) return;
      let melhor = 0, dist = Infinity;
      pontos.forEach((q, j) => {
        if (j === i) return;
        const dq = Math.hypot(q.x - 50, q.y - 37.5), dp = Math.hypot(p.x - 50, p.y - 37.5);
        if (dq >= dp) return;
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < dist) { dist = d; melhor = j; }
      });
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", p.x); l.setAttribute("y1", p.y);
      l.setAttribute("x2", pontos[melhor].x); l.setAttribute("y2", pontos[melhor].y);
      svg.appendChild(l);
      linhas.push({ el: l, de: i, para: melhor });
    });

    let geracao = 0;
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));

    function final() {
      nos.forEach((n) => n.classList.add("aceso"));
      linhas.forEach((l) => l.el.classList.add("aceso"));
      fases.forEach((f) => f.classList.add("feita"));
      status.textContent = "Relatório pronto";
      resultado.classList.add("visivel");
    }

    async function tocar() {
      const minha = ++geracao;
      if (reduzido) { final(); return; }
      nos.forEach((n) => n.classList.remove("aceso"));
      linhas.forEach((l) => l.el.classList.remove("aceso"));
      fases.forEach((f) => f.classList.remove("feita"));
      resultado.classList.remove("visivel");
      for (let f = 0; f < fases.length; f++) {
        if (minha !== geracao) return;
        status.textContent = fases[f].textContent;
        // Uma onda: alguns nós de fora acendem e a ligação até o centro brilha.
        for (let pulso = 0; pulso < 4; pulso++) {
          if (minha !== geracao) return;
          const escolhidos = linhas.filter(() => acaso() < 0.28);
          escolhidos.forEach((l) => { l.el.classList.add("aceso"); nos[l.de].classList.add("aceso"); });
          await espera(170);
          escolhidos.forEach((l) => { l.el.classList.remove("aceso"); nos[l.de].classList.remove("aceso"); });
          await espera(60);
        }
        fases[f].classList.add("feita");
      }
      if (minha !== geracao) return;
      final();
    }

    const repetir = raiz.querySelector("[data-enx-repetir]");
    if (repetir) repetir.addEventListener("click", tocar);
    if ("IntersectionObserver" in window && !reduzido) {
      fases.forEach((f) => f.classList.remove("feita"));
      resultado.classList.remove("visivel");
      const obs = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) { obs.disconnect(); tocar(); }
      }, { threshold: 0.3 });
      obs.observe(raiz);
    } else {
      final();
    }
  }

  /**
   * O que faz: Repassa aos botões de compra os utm_* com que a pessoa chegou à página (o vídeo, o anúncio, a mensagem).
   * Por quê: Os botões levam utm fixos do portal; sem o repasse, a venda vinda de uma peça aparece no Stripe como "portal", e não dá para saber qual peça vendeu.
   * Erro e ataque: Só os cinco utm_* passam, cada um até 200 caracteres e sem caractere de controle; o resto da visita é ignorado. Só links https de relatorio.dlt.academy/comprar/ são tocados, e o destino não muda. Sem utm válido na visita, nada muda. A posição do botão (o utm_content fixo) segue no utm_term, se a visita não trouxer um. O Worker revalida cada valor.
   * Prova: tests/test_paid_reports.py (test_botoes_de_compra_herdam_utm_da_visita).
   */
  const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const COMPRA = 'a[href^="https://relatorio.dlt.academy/comprar/"]';
  function repassarUtm() {
    let visita;
    try { visita = new URLSearchParams((window.location && window.location.search) || ""); } catch (e) { return; }
    const valido = (v) => typeof v === "string" && v.trim() !== "" && v.length <= 200 && !/[\u0000-\u001F\u007F-\u009F]/.test(v);
    const vindos = UTM.filter((k) => valido(visita.get(k)));
    if (!vindos.length) return;
    document.querySelectorAll(COMPRA).forEach((a) => {
      let url;
      try { url = new URL(a.getAttribute("href")); } catch (e) { return; }
      if (url.protocol !== "https:" || url.host !== "relatorio.dlt.academy" || !url.pathname.startsWith("/comprar/")) return;
      const posicao = url.searchParams.get("utm_content");
      UTM.forEach((k) => url.searchParams.delete(k));
      vindos.forEach((k) => url.searchParams.set(k, visita.get(k)));
      if (posicao && !vindos.includes("utm_term")) url.searchParams.set("utm_term", posicao);
      a.setAttribute("href", url.toString());
    });
  }

  /**
   * O que faz: Dispara a animação didática dos gráficos de resistência ao entrarem na tela, repete após pausa calma enquanto visíveis e oferece botões de repetir e pausar/reproduzir.
   * Por quê: Garante que quem rolou a página veja o movimento completo, mantendo pausa explícita acessível (WCAG 2.2.2) e estado final estático sem JS ou com movimento reduzido.
   * Erro e ataque: Limpa temporizadores ao sair da tela, pausar ou esconder a aba; ignora ambientes sem matchMedia ou IntersectionObserver sem lançar exceção.
   * Prova: tests/test_paid_reports.py (test_graficos_resistencia_no_mapa_do_teto).
   */
  function graficosTeto(raiz) {
    const reduzido = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const repetir = raiz.querySelector("[data-graf-repetir]");
    const pausar = raiz.querySelector("[data-graf-pausar]");
    const repeteAuto = raiz.hasAttribute("data-teto-graficos") || raiz.hasAttribute("data-df-limites");
    let pausado = false;
    let visivel = false;
    let timer = null;

    function limparTimer() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function agendarProximo() {
      limparTimer();
      if (!repeteAuto || pausado || !visivel) return;
      timer = setTimeout(() => {
        timer = null;
        if (pausado || !visivel) return;
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        tocar();
      }, 9200);
    }

    function tocar() {
      if (reduzido) return;
      limparTimer();
      raiz.dataset.grafPronto = "1";
      raiz.classList.remove("tocando");
      // Força novo ciclo limpo de animação CSS quando entra na tela ou repete.
      void raiz.offsetWidth;
      raiz.classList.add("tocando");
      agendarProximo();
    }

    if (repetir) {
      repetir.addEventListener("click", () => {
        if (pausado) {
          pausado = false;
          if (pausar) pausar.textContent = "Pausar animação";
        }
        visivel = true;
        tocar();
      });
    }
    if (pausar) {
      pausar.addEventListener("click", () => {
        pausado = !pausado;
        pausar.textContent = pausado ? "Reproduzir animação" : "Pausar animação";
        if (pausado) {
          limparTimer();
          raiz.classList.remove("tocando");
          delete raiz.dataset.grafPronto;
        } else {
          visivel = true;
          tocar();
        }
      });
    }
    if (reduzido) return;
    raiz.dataset.grafPronto = "1";
    const jaVisivel = typeof raiz.getBoundingClientRect === "function" &&
      typeof window !== "undefined" && typeof window.innerHeight === "number" &&
      raiz.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entradas) => {
        const entrou = entradas.some((e) => e.isIntersecting);
        if (entrou && !visivel) {
          visivel = true;
          if (!pausado) tocar();
          if (!repeteAuto) obs.disconnect();
        } else if (!entrou && visivel) {
          visivel = false;
          limparTimer();
        }
      }, { threshold: 0.1 });
      obs.observe(raiz);
      if (jaVisivel) {
        visivel = true;
        tocar();
      }
    } else {
      visivel = true;
      tocar();
    }
  }

  repassarUtm();
  document.querySelectorAll("[data-calc-limite]").forEach(calculadora);
  document.querySelectorAll("[data-calc-queda]").forEach(testeDeQueda);
  document.querySelectorAll("[data-calc-teto]").forEach(testeTeto);
  document.querySelectorAll("[data-enxame]").forEach(enxame);
  document.querySelectorAll("[data-teto-graficos], [data-teto-blindagem], [data-df-limites]").forEach(graficosTeto);
  document.querySelectorAll("[data-abas]").forEach(abas);
  document.querySelectorAll("[data-medidor]").forEach((el) => { if (!el.closest("[hidden]")) encher(el); });
  document.querySelectorAll("[data-barra-fixa]").forEach(barraFixa);
})();

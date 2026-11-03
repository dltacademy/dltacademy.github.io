// ============================================================
// Páginas de vendas — interações compartilhadas, ligadas por atributos
// data-* no HTML. Nada sai do navegador: a calculadora não envia nem
// guarda o que a pessoa digita. DOM seguro: só textContent.
//
//   [data-calc-limite]  calculadora do limite em reais (mesma conta do
//                       relatório: perda aceita ÷ queda de teste)
//   [data-abas]         abas de exemplo (role=tablist + busca na página)
//   [data-medidor]      barra que enche até data-valor (0–100) ao aparecer
//   [data-ancora]       frase que compara o preço com a perda aceita
//   [data-enxame]       nós de agentes acendendo sobre o caso, animado
//   [data-barra-fixa]   barra de compra no celular, escondida no topo,
//                       perto da oferta e no rodapé
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
      if (barra) barra.classList.toggle("passa", passa);
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
   * O que faz: Atualiza o comparativo entre o preço do relatório e a perda aceita informada na calculadora.
   * Por quê: Mantém uma âncora concreta visível desde o carregamento e personalizada quando há perda positiva digitada.
   * Erro e ataque: Se perda for vazia, zero, NaN ou preço inválido, restaura o texto padrão do HTML.
   * Prova: tests/test_paid_reports.py (test_calculadora_da_pagina_de_vendas_ignora_vazio_e_bloqueia_submit).
   */
  function ancorar() {
    document.querySelectorAll("[data-ancora]").forEach((el) => {
      const preco = Number(el.getAttribute("data-preco"));
      const padrao = el.dataset.padrao || "";
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

  document.querySelectorAll("[data-calc-limite]").forEach(calculadora);
  document.querySelectorAll("[data-enxame]").forEach(enxame);
  document.querySelectorAll("[data-abas]").forEach(abas);
  document.querySelectorAll("[data-medidor]").forEach((el) => { if (!el.closest("[hidden]")) encher(el); });
  document.querySelectorAll("[data-barra-fixa]").forEach(barraFixa);
})();

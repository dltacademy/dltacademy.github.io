// ============================================================
// Páginas de vendas — interações compartilhadas, ligadas por atributos
// data-* no HTML. Nada sai do navegador: a calculadora não envia nem
// guarda o que a pessoa digita. DOM seguro: só textContent.
//
//   [data-calc-limite]  calculadora do limite em reais (mesma conta do
//                       relatório: perda aceita ÷ queda de teste)
//   [data-abas]         abas de exemplo (role=tablist)
//   [data-medidor]      barra que enche até data-valor (0–100) ao aparecer
//   [data-ancora]       frase que compara o preço com a perda aceita
//   [data-barra-fixa]   barra de compra no celular, escondida no topo e
//                       perto da oferta
// ============================================================
(function () {
  "use strict";

  const brl = (v) => "R$ " + new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
  const num = (el) => {
    const v = Number(String(el.value || "").replace(",", "."));
    return Number.isFinite(v) && v >= 0 ? v : NaN;
  };

  // ---- calculadora do limite -------------------------------------
  let perdaInformada = NaN;
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

    function atualizar() {
      const v = num(valor);
      const p = num(perda);
      perdaInformada = p;
      ancorar();
      if (!(v > 0) || !(p >= 0) || Number.isNaN(p)) {
        saida.hidden = true;
        return;
      }
      saida.hidden = false;
      const queda = alav && alav.checked ? 1 : 0.7;
      const limite = Math.floor(p / queda);
      limiteEl.textContent = brl(limite);
      const passa = v > limite;
      const proporcao = limite > 0 ? Math.min(1, limite / v) : 0;
      barra.classList.toggle("passa", passa);
      barraI.style.width = (passa ? proporcao * 100 : 100) + "%";
      msg.className = "sp-msg " + (passa ? "passa" : "ok");
      msg.textContent = passa
        ? "Os " + brl(v) + " passam " + brl(v - limite) + " do que cabe na perda que você aceita, num tombo de " + Math.round(queda * 100) + "%."
        : "Cabe: num tombo de " + Math.round(queda * 100) + "%, você perderia no máximo " + brl(Math.round(v * queda)) + ".";
      resto.textContent = passa
        ? "Essa é só a primeira conta. O relatório mostra o que está empurrando o valor para cima e escreve as travas para não passar do limite."
        : "O número cabe. Falta o resto: o que a emoção está fazendo, o melhor argumento contra e as travas de saída.";
    }
    [valor, perda, alav].forEach((el) => el && el.addEventListener("input", atualizar));
    atualizar();
  }

  // ---- âncora do preço ---------------------------------------------
  function ancorar() {
    document.querySelectorAll("[data-ancora]").forEach((el) => {
      const preco = Number(el.getAttribute("data-preco"));
      if (!(perdaInformada > 0) || !(preco > 0)) { el.hidden = true; return; }
      const pct = (preco / perdaInformada) * 100;
      el.hidden = false;
      el.textContent = "Para quem aceita perder " + brl(perdaInformada) + ", o relatório custa " +
        (pct < 0.1 ? "menos de 0,1%" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(pct) + "%") +
        " desse valor.";
    });
  }

  // ---- abas --------------------------------------------------------
  function abas(raiz) {
    const botoes = Array.from(raiz.querySelectorAll("[role=tab]"));
    function mostrar(botao) {
      botoes.forEach((b) => {
        const ativo = b === botao;
        b.setAttribute("aria-selected", String(ativo));
        b.tabIndex = ativo ? 0 : -1;
        const painel = document.getElementById(b.getAttribute("aria-controls"));
        if (painel) {
          painel.hidden = !ativo;
          if (ativo) painel.querySelectorAll("[data-medidor]").forEach(encher);
        }
      });
    }
    botoes.forEach((b, i) => {
      b.addEventListener("click", () => mostrar(b));
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const prox = botoes[(i + (e.key === "ArrowRight" ? 1 : -1) + botoes.length) % botoes.length];
        prox.focus();
        mostrar(prox);
      });
    });
  }

  // ---- medidores ---------------------------------------------------
  function encher(el) {
    const i = el.querySelector("i");
    const v = Math.max(0, Math.min(100, Number(el.getAttribute("data-valor")) || 0));
    if (i) {
      i.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = v + "%"; }));
    }
  }

  // ---- barra fixa --------------------------------------------------
  function barraFixa(barra) {
    const topo = document.querySelector("[data-topo]");
    const oferta = document.querySelector("[data-oferta]");
    if (!("IntersectionObserver" in window)) return;
    let topoVisivel = true;
    let ofertaVisivel = false;
    const aplicar = () => barra.classList.toggle("visivel", !topoVisivel && !ofertaVisivel);
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.target === topo) topoVisivel = e.isIntersecting;
        if (e.target === oferta) ofertaVisivel = e.isIntersecting;
      });
      aplicar();
    });
    if (topo) obs.observe(topo);
    if (oferta) obs.observe(oferta);
  }

  document.querySelectorAll("[data-calc-limite]").forEach(calculadora);
  document.querySelectorAll("[data-abas]").forEach(abas);
  document.querySelectorAll("[data-medidor]").forEach((el) => { if (!el.closest("[hidden]")) encher(el); });
  document.querySelectorAll("[data-barra-fixa]").forEach(barraFixa);
})();

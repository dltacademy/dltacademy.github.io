// ============================================================
// Medição de campanhas nas páginas de venda (/produtos/*).
//
// Como ativar: preencher META_PIXEL_ID abaixo com o ID numérico do Pixel da
// Meta (ex.: "123456789012345") ou no atributo data-meta-pixel de <main>.
// Enquanto estiver vazio, nada externo é carregado e nenhum evento sai.
//
// Escopo: roda só nas páginas de oferta (/produtos/*). Nunca lê campos da
// calculadora nem dados pessoais. A compra concluída (Purchase) é medida no
// servidor (Conversions API), sem script de terceiro na página do relatório.
// ============================================================
(function () {
  "use strict";

  const META_PIXEL_ID = "";
  const ID_VALIDO = /^\d{5,30}$/;
  const COMPRA = 'a[href^="https://relatorio.dlt.academy/comprar/"]';
  const SCRIPT_META = "https://connect.facebook.net/en_US/fbevents.js";

  /**
   * O que faz: Inicializa o Meta Pixel nas páginas de venda quando há um Pixel ID numérico configurado e dispara PageView, ViewContent e InitiateCheckout.
   * Por quê: Permite otimizar campanhas da Meta sem colocar script inline nem carregar terceiros nas ferramentas gratuitas ou na página sensível do relatório.
   * Erro e ataque: ID vazio, não numérico ou fora de 5–30 dígitos mantém o módulo 100% inerte (sem criar script externo). Só lê data-produto e data-preco do <main>; nunca acessa inputs da calculadora.
   * Prova: tests/test_paid_reports.py (test_meta_pixel_inerte_sem_id_e_dispara_eventos_com_id).
   */
  function iniciarMetaPixel() {
    const main = document.querySelector("main[data-produto]");
    const bruto = ((main && main.getAttribute("data-meta-pixel")) || META_PIXEL_ID || "").trim();
    if (!ID_VALIDO.test(bruto)) return;

    if (!window.fbq) {
      const fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      window.fbq = fbq;

      const s = document.createElement("script");
      s.async = true;
      s.src = SCRIPT_META;
      const primeiro = document.getElementsByTagName("script")[0];
      if (primeiro && primeiro.parentNode) primeiro.parentNode.insertBefore(s, primeiro);
      else if (document.head) document.head.appendChild(s);
    }

    const produto = (main && main.getAttribute("data-produto")) || "";
    const preco = Number(main && main.getAttribute("data-preco"));
    const dados = produto
      ? {
          content_ids: [produto],
          content_type: "product",
          ...(Number.isFinite(preco) && preco > 0 ? { value: preco, currency: "BRL" } : {}),
        }
      : null;

    window.fbq("init", bruto);
    window.fbq("track", "PageView");
    if (dados) window.fbq("track", "ViewContent", dados);

    document.querySelectorAll(COMPRA).forEach((a) => {
      a.addEventListener("click", () => {
        if (typeof window.fbq === "function") {
          window.fbq("track", "InitiateCheckout", dados || {});
        }
      });
    });
  }

  iniciarMetaPixel();
})();

// ============================================================
// Player próprio do VSL nas páginas de venda (/produtos/*).
//
// Como ativar: no bloco .sp-vsl da página, preencher data-video-src com a URL
// do .mp4 em https://video.dlt.academy/ (bucket do Cloudflare R2 com domínio
// próprio). Opcional: data-video-legenda com o caminho de um .vtt no próprio
// site e data-cta-segundos com o segundo em que os botões [data-vsl-cta]
// aparecem. Com data-video-src vazio, nada muda: fica a capa com o aviso.
//
// Sem anúncio, sem script de terceiro e sem ler nada da pessoa. Os marcos de
// 10, 25, 50, 75 e 95% vão para o Meta Pixel (se ele estiver ativo na página)
// como evento VSLProgresso, e também saem como evento "dlt:vsl" no documento.
// ============================================================
(function () {
  "use strict";
  const HOST_VIDEO = "https://video.dlt.academy/";
  const MARCOS = [10, 25, 50, 75, 95];

  /**
   * O que faz: Aceita só .mp4 servido pelo domínio de vídeo e .vtt servido pelo próprio site.
   * Por quê: A CSP das páginas libera mídia só desses lugares; qualquer outro endereço quebraria calado.
   * Erro e ataque: Esquema, host, credenciais, query ou extensão fora do esperado devolvem "".
   * Prova: tests/js/vsl-player.test.mjs.
   */
  function urlVideo(bruto) {
    const t = String(bruto || "").trim();
    if (!t.startsWith(HOST_VIDEO) || /[?#\s"'<>]/.test(t) || !/\.mp4$/i.test(t)) return "";
    return t;
  }
  function urlLegenda(bruto) {
    const t = String(bruto || "").trim();
    return /^\/[a-z0-9/_-]+\.vtt$/i.test(t) ? t : "";
  }

  function avisar(slot, dados) {
    const detalhe = Object.assign({ video: slot.getAttribute("data-vsl-slot") || "" }, dados);
    if (typeof window.fbq === "function" && detalhe.tipo === "progresso") {
      window.fbq("trackCustom", "VSLProgresso", { video: detalhe.video, percentual: detalhe.percentual });
    }
    if (typeof window.fbq === "function" && detalhe.tipo === "play") {
      window.fbq("trackCustom", "VSLPlay", { video: detalhe.video });
    }
    if (typeof CustomEvent === "function" && document.dispatchEvent) {
      document.dispatchEvent(new CustomEvent("dlt:vsl", { detail: detalhe }));
    }
  }

  /**
   * O que faz: Troca a capa do VSL por um <video> próprio: começa mudo em autoplay
   *   (quando o aparelho deixa), com o botão "Toque para ouvir" que reinicia do zero com som.
   * Por quê: VSL sem anúncio nem distração de plataforma, medido pelo Pixel que já existe.
   * Erro e ataque: Sem URL válida não toca em nada; se o vídeo falhar, volta a capa e
   *   aponta para a versão em texto; com economia de dados ou movimento reduzido não faz autoplay.
   * Prova: tests/js/vsl-player.test.mjs.
   */
  function montar(slot) {
    const src = urlVideo(slot.getAttribute("data-video-src"));
    if (!src) return;
    const frame = slot.querySelector(".sp-vsl-frame");
    const capa = frame && frame.querySelector(".sp-vsl-poster");
    const estado = frame && frame.querySelector(".sp-vsl-estado");
    if (!frame) return;

    const poupar = Boolean((navigator.connection && navigator.connection.saveData)
      || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));

    const video = document.createElement("video");
    video.className = "sp-vsl-media";
    video.setAttribute("playsinline", "");
    video.playsInline = true;
    video.preload = poupar ? "none" : "metadata";
    if (capa && capa.getAttribute("src")) video.poster = capa.getAttribute("src");
    video.muted = true;
    const fonte = document.createElement("source");
    fonte.src = src;
    fonte.type = "video/mp4";
    video.appendChild(fonte);
    const legenda = urlLegenda(slot.getAttribute("data-video-legenda"));
    if (legenda) {
      const trilha = document.createElement("track");
      trilha.kind = "captions";
      trilha.srclang = "pt-BR";
      trilha.label = "Português";
      trilha.src = legenda;
      trilha.default = true;
      video.appendChild(trilha);
    }

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "sp-vsl-play";
    const rotulo = document.createElement("span");
    rotulo.className = "sp-vsl-selo";
    rotulo.textContent = "Assistir à apresentação · ~13 min";
    botao.appendChild(rotulo);

    if (capa) capa.hidden = true;
    if (estado) estado.hidden = true;
    frame.appendChild(video);
    frame.appendChild(botao);

    // Botões que esperam o pitch (opcional): aparecem no segundo marcado, no fim ou em erro.
    const segundosCta = Number(slot.getAttribute("data-cta-segundos"));
    const ctas = Number.isFinite(segundosCta) && segundosCta > 0 ? Array.from(document.querySelectorAll("[data-vsl-cta]")) : [];
    ctas.forEach((c) => { c.hidden = true; });
    const mostrarCtas = () => { ctas.forEach((c) => { c.hidden = false; }); };

    let comSom = false;
    const vistos = new Set();
    video.addEventListener("timeupdate", () => {
      if (ctas.length && video.currentTime >= segundosCta) mostrarCtas();
      if (!comSom || !(video.duration > 0)) return;
      const pct = (video.currentTime / video.duration) * 100;
      MARCOS.forEach((m) => {
        if (pct >= m && !vistos.has(m)) {
          vistos.add(m);
          avisar(slot, { tipo: "progresso", percentual: m });
        }
      });
    });
    video.addEventListener("ended", mostrarCtas);
    video.addEventListener("error", falhar, true);
    fonte.addEventListener("error", falhar);

    function falhar() {
      video.remove();
      botao.remove();
      if (capa) capa.hidden = false;
      if (estado) {
        estado.hidden = false;
        const p = estado.querySelector("p");
        if (p) p.textContent = "O vídeo não carregou agora. A oferta está logo abaixo, e a versão completa em texto traz tudo o que o vídeo explica.";
      }
      mostrarCtas();
    }

    botao.addEventListener("click", () => {
      comSom = true;
      video.muted = false;
      video.controls = true;
      try { video.currentTime = 0; } catch (e) { /* metadados ainda não chegaram */ }
      botao.remove();
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      avisar(slot, { tipo: "play" });
    });

    if (!poupar) {
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => { if (!comSom) rotulo.textContent = "Toque para ouvir"; }).catch(() => {});
      }
    }
  }

  function iniciar() {
    Array.from(document.querySelectorAll(".sp-vsl[data-vsl-slot]")).forEach(montar);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();

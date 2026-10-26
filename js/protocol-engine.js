// ============================================================
// Motor de protocolos — fluxo de reflexão com ramificação.
//
// Um protocolo é a forma pública dos exercícios de decisão: uma
// sequência de passos (escolha ou escrita livre) que termina num
// veredito + registro pessoal. É o padrão do tipo `protocolo` do
// registry, distinto do guia linear e da ferramenta de cálculo.
//
// Princípios inegociáveis desta peça:
//  - Tudo roda no navegador. Nenhuma resposta é enviada a lugar
//    nenhum. O registro é gerado localmente.
//  - Não é terapia. É reflexão estruturada. A copy do protocolo
//    carrega o aviso e a rampa de saída para ajuda profissional.
//  - DOM seguro: só textContent / createElement, zero innerHTML.
//
// Um protocolo define um objeto PROTOCOL (ver /protocolos/<slug>/)
// e chama runProtocol(PROTOCOL, mountId).
// ============================================================

const protocolPdfBrand = {
  asset: null,
  error: null,
  promise: null,
};

function runProtocol(protocol, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const state = { answers: {}, path: [] };
  prepareProtocolPdfBrand();

  // ---- helpers de DOM seguro ----
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // Um prompt/help pode ser função das respostas anteriores — é o que
  // permite a defusão ativa: devolver o pensamento que a pessoa escreveu,
  // reformulado, em vez de descrever o movimento em abstrato.
  const resolve = (v) => (typeof v === "function" ? v(state.answers) : v);

  // Único dado que o motor grava: quais itens do plano foram marcados.
  // A chave de cada item é "r<id do desfecho>:<id do item>", sem texto do
  // veredito nem tom. Chaves em outro formato (versões antigas guardavam o
  // veredito) são descartadas na leitura e apagadas do armazenamento.
  const planStorageKey = "dlt-protocol-plan:" + protocol.id;
  const planItemKeyPattern = /^r[0-9]+:[A-Za-z0-9_-]+$/;
  function readPlanState() {
    let saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(planStorageKey) || "{}") || {};
    } catch (error) {
      return {};
    }
    const clean = {};
    let dropped = false;
    Object.keys(saved).forEach((key) => {
      if (planItemKeyPattern.test(key) && saved[key] === true) clean[key] = true;
      else dropped = true;
    });
    if (dropped) {
      if (Object.keys(clean).length) writePlanState(clean);
      else clearPlanState();
    }
    return clean;
  }
  function writePlanState(value) {
    try {
      window.localStorage.setItem(planStorageKey, JSON.stringify(value));
    } catch (error) {
      // A private window or a blocked storage context still leaves the plan usable in memory.
    }
  }
  // Apaga tudo o que este protocolo gravou neste navegador.
  function clearPlanState() {
    try {
      window.localStorage.removeItem(planStorageKey);
    } catch (error) {
      // Sem acesso ao armazenamento não há nada gravado para apagar.
    }
  }

  function currentStep(index) {
    return protocol.steps[index];
  }

  // Um passo pode declarar um `next(answers)` para ramificar; senão segue em ordem.
  function nextIndex(index) {
    const step = currentStep(index);
    if (typeof step.next === "function") {
      const target = step.next(state.answers);
      if (target === null) return protocol.steps.length; // fim antecipado
      if (typeof target === "string") {
        const i = protocol.steps.findIndex((s) => s.id === target);
        return i === -1 ? index + 1 : i;
      }
    }
    return index + 1;
  }

  function render(index) {
    mount.replaceChildren();
    if (index >= protocol.steps.length) return renderResult();

    const step = currentStep(index);
    const card = el("div", "protocol-card flow-card");

    const progress = el("div", "protocol-progress");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "1");
    progress.setAttribute("aria-valuemax", String(protocol.steps.length));
    progress.setAttribute("aria-valuenow", String(Math.min(index + 1, protocol.steps.length)));
    const progressLabel = el("span", "protocol-progress-label", "Passo " + Math.min(index + 1, protocol.steps.length) + " de " + protocol.steps.length);
    progress.appendChild(progressLabel);
    const progressDots = el("span", "protocol-progress-dots");
    protocol.steps.forEach((_, dotIndex) => {
      const dot = el("span", "protocol-progress-dot" + (dotIndex < index ? " is-done" : dotIndex === index ? " is-current" : ""));
      dot.setAttribute("aria-hidden", "true");
      progressDots.appendChild(dot);
    });
    progress.appendChild(progressDots);
    card.appendChild(progress);

    if (step.eyebrow) card.appendChild(el("p", "protocol-eyebrow", step.eyebrow));
    card.appendChild(el("h2", "protocol-q", resolve(step.prompt)));
    const help = resolve(step.help);
    if (help) card.appendChild(el("p", "protocol-help", help));

    if (step.type === "choice") {
      const group = el("div", "protocol-options flow-options");
      group.setAttribute("role", "group");
      step.options.forEach((opt) => {
        const b = el("button", "btn btn-secondary", opt.label);
        b.type = "button";
        b.addEventListener("click", () => {
          state.answers[step.id] = opt.value;
          state.answers[step.id + "__label"] = opt.label;
          state.path.push(index);
          render(nextIndex(index));
          window.scrollTo({ top: mount.offsetTop - 20, behavior: "smooth" });
        });
        group.appendChild(b);
      });
      card.appendChild(group);
    } else if (step.type === "write") {
      const ta = el("textarea", "protocol-write");
      ta.rows = 4;
      ta.placeholder = step.placeholder || "Escreva com suas palavras…";
      ta.value = state.answers[step.id] || "";
      card.appendChild(ta);
      const row = el("div", "protocol-nav");
      const cont = el("button", "btn btn-primary", step.cta || "Continuar");
      cont.type = "button";
      cont.addEventListener("click", () => {
        state.answers[step.id] = ta.value.trim();
        state.path.push(index);
        render(nextIndex(index));
        window.scrollTo({ top: mount.offsetTop - 20, behavior: "smooth" });
      });
      row.appendChild(cont);
      card.appendChild(row);
    }

    // Voltar fica visível em todas as telas. No primeiro passo ele não
    // tem histórico, mas a affordance continua previsível para teclado e mobile.
    const back = el("button", "protocol-back", "← Voltar");
    back.type = "button";
    back.setAttribute("aria-disabled", String(!state.path.length));
    back.addEventListener("click", () => {
      if (!state.path.length) return;
      const prev = state.path.pop();
      render(prev);
    });
    card.appendChild(back);

    mount.appendChild(card);
  }

  function renderResult() {
    const result = protocol.result(state.answers);
    const toneClass = result.tone === "good" ? "is-good" : result.tone === "bad" ? "is-bad" : "is-mixed";
    const card = el("div", "protocol-card protocol-result flow-result result-hero " + toneClass);

    card.appendChild(el("p", "protocol-eyebrow", result.eyebrow || "Seu resultado"));

    const verdictPanel = el("div", "protocol-verdict-panel");
    verdictPanel.appendChild(el("h2", "protocol-verdict", result.verdict));
    card.appendChild(verdictPanel);

    if (result.stats && result.stats.length) {
      const stats = el("div", "result-stats protocol-result-stats");
      stats.setAttribute("aria-label", "Indicadores do resultado");
      result.stats.slice(0, 3).forEach((stat) => {
        const cell = el("div");
        cell.appendChild(el("strong", null, stat.value));
        cell.appendChild(el("span", null, stat.label));
        stats.appendChild(cell);
      });
      card.appendChild(stats);
    }

    const copy = el("div", "protocol-result-copy");
    (result.body || []).forEach((p) => copy.appendChild(el("p", "protocol-body", p)));
    card.appendChild(copy);

    // Registro pessoal do que a pessoa escreveu/escolheu.
    if (result.record && result.record.length) {
      const rec = el("section", "protocol-record answer-record");
      rec.setAttribute("aria-labelledby", "protocol-record-title");
      const recTitle = el("h3", null, "O que você registrou");
      recTitle.id = "protocol-record-title";
      rec.appendChild(recTitle);
      result.record.forEach((r) => {
        if (!r.value) return;
        const item = el("div", "protocol-record-item answer-item");
        item.appendChild(el("span", "protocol-record-q answer-q", r.q));
        item.appendChild(el("span", "protocol-record-a answer-a", r.value));
        rec.appendChild(item);
      });
      card.appendChild(rec);
    }

    if (result.plan && result.plan.length) {
      const planState = readPlanState();
      const plan = el("section", "protocol-plan");
      plan.setAttribute("aria-labelledby", "protocol-plan-title");
      const planTitle = el("h3", null, "Seu plano a partir de agora");
      planTitle.id = "protocol-plan-title";
      plan.appendChild(planTitle);
      plan.appendChild(el("p", "protocol-plan-intro", "Marque conforme fizer. A lista fica somente neste navegador e pode ser retomada depois."));
      const list = el("div", "protocol-plan-list");
      const resultKey = "r" + (Number.isInteger(result.id) ? result.id : 0);
      result.plan.forEach((item, index) => {
        const itemId = String(item.id || index).replace(/[^A-Za-z0-9_-]/g, "");
        const key = resultKey + ":" + (itemId || index);
        const label = el("label", "protocol-plan-item");
        const check = el("input");
        check.type = "checkbox";
        check.checked = Boolean(planState[key]);
        check.setAttribute("data-plan-key", key);
        const textWrap = el("span");
        textWrap.appendChild(el("span", "protocol-plan-num", "Passo " + (index + 1)));
        textWrap.appendChild(el("strong", "protocol-plan-title", item.title));
        textWrap.appendChild(el("span", "protocol-plan-text", item.text));
        label.appendChild(check);
        label.appendChild(textWrap);
        if (check.checked) label.classList.add("is-done");
        check.addEventListener("change", () => {
          const next = readPlanState();
          if (check.checked) next[key] = true;
          else delete next[key];
          if (Object.keys(next).length) writePlanState(next);
          else clearPlanState();
          label.classList.toggle("is-done", check.checked);
        });
        list.appendChild(label);
      });
      plan.appendChild(list);
      card.appendChild(plan);
    }

    if (result.safety) card.appendChild(el("p", "protocol-safety", result.safety));

    const delivery = el("section", "protocol-delivery result-actions");
    delivery.appendChild(el("h3", "protocol-delivery-title result-actions-title", "Leve este resultado com você"));
    delivery.appendChild(el("p", "protocol-delivery-text",
      "Os arquivos são montados localmente no seu navegador e não incluem recomendações ou ofertas exibidas depois do resultado."));

    const actions = el("div", "protocol-actions result-actions-row");
    const pdf = el("button", "btn btn-primary", "Preparando o PDF…");
    pdf.type = "button";
    pdf.disabled = true;
    pdf.setAttribute("aria-busy", "true");

    const enablePdf = () => {
      if (!pdf.isConnected) return;
      if (protocolPdfBrand.asset && window.jspdf && window.jspdf.jsPDF) {
        pdf.disabled = false;
        pdf.removeAttribute("aria-busy");
        pdf.textContent = "Baixar meu resultado em PDF";
        return;
      }
      if (protocolPdfBrand.error || !window.jspdf || !window.jspdf.jsPDF) {
        pdf.disabled = false;
        pdf.removeAttribute("aria-busy");
        pdf.textContent = "Tentar baixar meu resultado em PDF";
      }
    };

    enablePdf();
    if (protocolPdfBrand.promise) {
      protocolPdfBrand.promise.then(enablePdf).catch(enablePdf);
    }

    pdf.addEventListener("click", () => {
      const previousLabel = pdf.textContent;
      pdf.disabled = true;
      pdf.textContent = "Gerando PDF…";
      try {
        if (!protocolPdfBrand.asset) {
          throw new Error("O logo da DLT Academy ainda não foi carregado.");
        }
        downloadProtocolPdf(protocol, result, protocolPdfBrand.asset);
        pdf.textContent = "PDF baixado";
      } catch (error) {
        console.error("Não foi possível gerar o PDF do protocolo.", error);
        pdf.textContent = "Não foi possível baixar — tentar novamente";
      } finally {
        window.setTimeout(() => {
          if (!pdf.isConnected) return;
          pdf.disabled = false;
          pdf.textContent = previousLabel || "Baixar meu resultado em PDF";
        }, 1800);
      }
    });

    const md = el("button", "btn btn-secondary", "Baixar como texto (.md)");
    md.type = "button";
    md.addEventListener("click", () => downloadTextFile(
      protocol.slug + ".md",
      buildMarkdown(protocol, result, state.answers)
    ));

    const copyResult = el("button", "btn btn-secondary", "Copiar resultado");
    copyResult.type = "button";
    copyResult.addEventListener("click", () => {
      const text = buildMarkdown(protocol, result, state.answers);
      const done = () => {
        copyResult.textContent = "Resultado copiado";
        window.setTimeout(() => { if (copyResult.isConnected) copyResult.textContent = "Copiar resultado"; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
      else done();
    });

    const restart = el("button", "btn btn-secondary", "Refazer o protocolo");
    restart.type = "button";
    restart.addEventListener("click", () => {
      clearPlanState();
      state.answers = {};
      state.path = [];
      render(0);
      window.scrollTo({ top: mount.offsetTop - 20, behavior: "smooth" });
    });

    // Apagar: remove o que o protocolo gravou neste navegador e desmarca o
    // plano na tela. A confirmação é texto na página, sem diálogo.
    const eraseStatus = el("p", "protocol-erase-status");
    eraseStatus.setAttribute("role", "status");
    eraseStatus.setAttribute("aria-live", "polite");
    const erase = el("button", "btn btn-secondary protocol-erase", "Apagar minhas respostas");
    erase.type = "button";
    erase.addEventListener("click", () => {
      clearPlanState();
      card.querySelectorAll("[data-plan-key]").forEach((check) => {
        check.checked = false;
        const item = check.closest(".protocol-plan-item");
        if (item) item.classList.remove("is-done");
      });
      eraseStatus.textContent = "Respostas apagadas deste navegador.";
    });

    actions.appendChild(pdf);
    actions.appendChild(md);
    actions.appendChild(copyResult);
    actions.appendChild(restart);
    actions.appendChild(erase);
    delivery.appendChild(actions);
    delivery.appendChild(eraseStatus);
    delivery.appendChild(el("p", "protocol-privacy privacy-line",
      "Tudo isto rodou no seu navegador. Nenhuma resposta foi enviada a lugar nenhum — os arquivos são gerados no seu dispositivo."));
    card.appendChild(delivery);

    const share = el("section", "share-row protocol-share");
    share.setAttribute("aria-label", "Compartilhar o protocolo");
    share.appendChild(el("p", null, "Compartilhe a ferramenta, não as suas respostas."));
    const shareActions = el("div", "share-actions");
    const shareCopy = el("button", null, "Copiar link");
    shareCopy.type = "button";
    const publicUrl = window.location.origin + window.location.pathname;
    const shareTitle = document.title.replace(/ — DLT Academy$/, "");
    const shareLinks = {
      telegram: "https://t.me/share/url?url=" + encodeURIComponent(publicUrl) + "&text=" + encodeURIComponent(shareTitle),
      whatsapp: "https://wa.me/?text=" + encodeURIComponent(shareTitle + " " + publicUrl),
    };
    shareCopy.addEventListener("click", () => {
      const done = () => {
        shareCopy.textContent = "Link copiado";
        shareCopy.classList.add("is-done");
        window.setTimeout(() => { if (shareCopy.isConnected) { shareCopy.textContent = "Copiar link"; shareCopy.classList.remove("is-done"); } }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(publicUrl).then(done, done);
      else done();
    });
    shareActions.appendChild(shareCopy);
    Object.keys(shareLinks).forEach((channel) => {
      const link = el("a", null, channel === "telegram" ? "Telegram" : "WhatsApp");
      link.href = shareLinks[channel];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("referrerpolicy", "no-referrer");
      shareActions.appendChild(link);
    });
    share.appendChild(shareActions);
    card.appendChild(share);

    mount.replaceChildren(card);

    // Próximo passo pelo grafo do registry (mesmo componente dos guias).
    // Ele vem antes do CTA contextual para manter a ordem do modelo:
    // reflexão → registro → próximo passo útil → presente/CTA.
    const nextMount = el("div");
    nextMount.id = "next-step-mount";
    nextMount.dataset.contentId = protocol.id;
    mount.appendChild(nextMount);
    if (typeof renderNextStep === "function") renderNextStep();

    // CTA por veredito — bloco separado, só na tela, nunca no arquivo nem
    // tecido na reflexão. O modo "artigo" também pode apontar para guia ou
    // ferramenta de utilidade; "presente" é reservado a oferta elegível.
    const cta = result.cta;
    if (cta && cta.tipo && cta.tipo !== "none") {
      const box = el("section", "protocol-cta cta-verdict");
      box.dataset.tone = result.tone === "bad" ? "risk" : result.tone === "mixed" ? "warn" : "good";
      box.appendChild(el("p", "protocol-cta-eyebrow cta-eyebrow",
        cta.tipo === "presente" ? "Um presente por ter chegado até aqui" : "Próximo passo útil"));
      if (cta.headline) box.appendChild(el("p", "protocol-cta-headline cta-headline", cta.headline));
      if (cta.texto) box.appendChild(el("p", "protocol-cta-texto", cta.texto));
      const a = el("a", "btn btn-primary", cta.label);
      a.href = cta.href;
      if (cta.external) {
        a.target = "_blank";
        a.rel = "nofollow noopener noreferrer";
        a.setAttribute("referrerpolicy", "no-referrer");
      }
      box.appendChild(a);
      if (cta.disclosure) box.appendChild(el("p", "protocol-cta-disclosure", cta.disclosure));
      mount.appendChild(box);
    }

    // Relatório pago — o último bloco da página, separado do resultado.
    // O resultado gratuito já está completo acima; o relatório é
    // aprofundamento opcional. Sem produto configurado, nada aparece.
    // Um produto, ou uma lista (degraus: método e relatório do caso).
    const refs = Array.isArray(result.relatorio) ? result.relatorio : result.relatorio ? [result.relatorio] : [];
    const cards = refs.map((ref) => buildPaidReportOffer(ref, el)).filter(Boolean);
    if (cards.length === 1) mount.appendChild(cards[0]);
    if (cards.length > 1) {
      const group = el("div", "protocol-paid-offers");
      cards.forEach((c) => group.appendChild(c));
      mount.appendChild(group);
    }
  }

  render(0);
}

// Monta a oferta do relatório pago a partir do catálogo (js/paid-reports.js).
// Recebe só { produto, perfil } — nenhuma resposta da pessoa. O link vai
// para o checkout do provedor, sem parâmetro derivado das respostas.
// Configuração ausente ou inválida não gera oferta (SECURITY_BASELINE).
function buildPaidReportOffer(ref, el) {
  if (!ref || typeof PAID_REPORTS === "undefined") return null;
  const product = PAID_REPORTS[ref.produto];
  if (!product) return null;
  const checkout = paidReportCheckoutUrl(product.checkoutUrl);
  if (!checkout) return null;
  const profile = (product.perfis || {})[ref.perfil];

  const box = el("section", "protocol-paid-report");
  const titleId = "protocol-paid-report-title-" + String(ref.produto).replace(/[^a-z0-9-]/gi, "");
  box.setAttribute("aria-labelledby", titleId);
  box.appendChild(el("p", "protocol-paid-eyebrow", "Para ir além deste resultado"));
  const title = el("h3", "protocol-paid-title", product.titulo);
  title.id = titleId;
  box.appendChild(title);
  if (product.promessa) box.appendChild(el("p", "protocol-paid-text", product.promessa));

  if (profile && profile.capitulo) {
    const chapter = el("p", "protocol-paid-profile");
    chapter.appendChild(el("span", "protocol-paid-profile-label", "Inclui o capítulo do seu caso"));
    chapter.appendChild(el("strong", null, profile.capitulo));
    if (profile.porque) chapter.appendChild(el("span", "protocol-paid-profile-why", profile.porque));
    box.appendChild(chapter);
  }

  if (product.conteudo && product.conteudo.length) {
    const list = el("ul", "protocol-paid-list");
    product.conteudo.forEach((item) => list.appendChild(el("li", null, item)));
    box.appendChild(list);
  }

  const buy = el("div", "protocol-paid-buy");
  buy.appendChild(el("p", "protocol-paid-price", product.preco + (product.formato ? " · " + product.formato : "")));
  const a = el("a", "btn btn-primary", product.botao || "Quero o relatório completo →");
  a.href = checkout;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("referrerpolicy", "no-referrer");
  buy.appendChild(a);
  box.appendChild(buy);

  // Cada produto declara o próprio aviso (como paga, como recebe, o que
  // acontece com as respostas). Este texto é só a rede de segurança.
  box.appendChild(el("p", "protocol-paid-disclosure", product.aviso ||
    ("Produto da DLT Academy, com pagamento pelo " + product.plataforma + ". " +
    "Nada do que você escreveu aqui vai junto: suas respostas continuam só no seu navegador. " +
    "Você tem 7 dias para pedir reembolso.")));
  return box;
}

function paidReportCheckoutUrl(value) {
  if (typeof value !== "string" || !value) return null;
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const hosts = typeof PAID_REPORT_HOSTS === "undefined" ? [] : PAID_REPORT_HOSTS;
  return hosts.indexOf(url.hostname) === -1 ? null : url.href;
}

function prepareProtocolPdfBrand() {
  if (protocolPdfBrand.promise) return protocolPdfBrand.promise;

  protocolPdfBrand.promise = loadLocalImageAsDataUrl("/assets/dlt-logo.png")
    .then((asset) => {
      protocolPdfBrand.asset = asset;
      return asset;
    })
    .catch((error) => {
      protocolPdfBrand.error = error;
      return null;
    });

  return protocolPdfBrand.promise;
}

function loadLocalImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D indisponível.");
        context.drawImage(image, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Não foi possível carregar a marca do PDF."));
    image.src = src;
  });
}

// Monta e baixa um PDF paginado. Recebe apenas resultado + registro + aviso:
// CTA, cupom, disclosure e próximos passos nunca entram no arquivo pessoal.
function downloadProtocolPdf(protocol, result, brandAsset) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("jsPDF não está disponível.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);
  const contentBottom = pageHeight - 25;
  const blue = [30, 79, 216];
  const lightBlue = [74, 141, 248];
  const ink = [24, 34, 52];
  const muted = [82, 94, 116];
  const border = [221, 226, 235];
  let y = 16;

  doc.setProperties({
    title: protocol.title,
    subject: protocol.pdfSubject || "Reflexão estruturada",
    author: "DLT Academy",
    creator: "dlt.academy",
  });

  const ensureSpace = (height) => {
    if (y + height <= contentBottom) return;
    doc.addPage();
    y = 19;
    doc.setDrawColor(...lightBlue);
    doc.setLineWidth(0.7);
    doc.line(margin, 13, pageWidth - margin, 13);
  };

  const writeLines = (text, options = {}) => {
    const fontSize = options.fontSize || 10.5;
    const lineHeight = options.lineHeight || 5.1;
    const width = options.width || contentWidth;
    const x = options.x || margin;
    const color = options.color || ink;
    const fontStyle = options.fontStyle || "normal";
    const lines = doc.splitTextToSize(safePdfText(text), width);

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    lines.forEach((line) => {
      ensureSpace(lineHeight + 0.5);
      doc.text(line, x, y);
      y += lineHeight;
    });
    return lines.length;
  };

  const logoHeight = 15;
  const logoRatio = brandAsset.width / brandAsset.height;
  const logoWidth = Math.min(48, logoHeight * logoRatio);
  doc.addImage(brandAsset.dataUrl, "PNG", margin, y, logoWidth, logoHeight, undefined, "FAST");
  y += logoHeight + 6;
  doc.setDrawColor(...blue);
  doc.setLineWidth(1.1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...blue);
  doc.text("SEU RESULTADO", margin, y);
  y += 7;

  writeLines(protocol.title, { fontSize: 11, lineHeight: 5.2, fontStyle: "bold", color: ink });
  writeLines("Gerado em " + new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()), {
    fontSize: 8.8,
    lineHeight: 4.4,
    color: muted,
  });
  y += 3;

  writeLines(result.verdict, {
    fontSize: 18,
    lineHeight: 7.6,
    fontStyle: "bold",
    color: blue,
  });
  y += 4;

  const stats = (result.stats || []).slice(0, 3);
  if (stats.length) {
    ensureSpace(25);
    const gap = 4;
    const boxWidth = (contentWidth - gap * (stats.length - 1)) / stats.length;
    stats.forEach((stat, index) => {
      const x = margin + (boxWidth + gap) * index;
      doc.setFillColor(246, 248, 252);
      doc.setDrawColor(...border);
      doc.roundedRect(x, y - 3, boxWidth, 17, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...blue);
      doc.text(safePdfText(stat.value), x + 4, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...muted);
      doc.text(safePdfText(stat.label), x + 4, y + 10);
    });
    y += 22;
  }

  (result.body || []).forEach((paragraph) => {
    writeLines(paragraph, { fontSize: 10.5, lineHeight: 5.2, color: ink });
    y += 3.2;
  });

  const records = (result.record || []).filter((item) => item.value);
  if (records.length) {
    ensureSpace(16);
    y += 2;
    doc.setDrawColor(...border);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 9;
    writeLines("O que você registrou", {
      fontSize: 14,
      lineHeight: 6.5,
      fontStyle: "bold",
      color: ink,
    });
    y += 2;

    records.forEach((item) => {
      ensureSpace(14);
      doc.setFillColor(246, 248, 252);
      doc.roundedRect(margin, y - 4.2, contentWidth, 7, 1.5, 1.5, "F");
      writeLines(item.q, {
        x: margin + 3,
        width: contentWidth - 6,
        fontSize: 8.6,
        lineHeight: 4.3,
        fontStyle: "bold",
        color: blue,
      });
      y += 1.5;
      writeLines(item.value, {
        x: margin + 3,
        width: contentWidth - 6,
        fontSize: 10.2,
        lineHeight: 5,
        color: ink,
      });
      y += 5;
    });
  }

  const plan = result.plan || [];
  if (plan.length) {
    ensureSpace(18);
    y += 2;
    doc.setDrawColor(...border);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 9;
    writeLines("Seu plano", { fontSize: 14, lineHeight: 6.5, fontStyle: "bold", color: ink });
    y += 2;
    plan.forEach((item, index) => {
      ensureSpace(15);
      writeLines("[ ] Passo " + (index + 1) + ": " + item.title, {
        fontSize: 9.5,
        lineHeight: 4.8,
        fontStyle: "bold",
        color: blue,
      });
      writeLines(item.text, { fontSize: 9.5, lineHeight: 4.8, color: ink });
      y += 2.5;
    });
  }

  if (result.safety) {
    ensureSpace(20);
    y += 1;
    doc.setDrawColor(229, 188, 88);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 8);
    writeLines("Aviso de segurança", {
      x: margin + 4,
      width: contentWidth - 4,
      fontSize: 9,
      lineHeight: 4.6,
      fontStyle: "bold",
      color: muted,
    });
    y += 1;
    writeLines(result.safety, {
      x: margin + 4,
      width: contentWidth - 4,
      fontSize: 8.8,
      lineHeight: 4.5,
      color: muted,
    });
  }

  const totalPages = doc.getNumberOfPages();
  const pageUrl = "dlt.academy" + String(protocol.path || "/").replace(/\/$/, "");
  const disclaimer = "Conteúdo educacional · Reflexão estruturada — não é terapia nem recomendação de investimento";

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.35);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...muted);
    doc.text(pageUrl, margin, pageHeight - 12.5);
    doc.text(disclaimer, margin, pageHeight - 8.5);
    doc.text(`${page}/${totalPages}`, pageWidth - margin, pageHeight - 8.5, { align: "right" });
  }

  doc.save(protocol.slug + "-resultado.pdf");
}

function safePdfText(value) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n");
}

// Monta o registro pessoal em Markdown — a versão editável/journalável.
function buildMarkdown(protocol, result, answers) {
  const linhas = [];
  linhas.push("# " + protocol.title);
  linhas.push("Gerado em " + new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()));
  linhas.push("");
  linhas.push("> " + result.verdict);
  linhas.push("");
  if (result.stats && result.stats.length) {
    linhas.push("## Resumo");
    linhas.push("");
    result.stats.slice(0, 3).forEach((stat) => {
      linhas.push("- **" + stat.value + "** — " + stat.label);
    });
    linhas.push("");
  }
  (result.body || []).forEach((p) => { linhas.push(p); linhas.push(""); });
  if (result.record && result.record.length) {
    linhas.push("## O que você registrou");
    linhas.push("");
    result.record.forEach((r) => {
      if (!r.value) return;
      linhas.push("**" + r.q + "**");
      linhas.push(r.value);
      linhas.push("");
    });
  }
  if (result.plan && result.plan.length) {
    linhas.push("## Seu plano");
    linhas.push("");
    result.plan.forEach((item, index) => {
      linhas.push("- [ ] Passo " + (index + 1) + ": " + item.title);
      linhas.push("  " + item.text);
    });
    linhas.push("");
  }
  linhas.push("---");
  linhas.push("Reflexão estruturada da DLT Academy — não é terapia nem recomendação de investimento.");
  linhas.push("dlt.academy" + (protocol.path || ""));
  return linhas.join("\n");
}

// Download de arquivo de texto client-side. Nada é transmitido.
function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

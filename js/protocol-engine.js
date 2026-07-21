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
    const card = el("div", "protocol-card");

    if (step.eyebrow) card.appendChild(el("p", "protocol-eyebrow", step.eyebrow));
    card.appendChild(el("h2", "protocol-q", resolve(step.prompt)));
    const help = resolve(step.help);
    if (help) card.appendChild(el("p", "protocol-help", help));

    if (step.type === "choice") {
      const group = el("div", "protocol-options");
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

    // Voltar
    if (state.path.length) {
      const back = el("button", "protocol-back", "← Voltar");
      back.type = "button";
      back.addEventListener("click", () => {
        const prev = state.path.pop();
        render(prev);
      });
      card.appendChild(back);
    }

    mount.appendChild(card);
  }

  function renderResult() {
    const result = protocol.result(state.answers);
    const card = el("div", "protocol-card protocol-result");

    card.appendChild(el("p", "protocol-eyebrow", result.eyebrow || "Seu resultado"));

    const verdictPanel = el("div", "protocol-verdict-panel");
    verdictPanel.appendChild(el("h2", "protocol-verdict", result.verdict));
    card.appendChild(verdictPanel);

    const copy = el("div", "protocol-result-copy");
    (result.body || []).forEach((p) => copy.appendChild(el("p", "protocol-body", p)));
    card.appendChild(copy);

    // Registro pessoal do que a pessoa escreveu/escolheu.
    if (result.record && result.record.length) {
      const rec = el("section", "protocol-record");
      rec.setAttribute("aria-labelledby", "protocol-record-title");
      const recTitle = el("h3", null, "O que você registrou");
      recTitle.id = "protocol-record-title";
      rec.appendChild(recTitle);
      result.record.forEach((r) => {
        if (!r.value) return;
        const item = el("div", "protocol-record-item");
        item.appendChild(el("span", "protocol-record-q", r.q));
        item.appendChild(el("span", "protocol-record-a", r.value));
        rec.appendChild(item);
      });
      card.appendChild(rec);
    }

    if (result.safety) card.appendChild(el("p", "protocol-safety", result.safety));

    const delivery = el("section", "protocol-delivery");
    delivery.appendChild(el("h3", "protocol-delivery-title", "Leve este resultado com você"));
    delivery.appendChild(el("p", "protocol-delivery-text",
      "Os arquivos são montados localmente no seu navegador e não incluem recomendações ou ofertas exibidas depois do resultado."));

    const actions = el("div", "protocol-actions");
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

    actions.appendChild(pdf);
    actions.appendChild(md);
    delivery.appendChild(actions);
    delivery.appendChild(el("p", "protocol-privacy",
      "Tudo isto rodou no seu navegador. Nenhuma resposta foi enviada a lugar nenhum — os arquivos são gerados no seu dispositivo."));
    card.appendChild(delivery);

    mount.replaceChildren(card);

    // CTA por veredito — bloco separado, só na tela, nunca no arquivo nem
    // tecido na reflexão. O modo "artigo" também pode apontar para guia ou
    // ferramenta de utilidade; "presente" é reservado a oferta elegível.
    const cta = result.cta;
    if (cta && cta.tipo && cta.tipo !== "none") {
      const box = el("section", "protocol-cta");
      box.appendChild(el("p", "protocol-cta-eyebrow",
        cta.tipo === "presente" ? "Um presente por ter chegado até aqui" : "Próximo passo útil"));
      if (cta.headline) box.appendChild(el("p", "protocol-cta-headline", cta.headline));
      if (cta.texto) box.appendChild(el("p", "protocol-cta-texto", cta.texto));
      const a = el("a", "btn btn-primary", cta.label);
      a.href = cta.href;
      if (cta.external) {
        a.target = "_blank";
        a.rel = "sponsored nofollow noopener noreferrer";
        a.setAttribute("referrerpolicy", "no-referrer");
      }
      box.appendChild(a);
      if (cta.disclosure) box.appendChild(el("p", "protocol-cta-disclosure", cta.disclosure));
      mount.appendChild(box);
    }

    // Próximo passo pelo grafo do registry (mesmo componente dos guias).
    const nextMount = el("div");
    nextMount.id = "next-step-mount";
    nextMount.dataset.contentId = protocol.id;
    mount.appendChild(nextMount);
    if (typeof renderNextStep === "function") renderNextStep();
  }

  render(0);
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
    subject: "Reflexão estruturada — medo de ficar de fora",
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

  const logoHeight = 11;
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

  writeLines(result.verdict, {
    fontSize: 18,
    lineHeight: 7.6,
    fontStyle: "bold",
    color: blue,
  });
  y += 4;

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
  const pageUrl = "dlt.academy/protocolos/medo-de-ficar-de-fora";
  const disclaimer = "Reflexão estruturada — não é terapia nem recomendação de investimento";

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
  linhas.push("");
  linhas.push("> " + result.verdict);
  linhas.push("");
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

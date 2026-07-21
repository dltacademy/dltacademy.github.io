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

function runProtocol(protocol, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const state = { answers: {}, path: [] };

  // ---- helpers de DOM seguro ----
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

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
    card.appendChild(el("h2", "protocol-q", step.prompt));
    if (step.help) card.appendChild(el("p", "protocol-help", step.help));

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
    card.appendChild(el("h2", "protocol-verdict", result.verdict));
    (result.body || []).forEach((p) => card.appendChild(el("p", "protocol-body", p)));

    // Registro pessoal do que a pessoa escreveu/escolheu — visível e imprimível.
    if (result.record && result.record.length) {
      const rec = el("div", "protocol-record");
      rec.appendChild(el("h3", null, "O que você registrou"));
      result.record.forEach((r) => {
        if (!r.value) return;
        const item = el("div", "protocol-record-item");
        item.appendChild(el("span", "protocol-record-q", r.q));
        item.appendChild(el("span", "protocol-record-a", r.value));
        rec.appendChild(item);
      });
      card.appendChild(rec);
    }

    // Entrega: PDF via impressão nativa (principal) + .md (secundário).
    const actions = el("div", "protocol-actions protocol-noprint");
    const pdf = el("button", "btn btn-primary", "🖨️ Salvar meu resultado em PDF");
    pdf.type = "button";
    pdf.addEventListener("click", () => window.print());
    const md = el("button", "btn btn-secondary", "⬇️ Baixar como texto (.md)");
    md.type = "button";
    md.addEventListener("click", () => downloadTextFile(protocol.slug + ".md", buildMarkdown(protocol, result, state.answers)));
    actions.appendChild(pdf);
    actions.appendChild(md);
    card.appendChild(actions);

    card.appendChild(el("p", "protocol-privacy protocol-noprint",
      "Tudo isto rodou no seu navegador. Nenhuma resposta foi enviada a lugar nenhum — o arquivo é gerado no seu computador."));

    if (result.safety) card.appendChild(el("p", "protocol-safety", result.safety));

    mount.replaceChildren(card);

    // Próximo passo pelo grafo do registry (mesmo componente dos guias).
    const nextMount = el("div");
    nextMount.id = "next-step-mount";
    nextMount.dataset.contentId = protocol.id;
    mount.appendChild(nextMount);
    if (typeof renderNextStep === "function") renderNextStep();
  }

  render(0);
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
  a.click();
  URL.revokeObjectURL(url);
}

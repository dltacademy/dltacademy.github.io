// ============================================================
// Bloco "Próximo passo" / "Relacionados" — lê primaryNext/related
// de js/content-registry.js e conecta o grafo de conteúdo.
// Mesmo cartão do acervo da home e dos índices (.catalog-card,
// dlt-patterns 39). DOM seguro: só createElement/textContent,
// zero innerHTML.
// ============================================================

function findContentEntry(id) {
  return typeof CONTENT === "undefined" ? undefined : CONTENT.find((entry) => entry.id === id);
}

// Mesmos rótulos de formato da home (js/portal.js, TYPE_META).
const NEXT_STEP_TYPE_LABELS = {
  tool: "Simulador",
  protocolo: "Protocolo",
  guide: "Guia",
  article: "Artigo",
};

function nextStepMark(entry) {
  if (entry.mark) return entry.mark.slice(0, 2).toUpperCase();
  return entry.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function nextStepSpan(className, text) {
  const node = document.createElement("span");
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function createConnectionCard(entry) {
  const card = document.createElement("a");
  card.className = "catalog-card";
  card.href = entry.url;

  const mark = nextStepSpan(
    "catalog-mark tnum " + (entry.tone === "green" ? "is-green" : "is-blue"),
    nextStepMark(entry)
  );
  mark.setAttribute("aria-hidden", "true");
  const format = NEXT_STEP_TYPE_LABELS[entry.type];
  const kind = !format ? entry.tag || "" : !entry.tag ? format : entry.tag.toLowerCase().indexOf(format.toLowerCase()) === 0 ? entry.tag : format + " \u00b7 " + entry.tag;
  const top = nextStepSpan("catalog-card-top");
  top.append(mark, nextStepSpan("catalog-kind", kind));

  const title = document.createElement("h3");
  title.className = "catalog-card-title";
  title.textContent = entry.title;

  const desc = document.createElement("p");
  desc.className = "catalog-card-desc";
  desc.textContent = entry.description;

  const NEXT_STEP_CTAS = { tool: "Abrir ferramenta", protocolo: "Começar protocolo", guide: "Ler o guia", article: "Ler artigo" };
  const cta = nextStepSpan("catalog-cta", (NEXT_STEP_CTAS[entry.type] || "Abrir") + " ");
  const arrow = nextStepSpan("");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "\u2192";
  cta.appendChild(arrow);

  const foot = nextStepSpan("catalog-card-foot");
  foot.append(nextStepSpan("catalog-effort", entry.effort || entry.readingTime || ""), cta);

  card.append(top, title, desc, foot);
  return card;
}

function renderConnectionSection(title, entries) {
  const section = document.createElement("section");
  section.className = "next-step-section";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const grid = document.createElement("div");
  grid.className = "next-step-grid";
  entries.forEach((entry) => grid.appendChild(createConnectionCard(entry)));

  section.append(heading, grid);
  return section;
}

// A comunidade não vive no registry: o schema do Registry Core V1 aceita só
// tool/guide/article/protocolo, e forçar uma página institucional num desses
// tipos distorceria o schema para caber. Ela é um destino fixo, declarado
// aqui, e reaproveita o mesmo card do grafo — mesma linguagem visual, mesmo
// DOM seguro. Fecha o ciclo: conteúdo → canal → volta ao site.
const COMMUNITY_ENTRY = {
  id: "comunidade",
  url: "/comunidade/",
  title: "Comunidade da DLT Academy",
  description:
    "Canal para acompanhar, grupo para conversar e YouTube. Gratuitos, sem cadastro — e com os links oficiais num lugar só, para reconhecer golpe quando ele chegar.",
  tag: "Grátis",
  tone: "green",
  mark: "CM",
};

function renderNextStep() {
  const mount = document.getElementById("next-step-mount");
  if (!mount) return;

  const current = findContentEntry(mount.dataset.contentId);
  if (!current) return;

  if (typeof current.primaryNext === "string") {
    const nextEntry = findContentEntry(current.primaryNext);
    if (nextEntry) {
      mount.appendChild(renderConnectionSection("Próximo passo", [nextEntry]));
    }
  }

  if (Array.isArray(current.related) && current.related.length > 0) {
    const relatedEntries = current.related.map(findContentEntry).filter(Boolean);
    if (relatedEntries.length > 0) {
      mount.appendChild(renderConnectionSection("Relacionados", relatedEntries));
    }
  }

  // Por último, sempre: é continuação, não desvio. Quem tem um próximo passo
  // concreto no grafo vê aquilo primeiro; o canal fica para quem terminou.
  mount.appendChild(renderConnectionSection("Continue com a gente", [COMMUNITY_ENTRY]));
}

renderNextStep();

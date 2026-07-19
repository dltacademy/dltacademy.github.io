// ============================================================
// Bloco "Próximo passo" / "Relacionados" — lê primaryNext/related
// de js/content-registry.js e conecta o grafo de conteúdo.
// Mesma linguagem visual dos cards do portal (tool-card). DOM
// seguro: só createElement/textContent, zero innerHTML.
// ============================================================

function findContentEntry(id) {
  return typeof CONTENT === "undefined" ? undefined : CONTENT.find((entry) => entry.id === id);
}

function createConnectionCard(entry) {
  const card = document.createElement("a");
  card.className = "tool-card";
  card.href = entry.url;

  const top = document.createElement("div");
  top.className = "tool-card-top";

  const icon = document.createElement("span");
  icon.className = "tool-card-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = entry.icon || "✦";

  const tag = document.createElement("span");
  tag.className = "tag " + (entry.tone === "green" ? "s1" : "s2");
  tag.textContent = entry.tag;

  top.append(icon, tag);

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const desc = document.createElement("p");
  desc.textContent = entry.description;

  const cta = document.createElement("span");
  cta.className = "tool-card-cta";
  cta.textContent = "Abrir ";
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  cta.appendChild(arrow);

  card.append(top, title, desc, cta);
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
}

renderNextStep();

// ============================================================
// Renderiza os cards do portal a partir de js/content-registry.js.
// ============================================================

const DEFAULT_ICON = "✦";

function createToolCard(entry) {
  const card = document.createElement("a");
  card.className = "tool-card reveal";
  card.href = entry.url;

  const top = document.createElement("div");
  top.className = "tool-card-top";

  const icon = document.createElement("span");
  icon.className = "tool-card-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = entry.icon || DEFAULT_ICON;

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

function renderTools() {
  const grid = document.getElementById("tools-grid");
  grid.innerHTML = "";

  CONTENT.filter((entry) => entry.type === "tool").forEach((entry) => {
    grid.appendChild(createToolCard(entry));
  });

  const guides = CONTENT.filter((entry) => entry.type === "guide");
  if (guides.length > 0) {
    const section = document.createElement("section");
    section.className = "catalog-section";
    section.id = "guias";
    const title = document.createElement("h2");
    title.textContent = "Guias";
    const categoryGrid = document.createElement("div");
    categoryGrid.className = "tools-grid";
    guides.forEach((entry) => categoryGrid.appendChild(createToolCard(entry)));
    section.append(title, categoryGrid);
    grid.parentElement.after(section);
  }
}

function formatDatePtBr(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function renderLatestPosts() {
  const grid = document.getElementById("latest-posts-grid");
  grid.innerHTML = "";

  const articles =
    typeof CONTENT === "undefined" || !Array.isArray(CONTENT)
      ? []
      : CONTENT.filter((entry) => entry.type === "article").sort((a, b) =>
          a.publishedAt.localeCompare(b.publishedAt)
        );

  if (articles.length === 0) {
    const empty = document.createElement("p");
    empty.className = "section-empty";
    empty.textContent = "Nenhum artigo publicado ainda.";
    grid.appendChild(empty);
    return;
  }

  articles.slice(-3).reverse().forEach((entry) => {
    const card = document.createElement("a");
    card.className = "article-card reveal";
    card.href = entry.url;

    const date = document.createElement("time");
    date.className = "article-card-date";
    date.textContent = formatDatePtBr(entry.publishedAt);

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const desc = document.createElement("p");
    desc.textContent = entry.description;

    card.append(date, title, desc);
    grid.appendChild(card);
  });
}

// Reveal on scroll — a animação em si só existe no CSS sob
// prefers-reduced-motion: no-preference; sem IntersectionObserver,
// tudo recebe .in imediatamente e fica visível.
function setupReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => observer.observe(el));
}

renderTools();
renderLatestPosts();
setupReveal();

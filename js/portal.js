// ============================================================
// Renderiza os cards do portal a partir do registry em js/tools.js.
// ============================================================

const CATEGORY_LABELS = {
  ferramenta: "Ferramentas",
  guia: "Guias",
  protocolo: "Protocolos",
  manual: "Manuais",
  teste: "Testes",
};

function createToolCard(tool) {
  const card = document.createElement("a");
  card.className = "tool-card";
  card.href = tool.url;

  const tag = document.createElement("span");
  tag.className = "tag " + (tool.tone === "green" ? "s1" : "s2");
  tag.textContent = tool.tag;

  const title = document.createElement("h3");
  title.textContent = tool.name;

  const desc = document.createElement("p");
  desc.textContent = tool.desc;

  const cta = document.createElement("span");
  cta.className = "tool-card-cta";
  cta.textContent = "Abrir →";

  card.append(tag, title, desc, cta);
  return card;
}

function renderTools() {
  const grid = document.getElementById("tools-grid");
  grid.innerHTML = "";

  const categories = TOOLS.reduce((groups, tool) => {
    const category = tool.category || "ferramenta";
    (groups[category] ||= []).push(tool);
    return groups;
  }, {});

  (categories.ferramenta || []).forEach((tool) => grid.appendChild(createToolCard(tool)));

  Object.entries(categories).forEach(([category, tools]) => {
    if (category === "ferramenta") return;

    const section = document.createElement("section");
    section.className = "catalog-section";
    section.id = category === "guia" ? "guias" : category + "s";
    const title = document.createElement("h2");
    title.textContent = CATEGORY_LABELS[category] || category;
    const categoryGrid = document.createElement("div");
    categoryGrid.className = "tools-grid";
    tools.forEach((tool) => categoryGrid.appendChild(createToolCard(tool)));
    section.append(title, categoryGrid);
    grid.parentElement.after(section);
  });
}

function renderLatestPosts() {
  const grid = document.getElementById("latest-posts-grid");
  grid.innerHTML = "";

  if (typeof POSTS === "undefined" || !Array.isArray(POSTS) || POSTS.length === 0) {
    const empty = document.createElement("p");
    empty.className = "section-empty";
    empty.textContent = "Nenhum artigo publicado ainda.";
    grid.appendChild(empty);
    return;
  }

  [...POSTS].slice(-3).reverse().forEach((post) => {
    const card = document.createElement("a");
    card.className = "article-card";
    card.href = "/blog/" + post.slug + "/";

    const date = document.createElement("time");
    date.className = "article-card-date";
    date.textContent = post.date;

    const title = document.createElement("h3");
    title.textContent = post.title;

    const desc = document.createElement("p");
    desc.textContent = post.desc;

    card.append(date, title, desc);
    grid.appendChild(card);
  });
}

renderTools();
renderLatestPosts();

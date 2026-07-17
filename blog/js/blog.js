// ============================================================
// Renderiza os cards do blog a partir de js/content-registry.js.
// ============================================================

function formatDatePtBr(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function renderPosts() {
  const grid = document.getElementById("posts-grid");
  grid.innerHTML = "";

  const articles =
    typeof CONTENT === "undefined" || !Array.isArray(CONTENT)
      ? []
      : CONTENT.filter((entry) => entry.type === "article").sort((a, b) =>
          a.publishedAt.localeCompare(b.publishedAt)
        );

  if (articles.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = "Primeiro artigo a caminho.";
    grid.appendChild(empty);
    return;
  }

  articles.reverse().forEach((entry) => {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = entry.url;

    const tag = document.createElement("span");
    tag.className = "tag s2";
    tag.textContent = entry.tag;

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const desc = document.createElement("p");
    desc.textContent = entry.description;

    const date = document.createElement("span");
    date.className = "post-card-date";
    date.textContent = formatDatePtBr(entry.publishedAt);

    card.appendChild(tag);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(date);
    grid.appendChild(card);
  });
}

renderPosts();

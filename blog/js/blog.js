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
    card.className = "entry-card";
    card.href = entry.url;
    card.dataset.type = "article";
    card.dataset.situations = (entry.sit || []).join(" ");

    const top = document.createElement("span");
    top.className = "entry-top";

    const mark = document.createElement("span");
    mark.className = "entry-mark";
    mark.textContent = entry.mark || "AR";

    const tag = document.createElement("span");
    tag.className = "entry-type";
    tag.textContent = entry.tag;
    top.appendChild(mark);
    top.appendChild(tag);

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const desc = document.createElement("p");
    desc.textContent = entry.description;

    const date = document.createElement("span");
    date.className = "entry-effort";
    date.textContent = formatDatePtBr(entry.publishedAt) + (entry.effort ? " · " + entry.effort : "");

    const cta = document.createElement("span");
    cta.className = "entry-cta";
    cta.append("Ler artigo ");
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "→";
    cta.appendChild(arrow);

    card.appendChild(top);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(date);
    card.appendChild(cta);
    grid.appendChild(card);
  });
}

renderPosts();

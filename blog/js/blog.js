// ============================================================
// Renderiza os cards do blog a partir do registry em js/posts.js.
// Espelha js/portal.js (mesmo padrão pro grid de ferramentas).
// ============================================================

function renderPosts() {
  const grid = document.getElementById("posts-grid");
  grid.innerHTML = "";

  if (POSTS.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = "Primeiro artigo a caminho.";
    grid.appendChild(empty);
    return;
  }

  [...POSTS].reverse().forEach((post) => {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = "/blog/" + post.slug + "/";

    const tag = document.createElement("span");
    tag.className = "tag s2";
    tag.textContent = post.tag;

    const title = document.createElement("h3");
    title.textContent = post.title;

    const desc = document.createElement("p");
    desc.textContent = post.desc;

    const date = document.createElement("span");
    date.className = "post-card-date";
    date.textContent = post.date;

    card.appendChild(tag);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(date);
    grid.appendChild(card);
  });
}

renderPosts();

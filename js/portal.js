// ============================================================
// Renderiza os cards do portal a partir do registry em js/tools.js.
// ============================================================

function renderTools() {
  const grid = document.getElementById("tools-grid");
  grid.innerHTML = "";

  TOOLS.forEach((tool) => {
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

    card.appendChild(tag);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(cta);
    grid.appendChild(card);
  });
}

renderTools();

// Catálogos públicos por tipo, alimentados pelo mesmo registry da home.
(function () {
  "use strict";

  var mount = document.querySelector("[data-catalog-types]");
  if (!mount || typeof CONTENT === "undefined" || !Array.isArray(CONTENT)) return;

  var types = (mount.getAttribute("data-catalog-types") || "")
    .split(/\s+/)
    .filter(Boolean);
  var labels = { tool: "Ferramenta", guide: "Guia", protocolo: "Protocolo", article: "Artigo" };

  function markFor(entry) {
    if (entry.mark) return entry.mark;
    return entry.title.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
      return part.charAt(0);
    }).join("").toUpperCase();
  }

  CONTENT.filter(function (entry) {
    return types.indexOf(entry.type) !== -1;
  }).forEach(function (entry) {
    var card = document.createElement("a");
    card.className = "entry-card";
    card.href = entry.url;
    card.dataset.type = entry.type;
    card.dataset.situations = (entry.sit || []).join(" ");

    var top = document.createElement("span");
    top.className = "entry-top";
    var mark = document.createElement("span");
    mark.className = "entry-mark";
    mark.textContent = markFor(entry);
    var type = document.createElement("span");
    type.className = "entry-type";
    type.textContent = labels[entry.type] || entry.type;
    top.appendChild(mark);
    top.appendChild(type);

    var title = document.createElement("h3");
    title.textContent = entry.title;
    var description = document.createElement("p");
    description.textContent = entry.description;
    card.appendChild(top);
    card.appendChild(title);
    card.appendChild(description);

    if (entry.effort) {
      var effort = document.createElement("span");
      effort.className = "entry-effort";
      effort.textContent = entry.effort;
      card.appendChild(effort);
    }

    var cta = document.createElement("span");
    cta.className = "entry-cta";
    cta.append(entry.type === "guide" ? "Abrir guia " : "Abrir ");
    var arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "→";
    cta.appendChild(arrow);
    card.appendChild(cta);
    mount.appendChild(card);
  });
})();

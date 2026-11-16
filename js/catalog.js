// Catálogos públicos por tipo (ferramentas, guias, blog), alimentados pelo mesmo
// registry da home e com o mesmo cartão do acervo (.catalog-card, dlt-patterns 39).
// DOM seguro: só createElement/textContent, zero innerHTML.
(function () {
  "use strict";

  var mount = document.querySelector("[data-catalog-types]");
  if (!mount || typeof CONTENT === "undefined" || !Array.isArray(CONTENT)) return;

  var types = (mount.getAttribute("data-catalog-types") || "")
    .split(/\s+/)
    .filter(Boolean);

  // Mesmos rótulos e ações da home (js/portal.js, TYPE_META). "plural" só nomeia o filtro.
  var TYPE_META = {
    tool: { label: "Simulador", plural: "Simuladores", cta: "Abrir ferramenta" },
    protocolo: { label: "Protocolo", plural: "Protocolos", cta: "Começar protocolo" },
    guide: { label: "Guia", plural: "Guias", cta: "Ler o guia" },
    article: { label: "Artigo", plural: "Artigos", cta: "Ler artigo" }
  };

  function metaFor(type) {
    return TYPE_META[type] || TYPE_META.guide;
  }

  function markFor(entry) {
    if (entry.mark) return entry.mark.slice(0, 2).toUpperCase();
    return entry.title.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
      return part.charAt(0);
    }).join("").toUpperCase();
  }

  function formatDatePtBr(iso) {
    var parts = String(iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  // Artigo mostra a data de publicação antes do tempo de leitura; o resto, só o esforço.
  function effortFor(entry) {
    var effort = entry.effort || entry.readingTime || "";
    if (entry.type !== "article") return effort;
    var date = formatDatePtBr(entry.publishedAt);
    return date && effort ? date + " · " + effort : date || effort;
  }

  function span(className, text) {
    var node = document.createElement("span");
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function createCard(entry) {
    var meta = metaFor(entry.type);
    var card = document.createElement("a");
    card.className = "catalog-card";
    card.href = entry.url;
    card.dataset.type = entry.type;
    card.dataset.situations = (entry.sit || []).join(" ");

    var mark = span("catalog-mark tnum " + (entry.tone === "green" ? "is-green" : "is-blue"), markFor(entry));
    mark.setAttribute("aria-hidden", "true");
    var top = span("catalog-card-top");
    var kind = !entry.tag ? meta.label : entry.tag.toLowerCase().indexOf(meta.label.toLowerCase()) === 0 ? entry.tag : meta.label + " · " + entry.tag;
    top.append(mark, span("catalog-kind", kind));

    var title = document.createElement("h3");
    title.className = "catalog-card-title";
    title.textContent = entry.title;
    var description = document.createElement("p");
    description.className = "catalog-card-desc";
    description.textContent = entry.description;

    var cta = span("catalog-cta", meta.cta + " ");
    var arrow = span("");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    cta.appendChild(arrow);
    var foot = span("catalog-card-foot");
    foot.append(span("catalog-effort", effortFor(entry)), cta);

    card.append(top, title, description, foot);
    return card;
  }

  var entries = CONTENT.filter(function (entry) {
    return types.indexOf(entry.type) !== -1;
  });
  if (types.length === 1 && types[0] === "article") {
    entries = entries.slice().sort(function (a, b) {
      return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    });
  }

  var cards = entries.map(function (entry) {
    var card = createCard(entry);
    mount.appendChild(card);
    return card;
  });

  // Filtro de formato (controle segmentado, como na home): só quando a página tem mais de um
  // formato. Ele marca os cartões com data-format-off; quem esconde é o filtro de situação
  // (dlt-interactions.js), que soma os dois e atualiza a contagem.
  var present = types.filter(function (type) {
    return entries.some(function (entry) { return entry.type === type; });
  });
  if (present.length < 2) return;

  var group = document.createElement("div");
  group.className = "segmented";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Filtrar por formato");

  var buttons = [{ id: "", label: "Tudo", count: entries.length }].concat(present.map(function (type) {
    return {
      id: type,
      label: metaFor(type).plural,
      count: entries.filter(function (entry) { return entry.type === type; }).length
    };
  })).map(function (item) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "segmented-btn";
    button.setAttribute("aria-pressed", String(item.id === ""));
    button.dataset.formatFilter = item.id;
    button.append(item.label + " ", span("segmented-count tnum", String(item.count)));
    group.appendChild(button);
    return button;
  });

  function setFormat(id) {
    cards.forEach(function (card) {
      if (id && card.dataset.type !== id) card.setAttribute("data-format-off", "");
      else card.removeAttribute("data-format-off");
    });
    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.formatFilter === id));
    });
    document.dispatchEvent(new Event("catalog:format"));
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () { setFormat(button.dataset.formatFilter); });
  });

  var chips = document.querySelector("[data-filter-group]");
  if (chips && chips.parentNode) chips.parentNode.insertBefore(group, chips);
  else mount.parentNode.insertBefore(group, mount);
})();

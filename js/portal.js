// ============================================================
// Renderiza o catálogo do portal a partir de js/content-registry.js.
//
// Mudanças em relação à versão anterior:
//   · uma família de card só (.entry-card) para ferramenta, guia,
//     protocolo e artigo — muda o rótulo de tipo, não a estrutura;
//   · protocolos passam a aparecer (antes o filtro os descartava);
//   · monograma tipográfico no lugar do emoji (guia de marca);
//   · filtro por situação, opcional: só liga se a página tiver
//     um elemento [data-filter-group] e o registry tiver "sit".
//
// Campos do registry usados: type, title, description, url, tag,
// tone, publishedAt e — novos e opcionais — sit[], mark e effort.
// ============================================================

const TYPE_META = {
  tool:      { label: "Ferramenta", cta: "Abrir ferramenta" },
  protocolo: { label: "Protocolo",  cta: "Começar protocolo" },
  guide:     { label: "Guia",       cta: "Ler o guia" },
  article:   { label: "Artigo",     cta: "Ler artigo" },
};

const SITUATIONS = [
  { id: "",        label: "Tudo" },
  { id: "comecar", label: "Estou começando" },
  { id: "posicao", label: "Já tenho posição" },
  { id: "viagem",  label: "Vou viajar" },
  { id: "taxas",   label: "Quero pagar menos taxas" },
];

// Monograma: 2 letras. Usa entry.mark quando existe; senão deriva das
// iniciais das duas primeiras palavras relevantes do título.
function monogram(entry) {
  if (entry.mark) return entry.mark.slice(0, 2).toUpperCase();
  const skip = ["de", "da", "do", "em", "no", "na", "o", "a", "os", "as", "e", "com", "para", "por", "quanto", "como"];
  const words = entry.title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !skip.includes(w.toLowerCase()));
  if (words.length === 0) return "DA";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function createEntryCard(entry) {
  const meta = TYPE_META[entry.type] || TYPE_META.tool;

  const card = document.createElement("a");
  card.className = "entry-card reveal";
  card.href = entry.url;
  card.dataset.type = entry.type;
  if (Array.isArray(entry.sit) && entry.sit.length > 0) {
    card.dataset.situations = entry.sit.join(" ");
  }

  const top = document.createElement("div");
  top.className = "entry-top";

  const mark = document.createElement("span");
  mark.className = "entry-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = monogram(entry);

  const type = document.createElement("span");
  type.className = "entry-type";
  type.textContent = entry.tag || meta.label;

  top.append(mark, type);

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const desc = document.createElement("p");
  desc.textContent = entry.description;

  const effort = entry.effort ? document.createElement("span") : null;
  if (effort) {
    effort.className = "entry-effort";
    effort.textContent = entry.effort;
  }

  const cta = document.createElement("span");
  cta.className = "entry-cta";
  cta.textContent = meta.cta + " ";
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  cta.appendChild(arrow);

  card.append(top, title, desc);
  if (effort) card.appendChild(effort);
  card.appendChild(cta);
  return card;
}

// Ferramentas, protocolos e guias num catálogo só. A ordem é a do
// registry: quem edita o registry controla a vitrine.
function renderCatalog() {
  const grid = document.getElementById("tools-grid");
  if (!grid) return;
  grid.className = "entry-grid";
  grid.innerHTML = "";

  const CATALOG_TYPES = ["tool", "protocolo", "guide"];
  CONTENT
    .filter((entry) => CATALOG_TYPES.includes(entry.type))
    .forEach((entry) => grid.appendChild(createEntryCard(entry)));
}

// Filtro por situação. Progressive enhancement: sem o mount, ou sem
// "sit" no registry, a home continua mostrando tudo.
function setupSituationFilter() {
  const mount = document.querySelector("[data-filter-group]");
  if (!mount) return;

  const cards = Array.from(document.querySelectorAll("[data-situations]"));
  if (cards.length === 0) return;

  const countEl = document.querySelector("[data-filter-count]");
  let active = "";

  const buttons = SITUATIONS.map((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.filter = s.id;
    b.textContent = s.label;
    b.setAttribute("aria-pressed", String(s.id === active));
    b.addEventListener("click", () => {
      active = s.id === active ? "" : s.id;
      apply();
    });
    mount.appendChild(b);
    return b;
  });

  function apply() {
    let shown = 0;
    cards.forEach((card) => {
      const ok = !active || (" " + card.dataset.situations + " ").includes(" " + active + " ");
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === active)));
    if (countEl) {
      const label = (SITUATIONS.find((s) => s.id === active) || SITUATIONS[0]).label;
      countEl.textContent = active
        ? `${shown} ${shown === 1 ? "peça" : "peças"} para "${label}"`
        : `${shown} ferramentas, protocolos e guias — todos gratuitos`;
    }
  }

  apply();
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
  if (!grid) return;
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
    date.dateTime = entry.publishedAt;
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

renderCatalog();
renderLatestPosts();
setupSituationFilter();
setupReveal();

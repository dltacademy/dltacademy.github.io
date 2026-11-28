/* ============================================================
   Portal DLT Academy — caso ao vivo do hero, Triagem em 2 Cliques,
   Explorador do Ecossistema, Últimos Artigos e barra fixa do celular.
   ============================================================ */
(function () {
  "use strict";

  const TYPE_META = {
    tool:      { label: "Simulador", cta: "Abrir ferramenta" },
    protocolo: { label: "Protocolo", cta: "Começar protocolo" },
    guide:     { label: "Guia",      cta: "Ler o guia" },
    article:   { label: "Artigo",    cta: "Ler artigo" }
  };

  const FORMAT_FILTERS = [
    { id: "all",          label: "Tudo" },
    { id: "diagnosticos", label: "Simuladores e protocolos" },
    { id: "guide",        label: "Guias passo a passo" },
    { id: "article",      label: "Artigos e análises" }
  ];

  const SITUATIONS = [
    { id: "",        label: "Qualquer situação" },
    { id: "posicao", label: "Tenho posição ou dúvida agora" },
    { id: "viagem",  label: "Vou viajar / pagar no exterior" },
    { id: "taxas",   label: "Quero cortar taxas" },
    { id: "comecar", label: "Estou começando do zero" }
  ];

  const PROPOSED_ORDER = [
    "tool-sobrevive-ou-quebra",
    "protocolo-decisao-fria",
    "tool-dreno-cartao",
    "tool-setup-nomade",
    "tool-quanto-em-taxas",
    "tool-vender-ou-segurar",
    "protocolo-medo-de-ficar-de-fora",
    "tool-primeiros-passos-cripto",
    "guide-pagamentos-no-exterior",
    "guide-binance-futuros",
    "guide-assinaturas-ia-bybit",
    "guide-bybit-pay-vietqr",
    "guide-etherfi-cash-viagem",
    "guide-pagamentos-china",
    "guide-abastecer-moreta-usdt",
    "guide-conta-binance",
    "article-fomo-investimentos-depois-da-alta",
    "article-bybit-pay-vs-moreta-vietqr",
    "article-custo-100-dolares-exterior",
    "article-arq-saques-exterior",
    "article-topcashback-economia-viagem",
    "article-bem-vindo"
  ];

  const FUNNEL_TRACKS = [
    {
      id: "padrao",
      num: "Trilha 01",
      tabTitle: "Um teto no quanto você ganha",
      headline: "Para quando o ganho escorre, o preço trava na hora de cobrar ou o plano morre na quinta.",
      summary: "Ache primeiro o padrão que mais custa no seu caso, com uma trava para usar hoje, e só depois decida se vale a leitura das suas três cenas.",
      situationFilter: "comecar",
      scenarios: [
        {
          label: "O ganho entra e escorre antes de o mês acabar",
          badge: "Caminho sugerido · Grátis (8 min)",
          title: "Protocolo do Teto Financeiro",
          why: "Escolhas rápidas para achar o padrão, um exercício de 60 segundos e uma trava para usar hoje. Tudo fica no seu navegador, sem cadastro.",
          primary: {
            label: "Fazer o protocolo grátis →",
            url: "/protocolos/teto-financeiro/"
          },
          secondary: {
            label: "Ver O Mapa do seu Teto",
            url: "/produtos/mapa-do-seu-teto/"
          }
        },
        {
          label: "Travo na hora de cobrar ou dou desconto antes de pedirem",
          badge: "Caminho sugerido · Grátis (8 min)",
          title: "Protocolo do Teto Financeiro",
          why: "O protocolo separa o medo da recusa do fato e você sai com uma trava para a próxima proposta.",
          primary: {
            label: "Fazer o protocolo grátis →",
            url: "/protocolos/teto-financeiro/"
          },
          secondary: {
            label: "Ver O Mapa do seu Teto",
            url: "/produtos/mapa-do-seu-teto/"
          }
        },
        {
          label: "Já fiz o protocolo e quero a leitura das minhas 3 cenas",
          badge: "Caminho sugerido · Leitura sob medida (R$ 148)",
          title: "O Mapa do seu Teto",
          why: "Você carrega o arquivo (.md) do protocolo, conta mais duas cenas e recebe o que se repete nas três, o plano da sua semana e o ajuste no dia 7.",
          primary: {
            label: "Abrir O Mapa do seu Teto →",
            url: "/produtos/mapa-do-seu-teto/"
          },
          secondary: {
            label: "Refazer o protocolo grátis",
            url: "/protocolos/teto-financeiro/"
          }
        }
      ],
      step1Ids: ["protocolo-teto-financeiro"],
      step2Ids: ["protocolo-decisao-fria"],
      step3: {
        kicker: "Se o padrão pesar · Leitura sob medida (R$ 148)",
        title: "O Mapa do seu Teto",
        desc: "Os agentes cruzam três cenas reais suas, prendem cada conclusão às suas palavras e montam o plano da semana; no dia 7, o plano de 90 dias é reescrito com o que aconteceu.",
        primaryCta: { label: "Ver exemplo e a oferta →", url: "/produtos/mapa-do-seu-teto/" },
        secondaryCta: { label: "Começar no protocolo grátis (8 min)", url: "/protocolos/teto-financeiro/" }
      }
    },
    {
      id: "ordem",
      num: "Trilha 02",
      tabTitle: "Entrar, aumentar ou sair de posição",
      headline: "Para quando bate a pressa na tela — seja na euforia da alta ou no medo da queda.",
      summary: "Separe tese de impulso, confira se cabe na sua reserva e defina limite e saída antes de abrir a corretora.",
      situationFilter: "posicao",
      scenarios: [
        {
          label: "Subiu forte e bateu pressa de entrar (FOMO)",
          badge: "Caminho sugerido · Grátis (3 min)",
          title: "Protocolo Medo de Ficar de Fora",
          why: "Quebra o impulso antes de abrir a corretora e separa convicção de pressa. Se decidir seguir com capital relevante, passe depois pelo relatório sob medida.",
          primary: {
            label: "Abrir Protocolo FOMO grátis →",
            url: "/protocolos/medo-de-ficar-de-fora/"
          },
          secondary: {
            label: "Ver Relatório Decisão Fria",
            url: "/produtos/decisao-fria/"
          }
        },
        {
          label: "Vou colocar um valor relevante e quero travar meu limite",
          badge: "Caminho sugerido · Auditoria sob medida",
          title: "Relatório Decisão Fria + Dossiê 24p",
          why: "Regras fixas em código travam primeiro o teto máximo em reais para o seu caixa; agentes que discordam entre si auditam sua tese, fonte e pressão emocional.",
          primary: {
            label: "Abrir página do Decisão Fria →",
            url: "/produtos/decisao-fria/"
          },
          secondary: {
            label: "Fazer protocolo grátis antes (5 min)",
            url: "/protocolos/decisao-fria/"
          }
        },
        {
          label: "Já tenho posição e estou em dúvida entre vender ou segurar",
          badge: "Caminho sugerido · Simulador grátis",
          title: "Vender ou Segurar?",
          why: "Simula quanto muda se você realizar parcial, travar parte do ganho ou esperar antes de mexer na posição principal.",
          primary: {
            label: "Simular Vender ou Segurar grátis →",
            url: "https://vender-ou-segurar.dlt.academy/"
          },
          secondary: {
            label: "Auditar decisão no Decisão Fria",
            url: "/produtos/decisao-fria/"
          }
        }
      ],
      step1Ids: ["protocolo-decisao-fria", "protocolo-medo-de-ficar-de-fora", "tool-vender-ou-segurar"],
      step2Ids: ["article-fomo-investimentos-depois-da-alta", "tool-quanto-em-taxas", "guide-binance-futuros"],
      step3: {
        kicker: "Se o valor pesar · Segunda leitura sob medida (R$ 47)",
        title: "Relatório Decisão Fria + Dossiê 24 páginas",
        desc: "Antes de alocar um valor relevante, regras em código travam o teto máximo em reais e agentes que discordam entre si auditam sua tese, emoção e fontes.",
        primaryCta: { label: "Ver exemplo e calculadora →", url: "/produtos/decisao-fria/" },
        secondaryCta: { label: "Começar no protocolo grátis (5 min)", url: "/protocolos/decisao-fria/" }
      }
    },
    {
      id: "carteira",
      num: "Trilha 03",
      tabTitle: "Saber se a carteira aguenta uma queda",
      headline: "Para enxergar o risco real na soma das posições — antes que o mercado cobre a conta.",
      summary: "Teste uma queda forte na carteira inteira, descubra o que cai junto na mesma rede e veja quanto fica preso se uma plataforma travar.",
      situationFilter: "posicao",
      scenarios: [
        {
          label: "Tenho várias posições e quero saber se aguento uma queda forte",
          badge: "Caminho sugerido · Auditoria de portfólio",
          title: "Relatório A Carteira Aguenta? + Roteiro PDF",
          why: "Traduz a queda em reais e em meses dos seus gastos, revela concentração oculta por ecossistema e calcula o risco de saque travado por corretora.",
          primary: {
            label: "Abrir página d'A Carteira Aguenta? →",
            url: "/produtos/carteira-aguenta/"
          },
          secondary: {
            label: "Simular 1 posição grátis",
            url: "https://sobrevive-ou-quebra.dlt.academy/"
          }
        },
        {
          label: "Uso margem/futuros e quero calcular risco de liquidação",
          badge: "Caminho sugerido · Simulador grátis",
          title: "Sobrevive ou Quebra? (1.000 cenários)",
          why: "Calcula distância até liquidação e chance estatística de ruína antes de abrir ou aumentar alavancagem e travas de proteção.",
          primary: {
            label: "Abrir Sobrevive ou Quebra? grátis →",
            url: "https://sobrevive-ou-quebra.dlt.academy/"
          },
          secondary: {
            label: "Ler guia Binance Futuros sem erro",
            url: "/guias/binance-futuros-para-quem-ja-opera/"
          }
        },
        {
          label: "Quero descobrir se tudo cai junto ou trava na mesma corretora",
          badge: "Caminho sugerido · Auditoria de concentração",
          title: "Relatório A Carteira Aguenta?",
          why: "Soma o que cai junto por rede e setor e mostra quanto está em cada plataforma, antes que o próximo estresse de mercado bloqueie a saída.",
          primary: {
            label: "Testar concentração da carteira →",
            url: "/produtos/carteira-aguenta/"
          },
          secondary: {
            label: "Simular saída em Vender ou Segurar",
            url: "https://vender-ou-segurar.dlt.academy/"
          }
        }
      ],
      step1Ids: ["tool-sobrevive-ou-quebra", "tool-vender-ou-segurar", "tool-quanto-em-taxas"],
      step2Ids: ["guide-binance-futuros", "protocolo-decisao-fria", "article-fomo-investimentos-depois-da-alta"],
      step3: {
        kicker: "Se o valor pesar · Teste da carteira inteira (R$ 47)",
        title: "Relatório A Carteira Aguenta? + Roteiro Trimestral",
        desc: "Simula a carteira inteira contra quedas fortes em reais e meses de gastos, mede concentração por ecossistema/plataforma e distância até liquidação.",
        primaryCta: { label: "Ver exemplo e teste de queda →", url: "/produtos/carteira-aguenta/" },
        secondaryCta: { label: "Simular 1 posição grátis", url: "https://sobrevive-ou-quebra.dlt.academy/" }
      }
    },
    {
      id: "viagem",
      num: "Trilha 04",
      tabTitle: "Viajar e pagar no exterior sem dreno",
      headline: "Para gastar e sacar em outros países sem perder no câmbio invisível do banco.",
      summary: "Compare IOF, spread, saques em ATM e pagamentos via QR local estruturados em viagens reais na Ásia, China e Europa.",
      situationFilter: "viagem",
      scenarios: [
        {
          label: "Vou viajar e quero cortar IOF e spread do cartão tradicional",
          badge: "Caminho sugerido · Grátis (1 min)",
          title: "O Dreno do Cartão no Exterior",
          why: "Mostra em reais quanto o seu cartão atual perde no câmbio oculto e compara quanto economiza ao migrar para rotas globais eficientes.",
          primary: {
            label: "Calcular dreno do meu cartão →",
            url: "https://dreno-cartao.dlt.academy/"
          },
          secondary: {
            label: "Montar meu Setup do Nômade",
            url: "https://setup-nomade.dlt.academy/"
          }
        },
        {
          label: "Vou para Ásia, China ou Europa e preciso de QR local e saque",
          badge: "Caminho sugerido · Rota personalizada grátis",
          title: "O Setup do Nômade",
          why: "Reúne cartão com cashback líquido, conta global para saque barato e pagamento via QR Code local conforme o seu destino.",
          primary: {
            label: "Montar meu Setup do Nômade →",
            url: "https://setup-nomade.dlt.academy/"
          },
          secondary: {
            label: "Manual de Pagamentos no Exterior",
            url: "/pagamentos-no-exterior/"
          }
        },
        {
          label: "Pago IA e softwares em dólar todo mês e quero cashback",
          badge: "Caminho sugerido · Guia grátis",
          title: "Assinaturas de IA com Cashback",
          why: "Passo a passo para pagar ferramentas e serviços em dólar usando rota internacional com cashback líquido recorrente e teto claro.",
          primary: {
            label: "Abrir guia de Assinaturas de IA →",
            url: "/guias/assinaturas-ia-bybit/"
          },
          secondary: {
            label: "Simular economia no Dreno do Cartão",
            url: "https://dreno-cartao.dlt.academy/"
          }
        }
      ],
      step1Ids: ["tool-dreno-cartao", "tool-setup-nomade", "tool-quanto-em-taxas"],
      step2Ids: ["guide-pagamentos-no-exterior", "guide-etherfi-cash-viagem", "guide-pagamentos-china", "guide-bybit-pay-vietqr", "article-custo-100-dolares-exterior"],
      step3: {
        kicker: "Para ir além · Rotas completas de pagamento",
        title: "Setup completo para viver e viajar pagando menos",
        desc: "Combine cartão com cashback líquido (ether.fi Cash), conta global de saque barato (ARQ / Wise) e QR Codes locais com abastecimento eficiente em USDT.",
        primaryCta: { label: "Abrir O Setup do Nômade →", url: "https://setup-nomade.dlt.academy/" },
        secondaryCta: { label: "Manual de Pagamentos no Exterior", url: "/pagamentos-no-exterior/" }
      }
    },
    {
      id: "base",
      num: "Trilha 05",
      tabTitle: "Começar certo e cortar taxas",
      headline: "Para montar segurança, escolher conta e evitar erros caros logo no início.",
      summary: "Estruture reserva, crie conta com blindagem e reduza o custo composto de taxas operacionais antes do primeiro grande aporte.",
      situationFilter: "comecar",
      scenarios: [
        {
          label: "Estou começando do zero e quero montar reserva e 1ª posição",
          badge: "Caminho sugerido · Diagnóstico 3 min",
          title: "Primeiros Passos no Cripto",
          why: "Responda 8 perguntas para verificar se a sua reserva e segurança mínima já sustentam a entrada antes de escolher a conta e o valor inicial.",
          primary: {
            label: "Abrir Primeiros Passos grátis →",
            url: "https://primeiros-passos-cripto.dlt.academy/"
          },
          secondary: {
            label: "Guia de conta e blindagem Binance",
            url: "/guias/conta-binance/"
          }
        },
        {
          label: "Já opero e quero parar de perder dinheiro em taxas de corretora",
          badge: "Caminho sugerido · Calculadora grátis",
          title: "Quanto Você Paga para Operar?",
          why: "Calcula em menos de 30 segundos quanto giro e ordem a mercado consomem por mês e por ano no seu volume operacional.",
          primary: {
            label: "Calcular minhas taxas grátis →",
            url: "https://quanto-em-taxas.dlt.academy/"
          },
          secondary: {
            label: "Cortar taxas com o Guia Binance",
            url: "/guias/conta-binance/"
          }
        },
        {
          label: "Já estruturei a base e vou fazer meu primeiro aporte maior",
          badge: "Caminho sugerido · Travas antes do aporte",
          title: "Protocolo Decisão Fria",
          why: "Organize primeiro sua decisão no protocolo gratuito em cerca de 5 minutos; se o valor exigir dossiê e teto em código, avance para o relatório sob medida.",
          primary: {
            label: "Fazer Protocolo Decisão Fria grátis →",
            url: "/protocolos/decisao-fria/"
          },
          secondary: {
            label: "Conhecer Relatório Decisão Fria",
            url: "/produtos/decisao-fria/"
          }
        }
      ],
      step1Ids: ["tool-primeiros-passos-cripto", "tool-quanto-em-taxas", "protocolo-medo-de-ficar-de-fora"],
      step2Ids: ["guide-conta-binance", "guide-abastecer-moreta-usdt", "guide-assinaturas-ia-bybit", "article-bem-vindo"],
      step3: {
        kicker: "Se o valor pesar · Travas antes do aporte (R$ 47)",
        title: "Plano de entrada + Relatório Decisão Fria",
        desc: "Depois de estruturar reserva e cortar taxas operacionais, use o motor Decisão Fria antes de colocar capital maior para travar limites em reais.",
        primaryCta: { label: "Conhecer o Decisão Fria →", url: "/produtos/decisao-fria/" },
        secondaryCta: { label: "Abrir Primeiros Passos (3 min)", url: "https://primeiros-passos-cripto.dlt.academy/" }
      }
    }
  ];
  // Ícones (mesmo traço do desenho aprovado). Cada forma: [tag, atributos].
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICON_ARROW = [["path", { d: "M5 12h14M13 6l6 6-6 6" }]];
  const ICON_CHEVRON = [["path", { d: "M6 9l6 6 6-6" }]];
  const TRACK_ICONS = {
    ordem: [["path", { d: "M7 20V4M7 4L4 7M7 4l3 3M17 4v16M17 20l-3-3M17 20l3-3" }]],
    carteira: [["path", { d: "M12 3l9 5-9 5-9-5 9-5z" }], ["path", { d: "M3 13l9 5 9-5" }]],
    viagem: [
      ["circle", { cx: "12", cy: "12", r: "9" }],
      ["path", { d: "M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" }]
    ],
    base: [
      ["rect", { x: "3", y: "14", width: "18", height: "6", rx: "1" }],
      ["rect", { x: "6", y: "8", width: "12", height: "6", rx: "1" }],
      ["rect", { x: "9", y: "3", width: "6", height: "5", rx: "1" }]
    ]
  };

  const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        if (key === "className") {
          node.className = attrs[key];
        } else if (key === "textContent") {
          node.textContent = attrs[key];
        } else if (key === "href" || key === "id" || key === "type") {
          node[key] = attrs[key];
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    if (children) {
      children.forEach((child) => {
        if (typeof child === "string") {
          node.appendChild(document.createTextNode(child));
        } else if (child) {
          node.appendChild(child);
        }
      });
    }
    return node;
  }

  function svgIcon(shapes, size, strokeWidth, className) {
    const svg = document.createElementNS(SVG_NS, "svg");
    const base = {
      viewBox: "0 0 24 24",
      width: String(size),
      height: String(size),
      fill: "none",
      stroke: "currentColor",
      "stroke-width": String(strokeWidth),
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
      class: "icon" + (className ? " " + className : "")
    };
    Object.keys(base).forEach((key) => svg.setAttribute(key, base[key]));
    shapes.forEach((shape) => {
      const node = document.createElementNS(SVG_NS, shape[0]);
      Object.keys(shape[1]).forEach((key) => node.setAttribute(key, shape[1][key]));
      svg.appendChild(node);
    });
    return svg;
  }

  function monogram(entry) {
    if (entry.mark) return entry.mark.slice(0, 2).toUpperCase();
    const skip = ["de", "da", "do", "em", "no", "na", "o", "a", "os", "as", "e", "com", "para", "por", "quanto", "como"];
    const words = String(entry.title || "DA")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w && !skip.includes(w.toLowerCase()));
    if (words.length === 0) return "DA";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // "03 set 2026": dia com dois dígitos, mês abreviado, ano.
  function formatDatePtBr(iso) {
    const parts = String(iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return String(iso || "");
    const [y, m, d] = parts;
    return String(d).padStart(2, "0") + " " + MONTHS_PT[m - 1] + " " + y;
  }

  function getRegistryItems() {
    return typeof CONTENT !== "undefined" && Array.isArray(CONTENT) ? CONTENT : [];
  }

  function sortForExplorer(list) {
    const orderMap = new Map(PROPOSED_ORDER.map((id, idx) => [id, idx]));
    return list.slice().sort((a, b) => {
      const ia = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
      const ib = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
      if (ia !== ib) return ia - ib;
      return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    });
  }

  // Os rótulos dos dados terminam em " →"; o botão desenha a própria seta.
  function stripArrow(label) {
    return String(label || "").replace(/\s*→\s*$/, "");
  }

  function lowerFirst(text) {
    return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
  }

  // "Se o valor pesar · Segunda leitura (R$ 47)" -> ["Se o valor pesar", "segunda leitura (R$ 47)"]
  function splitTitle(text) {
    const parts = String(text || "").split(" · ");
    return [parts[0], lowerFirst(parts.slice(1).join(" · "))];
  }

  // Cartão do acervo: monograma, "Formato · tema", título, frase e rodapé com esforço e ação.
  function createCatalogCard(entry) {
    const meta = TYPE_META[entry.type] || TYPE_META.guide;
    const card = document.createElement("a");
    card.className = "catalog-card";
    card.href = entry.url;
    card.dataset.type = entry.type;
    if (Array.isArray(entry.sit) && entry.sit.length > 0) {
      card.dataset.situations = entry.sit.join(" ");
    }

    const kind = !entry.tag ? meta.label : entry.tag.toLowerCase().startsWith(meta.label.toLowerCase()) ? entry.tag : meta.label + " · " + entry.tag;
    const top = el("span", { className: "catalog-card-top" }, [
      el("span", {
        className: "catalog-mark tnum" + (entry.tone === "green" ? " is-green" : " is-blue"),
        "aria-hidden": "true",
        textContent: monogram(entry)
      }),
      el("span", { className: "catalog-kind", textContent: kind })
    ]);

    const title = el("h3", { className: "catalog-card-title", textContent: entry.title });
    const desc = el("p", { className: "catalog-card-desc", textContent: entry.description });

    const effortLabel = entry.effort || entry.readingTime || "";
    const foot = el("span", { className: "catalog-card-foot" }, [
      el("span", { className: "catalog-effort", textContent: effortLabel }),
      el("span", { className: "catalog-cta" }, [meta.cta + " ", el("span", { "aria-hidden": "true", textContent: "→" })])
    ]);

    card.append(top, title, desc, foot);
    return card;
  }

  // Caso ao vivo do hero. No HTML os três casos aparecem empilhados e a barra de abas
  // está oculta; aqui ela aparece e passa a mostrar um caso por vez.
  function initCaseCard() {
    const card = byId("case-card");
    const tabsHost = byId("case-tabs");
    if (!card || !tabsHost) return;

    const tabs = Array.from(tabsHost.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((tab) => byId(tab.getAttribute("aria-controls")));
    if (tabs.length === 0 || panels.some((panel) => !panel)) return;

    panels.forEach((panel, i) => {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabs[i].id);
    });

    function select(index, moveFocus) {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.setAttribute("tabindex", on ? "0" : "-1");
        panels[i].classList.toggle("is-active", on);
      });
      if (moveFocus) tabs[index].focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false));
      tab.addEventListener("keydown", (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next = -1;
        if (event.key in keys) next = (i + keys[event.key] + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        if (next < 0) return;
        event.preventDefault();
        select(next, true);
      });
    });

    card.classList.add("is-tabbed");
    tabsHost.hidden = false;
    select(0, false);
  }

  function initFunnelNavigator() {
    const tilesHost = byId("funnel-tabs");
    const panelHost = byId("funnel-panel");
    if (!tilesHost || !panelHost) return;

    const registryById = new Map(getRegistryItems().map((item) => [item.id, item]));
    const mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
    const tiles = [];
    let activeTrackId = FUNNEL_TRACKS[0].id;
    let activeScenarioIdx = 0;
    let collapsed = false; // só no celular: a trilha aberta pode ser fechada de novo

    function isMobile() {
      return Boolean(mobileQuery && mobileQuery.matches);
    }

    function buildPath(scenario) {
      const chipText = scenario.badge.replace(/^Caminho sugerido\s*·\s*/, "");
      const isFree = /gr[áa]tis/i.test(chipText);
      return el("div", { className: "path-body" }, [
        el("div", { className: "path-meta" }, [
          el("span", { className: "path-label", textContent: "Caminho sugerido" }),
          el("span", { className: "path-chip" + (isFree ? " is-free" : " is-paid"), textContent: chipText })
        ]),
        el("h4", { className: "path-title", textContent: scenario.title }),
        el("p", { className: "path-why", textContent: scenario.why }),
        el("div", { className: "path-actions" }, [
          el("a", { className: "btn btn-primary btn-md", href: scenario.primary.url }, [
            stripArrow(scenario.primary.label) + " ",
            svgIcon(ICON_ARROW, 16, 2.2)
          ]),
          el("a", { className: "text-link", href: scenario.secondary.url, textContent: stripArrow(scenario.secondary.label) })
        ])
      ]);
    }

    function buildStepList(ids) {
      const list = el("div", { className: "link-list" });
      ids.forEach((id) => {
        const entry = registryById.get(id);
        if (!entry) return;
        const meta = TYPE_META[entry.type] || TYPE_META.guide;
        const effort = entry.effort || entry.readingTime || "";
        list.appendChild(
          el("a", { className: "link-row", href: entry.url }, [
            el("span", { className: "link-row-text" }, [
              el("span", { className: "link-row-title", textContent: entry.title }),
              el("span", { className: "link-row-meta", textContent: effort ? meta.label + " · " + effort : meta.label })
            ]),
            svgIcon(ICON_ARROW, 16, 2.2, "link-row-arrow")
          ])
        );
      });
      return list;
    }

    function buildStep(kind, number, titleText, bodyChildren, isLast) {
      const parts = splitTitle(titleText);
      const rail = el("div", { className: "ladder-rail" }, [
        el("span", { className: "ladder-node tnum", textContent: String(number) }),
        isLast ? null : el("span", { className: "ladder-line", "aria-hidden": "true" })
      ]);
      const title = el("p", { className: "ladder-title" }, [
        parts[0] + " ",
        parts[1] ? el("span", { className: "ladder-sub", textContent: "· " + parts[1] }) : null
      ]);
      return el("li", { className: "ladder-step is-" + kind }, [
        rail,
        el("div", { className: "ladder-body" }, [title].concat(bodyChildren))
      ]);
    }

    function buildLadder(track) {
      const step3 = track.step3;
      const hasGuides = Array.isArray(track.step2Ids) && track.step2Ids.length > 0;
      const paid = el("div", { className: "ladder-card" }, [
        el("p", { className: "ladder-card-title", textContent: step3.title }),
        el("p", { className: "ladder-card-desc", textContent: step3.desc }),
        el("div", { className: "ladder-card-actions" }, [
          el("a", { className: "btn btn-primary btn-s", href: step3.primaryCta.url, textContent: stripArrow(step3.primaryCta.label) }),
          el("a", { className: "text-link", href: step3.secondaryCta.url, textContent: stripArrow(step3.secondaryCta.label) })
        ])
      ]);
      return el("div", { className: "track-ladder" }, [
        el("p", { className: "panel-label", textContent: "A escada desta trilha" }),
        el("ol", { className: "ladder" }, [
          buildStep("free", 1, "Grátis agora · Diagnóstico rápido", [buildStepList(track.step1Ids)], false),
          // A etapa de guias só aparece quando a trilha tem guias (a do Teto não tem).
          hasGuides ? buildStep("guide", 2, "Para executar · Guias e análises", [buildStepList(track.step2Ids)], false) : null,
          buildStep("paid", hasGuides ? 3 : 2, step3.kicker, [paid], true)
        ])
      ]);
    }

    function renderPanel(track) {
      panelHost.setAttribute("aria-labelledby", "tab-" + track.id);
      panelHost.replaceChildren();
      const scenarios = track.scenarios || [];
      if (activeScenarioIdx < 0 || activeScenarioIdx >= scenarios.length) {
        activeScenarioIdx = 0;
      }

      const intro = el("div", { className: "track-intro" }, [
        el("p", { className: "track-kicker tnum", textContent: track.num }),
        el("h3", { textContent: track.headline }),
        el("p", { className: "track-summary", textContent: track.summary })
      ]);

      const choicesRow = el("div", { className: "choice-list", role: "group", "aria-label": "Cenários da trilha" });
      const pathLive = el("div", { className: "track-path", "aria-live": "polite" });
      pathLive.appendChild(buildPath(scenarios[activeScenarioIdx]));

      scenarios.forEach((sc, idx) => {
        const btn = el("button", {
          type: "button",
          className: "choice-row",
          "aria-pressed": String(idx === activeScenarioIdx)
        }, [
          el("span", { className: "choice-dot", "aria-hidden": "true" }),
          el("span", { className: "choice-text", textContent: sc.label })
        ]);
        btn.addEventListener("click", () => {
          activeScenarioIdx = idx;
          choicesRow.querySelectorAll(".choice-row").forEach((other, i) => {
            other.setAttribute("aria-pressed", String(i === idx));
          });
          pathLive.replaceChildren(buildPath(scenarios[idx]));
          writeUrlState();
        });
        choicesRow.appendChild(btn);
      });

      const moments = el("div", { className: "track-moments" }, [
        el("p", { className: "panel-label", textContent: "Qual é o seu momento?" }),
        choicesRow
      ]);

      const jumpBtn = el("button", {
        type: "button",
        className: "link-button",
        textContent: "Filtrar as peças desta trilha no acervo ↓"
      });
      jumpBtn.addEventListener("click", () => {
        if (typeof window.__setEcosystemFilter === "function") {
          window.__setEcosystemFilter("all", track.situationFilter);
        }
        const explorer = byId("ferramentas");
        if (explorer) {
          explorer.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
        }
      });

      panelHost.appendChild(el("div", { className: "track-main" }, [intro, moments, pathLive, jumpBtn]));
      panelHost.appendChild(buildLadder(track));
    }

    // Celular: o painel fica logo abaixo da trilha aberta (sanfona).
    // Computador: o painel volta para baixo da grade de trilhas.
    function placePanel() {
      const activeTile = tiles.find((tile) => tile.getAttribute("data-track-id") === activeTrackId);
      if (isMobile() && activeTile) {
        if (activeTile.nextElementSibling !== panelHost) activeTile.insertAdjacentElement("afterend", panelHost);
        panelHost.hidden = collapsed;
      } else {
        if (panelHost.parentElement !== tilesHost.parentElement || panelHost.previousElementSibling !== tilesHost) {
          tilesHost.insertAdjacentElement("afterend", panelHost);
        }
        panelHost.hidden = false;
      }
    }

    function syncTiles() {
      const mobile = isMobile();
      tiles.forEach((tile) => {
        const selected = tile.getAttribute("data-track-id") === activeTrackId;
        if (mobile) {
          tile.removeAttribute("aria-pressed");
          tile.setAttribute("aria-expanded", String(selected && !collapsed));
        } else {
          tile.removeAttribute("aria-expanded");
          tile.setAttribute("aria-pressed", String(selected));
        }
        tile.classList.toggle("is-selected", selected);
      });
    }

    tilesHost.replaceChildren();
    FUNNEL_TRACKS.forEach((track) => {
      const btn = el("button", {
        type: "button",
        id: "tab-" + track.id,
        className: "track-tile",
        "aria-controls": "funnel-panel",
        "data-track-id": track.id
      }, [
        el("span", { className: "track-tile-top" }, [
          el("span", { className: "track-tile-num tnum", textContent: track.num.replace(/^Trilha\s+/, "") }),
          svgIcon(TRACK_ICONS[track.id] || TRACK_ICONS.base, 22, 1.8, "track-tile-icon")
        ]),
        el("span", { className: "track-tile-title", textContent: track.tabTitle }),
        svgIcon(ICON_CHEVRON, 18, 2.2, "track-tile-chevron")
      ]);
      btn.addEventListener("click", () => {
        const sameTrack = track.id === activeTrackId;
        if (sameTrack && isMobile()) {
          collapsed = !collapsed;
          syncTiles();
          placePanel();
          return;
        }
        if (sameTrack) return;
        selectTrack(track.id, 0);
        writeUrlState();
        if (isMobile()) {
          btn.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        }
      });
      tiles.push(btn);
      tilesHost.appendChild(btn);
    });

    function selectTrack(trackId, scenarioIdx) {
      const nextTrack = FUNNEL_TRACKS.find((t) => t.id === trackId);
      if (!nextTrack) return false;
      activeTrackId = nextTrack.id;
      activeScenarioIdx = typeof scenarioIdx === "number" ? scenarioIdx : 0;
      collapsed = false;
      renderPanel(nextTrack);
      syncTiles();
      placePanel();
      return true;
    }

    // A escolha fica no endereço (?trilha=...&momento=...), para compartilhar o link
    // e manter a escolha ao voltar. Momento é 1, 2 ou 3 no endereço.
    function writeUrlState() {
      if (!window.history || typeof window.history.replaceState !== "function") return;
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("trilha", activeTrackId);
        if (activeScenarioIdx > 0) url.searchParams.set("momento", String(activeScenarioIdx + 1));
        else url.searchParams.delete("momento");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (err) {
        /* endereço inválido: a escolha continua valendo na tela */
      }
    }

    window.__selectFunnelTrack = function (trackId, scenarioIdx) {
      if (selectTrack(trackId, scenarioIdx)) writeUrlState();
    };

    if (mobileQuery) {
      const onChange = () => {
        syncTiles();
        placePanel();
      };
      if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", onChange);
      else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(onChange);
    }

    const params = new URLSearchParams(window.location.search);
    const initialTrack = FUNNEL_TRACKS.find((t) => t.id === params.get("trilha")) || FUNNEL_TRACKS[0];
    const momento = parseInt(params.get("momento") || "1", 10);
    const initialScenario = momento >= 1 && momento <= (initialTrack.scenarios || []).length ? momento - 1 : 0;
    selectTrack(initialTrack.id, initialScenario);
  }

  function setupEcosystemExplorer() {
    const typeHost = byId("type-filter-group");
    const sitHost = byId("situation-filter-group");
    const countHost = byId("filter-count");
    const gridHost = byId("tools-grid");
    const allLink = byId("catalog-all");
    if (!gridHost) return;

    const allItems = sortForExplorer(getRegistryItems());
    gridHost.className = "catalog-grid";
    gridHost.replaceChildren();
    const cards = allItems.map((entry) => {
      const card = createCatalogCard(entry);
      gridHost.appendChild(card);
      return card;
    });

    let activeType = "all";
    let activeSit = "";
    const PREVIEW_LIMIT = 6;

    // O link para o catálogo completo traz o total real de peças.
    if (allLink) {
      allLink.textContent = "Ver as " + allItems.length + " peças do acervo";
    }

    const clearBtn = el("button", { type: "button", className: "catalog-clear", textContent: "Limpar filtro" });
    clearBtn.addEventListener("click", () => {
      activeType = "all";
      activeSit = "";
      apply();
      if (countHost) countHost.focus({ preventScroll: true });
    });
    if (countHost) {
      countHost.setAttribute("tabindex", "-1");
      countHost.insertAdjacentElement("afterend", clearBtn);
    }

    function countForFormat(formatId) {
      if (formatId === "all") return allItems.length;
      if (formatId === "diagnosticos") {
        return allItems.filter((item) => item.type === "tool" || item.type === "protocolo").length;
      }
      return allItems.filter((item) => item.type === formatId).length;
    }

    // Sem filtro, o acervo mostra as 6 primeiras peças; o link abaixo leva ao resto.
    function apply() {
      let shown = 0;
      let matched = 0;
      const filtering = activeType !== "all" || Boolean(activeSit);
      cards.forEach((card) => {
        const cardType = card.dataset.type || "";
        const formatOk =
          activeType === "all" ||
          (activeType === "diagnosticos" && (cardType === "tool" || cardType === "protocolo")) ||
          cardType === activeType;
        const cardSits = card.dataset.situations || "";
        const sitOk = !activeSit || (" " + cardSits + " ").includes(" " + activeSit + " ");
        const matches = formatOk && sitOk;
        if (matches) matched += 1;
        const visible = matches && (filtering || matched <= PREVIEW_LIMIT);
        card.hidden = !visible;
        if (visible) shown += 1;
      });

      clearBtn.hidden = !filtering;

      if (typeHost) {
        typeHost.querySelectorAll(".segmented-btn").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.getAttribute("data-type-filter") === activeType));
        });
      }
      if (sitHost) {
        sitHost.querySelectorAll("button").forEach((b) => {
          b.setAttribute("aria-pressed", String((b.getAttribute("data-sit-filter") || "") === activeSit));
        });
      }

      if (countHost) {
        if (activeType === "all" && !activeSit) {
          countHost.textContent = matched > shown
            ? "Exibindo " + shown + " de " + matched + " peças no acervo — simuladores, protocolos, guias e artigos gratuitos."
            : matched + " peças no acervo — simuladores, protocolos, guias e artigos gratuitos.";
        } else {
          const fmtObj = FORMAT_FILTERS.find((f) => f.id === activeType) || FORMAT_FILTERS[0];
          const sitObj = SITUATIONS.find((s) => s.id === activeSit) || SITUATIONS[0];
          const parts = [];
          if (activeType !== "all") parts.push(fmtObj.label);
          if (activeSit) parts.push('"' + sitObj.label + '"');
          countHost.textContent = shown + " " + (shown === 1 ? "peça exibida" : "peças exibidas") + " · filtro: " + parts.join(" + ");
        }
      }
    }

    if (typeHost) {
      typeHost.replaceChildren();
      FORMAT_FILTERS.forEach((fmt) => {
        const btn = el("button", {
          type: "button",
          className: "segmented-btn",
          "aria-pressed": String(fmt.id === activeType),
          "data-type-filter": fmt.id
        }, [
          fmt.label + " ",
          el("span", { className: "segmented-count tnum", textContent: String(countForFormat(fmt.id)) })
        ]);
        btn.addEventListener("click", () => {
          activeType = fmt.id;
          apply();
        });
        typeHost.appendChild(btn);
      });
    }

    if (sitHost) {
      sitHost.replaceChildren();
      SITUATIONS.forEach((sit) => {
        const btn = el("button", {
          type: "button",
          className: "pill",
          "aria-pressed": String(sit.id === activeSit),
          "data-sit-filter": sit.id,
          textContent: sit.label
        });
        btn.addEventListener("click", () => {
          activeSit = sit.id === activeSit ? "" : sit.id;
          apply();
        });
        sitHost.appendChild(btn);
      });
    }

    window.__setEcosystemFilter = function (typeId, sitId) {
      activeType = typeId || "all";
      activeSit = sitId || "";
      apply();
    };

    apply();
  }

  function renderLatestPosts() {
    const grid = byId("latest-posts-grid");
    if (!grid) return;
    grid.replaceChildren();

    const posts = getRegistryItems()
      .filter((entry) => entry.type === "article")
      .slice()
      .sort((a, b) => String(a.publishedAt || "").localeCompare(String(b.publishedAt || "")));

    if (posts.length === 0) {
      const empty = document.createElement("p");
      empty.className = "section-empty";
      empty.textContent = "Nenhum artigo publicado ainda.";
      grid.appendChild(empty);
      return;
    }

    posts.slice(-3).reverse().forEach((entry) => {
      const row = document.createElement("a");
      row.className = "article-row";
      row.href = entry.url;

      const date = document.createElement("time");
      date.className = "article-row-date tnum";
      date.dateTime = entry.publishedAt;
      date.textContent = formatDatePtBr(entry.publishedAt);

      const title = document.createElement("h3");
      title.textContent = entry.title;

      const desc = document.createElement("p");
      desc.textContent = entry.description;

      const body = document.createElement("span");
      body.className = "article-row-body";
      body.append(title, desc);

      row.append(date, body);
      grid.appendChild(row);
    });
  }

  // Barra fixa do celular (CSS só a mostra em até 720 px). Aparece depois do primeiro
  // quadro e some enquanto o painel da triagem, os relatórios ou o rodapé estão na tela.
  function initMobileBar() {
    const bar = byId("mobile-bar");
    if (!bar || !("IntersectionObserver" in window)) return;

    const watched = [byId("hero"), byId("funnel-panel"), byId("relatorios"), document.querySelector("footer")].filter(Boolean);
    const visible = new Map(watched.map((node) => [node, false]));
    const hero = byId("hero");
    if (hero) visible.set(hero, true);

    function apply() {
      let anyVisible = false;
      visible.forEach((isVisible) => {
        if (isVisible) anyVisible = true;
      });
      bar.classList.toggle("is-visible", !anyVisible);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
      apply();
    });
    watched.forEach((node) => observer.observe(node));
  }

  initCaseCard();
  initFunnelNavigator();
  setupEcosystemExplorer();
  renderLatestPosts();
  initMobileBar();
})();

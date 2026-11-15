/* ============================================================
   Portal DLT Academy — Triagem em 2 Cliques, Explorador do
   Ecossistema e Últimos Artigos.
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
    { id: "diagnosticos", label: "Simuladores e Protocolos" },
    { id: "guide",        label: "Guias Passo a Passo" },
    { id: "article",      label: "Artigos e Análises" }
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
      id: "ordem",
      num: "Trilha 01",
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
      num: "Trilha 02",
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
      num: "Trilha 03",
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
      num: "Trilha 04",
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

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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

  function formatDatePtBr(iso) {
    const parts = String(iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return String(iso || "");
    const [y, m, d] = parts;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(y, m - 1, d));
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

  function createEntryCard(entry) {
    const meta = TYPE_META[entry.type] || TYPE_META.guide;
    const card = document.createElement("a");
    card.className = "entry-card";
    card.href = entry.url;
    card.dataset.type = entry.type;
    if (Array.isArray(entry.sit) && entry.sit.length > 0) {
      card.dataset.situations = entry.sit.join(" ");
    }

    const top = el("div", { className: "entry-top" }, [
      el("span", { className: "entry-mark", "aria-hidden": "true", textContent: monogram(entry) }),
      el("span", { className: "entry-type", textContent: entry.tag || meta.label })
    ]);

    const title = el("h3", { textContent: entry.title });
    const desc = el("p", { textContent: entry.description });

    card.append(top, title, desc);

    const effortLabel = entry.effort || entry.readingTime || "";
    if (effortLabel) {
      card.appendChild(el("span", { className: "entry-effort", textContent: effortLabel }));
    }

    const cta = document.createElement("span");
    cta.className = "entry-cta";
    cta.textContent = meta.cta + " ";
    cta.appendChild(el("span", { className: "arrow", "aria-hidden": "true", textContent: "→" }));
    card.appendChild(cta);

    return card;
  }

  function initFunnelNavigator() {
    const tabsHost = document.getElementById("funnel-tabs");
    const panelHost = document.getElementById("funnel-panel");
    if (!tabsHost || !panelHost) return;

    const registryById = new Map(getRegistryItems().map((item) => [item.id, item]));
    let activeTrackId = FUNNEL_TRACKS[0].id;
    let activeScenarioIdx = 0;

    function buildPrescription(scenario) {
      const box = el("div", { className: "triage-prescription" });
      box.appendChild(
        el("div", { className: "triage-rx-top" }, [
          el("span", { className: "triage-rx-badge", textContent: scenario.badge })
        ])
      );
      box.appendChild(el("h4", { textContent: scenario.title }));
      box.appendChild(el("p", { className: "triage-rx-why", textContent: scenario.why }));

      const actions = el("div", { className: "triage-actions" }, [
        el("a", { className: "btn btn-primary", href: scenario.primary.url, textContent: scenario.primary.label }),
        el("a", { className: "btn btn-ghost", href: scenario.secondary.url, textContent: scenario.secondary.label })
      ]);
      box.appendChild(actions);
      return box;
    }

    function renderPanel(track) {
      panelHost.setAttribute("aria-labelledby", "tab-" + track.id);
      panelHost.replaceChildren();
      const scenarios = track.scenarios || [];
      if (activeScenarioIdx < 0 || activeScenarioIdx >= scenarios.length) {
        activeScenarioIdx = 0;
      }

      const headCopy = el("div", { className: "funnel-panel-head-copy" }, [
        el("p", { className: "funnel-panel-kicker", textContent: track.num }),
        el("h3", { textContent: track.headline }),
        el("p", { className: "funnel-panel-desc", textContent: track.summary })
      ]);

      const jumpBtn = el("button", {
        type: "button",
        className: "btn btn-ghost funnel-jump-btn",
        textContent: "Filtrar as peças desta trilha no acervo ↓"
      });
      jumpBtn.addEventListener("click", () => {
        if (typeof window.__setEcosystemFilter === "function") {
          window.__setEcosystemFilter("all", track.situationFilter);
        }
        const explorer = document.getElementById("ferramentas");
        if (explorer) {
          explorer.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
        }
      });

      const head = el("div", { className: "funnel-panel-head" }, [headCopy, jumpBtn]);
      panelHost.appendChild(head);

      const triage = el("div", { className: "funnel-triage" }, [
        el("p", { className: "triage-prompt", textContent: "Qual é o seu momento nessa decisão?" })
      ]);

      const scenariosRow = el("div", { className: "triage-scenarios", role: "group", "aria-label": "Cenários da trilha" });
      const rxLive = el("div", { className: "triage-rx-live", "aria-live": "polite" });
      rxLive.appendChild(buildPrescription(scenarios[activeScenarioIdx]));

      scenarios.forEach((sc, idx) => {
        const btn = el("button", {
          type: "button",
          className: "triage-scenario-btn",
          "aria-pressed": String(idx === activeScenarioIdx),
          textContent: sc.label
        });
        btn.addEventListener("click", () => {
          activeScenarioIdx = idx;
          scenariosRow.querySelectorAll(".triage-scenario-btn").forEach((other, i) => {
            other.setAttribute("aria-pressed", String(i === idx));
          });
          rxLive.replaceChildren(buildPrescription(scenarios[idx]));
          writeUrlState();
        });
        scenariosRow.appendChild(btn);
      });

      triage.appendChild(scenariosRow);
      triage.appendChild(rxLive);
      panelHost.appendChild(triage);

      panelHost.appendChild(el("p", {
        className: "funnel-map-label",
        textContent: "A trilha completa: grátis agora → para executar → se o valor for alto"
      }));

      const stages = el("div", { className: "funnel-stages" });

      function buildStageList(cssMod, pillText, titleText, ids) {
        const stage = el("div", { className: "funnel-stage " + cssMod });
        stage.appendChild(
          el("div", { className: "funnel-stage-head" }, [
            el("span", { className: "stage-pill", textContent: pillText }),
            el("span", { className: "stage-link-tag", textContent: titleText })
          ])
        );
        const list = el("div", { className: "stage-links" });
        ids.forEach((id) => {
          const entry = registryById.get(id);
          if (!entry) return;
          const meta = TYPE_META[entry.type] || TYPE_META.guide;
          list.appendChild(
            el("a", { className: "stage-link", href: entry.url }, [
              el("span", { className: "stage-link-title", textContent: entry.title }),
              el("span", { className: "stage-link-tag", textContent: (entry.tag || meta.label) + " →" })
            ])
          );
        });
        stage.appendChild(list);
        return stage;
      }

      stages.appendChild(buildStageList("stage-free", "Grátis agora · Diagnóstico rápido", "Grátis", track.step1Ids));
      stages.appendChild(buildStageList("stage-guide", "Para executar · Guias e análises", "Grátis", track.step2Ids));

      const stagePaid = el("div", { className: "funnel-stage stage-paid" }, [
        el("div", { className: "funnel-stage-head" }, [
          el("span", { className: "stage-pill", textContent: track.step3.kicker })
        ]),
        el("div", { className: "stage-paid-box" }, [
          el("div", null, [
            el("strong", { textContent: track.step3.title }),
            el("p", { textContent: track.step3.desc })
          ]),
          el("div", { className: "stage-paid-actions" }, [
            el("a", { className: "stage-paid-cta", href: track.step3.primaryCta.url, textContent: track.step3.primaryCta.label }),
            el("a", { className: "stage-paid-cta-alt", href: track.step3.secondaryCta.url, textContent: track.step3.secondaryCta.label })
          ])
        ])
      ]);
      stages.appendChild(stagePaid);
      panelHost.appendChild(stages);
    }

    tabsHost.replaceChildren();
    const tabButtons = [];
    FUNNEL_TRACKS.forEach((track) => {
      const btn = el("button", {
        type: "button",
        id: "tab-" + track.id,
        className: "funnel-tab",
        role: "tab",
        "aria-controls": "funnel-panel",
        "aria-selected": String(track.id === activeTrackId),
        tabindex: track.id === activeTrackId ? "0" : "-1",
        "data-track-id": track.id
      }, [
        el("span", { className: "funnel-tab-num", textContent: track.num }),
        el("span", { className: "funnel-tab-title", textContent: track.tabTitle })
      ]);
      btn.addEventListener("click", () => {
        selectTrack(track.id, 0);
        writeUrlState();
      });
      btn.addEventListener("keydown", (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next = -1;
        const current = tabButtons.indexOf(btn);
        if (event.key in keys) next = (current + keys[event.key] + tabButtons.length) % tabButtons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabButtons.length - 1;
        if (next < 0) return;
        event.preventDefault();
        tabButtons[next].focus();
        tabButtons[next].click();
      });
      tabButtons.push(btn);
      tabsHost.appendChild(btn);
    });

    function selectTrack(trackId, scenarioIdx) {
      const nextTrack = FUNNEL_TRACKS.find((t) => t.id === trackId);
      if (!nextTrack) return false;
      activeTrackId = nextTrack.id;
      activeScenarioIdx = typeof scenarioIdx === "number" ? scenarioIdx : 0;
      tabButtons.forEach((other) => {
        const selected = other.getAttribute("data-track-id") === activeTrackId;
        other.setAttribute("aria-selected", String(selected));
        other.setAttribute("tabindex", selected ? "0" : "-1");
        if (selected && tabsHost.scrollWidth > tabsHost.clientWidth) {
          const pad = parseFloat(window.getComputedStyle(tabsHost).paddingLeft) || 0;
          tabsHost.scrollTo({ left: Math.max(0, other.offsetLeft - tabsHost.offsetLeft - pad), behavior: reducedMotion() ? "auto" : "smooth" });
        }
      });
      renderPanel(nextTrack);
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

    const params = new URLSearchParams(window.location.search);
    const initialTrack = FUNNEL_TRACKS.find((t) => t.id === params.get("trilha")) || FUNNEL_TRACKS[0];
    const momento = parseInt(params.get("momento") || "1", 10);
    const initialScenario = momento >= 1 && momento <= (initialTrack.scenarios || []).length ? momento - 1 : 0;
    selectTrack(initialTrack.id, initialScenario);

    // Atalhos do topo: abrem a trilha sem recarregar a página.
    document.querySelectorAll("[data-track]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const trackId = link.getAttribute("data-track");
        if (!selectTrack(trackId, 0)) return;
        event.preventDefault();
        writeUrlState();
        const section = document.getElementById("como-funciona");
        if (section) section.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
        const tab = document.getElementById("tab-" + trackId);
        if (tab) tab.focus({ preventScroll: true });
      });
    });
  }

  function setupEcosystemExplorer() {
    const typeHost = document.getElementById("type-filter-group");
    const sitHost = document.getElementById("situation-filter-group");
    const countHost = document.getElementById("filter-count");
    const gridHost = document.getElementById("tools-grid");
    if (!gridHost) return;

    const allItems = sortForExplorer(getRegistryItems());
    gridHost.className = "entry-grid";
    gridHost.replaceChildren();
    const cards = allItems.map((entry) => {
      const card = createEntryCard(entry);
      gridHost.appendChild(card);
      return card;
    });

    let activeType = "all";
    let activeSit = "";
    let expanded = false;
    const PREVIEW_LIMIT = 6;

    // Sem filtro, o acervo mostra as 6 primeiras peças e um botão para abrir o resto.
    const moreBtn = el("button", { type: "button", className: "btn btn-ghost catalog-more", "aria-controls": "tools-grid" });
    moreBtn.addEventListener("click", () => {
      expanded = true;
      apply();
      const firstHidden = cards[PREVIEW_LIMIT];
      if (firstHidden) firstHidden.focus({ preventScroll: true });
    });
    gridHost.insertAdjacentElement("afterend", moreBtn);

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
        const visible = matches && (filtering || expanded || matched <= PREVIEW_LIMIT);
        card.hidden = !visible;
        if (visible) shown += 1;
      });

      const rest = matched - shown;
      moreBtn.hidden = rest <= 0;
      moreBtn.textContent = "Ver as outras " + rest + (rest === 1 ? " peça" : " peças");
      clearBtn.hidden = !filtering;

      if (typeHost) {
        typeHost.querySelectorAll(".type-chip").forEach((b) => {
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
          countHost.textContent = matched + " peças no acervo — simuladores, protocolos, guias e artigos gratuitos.";
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
        const count = countForFormat(fmt.id);
        const btn = el("button", {
          type: "button",
          className: "type-chip",
          "aria-pressed": String(fmt.id === activeType),
          "data-type-filter": fmt.id,
          textContent: fmt.label + " (" + count + ")"
        });
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
          className: "situation-chip",
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
    const grid = document.getElementById("latest-posts-grid");
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
      const card = document.createElement("a");
      card.className = "article-card";
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

  function setupReveal() {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach((node) => node.classList.add("in"));
      return;
    }
    document.documentElement.classList.add("js-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    targets.forEach((node) => observer.observe(node));
  }

  initFunnelNavigator();
  setupEcosystemExplorer();
  renderLatestPosts();
  setupReveal();
})();

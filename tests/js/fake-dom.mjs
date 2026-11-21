// DOM mínimo em memória para rodar o motor de protocolos no Node.
//
// O motor só usa createElement, filhos, atributos, classes, eventos de clique
// e um punhado de APIs da janela. Aqui há o suficiente disso para percorrer
// um protocolo de ponta a ponta, ler o que ficou na tela e capturar os
// arquivos que o motor baixaria. Nada aqui toca rede, disco do projeto ou
// relógio real: a data é fixa e os temporizadores só correm quando o teste manda.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Propriedades que o navegador espelha como atributo.
const ESPELHADAS = {
  id: "id",
  type: "type",
  href: "href",
  target: "target",
  rel: "rel",
  placeholder: "placeholder",
  rows: "rows",
  download: "download",
  tabIndex: "tabindex",
  maxLength: "maxlength",
  min: "min",
  max: "max",
  step: "step",
};
const BOOLEANAS = { disabled: "disabled", checked: "checked", hidden: "hidden", required: "required" };

// Seletores separados por vírgula e, em cada um, compostos ligados por descendência.
function casaSeletor(el, seletor, escopo) {
  return seletor.split(",").some((parte) => {
    const compostos = parte.trim().split(/\s+/);
    if (!casaSimples(el, compostos[compostos.length - 1])) return false;
    let n = el.parent;
    for (let i = compostos.length - 2; i >= 0; i -= 1) {
      while (n && n !== escopo && !casaSimples(n, compostos[i])) n = n.parent;
      if (!n || n === escopo) return false;
      n = n.parent;
    }
    return true;
  });
}

function casaSimples(el, seletor) {
  const re = /^([a-zA-Z][a-zA-Z0-9-]*)?((?:\.[\w-]+|#[\w-]+|\[[^\]]+\])*)$/;
  const m = re.exec(seletor);
  if (!m) throw new Error("Seletor não suportado no DOM falso: " + seletor);
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  const resto = m[2] || "";
  const pedacos = resto.match(/\.[\w-]+|#[\w-]+|\[[^\]]+\]/g) || [];
  return pedacos.every((p) => {
    if (p[0] === ".") return el.classList.contains(p.slice(1));
    if (p[0] === "#") return el.getAttribute("id") === p.slice(1);
    const attr = /^\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\]$/.exec(p);
    if (!attr) throw new Error("Atributo não suportado no DOM falso: " + p);
    const valor = el.getAttribute(attr[1]);
    return attr[2] === undefined ? valor !== null : valor === attr[2];
  });
}

export class FakeElement {
  constructor(tag, doc) {
    this.tagName = String(tag).toUpperCase();
    this.ownerDocument = doc;
    this.children = [];
    this.parent = null;
    this.attributes = {};
    this.listeners = {};
    this.ownText = "";
    this.dataset = {};
    this.style = {};
    this._value = "";
    this.offsetTop = 0;
  }
  get className() { return this.attributes.class || ""; }
  set className(v) { this.attributes.class = String(v); }
  get textContent() { return this.ownText + this.children.map((c) => c.textContent).join(""); }
  set textContent(text) {
    this.children.forEach((c) => { c.parent = null; });
    this.ownText = String(text);
    this.children = [];
  }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
  get classList() {
    const nomes = () => this.className.split(/\s+/).filter(Boolean);
    return {
      contains: (n) => nomes().includes(n),
      add: (...ns) => { const atual = nomes(); ns.forEach((n) => { if (!atual.includes(n)) atual.push(n); }); this.className = atual.join(" "); },
      remove: (...ns) => { this.className = nomes().filter((n) => !ns.includes(n)).join(" "); },
      toggle: (n, forca) => {
        const quer = forca === undefined ? !nomes().includes(n) : Boolean(forca);
        this.className = nomes().filter((x) => x !== n).concat(quer ? [n] : []).join(" ");
        return quer;
      },
    };
  }
  get isConnected() {
    let n = this;
    while (n.parent) n = n.parent;
    return n === this.ownerDocument._raiz;
  }
  appendChild(filho) {
    if (filho.parent) filho.parent.children = filho.parent.children.filter((c) => c !== filho);
    filho.parent = this;
    this.children.push(filho);
    return filho;
  }
  replaceChildren(...filhos) {
    this.children.forEach((c) => { c.parent = null; });
    this.children = [];
    this.ownText = "";
    filhos.forEach((f) => this.appendChild(f));
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  setAttribute(nome, valor) { this.attributes[nome] = String(valor); }
  getAttribute(nome) { return nome in this.attributes ? this.attributes[nome] : null; }
  removeAttribute(nome) { delete this.attributes[nome]; }
  hasAttribute(nome) { return nome in this.attributes; }
  addEventListener(tipo, fn) { (this.listeners[tipo] ||= []).push(fn); }
  removeEventListener(tipo, fn) { this.listeners[tipo] = (this.listeners[tipo] || []).filter((f) => f !== fn); }
  dispararEvento(tipo, extra = {}) {
    const evento = { type: tipo, target: this, key: undefined, preventDefault() {}, stopPropagation() {}, ...extra };
    (this.listeners[tipo] || []).slice().forEach((fn) => fn(evento));
  }
  click() {
    if (this.hasAttribute("disabled")) return;
    this.dispararEvento("click");
    if (this.tagName === "A" && this.hasAttribute("download")) this.ownerDocument._env._baixou(this);
  }
  focus() { this.ownerDocument.activeElement = this; }
  descendants() { return this.children.flatMap((c) => [c, ...c.descendants()]); }
  matches(seletor) { return casaSeletor(this, seletor); }
  closest(seletor) {
    for (let n = this; n; n = n.parent) if (n.matches && casaSeletor(n, seletor, null)) return n;
    return null;
  }
  querySelectorAll(seletor) { return this.descendants().filter((e) => casaSeletor(e, seletor, this)); }
  querySelector(seletor) { return this.querySelectorAll(seletor)[0] || null; }
}

Object.entries(ESPELHADAS).forEach(([prop, attr]) => {
  Object.defineProperty(FakeElement.prototype, prop, {
    get() { const v = this.getAttribute(attr); return v === null ? "" : v; },
    set(v) { this.setAttribute(attr, v); },
  });
});
Object.entries(BOOLEANAS).forEach(([prop, attr]) => {
  Object.defineProperty(FakeElement.prototype, prop, {
    get() { return this.hasAttribute(attr); },
    set(v) { if (v) this.setAttribute(attr, ""); else this.removeAttribute(attr); },
  });
});

// Texto serializado com estrutura: tag, classe e atributos que o leitor de tela
// ou o CSS enxergam. Serve de impressão digital de uma tela.
export function serializar(el) {
  const attrs = Object.keys(el.attributes).sort().map((k) => ` ${k}="${el.attributes[k]}"`).join("");
  const data = Object.keys(el.dataset).sort().map((k) => ` data-${k}="${el.dataset[k]}"`).join("");
  const filhos = el.children.map(serializar).join("");
  return `<${el.tagName.toLowerCase()}${attrs}${data}>${el.ownText}${filhos}</${el.tagName.toLowerCase()}>`;
}

export function criarAmbiente({ dataFixa = "2026-11-20T12:00:00", reduzMovimento = true, armazenamento = {} } = {}) {
  const env = { baixados: [], timers: [], scrolls: 0 };
  const doc = {
    _env: env,
    _raiz: null,
    activeElement: null,
    title: "Protocolo de teste — DLT Academy",
    createElement: (tag) => new FakeElement(tag, doc),
    getElementById: (id) => doc._raiz.descendants().find((e) => e.getAttribute("id") === id) || null,
  };
  const raiz = new FakeElement("html", doc);
  doc._raiz = raiz;
  doc.body = raiz.appendChild(new FakeElement("body", doc));
  const mount = new FakeElement("div", doc);
  mount.setAttribute("id", "protocol-mount");
  doc.body.appendChild(mount);

  const loja = { ...armazenamento };
  const localStorage = {
    getItem: (k) => (k in loja ? loja[k] : null),
    setItem: (k, v) => { loja[k] = String(v); },
    removeItem: (k) => { delete loja[k]; },
  };
  const sessao = {};
  const sessionStorage = {
    getItem: (k) => (k in sessao ? sessao[k] : null),
    setItem: (k, v) => { sessao[k] = String(v); },
    removeItem: (k) => { delete sessao[k]; },
  };

  class Blob {
    constructor(partes, opcoes = {}) { this.texto = partes.join(""); this.type = opcoes.type || ""; }
  }
  class Image {}

  const janela = {
    localStorage,
    sessionStorage,
    location: { origin: "https://dlt.academy", pathname: "/protocolos/teste/", hash: "", search: "" },
    history: { replaceState() {} },
    navigator: { clipboard: { writeText: () => Promise.resolve() }, userAgent: "node-test" },
    scrollTo: () => { env.scrolls += 1; },
    matchMedia: () => ({ matches: Boolean(reduzMovimento) }),
    setTimeout: (fn, ms) => { env.timers.push({ fn, ms }); return env.timers.length; },
    clearTimeout: () => {},
    document: doc,
  };

  const contexto = vm.createContext({
    document: doc,
    window: janela,
    localStorage,
    sessionStorage,
    navigator: janela.navigator,
    console,
    Blob,
    Image,
    URL: class extends URL {
      static createObjectURL(blob) { env._ultimoBlob = blob; return "blob:teste-" + env.baixados.length; }
      static revokeObjectURL() {}
    },
  });
  janela.window = janela;
  contexto.window.window = janela;
  // A data fixa vive dentro do contexto, para `new Date()` e `Date.now()` do motor.
  vm.runInContext(
    `(() => {
      const Real = Date;
      const FIXA = new Real(${JSON.stringify(dataFixa)}).getTime();
      globalThis.self = globalThis;
      globalThis.Date = class extends Real {
        constructor(...args) { if (args.length === 0) super(FIXA); else super(...args); }
        static now() { return FIXA; }
      };
    })();`,
    contexto
  );

  env._baixou = (a) => {
    const blob = env._ultimoBlob;
    env.baixados.push({ nome: a.getAttribute("download"), texto: blob ? blob.texto : "", tipo: blob ? blob.type : "" });
  };

  env.mount = mount;
  env.doc = doc;
  env.janela = janela;
  env.contexto = contexto;
  env.armazenamento = loja;
  env.sessao = sessao;
  env.rodar = (codigo, nome = "teste.js") => vm.runInContext(codigo, contexto, { filename: nome });
  env.carregar = (caminhoRelativo) => {
    const completo = path.join(RAIZ, caminhoRelativo);
    return vm.runInContext(fs.readFileSync(completo, "utf8"), contexto, { filename: completo });
  };
  env.rodarTimers = () => {
    while (env.timers.length) env.timers.shift().fn();
  };
  return env;
}

// Controle do que a pessoa vê e faz na tela do protocolo.
export function piloto(env) {
  const { mount } = env;
  const todos = () => mount.descendants();
  const porClasse = (nome) => todos().filter((e) => e.classList.contains(nome));
  const botaoPor = (texto) => todos().find((e) => e.tagName === "BUTTON" && e.textContent.trim() === texto) || null;
  return {
    mount,
    todos,
    porClasse,
    botaoPor,
    noResultado: () => porClasse("protocol-result").length > 0,
    rotulo: () => (porClasse("protocol-progress-label")[0] || { textContent: "" }).textContent,
    pergunta: () => (mount.querySelector("#protocol-question") || { textContent: "" }).textContent,
    opcoes: () => porClasse("choice-row"),
    marcadas: () => porClasse("choice-row").filter((r) => r.getAttribute("aria-pressed") === "true").map((r) => r.textContent),
    textarea: () => todos().find((e) => e.tagName === "TEXTAREA") || null,
    primario: () => porClasse("btn-primary")[0] || null,
    voltar: () => porClasse("protocol-back")[0] || null,
    escolher(indice) {
      const linhas = porClasse("choice-row");
      if (!linhas[indice]) throw new Error("Sem opção " + indice + " na tela " + this.rotulo());
      linhas[indice].click();
      env.rodarTimers();
    },
    escrever(texto) {
      const ta = this.textarea();
      if (!ta) throw new Error("Sem campo de texto na tela " + this.rotulo());
      ta.value = texto;
      ta.dispararEvento("input");
      this.primario().click();
      env.rodarTimers();
    },
    impressao: () => serializar(mount),
  };
}

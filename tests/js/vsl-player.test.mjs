// O player próprio do VSL (produtos/vsl-player.js): inerte sem URL válida; com URL,
// troca a capa por <video>, toca mudo, reinicia com som no toque, manda os marcos
// ao Pixel e volta para a capa se o vídeo falhar.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const CODIGO = readFileSync(new URL("../../produtos/vsl-player.js", import.meta.url), "utf8");

class El {
  constructor(tag, attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this.hidden = false;
    this.ouvintes = {};
    this.textContent = "";
  }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); this.parent = null; }
  addEventListener(t, fn) { (this.ouvintes[t] = this.ouvintes[t] || []).push(fn); }
  disparar(t) { (this.ouvintes[t] || []).forEach((fn) => fn({ type: t })); }
  click() { this.disparar("click"); }
  todos() { return this.children.flatMap((c) => [c, ...c.todos()]); }
  querySelector(sel) { return this.todos().find((e) => casa(e, sel)) || null; }
  querySelectorAll(sel) { return this.todos().filter((e) => casa(e, sel)); }
}
function casa(e, sel) {
  if (sel === ".sp-vsl[data-vsl-slot]") return (e.attrs.class || e.className || "").split(" ").includes("sp-vsl") && "data-vsl-slot" in e.attrs;
  if (sel.startsWith(".")) return (e.attrs.class || e.className || "").split(" ").includes(sel.slice(1));
  if (sel === "[data-vsl-cta]") return "data-vsl-cta" in e.attrs;
  if (sel === "p") return e.tagName === "P";
  return false;
}

function montar({ src = "", legenda = "", ctaSegundos = "", autoplayFalha = false, poupar = false } = {}) {
  const body = new El("body");
  const slot = body.appendChild(new El("div", { class: "sp-vsl", "data-vsl-slot": "mapa-teto-vsl", "data-video-src": src, "data-video-legenda": legenda, "data-cta-segundos": ctaSegundos }));
  const frame = slot.appendChild(new El("div", { class: "sp-vsl-frame" }));
  const capa = frame.appendChild(new El("img", { class: "sp-vsl-poster", src: "/capa.png" }));
  const estado = frame.appendChild(new El("div", { class: "sp-vsl-estado" }));
  estado.appendChild(new El("p"));
  const cta = body.appendChild(new El("a", { "data-vsl-cta": "" }));
  const eventos = [];
  const pixel = [];
  const plays = [];
  const document = {
    readyState: "complete",
    querySelectorAll: (s) => body.querySelectorAll(s),
    createElement: (tag) => {
      const e = new El(tag);
      Object.defineProperty(e, "className", { get() { return e.attrs.class || ""; }, set(v) { e.attrs.class = v; } });
      if (tag === "video") {
        e.currentTime = 0;
        e.duration = 0;
        e.play = () => { plays.push({ muted: e.muted }); return autoplayFalha && plays.length === 1 ? Promise.reject(new Error("bloqueado")) : Promise.resolve(); };
      }
      return e;
    },
    dispatchEvent: (ev) => eventos.push(ev.detail),
    addEventListener: () => {},
  };
  const window = {
    fbq: (...a) => pixel.push(a),
    matchMedia: () => ({ matches: poupar }),
  };
  const ctx = vm.createContext({ window, document, navigator: {}, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o.detail; } }, Promise, Number, Array, Set, Object, String });
  vm.runInContext(CODIGO, ctx);
  const video = frame.children.find((c) => c.tagName === "VIDEO");
  const botao = frame.children.find((c) => c.tagName === "BUTTON");
  return { frame, capa, estado, cta, video, botao, eventos, pixel, plays };
}

const soltar = () => new Promise((r) => setImmediate(r));

test("sem URL, ou com URL fora do domínio de vídeo, o player não toca em nada", () => {
  for (const src of ["", "https://exemplo.com/vsl.mp4", "http://video.dlt.academy/vsl.mp4", "https://video.dlt.academy/vsl.mp4?x=1", "https://video.dlt.academy/vsl.webm", "javascript:alert(1)"]) {
    const p = montar({ src });
    assert.equal(p.video, undefined, src);
    assert.equal(p.capa.hidden, false, src);
    assert.equal(p.estado.hidden, false, src);
  }
});

test("com URL válida: vídeo mudo em autoplay, capa escondida e 'Toque para ouvir'", async () => {
  const p = montar({ src: "https://video.dlt.academy/teto/vsl-v8.mp4", legenda: "/produtos/mapa-do-seu-teto-vsl/legenda.vtt" });
  assert.ok(p.video);
  assert.equal(p.video.muted, true);
  assert.equal(p.video.preload, "metadata");
  assert.equal(p.video.poster, "/capa.png");
  assert.equal(p.capa.hidden, true);
  assert.equal(p.estado.hidden, true);
  const fonte = p.video.children.find((c) => c.tagName === "SOURCE");
  assert.equal(fonte.src, "https://video.dlt.academy/teto/vsl-v8.mp4");
  const trilha = p.video.children.find((c) => c.tagName === "TRACK");
  assert.equal(trilha.src, "/produtos/mapa-do-seu-teto-vsl/legenda.vtt");
  await soltar();
  assert.equal(p.botao.children[0].textContent, "Toque para ouvir");
  assert.equal(p.cta.hidden, false, "sem data-cta-segundos o botão de compra fica sempre visível");
});

test("o toque reinicia do zero com som, e os marcos vão ao Pixel uma vez só", async () => {
  const p = montar({ src: "https://video.dlt.academy/teto/vsl-v8.mp4" });
  p.video.duration = 780;
  p.video.currentTime = 200;
  p.video.disparar("timeupdate");
  assert.equal(p.pixel.length, 0, "mudo no autoplay não conta como assistido");
  p.botao.click();
  assert.equal(p.video.muted, false);
  assert.equal(p.video.controls, true);
  assert.equal(p.video.currentTime, 0);
  assert.equal(JSON.stringify(p.pixel[0]), JSON.stringify(["trackCustom", "VSLPlay", { video: "mapa-teto-vsl" }]));
  p.video.currentTime = 400; // 51%
  p.video.disparar("timeupdate");
  p.video.disparar("timeupdate");
  const marcos = p.pixel.filter((a) => a[1] === "VSLProgresso").map((a) => a[2].percentual);
  assert.deepEqual(marcos, [10, 25, 50]);
});

test("autoplay bloqueado mantém o convite para assistir; economia de dados não faz autoplay", async () => {
  const bloqueado = montar({ src: "https://video.dlt.academy/teto/vsl-v8.mp4", autoplayFalha: true });
  await soltar();
  assert.equal(bloqueado.botao.children[0].textContent, "Assistir à apresentação · ~13 min");
  const poupa = montar({ src: "https://video.dlt.academy/teto/vsl-v8.mp4", poupar: true });
  assert.equal(poupa.plays.length, 0);
  assert.equal(poupa.video.preload, "none");
});

test("botão de compra no minuto do pitch (opcional) e volta para a capa se o vídeo falhar", () => {
  const p = montar({ src: "https://video.dlt.academy/teto/vsl-v8.mp4", ctaSegundos: "540" });
  assert.equal(p.cta.hidden, true);
  p.video.currentTime = 541;
  p.video.disparar("timeupdate");
  assert.equal(p.cta.hidden, false);

  const f = montar({ src: "https://video.dlt.academy/teto/vsl-v8.mp4", ctaSegundos: "540" });
  f.video.children.find((c) => c.tagName === "SOURCE").disparar("error");
  assert.equal(f.frame.children.some((c) => c.tagName === "VIDEO"), false);
  assert.equal(f.capa.hidden, false);
  assert.equal(f.estado.hidden, false);
  assert.match(f.estado.children[0].textContent, /versão completa em texto/);
  assert.equal(f.cta.hidden, false, "com o vídeo fora, o botão de compra volta");
});

// A escolha opcional da hora dos lembretes (.ics) no motor: qualquer protocolo cujo resultado
// traga `ics.escolhaHora` ganha os botões de hora; a escolha troca o DTSTART ao baixar e só
// entra no estado guardado quando a pessoa guarda.
import assert from "node:assert/strict";
import test from "node:test";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

const CHAVE = "dlt-protocol-state:protocolo-demonstracao-ciclo";
const ESCOLHA = "{ rotulo: 'Hora dos lembretes', opcoes: [{ rotulo: 'Manhã (08:00)', hora: '08:00' }, { rotulo: 'Almoço (12:30)', hora: '12:30' }, { rotulo: 'Noite (20:00)', hora: '20:00' }] }";

function abrir({ escolha = ESCOLHA } = {}) {
  const env = criarAmbiente();
  env.janela.location.pathname = "/tests/fixtures/protocolo-demo/ciclo.html";
  env.janela.history.replaceState = () => {};
  env.carregar("js/protocol-kit.js");
  env.carregar("js/protocol-engine.js");
  env.carregar("tests/fixtures/protocolo-demo/ciclo.js");
  env.rodar(`demoEventos = ((antes) => (...a) => { const r = antes(...a); const e = ${escolha}; if (e) r.escolhaHora = e; return r; })(demoEventos);`);
  return { env, p: piloto(env) };
}
const clicar = (p, texto) => {
  const b = p.botaoPor(texto);
  assert.ok(b, `botão "${texto}" não encontrado em: ${p.mount.textContent.slice(0, 160)}`);
  b.click();
  p.mount.ownerDocument._env.rodarTimers();
};
const linha = (p, texto) => {
  const r = p.opcoes().find((o) => o.textContent.trim() === texto);
  assert.ok(r, `opção "${texto}" não encontrada`);
  r.click();
  p.mount.ownerDocument._env.rodarTimers();
};
const baixar = (env, p, texto) => {
  const antes = env.baixados.length;
  p.botaoPor(texto).click();
  assert.equal(env.baixados.length, antes + 1, texto);
  return env.baixados[antes];
};
const ateCheckpoint = (p) => {
  linha(p, "Nenhum destes");
  clicar(p, "Continuar");
  linha(p, "Para onde o dinheiro vai");
  p.escrever("uma frase");
};
const ateResultado = (p) => {
  clicar(p, "Continuar com a parte 2");
  p.escrever("olhar o extrato toda segunda");
  linha(p, "Anotar o que entra, sem corrigir");
  assert.ok(p.noResultado());
};
const horas = (texto) => (texto.match(/DTSTART:\d{8}T(\d{6})/g) || []).map((l) => l.slice(-6));
const marcadas = (p) => p.porClasse("protocol-ics-hora-opt").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);

test("sem escolha, o .ics sai na hora do protocolo e os três botões de hora aparecem marcando a dele", () => {
  const { env, p } = abrir();
  ateCheckpoint(p);
  assert.deepEqual(p.porClasse("protocol-ics-hora-opt").map((b) => b.textContent), ["Manhã (08:00)", "Almoço (12:30)", "Noite (20:00)"]);
  assert.deepEqual(marcadas(p), ["Noite (20:00)"]);
  const arquivo = baixar(env, p, "Baixar lembretes (.ics)");
  assert.ok(horas(arquivo.texto).length >= 1);
  horas(arquivo.texto).forEach((h) => assert.equal(h, "200000"));
});

test("a hora escolhida troca o DTSTART de todos os eventos e nada mais muda no arquivo", () => {
  const { env, p } = abrir();
  ateCheckpoint(p);
  const padrao = baixar(env, p, "Baixar lembretes (.ics)").texto;
  clicar(p, "Almoço (12:30)");
  assert.deepEqual(marcadas(p), ["Almoço (12:30)"]);
  const texto = baixar(env, p, "Baixar lembretes (.ics)").texto;
  assert.ok(horas(texto).length >= 1);
  horas(texto).forEach((h) => assert.equal(h, "123000"));
  const semHora = (t) => t.replace(/T\d{6}\r\n/g, "T\r\n").replace(/DTSTAMP:\S+/g, "");
  assert.equal(semHora(texto), semHora(padrao), "só a hora muda");
  assert.ok(!texto.includes("Almoço") && !texto.includes("Hora dos lembretes"), "o rótulo da escolha não vai no arquivo");
  assert.ok(!texto.includes("?"), "nenhuma query");
});

test("a escolha não vai para endereço nem para o armazenamento enquanto ela não guarda", () => {
  const { env, p } = abrir();
  ateCheckpoint(p);
  clicar(p, "Manhã (08:00)");
  baixar(env, p, "Baixar lembretes (.ics)");
  assert.deepEqual(Object.keys(env.armazenamento), []);
  assert.deepEqual(Object.keys(env.sessao).filter((k) => /08:00|0800/.test(env.sessao[k])), [], "nem na aba");
  assert.equal(env.janela.location.hash, "");
  assert.ok(!/08:00/.test(env.janela.location.href || ""));
});

test("guardar leva a hora escolhida como lembrete; sem escolha, o estado guardado fica com lembrete nulo", () => {
  const sem = abrir();
  ateCheckpoint(sem.p);
  ateResultado(sem.p);
  clicar(sem.p, "Guardar neste aparelho para os retornos");
  assert.equal(JSON.parse(sem.env.armazenamento[CHAVE]).lembrete, null);

  const com = abrir();
  ateCheckpoint(com.p);
  clicar(com.p, "Manhã (08:00)");
  ateResultado(com.p);
  assert.deepEqual(marcadas(com.p), ["Manhã (08:00)"], "a escolha do checkpoint segue no resultado");
  assert.equal(com.env.armazenamento[CHAVE], undefined, "escolher não guarda");
  clicar(com.p, "Guardar neste aparelho para os retornos");
  assert.equal(JSON.parse(com.env.armazenamento[CHAVE]).lembrete, "08:00");
});

test("o resultado final também oferece a escolha e baixa na hora marcada", () => {
  const { env, p } = abrir();
  ateCheckpoint(p);
  ateResultado(p);
  clicar(p, "Almoço (12:30)");
  const hs = horas(baixar(env, p, "Baixar lembretes (.ics)").texto);
  assert.equal(hs.length, 3, "dia 3, dia 7 e a revisão semanal");
  hs.forEach((h) => assert.equal(h, "123000"));
});

test("sem `escolhaHora`, ou com menos de duas horas válidas, não aparece nenhuma escolha", () => {
  [ "null", "{ rotulo: 'x', opcoes: [{ rotulo: 'A', hora: '08:00' }] }", "{ rotulo: 'x', opcoes: [{ rotulo: 'A', hora: '25:00' }, { rotulo: 'B', hora: 'x' }] }" ].forEach((escolha) => {
    const { env, p } = abrir({ escolha });
    ateCheckpoint(p);
    assert.equal(p.porClasse("protocol-ics-hora-opt").length, 0, escolha);
    horas(baixar(env, p, "Baixar lembretes (.ics)").texto).forEach((h) => assert.equal(h, "200000"));
  });
});

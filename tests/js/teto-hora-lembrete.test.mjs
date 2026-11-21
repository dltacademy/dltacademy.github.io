// A hora dos lembretes (.ics) do Protocolo do Teto: manhã (08:00), almoço (12:30) ou noite
// (20:00, o padrão), no checkpoint do Ato 1 e no resultado final. A escolha muda o DTSTART, fica
// no estado como `lembrete` só quando ela guarda e nunca vai para endereço nem para o arquivo
// além da hora. Cuidado e "nenhum" seguem sem .ics.
import assert from "node:assert/strict";
import test from "node:test";
import { CASOS, CHAVE, R, abrir, baixar, bib, clicar, clone, jogarCaso, kit, lerLocal, semProibidas } from "./teto-ciclo-apoio.mjs";
import { percorrer } from "./teto-casos.mjs";

const ICS = "Baixar os lembretes (.ics)";
const ROTULOS = ["Manhã (08:00)", "Almoço (12:30)", "Noite (20:00)"];
const horas = (texto) => (texto.match(/DTSTART:\d{8}T\d{6}/g) || []).map((l) => l.slice(-6));
const botoesDeHora = (p) => p.porClasse("protocol-ics-hora-opt");
const marcadas = (p) => botoesDeHora(p).filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);

async function ateOCheckpoint(pagina, letra = "A") {
  const parou = await percorrer({
    mount: pagina.env.mount, passos: pagina.PROTOCOL.steps, kit, respostas: clone(CASOS[letra]),
    seguir: false, esperar: async () => pagina.env.rodarTimers(),
  });
  assert.equal(parou, "fim_ato1");
}

test("a biblioteca e as regras oferecem as três horas, só nos arquivos que têm .ics", () => {
  const ctx = { ciclo: "abcd1234", hoje: "2026-11-20", pagina: "https://dlt.academy/protocolos/teto-financeiro/" };
  const parcial = R.montarParcial(clone(CASOS.A), ctx, bib);
  assert.deepEqual(parcial.ics.escolhaHora.opcoes.map((o) => [o.rotulo, o.hora]), [["Manhã (08:00)", "08:00"], ["Almoço (12:30)", "12:30"], ["Noite (20:00)", "20:00"]]);
  const textos = JSON.stringify(parcial.ics.escolhaHora);
  semProibidas(textos, "escolhaHora");
  ["D", "E", "F"].forEach((letra) => {
    const res = R.montarResultado(clone(CASOS[letra]), ctx, bib);
    assert.equal(res.ics, undefined, `${letra}: sem .ics, logo sem escolha de hora`);
  });
});

test("Ato 1: sem escolha, o .ics sai às 20:00 com a noite marcada", async () => {
  const a = abrir();
  await ateOCheckpoint(a);
  assert.deepEqual(botoesDeHora(a.p).map((b) => b.textContent), ROTULOS);
  assert.deepEqual(marcadas(a.p), ["Noite (20:00)"]);
  const texto = baixar(a.env, a.p, ICS).texto;
  assert.deepEqual(horas(texto), ["200000", "200000"]);
});

for (const [rotulo, hhmmss] of [["Manhã (08:00)", "080000"], ["Almoço (12:30)", "123000"], ["Noite (20:00)", "200000"]]) {
  test(`Ato 1: escolher "${rotulo}" muda o DTSTART da revisão semanal e do continuar`, async () => {
    const a = abrir();
    await ateOCheckpoint(a);
    clicar(a.p, rotulo);
    assert.deepEqual(marcadas(a.p), [rotulo]);
    const texto = baixar(a.env, a.p, ICS).texto.replace(/\r\n /g, "");
    assert.deepEqual(horas(texto), [hhmmss, hhmmss]);
    assert.ok(texto.includes("DTSTART:20261127T" + hhmmss), "a revisão semanal, 7 dias depois");
    assert.ok(texto.includes("DTSTART:20261121T" + hhmmss), "o continuar, no dia seguinte");
    assert.ok(texto.includes("RRULE:FREQ=WEEKLY;COUNT=13"));
  });
}

test("a escolha não aparece em endereço nem no .ics além da hora, e escolher não guarda nada", async () => {
  const a = abrir();
  await ateOCheckpoint(a);
  const padrao = baixar(a.env, a.p, ICS).texto;
  clicar(a.p, "Manhã (08:00)");
  const texto = baixar(a.env, a.p, ICS).texto;
  const semHora = (t) => t.replace(/T\d{6}\r\n/g, "T\r\n").replace(/DTSTAMP:\S+/g, "");
  assert.equal(semHora(texto), semHora(padrao), "só a hora muda");
  assert.ok(!/Manhã|Almoço|Noite|Hora dos lembretes/.test(texto));
  texto.split("\r\n").filter((l) => /^URL:/.test(l)).forEach((l) => assert.ok(!/[?]|08|manha|hora/i.test(l.replace("https://dlt.academy/protocolos/teto-financeiro/", "")), l));
  assert.equal(a.env.janela.location.hash, "");
  assert.deepEqual(a.env.chamadasReplaceState.filter((args) => JSON.stringify(args).includes("08:00") || /manha|hora/i.test(JSON.stringify(args))), []);
  a.p.todos().filter((e) => e.tagName === "A").forEach((e) => assert.ok(!/08|manha|hora/i.test(e.getAttribute("href") || "")));
  assert.deepEqual([Object.keys(a.env.armazenamento), JSON.stringify(a.env.sessao).includes("08:00")], [[], false], "nada guardado só por escolher");
});

test("Ato 1: pausar guarda a hora escolhida; sem escolha o lembrete fica nulo", async () => {
  const com = abrir();
  await ateOCheckpoint(com);
  clicar(com.p, "Almoço (12:30)");
  clicar(com.p, "Salvar e continuar depois");
  assert.equal(lerLocal(com.env).lembrete, "12:30");

  const sem = abrir();
  await ateOCheckpoint(sem);
  clicar(sem.p, "Salvar e continuar depois");
  assert.equal(lerLocal(sem.env).lembrete, null);
});

test("resultado final: a escolha do Ato 1 segue marcada, só guardar a leva ao estado e o .ics sai na hora", async () => {
  const a = abrir();
  await jogarCaso(a, "A", {});
  assert.deepEqual(botoesDeHora(a.p).map((b) => b.textContent), ROTULOS);
  assert.deepEqual(marcadas(a.p), ["Noite (20:00)"]);
  clicar(a.p, "Manhã (08:00)");
  assert.equal(a.env.armazenamento[CHAVE], undefined, "escolher não guarda");
  const texto = baixar(a.env, a.p, ICS).texto;
  assert.ok(horas(texto).length >= 4, "retornos e revisão semanal");
  horas(texto).forEach((h) => assert.equal(h, "080000"));
  assert.equal(a.env.armazenamento[CHAVE], undefined, "baixar também não guarda");
  clicar(a.p, "Guardar neste aparelho para os retornos");
  assert.equal(lerLocal(a.env).lembrete, "08:00");
});

test("resultado final sem escolha: 20:00 e o estado guardado fica com lembrete nulo", async () => {
  const a = abrir();
  await jogarCaso(a, "A", {});
  horas(baixar(a.env, a.p, ICS).texto).forEach((h) => assert.equal(h, "200000"));
  clicar(a.p, "Guardar neste aparelho para os retornos");
  assert.equal(lerLocal(a.env).lembrete, null);
});

test("o `lembrete` guardado volta às regras e os eventos saem na hora guardada", async () => {
  const a = abrir();
  await jogarCaso(a, "A", {});
  clicar(a.p, "Manhã (08:00)");
  clicar(a.p, "Guardar neste aparelho para os retornos");
  const estado = lerLocal(a.env);
  assert.equal(estado.lembrete, "08:00");
  const ctx = { ciclo: estado.ciclo, hoje: "2026-11-20", pagina: "https://dlt.academy/protocolos/teto-financeiro/", lembrete: estado.lembrete };
  R.montarParcial(clone(CASOS.A), ctx, bib).ics.eventos.forEach((e) => assert.equal(e.hora, "08:00"));
});

for (const letra of ["D", "E", "F"]) {
  test(`caso ${letra}: sem .ics e sem escolha de hora`, async () => {
    const a = abrir();
    await percorrer({ mount: a.env.mount, passos: a.PROTOCOL.steps, kit, respostas: clone(CASOS[letra]), seguir: true, esperar: async () => a.env.rodarTimers() });
    assert.equal(a.p.botaoPor(ICS), null);
    assert.equal(botoesDeHora(a.p).length, 0);
    assert.equal(a.p.porClasse("protocol-ics-hora").length, 0);
    assert.deepEqual([Object.keys(a.env.armazenamento), Object.keys(a.env.sessao)], [[], []]);
  });
}

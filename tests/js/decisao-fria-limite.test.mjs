import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { criarAmbiente, piloto } from "./fake-dom.mjs";

function preparar() {
  const env = criarAmbiente();
  env.carregar("js/paid-reports.js");
  env.carregar("js/protocol-engine.js");
  env.carregar("protocolos/decisao-fria/js/protocol.js");
  return env;
}

class JsPdfFalso {
  constructor() {
    this.textos = [];
    this.retangulos = 0;
    this.salvo = null;
    this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
  }
  setProperties() {}
  addImage() {}
  setDrawColor() {}
  setFillColor() {}
  setLineWidth() {}
  setFont() {}
  setFontSize() {}
  setTextColor() {}
  line() {}
  roundedRect() { this.retangulos += 1; }
  addPage() {}
  getNumberOfPages() { return 1; }
  setPage() {}
  splitTextToSize(t) { return [String(t)]; }
  text(t) { this.textos.push(String(t)); }
  save(nome) { this.salvo = nome; }
}

describe("Decisão Fria — versão básica (cálculo em reais + painel visual + limpeza cripto)", () => {
  it("calcula quanto cabe em reais (70%), barra excesso no veredito e gera SVG + PDF", () => {
    const env = preparar();
    const p = piloto(env);
    // Caminho frio sem alertas: compra(0), numeros(0), semana(2), tese, contra, nada(0)
    p.escolher(0);
    p.escolher(0);
    p.escolher(2);
    p.escrever("Empresa com margem crescente e caixa liquido.");
    p.escrever("Crescimento pode ja estar precificado.");
    p.escolher(0);

    // Passo 7: preencher valor_planejado = 5000 e perda_aceitavel = 1500 (limite = 2142 -> passa!)
    const inputs = p.porClasse("protocol-num-input");
    assert.equal(inputs.length, 2);
    inputs[0].value = "5000";
    inputs[0].dispararEvento("input");
    inputs[1].value = "1500";
    inputs[1].dispararEvento("input");

    const preview = p.porClasse("protocol-num-preview")[0];
    assert.equal(preview.hidden, false);
    assert.match(preview.textContent, /R\$ 2\.142/);
    assert.match(preview.textContent, /passam R\$ 2\.858/);

    p.escrever("Limite R$ 2.100, saio se cair 25%, reviso em 30 dias.");

    assert.equal(p.noResultado(), true);
    // Mesmo sem alertas de escolha, o excesso em reais transforma em AJUSTE (ramo 5), nunca SIGA
    assert.match(p.porClasse("protocol-verdict")[0].textContent, /Quase lá/);
    const graf = p.porClasse("protocol-df-graf")[0];
    assert.ok(graf, "Deve renderizar o painel visual SVG do limite");
    assert.match(graf.className, /protocol-df-limite/);
    const svg = p.porClasse("protocol-df-svg")[0];
    assert.equal(svg.getAttribute("role"), "img");

    // Baixar Markdown inclui os valores calculados
    const antes = env.baixados.length;
    p.botaoPor("Baixar como texto (.md)").click();
    const md = env.baixados[antes].texto;
    assert.match(md, /R\$ 2\.142/);
    assert.match(md, /R\$ 5\.000/);

    // PDF vetorial funciona mesmo sem doc.rect (JsPdfFalso)
    let pdfGerado = null;
    env.rodar("window").jspdf = {
      jsPDF: class extends JsPdfFalso {
        constructor() { super(); pdfGerado = this; }
      },
    };
    const proto = env.rodar("PROTOCOL");
    const result = proto.result({
      intencao: "compra", intencao__label: "Compra",
      base: "numeros", base__label: "Números",
      relogio: "semana", relogio__label: "1 semana",
      tese: "Tese real", contra: "Contra real",
      impacto: "nada", impacto__label: "Nada",
      valor_planejado: "5000", perda_aceitavel: "1500",
      travas: "Minhas travas",
    });
    env.rodar("downloadProtocolPdf")(proto, result, { dataUrl: "data:image/png;base64,AA==", width: 100, height: 30 });
    assert.ok(pdfGerado);
    assert.equal(pdfGerado.salvo, "decisao-fria-resultado.pdf");
    assert.ok(pdfGerado.textos.some((t) => t.includes("R$ 2.142")));
    assert.ok(pdfGerado.retangulos >= 8);
  });

  it("usa queda de 100% para alavancagem e mantém painel de sinais quando números ficam em branco", () => {
    const env = preparar();
    const p = piloto(env);
    // alavancar(2), numeros(0), semana(2), tese, contra, nada(0)
    p.escolher(2);
    p.escolher(0);
    p.escolher(2);
    p.escrever("Hedge de carteira");
    p.escrever("Pode zerar a garantia");
    p.escolher(0);

    const inputs = p.porClasse("protocol-num-input");
    inputs[0].value = "3000";
    inputs[1].value = "1000";
    inputs[1].dispararEvento("input");
    const preview = p.porClasse("protocol-num-preview")[0];
    assert.match(preview.textContent, /queda de 100%/);
    assert.match(preview.textContent, /R\$ 1\.000/);

    // Sem números: gera painel de sinais (modo sinais)
    inputs[0].value = "";
    inputs[1].value = "";
    p.escrever("Travas escritas");
    assert.equal(p.noResultado(), true);
    const graf = p.porClasse("protocol-df-graf")[0];
    assert.ok(graf);
    assert.match(graf.className, /protocol-df-sinais/);
  });

  it("ramo de vulnerabilidade não cita cripto e aponta para o protocolo do Teto Financeiro", () => {
    const env = preparar();
    const proto = env.rodar("PROTOCOL");
    const res = proto.result({
      intencao: "compra", intencao__label: "Compra",
      base: "numeros", base__label: "Números",
      relogio: "semana", relogio__label: "1 semana",
      tese: "Tese", contra: "Contra",
      impacto: "compromete", impacto__label: "Compromete",
      travas: "Travas",
    });
    assert.equal(res.relatorio, undefined);
    assert.equal(res.cta.href, "/protocolos/teto-financeiro/");
    assert.doesNotMatch(JSON.stringify(res), /cripto/i);
  });
});

(function () {
  "use strict";

  var root = document.querySelector("[data-china-calculator]");
  var Model = window.DLTChinaModel;
  if (!root || !Model) return;

  // Tarifas vêm do HTML (data-*), datadas em data-verified-at. A fórmula está em china-model.js.
  function attr(name, fallback) {
    var value = Number(root.getAttribute("data-" + name));
    return Number.isFinite(value) ? value : fallback;
  }
  function list(name, fallback) {
    var values = (root.getAttribute("data-" + name) || fallback).split(",").map(Number);
    return values.every(Number.isFinite) ? values : fallback.split(",").map(Number);
  }

  var P = {
    iof: attr("iof", 3.5) / 100,
    pix: attr("etherfi-pix", 0.5) / 100,
    pixFlat: attr("etherfi-pix-flat", 0.1),
    tier1: attr("etherfi-tier1", 2000),
    tier2: attr("etherfi-tier2", 3000),
    rates: list("etherfi-rates", "3,1,0.5").map(function (v) { return v / 100; }),
    luxePoints: attr("etherfi-luxe-points", 5000),
    luxeCaps: list("etherfi-luxe-caps", "10000,20000"),
    luxeFxMax: attr("etherfi-luxe-fx-max", 1.25) / 100,
    pinnaclePoints: attr("etherfi-pinnacle-points", 25000),
    pinnacleCaps: list("etherfi-pinnacle-caps", "50000,80000"),
    pinnacleFxMax: attr("etherfi-pinnacle-fx-max", 1) / 100,
    arqFunding: attr("arq-funding", 0.5) / 100,
    revolutQuota: attr("revolut-quota", 1000),
    revolutFee: attr("revolut-fee", 1.4) / 100,
    alipayFee: attr("alipay-fee", 3) / 100,
    walletFree: attr("wallet-free", 200),
  };

  var labels = {
    etherfi: "ether.fi Cash",
    arq: "ARQ Global",
    revolut: "Revolut",
    wise: "Wise",
    nomad: "Nomad",
    bank: "cartão de banco",
  };
  var levelLabel = { core: "Core", luxe: "Luxe", pinnacle: "Pinnacle" };

  function $(id) { return root.querySelector("#" + id); }
  var inputs = {
    reservas: $("china-reservas"),
    diario: $("china-diario"),
    qrAlto: $("china-qr-alto"),
    conta: $("china-conta"),
    etherfiLevel: $("china-etherfi-level"),
    etherfiPrior: $("china-etherfi-prior"),
    revolutUsed: $("china-revolut-used"),
    usdbrl: $("china-usdbrl"),
    usdcny: $("china-usdcny"),
    etherfiFx: $("china-etherfi-fx"),
    arqFx: $("china-arq-fx"),
    wiseFee: $("china-wise-fee"),
    nomadConv: $("china-nomad-conv"),
    bankSpread: $("china-bank-spread"),
  };

  var rows = {};
  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    rows[row.getAttribute("data-calc-row")] = {
      root: row,
      fill: row.querySelector(".calc-track .range-fill"),
      zero: row.querySelector(".calc-track .range-zero"),
      total: row.querySelector("[data-calc-total]"),
      detail: row.querySelector("[data-calc-detail]"),
    };
  });
  var verdict = root.querySelector("[data-calc-verdict]");
  var summary = root.querySelector("[data-china-base]");
  var billOut = root.querySelector("[data-china-bill]");
  var cta = root.querySelector("[data-china-cta]");
  var ctaNote = root.querySelector("[data-china-cta-note]");
  // O botão aponta para o cartão mais barato que tem link de indicação. O link vem do
  // nome do cartão na própria linha, então só existe um lugar para trocar cada link.
  var ctaLabels = {
    etherfi: "Pedir o ether.fi Cash pelo navegador →",
    arq: "Abrir conta no ARQ →",
    revolut: "Abrir conta na Revolut →",
    wise: "Abrir conta na Wise →",
  };

  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var yuan = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  function num(input, fallback) {
    var value = Number(input && String(input.value).replace(",", "."));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
  function pct(value) {
    var text = Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
    return (value < -0.005 ? "−" : "+") + text;
  }
  // Barras numa escala só, com o zero marcado: cada barra sai da linha do zero até o valor
  // (para a esquerda quando o cashback passa do custo). Só apresentação; os números vêm do modelo.
  // Verde = mais barato (ou valor negativo), vermelho = mais caro, cinza = os demais.
  function paintBars(rows, values, best, worst) {
    var keys = Object.keys(values);
    var nums = keys.map(function (key) { return values[key]; });
    var low = Math.min.apply(null, nums.concat(0));
    var span = (Math.max.apply(null, nums.concat(0)) - low) || 1;
    var zero = (0 - low) / span * 100;
    keys.forEach(function (key) {
      var entry = rows[key];
      var value = values[key];
      var width = value === 0 ? 0 : Math.max(Math.abs(value) / span * 100, 1.5);
      entry.fill.style.left = ((Math.min(value, 0) - low) / span * 100) + "%";
      entry.fill.style.width = width + "%";
      entry.zero.style.left = zero + "%";
      var grade = key === best || value < 0 ? "1" : (key === worst && value > values[best] ? "4" : "");
      if (grade) entry.root.setAttribute("data-grade", grade);
      else entry.root.removeAttribute("data-grade");
    });
  }

  function money(value) { return (value < 0 ? "−" : "") + brl.format(Math.abs(value)); }

  function options() {
    return {
      reservas: num(inputs.reservas, 0),
      diario: num(inputs.diario, 0),
      qrAlto: num(inputs.qrAlto, 0),
      usdbrl: num(inputs.usdbrl, 0) || 5.1681,
      usdcny: num(inputs.usdcny, 0) || 6.7053,
      etherfiLevel: inputs.etherfiLevel ? inputs.etherfiLevel.value : "core",
      etherfiPrior: num(inputs.etherfiPrior, 0),
      revolutUsed: Math.min(num(inputs.revolutUsed, 0), P.revolutQuota),
      etherfiFx: num(inputs.etherfiFx, 1.29) / 100,
      arqFx: num(inputs.arqFx, 0) / 100,
      wiseFee: num(inputs.wiseFee, 0.67) / 100,
      nomadConv: num(inputs.nomadConv, 2) / 100,
      bankSpread: num(inputs.bankSpread, 4) / 100,
    };
  }

  // Sem gasto não há simulação: apaga totais, barras e a economia da rodada
  // anterior, para a tela não mostrar números de uma conta que já não vale.
  function clearTrip() {
    Object.keys(rows).forEach(function (key) {
      var row = rows[key];
      row.total.textContent = "—";
      row.detail.textContent = "";
      row.fill.style.width = "0%";
      row.root.removeAttribute("data-grade");
      row.root.classList.remove("is-best");
    });
    if (ctaNote) ctaNote.textContent = "";
  }

  function renderTrip(o) {
    var m = Model.cost(o, P);
    if (m.spend <= 0) {
      summary.textContent = "Coloque quanto pretende gastar em pelo menos um dos três tipos de gasto.";
      verdict.textContent = "";
      clearTrip();
      return;
    }
    var feeText = m.walletFee > 0
      ? " Os ¥" + yuan.format(o.qrAlto) + " pagos no QR acima de ¥200 somam ¥" + yuan.format(m.walletFee) + " de taxa da carteira, em qualquer cartão."
      : " Nada passa de ¥200 no QR, então a taxa da carteira não entra.";
    summary.textContent = "¥" + yuan.format(m.spend) + " custam " + brl.format(m.base) + " no câmbio comercial." + feeText;

    var best = m.cards[m.ranking[0]];
    var pcts = {};
    m.ranking.forEach(function (key, rank) {
      var card = m.cards[key];
      var row = rows[key];
      if (!row) return;
      row.root.style.order = String(rank);
      row.total.textContent = brl.format(card.total) + " · " + pct(card.pct);
      var parts = card.parts.filter(function (part) { return Math.abs(part[1]) >= 0.005; })
        .map(function (part) { return part[0] + " " + money(part[1]); });
      if (key === "etherfi" && card.level !== o.etherfiLevel) parts.push("sobe para " + levelLabel[card.level] + " durante a viagem");
      row.detail.textContent = parts.join(" · ") || "sem custo além do câmbio comercial";
      pcts[key] = card.pct;
      row.root.classList.toggle("is-best", rank === 0);
    });
    // Barras pelo custo sobre o câmbio comercial (a mesma % do texto), com o zero marcado.
    paintBars(rows, pcts, m.ranking[0], m.ranking[m.ranking.length - 1]);

    if (cta) {
      var pick = m.ranking.filter(function (key) {
        return ctaLabels[key] && rows[key] && rows[key].root.querySelector(".calc-name a");
      })[0];
      if (pick) {
        cta.href = rows[pick].root.querySelector(".calc-name a").href;
        cta.textContent = ctaLabels[pick];
        if (ctaNote) {
          var saving = m.cards.bank.total - m.cards[pick].total;
          ctaNote.textContent = (pick === m.ranking[0] ? "É o mais barato nesta simulação: " : "É o mais barato com link de indicação: ") +
            brl.format(saving) + " a menos que um cartão de banco." +
            (pick === "etherfi" ? " Cadastre o e-mail no link, pelo navegador, antes de baixar o app." : "");
        }
      }
    }

    var second = m.cards[m.ranking[1]];
    verdict.textContent = labels[m.ranking[0]] + " sai mais barato: " + brl.format(best.total) + ", " +
      brl.format(second.total - best.total) + " a menos que " + labels[m.ranking[1]] + " e " +
      brl.format(m.cards.bank.total - best.total) + " a menos que um cartão de banco." +
      (m.walletFee > 0 ? " Se as contas acima de ¥200 forem no cartão direto, você ainda deixa de pagar ¥" + yuan.format(m.walletFee) + "." : "");
  }

  function renderBill(o) {
    if (!billOut || !inputs.conta) return;
    var value = num(inputs.conta, 0);
    if (value <= 0) { billOut.textContent = "Digite o valor da conta."; return; }
    var b = Model.bill(value, P);
    if (!b.overLimit) {
      billOut.textContent = "Pague no QR do Alipay: até ¥" + yuan.format(P.walletFree) + " não tem taxa.";
      return;
    }
    var feeBrl = b.fee / o.usdcny * o.usdbrl;
    billOut.textContent = "No QR, a carteira cobra ¥" + yuan.format(b.fee) + " (cerca de " + brl.format(feeBrl) +
      "): 3% sobre os ¥" + yuan.format(value) + " inteiros. Se o lugar tem maquininha, passe o cartão direto e não paga nada. " +
      "Não divida a mesma conta em vários QRs seguidos: o antifraude pode travar a carteira. Compras diferentes, pague separado.";
  }

  function render() {
    var o = options();
    renderTrip(o);
    renderBill(o);
  }

  Object.keys(inputs).forEach(function (key) {
    if (!inputs[key]) return;
    inputs[key].addEventListener("input", render);
    inputs[key].addEventListener("change", render);
  });
  render();
})();

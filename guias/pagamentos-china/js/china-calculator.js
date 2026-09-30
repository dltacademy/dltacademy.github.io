(function () {
  "use strict";

  var root = document.querySelector("[data-china-calculator]");
  if (!root) return;

  // Tarifas vêm do HTML (data-*), datadas em data-verified-at. Aqui fica só a fórmula.
  function attr(name, fallback) {
    var value = Number(root.getAttribute("data-" + name));
    return Number.isFinite(value) ? value : fallback;
  }

  var P = {
    iof: attr("iof", 3.5) / 100,
    pix: attr("etherfi-pix", 0.5) / 100,
    pixFlat: attr("etherfi-pix-flat", 0.1),
    tier1: attr("etherfi-tier1", 2000),
    tier2: attr("etherfi-tier2", 3000),
    rates: (root.getAttribute("data-etherfi-rates") || "3,1,0.5").split(",").map(function (v) { return Number(v) / 100; }),
    arqFunding: attr("arq-funding", 0.5) / 100,
    revolutQuota: attr("revolut-quota", 1000),
    revolutFee: attr("revolut-fee", 1.4) / 100,
    alipayFee: attr("alipay-fee", 3) / 100,
  };

  var labels = {
    etherfi: "ether.fi Cash",
    arq: "ARQ Global",
    revolut: "Revolut Standard",
    wise: "Wise",
    nomad: "Nomad",
    bank: "cartão de banco",
  };

  function $(id) { return root.querySelector("#" + id); }

  var inputs = {
    spend: $("china-spend"),
    walletOver: $("china-wallet-over"),
    etherfiPrior: $("china-etherfi-prior"),
    revolutUsed: $("china-revolut-used"),
    nomadConv: $("china-nomad-conv"),
    bankSpread: $("china-bank-spread"),
    etherfiFx: $("china-etherfi-fx"),
    arqFx: $("china-arq-fx"),
    wiseFee: $("china-wise-fee"),
    usdbrl: $("china-usdbrl"),
    usdcny: $("china-usdcny"),
  };

  var outputs = {};
  Object.keys(inputs).forEach(function (key) {
    var input = inputs[key];
    outputs[key] = input ? root.querySelector('output[for="' + input.id + '"]') : null;
  });

  var rows = {};
  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    rows[row.getAttribute("data-calc-row")] = {
      root: row,
      track: row.querySelector(".calc-track > span"),
      total: row.querySelector("[data-calc-total]"),
      detail: row.querySelector("[data-calc-detail]"),
    };
  });
  var verdict = root.querySelector("[data-calc-verdict]");
  var baseLine = root.querySelector("[data-china-base]");

  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

  function pct(value, signed) {
    var text = Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
    if (!signed) return text;
    return (value < -0.005 ? "−" : "+") + text;
  }

  function num(input, fallback, min) {
    var value = Number(input && String(input.value).replace(",", "."));
    if (!Number.isFinite(value)) return fallback;
    return typeof min === "number" && value < min ? fallback : value;
  }

  function model(o) {
    var cny = o.spend + o.walletOver * P.alipayFee;
    var usdMid = cny / o.usdcny;
    var base = usdMid * o.usdbrl;
    var result = {};

    // ether.fi: PIX → USDC (0,5% + R$ 0,10), câmbio medido, cashback por faixa no mês.
    var efUsd = usdMid * (1 + o.etherfiFx);
    var efFx = (efUsd - usdMid) * o.usdbrl;
    var efFund = efUsd * o.usdbrl * P.pix + P.pixFlat;
    var remaining = efUsd;
    var spent = o.etherfiPrior;
    var cashbackUsd = 0;
    [[P.tier1, P.rates[0]], [P.tier2, P.rates[1]], [Infinity, P.rates[2]]].forEach(function (tier) {
      var take = Math.max(0, Math.min(remaining, tier[0] - spent));
      cashbackUsd += take * tier[1];
      remaining -= take;
      spent += take;
    });
    var efCashback = cashbackUsd * o.usdbrl;
    result.etherfi = {
      total: base + efFx + efFund - efCashback,
      parts: [["formar o saldo", efFund], ["IOF", 0, "zero"], ["câmbio", efFx], ["cashback", -efCashback]],
    };

    // ARQ Global: reais → USDc (0,5%), câmbio da bandeira.
    var arqUsd = usdMid * (1 + o.arqFx);
    var arqFx = (arqUsd - usdMid) * o.usdbrl;
    var arqFund = arqUsd * o.usdbrl * P.arqFunding;
    result.arq = {
      total: base + arqFx + arqFund,
      parts: [["formar o saldo", arqFund], ["IOF", 0, "zero"], ["câmbio", arqFx]],
    };

    // Revolut Standard: cota mensal sem tarifa e sem IOF; acima, tarifa + IOF.
    var free = Math.max(0, Math.min(base, P.revolutQuota - o.revolutUsed));
    var over = base - free;
    var rvFee = over * P.revolutFee;
    var rvIof = (over + rvFee) * P.iof;
    result.revolut = {
      total: base + rvFee + rvIof,
      parts: [["convertidos na cota, sem tarifa e sem IOF", free, "info"], ["tarifa fora da cota", rvFee], ["IOF fora da cota", rvIof]],
    };

    // Wise: reais → yuan antes; IOF e tarifa sobre o valor convertido.
    var wsIof = base * P.iof;
    var wsFee = base * o.wiseFee;
    result.wise = {
      total: base + wsIof + wsFee,
      parts: [["tarifa", wsFee], ["IOF", wsIof]],
    };

    // Nomad: reais → dólar (conversão do nível + IOF), dólar → yuan pela Visa sem margem.
    var nmConv = base * o.nomadConv;
    var nmIof = (base + nmConv) * P.iof;
    result.nomad = {
      total: base + nmConv + nmIof,
      parts: [["conversão", nmConv], ["IOF", nmIof]],
    };

    // Cartão de banco: spread + IOF sobre a fatura.
    var bkSpread = base * o.bankSpread;
    var bkIof = (base + bkSpread) * P.iof;
    result.bank = {
      total: base + bkSpread + bkIof,
      parts: [["spread", bkSpread], ["IOF", bkIof]],
    };

    return { base: base, cny: cny, cards: result };
  }

  function render() {
    var usdbrl = num(inputs.usdbrl, 5.1681, 0.5);
    var usdcny = num(inputs.usdcny, 6.7053, 0.5);
    var spend = Math.max(num(inputs.spend, 5000, 0), 0);
    var walletOver = Math.min(Math.max(num(inputs.walletOver, 0, 0), 0), spend);
    if (inputs.walletOver && Number(inputs.walletOver.value) > spend) inputs.walletOver.value = String(walletOver);

    var o = {
      spend: spend,
      walletOver: walletOver,
      etherfiPrior: num(inputs.etherfiPrior, 0, 0),
      revolutUsed: num(inputs.revolutUsed, 0, 0),
      nomadConv: num(inputs.nomadConv, 2, 0) / 100,
      bankSpread: num(inputs.bankSpread, 4, 0) / 100,
      etherfiFx: num(inputs.etherfiFx, 1.29, 0) / 100,
      arqFx: num(inputs.arqFx, 0, 0) / 100,
      wiseFee: num(inputs.wiseFee, 0.67, 0) / 100,
      usdbrl: usdbrl,
      usdcny: usdcny,
    };

    if (outputs.spend) outputs.spend.textContent = "¥" + int.format(spend);
    if (outputs.walletOver) outputs.walletOver.textContent = "¥" + int.format(walletOver);
    if (outputs.etherfiPrior) outputs.etherfiPrior.textContent = "US$ " + int.format(o.etherfiPrior);
    if (outputs.revolutUsed) outputs.revolutUsed.textContent = "R$ " + int.format(o.revolutUsed);
    if (outputs.nomadConv) outputs.nomadConv.textContent = pct(o.nomadConv * 100);
    if (outputs.bankSpread) outputs.bankSpread.textContent = pct(o.bankSpread * 100);
    if (outputs.etherfiFx) outputs.etherfiFx.textContent = pct(o.etherfiFx * 100);
    if (outputs.arqFx) outputs.arqFx.textContent = pct(o.arqFx * 100);
    if (outputs.wiseFee) outputs.wiseFee.textContent = pct(o.wiseFee * 100);
    if (outputs.usdbrl) outputs.usdbrl.textContent = "R$ " + usdbrl.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    if (outputs.usdcny) outputs.usdcny.textContent = "¥" + usdcny.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    var m = model(o);
    var keys = Object.keys(m.cards);
    var sorted = keys.slice().sort(function (a, b) { return m.cards[a].total - m.cards[b].total; });
    var best = sorted[0];

    if (baseLine) {
      var extra = walletOver > 0 ? " (inclui ¥" + int.format(walletOver * P.alipayFee) + " de taxa da carteira)" : "";
      baseLine.textContent = "No câmbio comercial, ¥" + int.format(m.cny) + extra + " saem por " + brl.format(m.base) + ".";
    }

    keys.forEach(function (key) {
      var card = m.cards[key];
      var row = rows[key];
      if (!row) return;
      var diff = (card.total / m.base - 1) * 100;
      var rank = sorted.indexOf(key);
      row.root.style.order = String(rank);
      row.total.textContent = (rank + 1) + "º · " + brl.format(card.total) + " · " + pct(diff, true);
      row.detail.textContent = card.parts.filter(function (part) {
        return Math.abs(part[1]) >= 0.005 || part[2] === "zero";
      }).map(function (part) {
        if (part[2] === "info") return brl.format(part[1]) + " " + part[0];
        if (part[2] === "zero") return part[0] + " " + brl.format(0);
        return part[0] + " " + (part[1] < 0 ? "−" : "") + brl.format(Math.abs(part[1]));
      }).join(" · ") || "sem custo além do câmbio comercial";
      // A barra mostra quanto cada um custa acima do mais barato.
      var span = m.cards[sorted[sorted.length - 1]].total - m.cards[best].total;
      row.track.style.width = (span > 0 ? Math.max(((card.total - m.cards[best].total) / span) * 100, 3) : 3) + "%";
      row.root.classList.toggle("is-best", key === best);
      row.track.classList.toggle("is-best", key === best);
    });

    var second = sorted[1];
    var gap = m.cards[second].total - m.cards[best].total;
    var worst = sorted[sorted.length - 1];
    verdict.textContent = gap < 0.01
      ? "Empate entre " + labels[best] + " e " + labels[second] + " nesse cenário."
      : labels[best] + " sai mais barato: " + brl.format(m.cards[best].total) + ", " + brl.format(gap) + " a menos que " + labels[second] + " e " + brl.format(m.cards[worst].total - m.cards[best].total) + " a menos que " + labels[worst] + ".";
  }

  var presets = Array.prototype.slice.call(root.querySelectorAll("[data-china-preset]"));
  function syncPresets() {
    presets.forEach(function (button) {
      button.setAttribute("aria-pressed", String(inputs.spend && button.getAttribute("data-china-preset") === inputs.spend.value));
    });
  }
  presets.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!inputs.spend) return;
      inputs.spend.value = button.getAttribute("data-china-preset");
      render();
      syncPresets();
    });
  });

  Object.keys(inputs).forEach(function (key) {
    if (inputs[key]) inputs[key].addEventListener("input", function () { render(); syncPresets(); });
  });
  syncPresets();

  render();
})();

(function () {
  "use strict";

  var root = document.querySelector("[data-usd100-calculator]");
  if (!root) return;

  var planLabels = {
    binance: "Binance",
    etherfi: "ether.fi direto",
    wise: "Wise",
    cartao: "cartão brasileiro",
  };

  var planArticles = {
    binance: "a Binance",
    etherfi: "o ether.fi direto",
    wise: "a Wise",
    cartao: "o cartão brasileiro",
  };

  var valueInput = root.querySelector("#usd100-value");
  var rateInput = root.querySelector("#usd100-rate");
  var etherfiFeeInput = root.querySelector("#usd100-etherfi-fee");
  var wiseFeeInput = root.querySelector("#usd100-wise-fee");
  var cardSpreadInput = root.querySelector("#usd100-card-spread");
  var cashbackInput = root.querySelector("#usd100-cashback");

  var valueOutput = root.querySelector("#usd100-value-output");
  var rateOutput = root.querySelector("#usd100-rate-output");
  var etherfiFeeOutput = root.querySelector("#usd100-etherfi-fee-output");
  var wiseFeeOutput = root.querySelector("#usd100-wise-fee-output");
  var cardSpreadOutput = root.querySelector("#usd100-card-spread-output");
  var cashbackOutput = root.querySelector("#usd100-cashback-output");
  var verdict = root.querySelector("[data-calc-verdict]");
  var rows = {};

  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    var key = row.getAttribute("data-calc-row");
    var output = row.querySelector(".calc-out");
    rows[key] = {
      root: row,
      track: row.querySelector(".calc-track > span"),
      total: output.querySelector("[data-calc-total]"),
      detail: output.querySelector("[data-calc-detail]"),
    };
  });

  var money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function percentage(value) {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + "%";
  }

  function readNumber(input, fallback) {
    var value = Number(input && input.value);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  function costModel(options) {
    var base = options.value * options.rate;
    var etherfiGross = base * (1 + options.etherfiFeePercent / 100);
    var cashback = options.cashbackOn ? etherfiGross * 0.03 : 0;
    var etherfiTotal = etherfiGross - cashback;
    var wiseTotal = base * (1 + options.wiseFeePercent / 100);
    var cardTotal = base * (1 + options.cardSpreadPercent / 100) * 1.035;

    return {
      binance: {
        total: base,
        detail: "cotação de referência " + money.format(base) + " · sem prêmio adicional",
      },
      etherfi: {
        total: etherfiTotal,
        detail: options.cashbackOn
          ? "bruto " + money.format(etherfiGross) + " · cashback " + money.format(cashback) + " · líquido " + money.format(etherfiTotal)
          : "bruto " + money.format(etherfiGross) + " · sem cashback aplicado",
      },
      wise: {
        total: wiseTotal,
        detail: "prêmio " + money.format(wiseTotal - base) + " · IOF e conversão incluídos",
      },
      cartao: {
        total: cardTotal,
        detail: "PTAX " + money.format(options.rate) + " · spread " + percentage(options.cardSpreadPercent) + " · IOF 3,50%",
      },
    };
  }

  function render() {
    var options = {
      value: Math.max(readNumber(valueInput, 100), 0),
      rate: Math.max(readNumber(rateInput, 5.15), 0),
      etherfiFeePercent: readNumber(etherfiFeeInput, 0.59),
      wiseFeePercent: readNumber(wiseFeeInput, 3.52),
      cardSpreadPercent: readNumber(cardSpreadInput, 5),
      cashbackOn: Boolean(cashbackInput && cashbackInput.checked),
    };

    var costs = costModel(options);
    var keys = Object.keys(costs);
    var max = Math.max.apply(null, keys.map(function (key) {
      return costs[key].total;
    }).concat(1));
    var best = keys.reduce(function (current, candidate) {
      return costs[candidate].total < costs[current].total ? candidate : current;
    }, "binance");

    valueOutput.textContent = "US$ " + options.value;
    rateOutput.textContent = money.format(options.rate);
    etherfiFeeOutput.textContent = percentage(options.etherfiFeePercent);
    wiseFeeOutput.textContent = percentage(options.wiseFeePercent);
    cardSpreadOutput.textContent = percentage(options.cardSpreadPercent);
    cashbackOutput.textContent = options.cashbackOn ? "aplicado" : "pausado";

    keys.forEach(function (key) {
      var entry = rows[key];
      entry.total.textContent = money.format(costs[key].total);
      entry.detail.textContent = costs[key].detail;
      entry.track.style.width = Math.max(costs[key].total > 0 ? (costs[key].total / max) * 100 : 0, 1.5) + "%";
      entry.root.classList.toggle("is-best", key === best);
      entry.track.classList.toggle("is-best", key === best);
    });

    var second = keys.filter(function (key) {
      return key !== best;
    }).sort(function (a, b) {
      return costs[a].total - costs[b].total;
    })[0];
    var difference = costs[second].total - costs[best].total;

    verdict.textContent = difference <= 0.01
      ? "Empate nesse cenário. Decida pela aceitação e pela redundância."
      : planLabels[best] + " tem o menor custo estimado: " + money.format(costs[best].total) + ". A diferença para " + planArticles[second] + " é de " + money.format(difference) + ".";
  }

  [
    valueInput,
    rateInput,
    etherfiFeeInput,
    wiseFeeInput,
    cardSpreadInput,
    cashbackInput,
  ].forEach(function (input) {
    if (input) input.addEventListener("input", render);
  });
  if (cashbackInput) cashbackInput.addEventListener("change", render);

  render();
})();

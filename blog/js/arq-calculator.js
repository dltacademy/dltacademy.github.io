(function () {
  "use strict";

  var root = document.querySelector("[data-arq-calculator]");
  if (!root) return;

  var valueInput = root.querySelector("#arq-withdrawal-value");
  var countInput = root.querySelector("#arq-withdrawal-count");
  var iofInput = root.querySelector("#arq-iof-rate");
  var wiseConversionInput = root.querySelector("#arq-wise-conversion-rate");
  var valueOutput = root.querySelector("#arq-withdrawal-value-output");
  var countOutput = root.querySelector("#arq-withdrawal-count-output");
  var iofOutput = root.querySelector("#arq-iof-rate-output");
  var wiseConversionOutput = root.querySelector("#arq-wise-conversion-rate-output");
  var verdict = root.querySelector("[data-calc-verdict]");
  var rows = {};
  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    var output = row.querySelector(".calc-out");
    rows[row.getAttribute("data-calc-row")] = {
      root: row,
      track: row.querySelector(".calc-track > span"),
      output: output,
      total: output.querySelector("[data-calc-total]") || output,
      detail: output.querySelector("[data-calc-detail]"),
    };
  });

  var money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

  function percentage(value) {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  }

  function readPercent(input, fallback) {
    var value = Number(input && input.value);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  function costModel(value, count, iofPercent, wiseConversionPercent) {
    var totalValue = value * count;
    var iofRate = iofPercent / 100;
    var wiseConversionRate = wiseConversionPercent / 100;
    var arqConversion = totalValue * 0.005;
    var arqCard = totalValue * 0.01;
    var wiseConversion = totalValue * wiseConversionRate;
    var wiseIof = totalValue * iofRate;
    var wiseCard = Math.max(count - 1, 0) * 20;
    var revolutIof = totalValue * iofRate;
    var revolutExchange = Math.max(totalValue - 1000, 0) * 0.014;
    var revolutCard = 0;
    var accumulated = 0;

    for (var i = 0; i < count; i += 1) {
      var freeRevolut = i < 5 && accumulated + value <= 1600;
      revolutCard += freeRevolut ? 0 : Math.max(value * 0.02, 6);
      accumulated += value;
    }

    return {
      arq: {
        total: arqConversion + arqCard,
        detail: "conversão + IOF + spread/serviço " + money.format(arqConversion) + " · cartão " + money.format(arqCard),
      },
      wise: {
        total: wiseConversion + wiseIof + wiseCard,
        detail: "conversão " + money.format(wiseConversion) + " · IOF " + money.format(wiseIof) + " · cartão " + money.format(wiseCard),
      },
      revolut: {
        total: revolutIof + revolutExchange + revolutCard,
        detail: "câmbio " + money.format(revolutExchange) + " · IOF " + money.format(revolutIof) + " · cartão " + money.format(revolutCard),
      },
    };
  }

  function render() {
    var value = Math.max(Number(valueInput.value) || 0, 0);
    var count = Math.max(Math.floor(Number(countInput.value) || 1), 1);
    var iofPercent = readPercent(iofInput, 1.1);
    var wiseConversionPercent = readPercent(wiseConversionInput, 0.78);
    var costs = costModel(value, count, iofPercent, wiseConversionPercent);
    var keys = Object.keys(costs);
    var max = Math.max.apply(null, keys.map(function (key) { return costs[key].total; }).concat(1));
    var best = keys.reduce(function (key, candidate) {
      return costs[candidate].total < costs[key].total ? candidate : key;
    }, "arq");

    valueOutput.textContent = money.format(value);
    countOutput.textContent = count + (count === 1 ? " retirada" : " retiradas");
    iofOutput.textContent = percentage(iofPercent);
    wiseConversionOutput.textContent = percentage(wiseConversionPercent);

    keys.forEach(function (key) {
      var entry = rows[key];
      var total = costs[key].total;
      entry.total.textContent = money.format(total);
      entry.detail.textContent = costs[key].detail;
      entry.track.style.width = Math.max(total > 0 ? (total / max) * 100 : 0, 1.5) + "%";
      entry.root.classList.toggle("is-best", key === best);
      entry.track.classList.toggle("is-best", key === best);
    });

    var second = keys.filter(function (key) { return key !== best; })
      .sort(function (a, b) { return costs[a].total - costs[b].total; })[0];
    var difference = costs[second].total - costs[best].total;
    var bestLabel = best === "arq" ? "ARQ" : best === "wise" ? "Wise" : "Revolut Standard";
    verdict.textContent = difference <= 0
      ? "Empate nesse cenário — confira a conveniência e a cotação exibida no app."
      : bestLabel + " tem o menor custo conhecido nesta simulação: " + money.format(costs[best].total) + ". A diferença para o " + (second === "arq" ? "ARQ" : second === "wise" ? "Wise" : "Revolut Standard") + " é de " + money.format(difference) + ". A tarifa variável do ATM e o DCC ficam fora.";
  }

  [valueInput, countInput, iofInput, wiseConversionInput].forEach(function (input) {
    if (input) input.addEventListener("input", render);
  });
  render();
})();

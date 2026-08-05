(function () {
  "use strict";

  var root = document.querySelector("[data-arq-calculator]");
  if (!root) return;

  var valueInput = root.querySelector("#arq-withdrawal-value");
  var countInput = root.querySelector("#arq-withdrawal-count");
  var sourceInput = root.querySelector("#arq-balance-source");
  var arqConversionInput = root.querySelector("#arq-conversion-rate");
  var wiseIofInput = root.querySelector("#arq-wise-iof-rate");
  var wiseConversionInput = root.querySelector("#arq-wise-conversion-rate");
  var revolutIofInput = root.querySelector("#arq-revolut-iof-rate");
  var revolutSpreadInput = root.querySelector("#arq-revolut-spread-rate");
  var atmFeeInput = root.querySelector("#arq-atm-fee");
  var dccInput = root.querySelector("#arq-dcc-rate");

  var valueOutput = root.querySelector("#arq-withdrawal-value-output");
  var countOutput = root.querySelector("#arq-withdrawal-count-output");
  var arqConversionOutput = root.querySelector("#arq-conversion-rate-output");
  var wiseIofOutput = root.querySelector("#arq-wise-iof-rate-output");
  var wiseConversionOutput = root.querySelector("#arq-wise-conversion-rate-output");
  var revolutIofOutput = root.querySelector("#arq-revolut-iof-rate-output");
  var revolutSpreadOutput = root.querySelector("#arq-revolut-spread-rate-output");
  var atmFeeOutput = root.querySelector("#arq-atm-fee-output");
  var dccOutput = root.querySelector("#arq-dcc-rate-output");
  var verdict = root.querySelector("[data-calc-verdict]");
  var rows = {};

  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    var output = row.querySelector(".calc-out");
    rows[row.getAttribute("data-calc-row")] = {
      root: row,
      track: row.querySelector(".calc-track > span"),
      total: output.querySelector("[data-calc-total]"),
      detail: output.querySelector("[data-calc-detail]"),
    };
  });

  var money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
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

  function revolutWithdrawalFee(value, count) {
    var remainingFreeAmount = 1600;
    var fee = 0;

    for (var index = 0; index < count; index += 1) {
      var countExceeded = index >= 5;
      var chargeableAmount = countExceeded
        ? value
        : Math.max(value - remainingFreeAmount, 0);

      if (chargeableAmount > 0) {
        fee += Math.max(chargeableAmount * 0.02, 6);
      }

      remainingFreeAmount = Math.max(remainingFreeAmount - value, 0);
    }

    return fee;
  }

  function costModel(options) {
    var totalValue = options.value * options.count;
    var includeFunding = options.source === "brl";
    var atmTotal = options.atmFee * options.count;
    var dccTotal = totalValue * (options.dccPercent / 100);

    var arqFunding = includeFunding ? totalValue * (options.arqConversionPercent / 100) : 0;
    var arqCard = totalValue * 0.01;

    var wiseConversion = includeFunding ? totalValue * (options.wiseConversionPercent / 100) : 0;
    var wiseIof = includeFunding ? totalValue * (options.wiseIofPercent / 100) : 0;
    var wiseCard = Math.max(options.count - 1, 0) * 20;

    var revolutIof = includeFunding ? totalValue * (options.revolutIofPercent / 100) : 0;
    var revolutExchange = includeFunding ? Math.max(totalValue - 1000, 0) * 0.014 : 0;
    var revolutSpread = includeFunding ? totalValue * (options.revolutSpreadPercent / 100) : 0;
    var revolutCard = revolutWithdrawalFee(options.value, options.count);

    return {
      arq: {
        total: arqFunding + arqCard + atmTotal + dccTotal,
        detail: "saldo " + money.format(arqFunding) + " · cartão " + money.format(arqCard) + " · ATM " + money.format(atmTotal) + " · DCC " + money.format(dccTotal),
      },
      wise: {
        total: wiseConversion + wiseIof + wiseCard + atmTotal + dccTotal,
        detail: "conversão " + money.format(wiseConversion) + " · IOF " + money.format(wiseIof) + " · cartão " + money.format(wiseCard) + " · ATM " + money.format(atmTotal) + " · DCC " + money.format(dccTotal),
      },
      revolut: {
        total: revolutIof + revolutExchange + revolutSpread + revolutCard + atmTotal + dccTotal,
        detail: "IOF " + money.format(revolutIof) + " · tarifa cambial " + money.format(revolutExchange) + " · ajuste " + money.format(revolutSpread) + " · cartão " + money.format(revolutCard) + " · ATM " + money.format(atmTotal) + " · DCC " + money.format(dccTotal),
      },
    };
  }

  function render() {
    var options = {
      value: Math.max(readNumber(valueInput, 500), 0),
      count: Math.max(Math.floor(readNumber(countInput, 2)), 1),
      source: sourceInput && sourceInput.value === "foreign" ? "foreign" : "brl",
      arqConversionPercent: readNumber(arqConversionInput, 0.5),
      wiseIofPercent: readNumber(wiseIofInput, 3.5),
      wiseConversionPercent: readNumber(wiseConversionInput, 0.78),
      revolutIofPercent: readNumber(revolutIofInput, 3.5),
      revolutSpreadPercent: readNumber(revolutSpreadInput, 0),
      atmFee: readNumber(atmFeeInput, 0),
      dccPercent: readNumber(dccInput, 0),
    };

    var costs = costModel(options);
    var keys = Object.keys(costs);
    var max = Math.max.apply(null, keys.map(function (key) {
      return costs[key].total;
    }).concat(1));
    var best = keys.reduce(function (current, candidate) {
      return costs[candidate].total < costs[current].total ? candidate : current;
    }, "arq");

    valueOutput.textContent = money.format(options.value);
    countOutput.textContent = options.count + (options.count === 1 ? " retirada" : " retiradas");
    arqConversionOutput.textContent = percentage(options.arqConversionPercent);
    wiseIofOutput.textContent = percentage(options.wiseIofPercent);
    wiseConversionOutput.textContent = percentage(options.wiseConversionPercent);
    revolutIofOutput.textContent = percentage(options.revolutIofPercent);
    revolutSpreadOutput.textContent = percentage(options.revolutSpreadPercent);
    atmFeeOutput.textContent = money.format(options.atmFee);
    dccOutput.textContent = percentage(options.dccPercent);

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
    var labels = { arq: "ARQ", wise: "Wise", revolut: "Revolut Standard" };
    var sourceLabel = options.source === "brl" ? "partindo de BRL" : "com saldo estrangeiro já formado";

    verdict.textContent = difference <= 0.01
      ? "Empate nesse cenário " + sourceLabel + ". Confira a cotação e a disponibilidade do caixa."
      : labels[best] + " tem o menor custo total estimado " + sourceLabel + ": " + money.format(costs[best].total) + ". A diferença para o " + labels[second] + " é de " + money.format(difference) + ".";
  }

  [
    valueInput,
    countInput,
    sourceInput,
    arqConversionInput,
    wiseIofInput,
    wiseConversionInput,
    revolutIofInput,
    revolutSpreadInput,
    atmFeeInput,
    dccInput,
  ].forEach(function (input) {
    if (input) input.addEventListener("input", render);
    if (input && input.tagName === "SELECT") input.addEventListener("change", render);
  });

  render();
})();

(function () {
  "use strict";

  var root = document.querySelector("[data-arq-calculator]");
  if (!root) return;

  var planLabels = {
    arq: "ARQ Standard Global",
    wise: "Wise padrão gratuito",
    revolut: "Revolut Standard",
  };

  var scopeNote = document.querySelector(".arq-source-note");
  if (scopeNote) {
    scopeNote.textContent = "Escopo: opções básicas gratuitas para clientes brasileiros — ARQ Standard Global, cartão Wise padrão e Revolut Standard. A comparação parte de BRL e termina num saque internacional. O Cartão Local ARQ segue outra regra.";
  }

  var comparisonTitle = document.querySelector("#arq-fees-title");
  if (comparisonTitle) {
    comparisonTitle.textContent = "Custos das opções básicas gratuitas para clientes brasileiros";
    var comparisonTable = comparisonTitle.closest("table");
    var headers = comparisonTable ? comparisonTable.querySelectorAll("thead th") : [];
    if (headers.length >= 4) {
      headers[1].textContent = planLabels.arq;
      headers[2].textContent = planLabels.wise;
      headers[3].textContent = planLabels.revolut;
    }
  }

  var valueInput = root.querySelector("#arq-withdrawal-value");
  var countInput = root.querySelector("#arq-withdrawal-count");
  var arqConversionInput = root.querySelector("#arq-conversion-rate");
  var arqLocalFxInput = root.querySelector("#arq-local-fx-rate");
  var wiseIofInput = root.querySelector("#arq-wise-iof-rate");
  var wiseConversionInput = root.querySelector("#arq-wise-conversion-rate");
  var revolutIofInput = root.querySelector("#arq-revolut-iof-rate");
  var revolutBrlFeeInput = root.querySelector("#arq-revolut-brl-fee-rate");
  var revolutExtraFxInput = root.querySelector("#arq-revolut-extra-fx-rate");
  var revolutSpreadInput = root.querySelector("#arq-revolut-spread-rate");
  var atmFeeInput = root.querySelector("#arq-atm-fee");
  var dccInput = root.querySelector("#arq-dcc-rate");

  var valueOutput = root.querySelector("#arq-withdrawal-value-output");
  var countOutput = root.querySelector("#arq-withdrawal-count-output");
  var arqConversionOutput = root.querySelector("#arq-conversion-rate-output");
  var arqLocalFxOutput = root.querySelector("#arq-local-fx-rate-output");
  var wiseIofOutput = root.querySelector("#arq-wise-iof-rate-output");
  var wiseConversionOutput = root.querySelector("#arq-wise-conversion-rate-output");
  var revolutIofOutput = root.querySelector("#arq-revolut-iof-rate-output");
  var revolutBrlFeeOutput = root.querySelector("#arq-revolut-brl-fee-rate-output");
  var revolutExtraFxOutput = root.querySelector("#arq-revolut-extra-fx-rate-output");
  var revolutSpreadOutput = root.querySelector("#arq-revolut-spread-rate-output");
  var atmFeeOutput = root.querySelector("#arq-atm-fee-output");
  var dccOutput = root.querySelector("#arq-dcc-rate-output");
  var verdict = root.querySelector("[data-calc-verdict]");
  var rows = {};

  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    var key = row.getAttribute("data-calc-row");
    var output = row.querySelector(".calc-out");
    var name = row.querySelector(".calc-name");
    if (name && planLabels[key]) {
      name.textContent = planLabels[key] + " · custo total estimado";
    }
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
    var atmTotal = options.atmFee * options.count;
    var dccTotal = totalValue * (options.dccPercent / 100);

    var arqConversion = totalValue * (options.arqConversionPercent / 100);
    var arqLocalFx = totalValue * (options.arqLocalFxPercent / 100);
    var arqCard = totalValue * 0.01;

    var wiseConversion = totalValue * (options.wiseConversionPercent / 100);
    var wiseIof = totalValue * (options.wiseIofPercent / 100);
    var wiseCard = Math.max(options.count - 1, 0) * 20;

    var revolutIof = totalValue * (options.revolutIofPercent / 100);
    var revolutBrlFee = totalValue * (options.revolutBrlFeePercent / 100);
    var revolutExtraFx = totalValue * (options.revolutExtraFxPercent / 100);
    var revolutSpread = totalValue * (options.revolutSpreadPercent / 100);
    var revolutCard = revolutWithdrawalFee(options.value, options.count);

    return {
      arq: {
        total: arqConversion + arqLocalFx + arqCard + atmTotal + dccTotal,
        detail: "formação do saldo " + money.format(arqConversion) + " · ajuste cambial " + money.format(arqLocalFx) + " · saque " + money.format(arqCard) + " · ATM " + money.format(atmTotal) + " · DCC " + money.format(dccTotal),
      },
      wise: {
        total: wiseConversion + wiseIof + wiseCard + atmTotal + dccTotal,
        detail: "conversão " + money.format(wiseConversion) + " · IOF " + money.format(wiseIof) + " · saque " + money.format(wiseCard) + " · ATM " + money.format(atmTotal) + " · DCC " + money.format(dccTotal),
      },
      revolut: {
        total: revolutIof + revolutBrlFee + revolutExtraFx + revolutSpread + revolutCard + atmTotal + dccTotal,
        detail: "IOF " + money.format(revolutIof) + " · tarifa BRL " + money.format(revolutBrlFee) + " · adicional entre moedas " + money.format(revolutExtraFx) + " · spread " + money.format(revolutSpread) + " · saque " + money.format(revolutCard) + " · ATM " + money.format(atmTotal) + " · DCC " + money.format(dccTotal),
      },
    };
  }

  function render() {
    var options = {
      value: Math.max(readNumber(valueInput, 500), 0),
      count: Math.max(Math.floor(readNumber(countInput, 2)), 1),
      arqConversionPercent: readNumber(arqConversionInput, 0.5),
      arqLocalFxPercent: readNumber(arqLocalFxInput, 0),
      wiseIofPercent: readNumber(wiseIofInput, 3.5),
      wiseConversionPercent: readNumber(wiseConversionInput, 0.78),
      revolutIofPercent: readNumber(revolutIofInput, 3.5),
      revolutBrlFeePercent: readNumber(revolutBrlFeeInput, 0),
      revolutExtraFxPercent: readNumber(revolutExtraFxInput, 0),
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
    arqLocalFxOutput.textContent = percentage(options.arqLocalFxPercent);
    wiseIofOutput.textContent = percentage(options.wiseIofPercent);
    wiseConversionOutput.textContent = percentage(options.wiseConversionPercent);
    revolutIofOutput.textContent = percentage(options.revolutIofPercent);
    revolutBrlFeeOutput.textContent = percentage(options.revolutBrlFeePercent);
    revolutExtraFxOutput.textContent = percentage(options.revolutExtraFxPercent);
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

    verdict.textContent = difference <= 0.01
      ? "Empate nesse cenário. Confira a cotação e a disponibilidade do caixa."
      : planLabels[best] + " tem o menor custo total estimado: " + money.format(costs[best].total) + ". A diferença para o " + planLabels[second] + " é de " + money.format(difference) + ".";
  }

  [
    valueInput,
    countInput,
    arqConversionInput,
    arqLocalFxInput,
    wiseIofInput,
    wiseConversionInput,
    revolutIofInput,
    revolutBrlFeeInput,
    revolutExtraFxInput,
    revolutSpreadInput,
    atmFeeInput,
    dccInput,
  ].forEach(function (input) {
    if (input) input.addEventListener("input", render);
  });

  render();
})();

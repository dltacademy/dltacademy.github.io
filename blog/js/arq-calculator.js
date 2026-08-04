(function () {
  "use strict";

  var root = document.querySelector("[data-arq-calculator]");
  if (!root) return;

  var valueInput = root.querySelector("#arq-withdrawal-value");
  var countInput = root.querySelector("#arq-withdrawal-count");
  var valueOutput = root.querySelector("#arq-withdrawal-value-output");
  var countOutput = root.querySelector("#arq-withdrawal-count-output");
  var verdict = root.querySelector("[data-calc-verdict]");
  var rows = {};
  Array.prototype.forEach.call(root.querySelectorAll("[data-calc-row]"), function (row) {
    rows[row.getAttribute("data-calc-row")] = {
      root: row,
      track: row.querySelector(".calc-track > span"),
      output: row.querySelector(".calc-out"),
    };
  });

  var money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

  function arqCost(value, count) {
    return value * 0.01 * count;
  }

  function wiseCost(count) {
    return Math.max(count - 1, 0) * 20;
  }

  function revolutCost(value, count) {
    var usedValue = 0;
    var cost = 0;
    for (var i = 0; i < count; i += 1) {
      var withinCount = i < 5;
      var withinValue = usedValue + value <= 1600;
      if (withinCount && withinValue) {
        usedValue += value;
        continue;
      }
      cost += Math.max(value * 0.02, 6);
      usedValue += value;
    }
    return cost;
  }

  function render() {
    var value = Number(valueInput.value);
    var count = Number(countInput.value);
    var costs = {
      arq: arqCost(value, count),
      wise: wiseCost(count),
      revolut: revolutCost(value, count),
    };
    var max = Math.max(costs.arq, costs.wise, costs.revolut, 1);
    var best = Object.keys(costs).reduce(function (key, candidate) {
      return costs[candidate] < costs[key] ? candidate : key;
    }, "arq");

    valueOutput.textContent = money.format(value);
    countOutput.textContent = count + (count === 1 ? " retirada" : " retiradas");
    Object.keys(rows).forEach(function (key) {
      var entry = rows[key];
      entry.output.textContent = money.format(costs[key]);
      entry.track.style.width = Math.max(costs[key] > 0 ? (costs[key] / max) * 100 : 0, 1.5) + "%";
      entry.root.classList.toggle("is-best", key === best);
      entry.track.classList.toggle("is-best", key === best);
    });

    var bestLabel = best === "arq" ? "ARQ" : best === "wise" ? "Wise" : "Revolut Standard";
    verdict.textContent = bestLabel + " tem a menor tarifa própria nesta simulação de " + money.format(value) + " por retirada e " + count + (count === 1 ? " retirada" : " retiradas") + ". Ainda confira a tarifa do ATM, câmbio e custo de formar o saldo.";
  }

  valueInput.addEventListener("input", render);
  countInput.addEventListener("input", render);
  render();
})();

/* Fórmula do simulador do guia da China, sem DOM.
   O navegador usa window.DLTChinaModel; os testes usam require() no Node.
   Tarifas chegam de fora (atributos data-* datados no HTML); aqui só a conta. */
(function (root) {
  "use strict";

  var LEVEL_ORDER = ["core", "luxe", "pinnacle"];

  function levels(P) {
    return {
      core: { points: 0, caps: [P.tier1, P.tier2], fxMax: Infinity },
      luxe: { points: P.luxePoints, caps: P.luxeCaps, fxMax: P.luxeFxMax },
      pinnacle: { points: P.pinnaclePoints, caps: P.pinnacleCaps, fxMax: P.pinnacleFxMax },
    };
  }

  // o: { reservas, diario, qrAlto (¥), usdbrl, usdcny, etherfiLevel, etherfiPrior (US$),
  //      revolutUsed (R$), nomadConv, bankSpread, etherfiFx, arqFx, wiseFee (frações) }
  function cost(o, P) {
    var spend = o.reservas + o.diario + o.qrAlto;
    var walletFee = o.qrAlto * P.alipayFee; // 3% só no que passa de ¥200 pela carteira
    var charged = spend + walletFee;
    var base = spend / o.usdcny * o.usdbrl; // a viagem no câmbio comercial, sem taxa nenhuma
    var usdMid = charged / o.usdcny;
    var chargedBrl = usdMid * o.usdbrl;
    var feeBrl = walletFee / o.usdcny * o.usdbrl;
    var cards = {};

    // ether.fi: PIX → USDC, câmbio por nível, cashback por faixa no mês; o nível sobe com os pontos.
    var L = levels(P);
    var start = Math.max(0, LEVEL_ORDER.indexOf(o.etherfiLevel));
    var efCard = 0, cashbackUsd = 0, points = o.etherfiPrior, counter = o.etherfiPrior, levelName = LEVEL_ORDER[start];
    var steps = Math.max(1, Math.min(400, Math.ceil(usdMid / 10)));
    var chunk = usdMid / steps;
    for (var i = 0; i < steps; i += 1) {
      var level = start;
      for (var l = LEVEL_ORDER.length - 1; l > start; l -= 1) {
        if (points >= L[LEVEL_ORDER[l]].points) { level = l; break; }
      }
      var def = L[LEVEL_ORDER[level]];
      levelName = LEVEL_ORDER[level];
      var cardUsd = chunk * (1 + Math.min(o.etherfiFx, def.fxMax));
      var rate = counter < def.caps[0] ? P.rates[0] : counter < def.caps[1] ? P.rates[1] : P.rates[2];
      cashbackUsd += cardUsd * rate;
      counter += cardUsd;
      points += cardUsd;
      efCard += cardUsd;
    }
    var efFx = (efCard - usdMid) * o.usdbrl;
    var efFund = efCard * o.usdbrl * P.pix + (spend > 0 ? P.pixFlat : 0);
    var efCashback = cashbackUsd * o.usdbrl;
    cards.etherfi = {
      total: chargedBrl + efFx + efFund - efCashback,
      parts: [["PIX", efFund], ["câmbio", efFx], ["cashback", -efCashback]],
      level: levelName,
    };

    // ARQ Global: reais → USDc (0,5%), câmbio da Mastercard, sem IOF.
    var arqUsd = usdMid * (1 + o.arqFx);
    var arqFx = (arqUsd - usdMid) * o.usdbrl;
    var arqFund = arqUsd * o.usdbrl * P.arqFunding;
    cards.arq = { total: chargedBrl + arqFx + arqFund, parts: [["formar o saldo", arqFund], ["câmbio", arqFx]] };

    // Revolut Standard: cota mensal sem tarifa e sem IOF; acima, tarifa + IOF.
    var free = Math.max(0, Math.min(chargedBrl, P.revolutQuota - o.revolutUsed));
    var over = chargedBrl - free;
    var rvFee = over * P.revolutFee;
    var rvIof = (over + rvFee) * P.iof;
    cards.revolut = { total: chargedBrl + rvFee + rvIof, parts: [["tarifa fora da cota", rvFee], ["IOF fora da cota", rvIof]] };

    // Wise: reais → yuan antes da compra; tarifa e IOF sobre o convertido.
    var wsFee = chargedBrl * o.wiseFee;
    var wsIof = chargedBrl * P.iof;
    cards.wise = { total: chargedBrl + wsFee + wsIof, parts: [["tarifa", wsFee], ["IOF", wsIof]] };

    // Nomad: reais → dólar (conversão do nível + IOF); dólar → yuan pela Visa, sem margem.
    var nmConv = chargedBrl * o.nomadConv;
    var nmIof = (chargedBrl + nmConv) * P.iof;
    cards.nomad = { total: chargedBrl + nmConv + nmIof, parts: [["conversão", nmConv], ["IOF", nmIof]] };

    // Cartão de crédito de banco: spread + IOF.
    var bkSpread = chargedBrl * o.bankSpread;
    var bkIof = (chargedBrl + bkSpread) * P.iof;
    cards.bank = { total: chargedBrl + bkSpread + bkIof, parts: [["spread", bkSpread], ["IOF", bkIof]] };

    Object.keys(cards).forEach(function (key) {
      if (walletFee > 0) cards[key].parts.unshift(["taxa da carteira", feeBrl * cards[key].total / chargedBrl]);
      cards[key].pct = base > 0 ? (cards[key].total / base - 1) * 100 : 0;
    });
    var ranking = Object.keys(cards).sort(function (a, b) { return cards[a].total - cards[b].total; });
    return { spend: spend, walletFee: walletFee, base: base, cards: cards, ranking: ranking };
  }

  // Uma conta avulsa: quanto custa no QR e o que fazer.
  function bill(value, P) {
    var fee = value > P.walletFree ? value * P.alipayFee : 0;
    return { value: value, fee: fee, overLimit: value > P.walletFree };
  }

  var api = { cost: cost, bill: bill, LEVEL_ORDER: LEVEL_ORDER };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DLTChinaModel = api;
})(this);

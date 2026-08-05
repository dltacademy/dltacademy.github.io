from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "blog/arq-saques-exterior/index.html").read_text()
CALC = (ROOT / "blog/js/arq-calculator.js").read_text()


class ArqModelContractTests(unittest.TestCase):
    def test_full_article_model_is_present(self):
        required = [
            'class="figure-row"',
            'id="arq-calc"',
            'id="arq-withdrawal-value"',
            'id="arq-withdrawal-count"',
            'id="arq-conversion-rate"',
            'id="arq-local-fx-rate"',
            'id="arq-revolut-brl-fee-rate"',
            'id="arq-revolut-extra-fx-rate"',
            'id="arq-atm-fee"',
            'id="arq-dcc-rate"',
            'class="calc-row"',
            'class="compare"',
            'class="note is-risk"',
            'class="steps"',
            'class="verdict"',
            'class="offer"',
            'class="faq"',
            'class="sources"',
            'class="share-row"',
            'id="next-step-mount"',
            '/blog/js/arq-calculator.js',
        ]
        for marker in required:
            self.assertIn(marker, HTML, marker)
        self.assertRegex(HTML, r'class="[^"]*bar-chart[^"]*"')
        self.assertNotIn('id="arq-balance-source"', HTML)

    def test_model_has_no_unresolved_copy_or_inline_calculator(self):
        self.assertNotRegex(HTML, r"\[(?:a confirmar|placeholder|TODO)\]")
        self.assertNotIn("onclick=", HTML.lower())
        self.assertNotIn("oninput=", HTML.lower())
        self.assertNotIn("onchange=", HTML.lower())
        self.assertRegex(HTML, r"Taxas e condições verificadas em páginas oficiais em <strong>05/08/2026</strong>")
        self.assertNotIn("por tempo indeterminado", HTML.lower())

    def test_calculator_uses_verified_scoped_rules(self):
        for marker in [
            "costModel",
            "arqConversion",
            "arqLocalFx",
            "arqLocalFxPercent",
            "wiseIof",
            "wiseConversion",
            "revolutIof",
            "revolutBrlFee",
            "revolutExtraFx",
            "revolutSpread",
            "wiseIofPercent",
            "revolutIofPercent",
            "revolutBrlFeePercent",
            "revolutExtraFxPercent",
            "revolutWithdrawalFee",
            "atmTotal",
            "dccTotal",
            "3.5",
            "0.5",
            "0.78",
            "0.01",
            "1600",
            "20",
            "0.02",
            "6",
        ]:
            self.assertIn(marker, CALC, marker)
        self.assertIn("ARQ Global: 0% de IOF", HTML)
        self.assertIn("ajuste cambial até a moeda do saque", HTML)
        self.assertIn("<strong>1%</strong> para câmbio entre moedas estrangeiras no fim de semana", HTML)
        self.assertIn("<strong>0,5%</strong> sobre o volume acima de R$ 10.000", HTML)
        self.assertIn("tarifa do operador do ATM", HTML)
        self.assertIn("3GuSCwDgRqiYrsUc2eo7MN", HTML)
        self.assertNotIn("0,5% já incluindo IOF", HTML)

    def test_comparison_is_limited_to_free_basic_cards(self):
        for marker in (
            "ARQ Standard Global",
            "Wise padrão gratuito",
            "Revolut Standard",
            "opções básicas gratuitas",
        ):
            with self.subTest(marker=marker):
                self.assertTrue(marker in HTML or marker in CALC, marker)

    def test_social_asset_highlights_zero_iof(self):
        svg = (ROOT / "blog/arq-saques-exterior/og-image.svg").read_text()
        self.assertIn("0% DE IOF", svg)
        self.assertIn("SAQUE STANDARD · 1%", svg)


if __name__ == "__main__":
    unittest.main()

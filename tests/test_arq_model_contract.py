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
        self.assertRegex(HTML, r'class="[^"]*cost-parts[^"]*"')

    def test_model_has_no_unresolved_copy_or_inline_calculator(self):
        self.assertNotRegex(HTML, r"\[(?:a confirmar|placeholder|TODO)\]")
        self.assertNotIn("onclick=", HTML.lower())
        self.assertNotIn("oninput=", HTML.lower())
        self.assertNotIn("onchange=", HTML.lower())
        self.assertRegex(HTML, r"Fontes oficiais conferidas em 04/08/2026")

    def test_calculator_uses_verified_scoped_rules(self):
        for marker in ["arqCost", "wiseCost", "revolutCost", "0.01", "1600", "20", "0.02", "6"]:
            self.assertIn(marker, CALC, marker)
        self.assertIn("ATM, conversão, spread", HTML)
        self.assertIn("3GuSCwDgRqiYrsUc2eo7MN", HTML)


if __name__ == "__main__":
    unittest.main()

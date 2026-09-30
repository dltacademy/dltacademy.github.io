from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "guias" / "pagamentos-china" / "index.html"
CLAIMS = ROOT / "guias" / "pagamentos-china" / "CLAIMS.md"
REGISTRY = ROOT / "js" / "content-registry.js"
SITEMAP = ROOT / "sitemap.xml"
CONTENT_ID = "guide-pagamentos-china"
URL = "https://dlt.academy/guias/pagamentos-china/"


class ChinaPaymentsGuideTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = PAGE.read_text(encoding="utf-8")
        source = REGISTRY.read_text(encoding="utf-8")
        start = source.index("const CONTENT = ") + len("const CONTENT = ")
        end = source.rindex("];") + 1
        cls.registry = {entry["id"]: entry for entry in json.loads(source[start:end])}

    def test_page_claims_and_social_assets_exist(self) -> None:
        self.assertTrue(PAGE.is_file())
        self.assertTrue(CLAIMS.is_file())
        self.assertTrue((PAGE.parent / "og-image.svg").is_file())
        png = PAGE.parent / "og-image.png"
        self.assertTrue(png.is_file())
        self.assertEqual(png.read_bytes()[16:24], (1200).to_bytes(4, "big") + (630).to_bytes(4, "big"))

    def test_canonical_metadata_and_mount_match(self) -> None:
        self.assertIn(f'<link rel="canonical" href="{URL}">', self.html)
        self.assertIn(f'<meta property="og:url" content="{URL}">', self.html)
        self.assertIn('"mainEntityOfPage": "' + URL + '"', self.html)
        self.assertIn(f'data-content-id="{CONTENT_ID}"', self.html)
        self.assertIn('data-guide-progress="pagamentos-china"', self.html)
        self.assertEqual(4, self.html.count("data-guide-check="))

    def test_registry_and_sitemap(self) -> None:
        entry = self.registry[CONTENT_ID]
        self.assertEqual(entry["type"], "guide")
        self.assertEqual(entry["url"], "/guias/pagamentos-china/")
        self.assertIn("viagem", entry["sit"])
        self.assertEqual(entry["primaryNext"], "guide-etherfi-cash-viagem")
        self.assertIn(URL, SITEMAP.read_text(encoding="utf-8"))

    def test_guide_anatomy(self) -> None:
        for marker in (
            "key-points", "piece-toc", "guide-step", "verificacao-final", "guide-final-check",
            "Quando dá errado", "plan-b", "verdict", "faq", "sources", "share-row",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)

    def test_core_rule_and_numbers_are_scoped(self) -> None:
        required = (
            "¥200",
            "3% sobre o valor inteiro",
            "¥7,71",
            "¥6,7128",
            "US$ 38,83",
            "US$ 24,79",
            "(pendente)",
            "7372",
            "0,5% + R$ 0,10",
            "ETHFI",
            "US$ 5.000",
            "US$ 50.000",
            "Consultadas em 30/09/2026",
            "Comparação: ether.fi, ARQ, Revolut, Wise, Nomad e cartão de banco",
            "Quanto sai ¥1.000 em cada rota",
            "R$ 770,75",
            "+4,17%",
            "+5,57%",
            "+7,64%",
            "+4,95%",
            "Reais → dólar → yuan, ou reais → yuan?",
            "Vá direto ao que você precisa",
            "Quanto você economiza em cada caso",
            "R$ 684,50",
            "roaming internacional só para SMS",
            "eSIM de dados no Trip.com",
            "Dá para carregar saldo no Alipay para fugir dos 3%?",
            "QR de transporte",
            "Remessa internacional (Cross-border Remittance)",
            "¥1.320,30",
            "R$ 783,91",
            "R$ 823,44",
            "o limite de ¥200 é regra do cartão, não do saldo",
            "Alternativa: saldo no Alipay pela Remessa internacional",
            "O ether.fi no mês inteiro, com a subida de nível",
            "5 mil pontos",
            "O que cada nível dá além do cashback",
            "Salas VIP de aeroporto",
            "Vale pagar os US$ 199 do Luxe?",
            "Compare com o ether.fi Travel",
            "eSIM global",
            "+0,16%",
            "¥6,7053",
            "6,7148",
            "−1,23%",
            "+0,50%",
            "IOF de até 3,5% na compra de stablecoins",
        )
        for text in required:
            with self.subTest(text=text):
                self.assertIn(text, self.html)

    def test_calculator_contract(self) -> None:
        self.assertIn('data-china-calculator', self.html)
        self.assertIn('data-verified-at="2026-09-30"', self.html)
        self.assertIn('src="/guias/pagamentos-china/js/china-calculator.js"', self.html)
        script = (PAGE.parent / "js" / "china-calculator.js").read_text(encoding="utf-8")
        for key in ("etherfi", "arq", "revolut", "wise", "nomad", "bank"):
            with self.subTest(row=key):
                self.assertIn(f'data-calc-row="{key}"', self.html)
                self.assertIn(key + ":", script)
        self.assertIn('id="china-etherfi-level"', self.html)
        self.assertIn("LEVELS", script)
        self.assertNotIn("o ARQ passa na frente", self.html)
        for attr in ("data-iof=", "data-revolut-quota=", "data-etherfi-tier1=", "data-alipay-fee=", "data-etherfi-luxe-points=", "data-etherfi-pinnacle-points=", "data-etherfi-luxe-perks="):
            with self.subTest(attr=attr):
                self.assertIn(attr, self.html)
        self.assertIn('data-copy-result="#china-calc"', self.html)

    def test_no_sensitive_receipt_data(self) -> None:
        for leaked in ("0787", "4318", "c1145301", "e9ce1ece", "476c5927", "0x038e", "0xc423", "0x11dc", "02161686888", "9036"):
            with self.subTest(leaked=leaked):
                self.assertNotIn(leaked, self.html)

    def test_affiliate_links_are_marked_and_known(self) -> None:
        allowed = (
            "https://www.ether.fi/@e155ee95",
            "https://www.arqfinance.com/referrals/general?referralCode=tiagohyd_t7t",
            "https://wise.com/invite/irhc/tiagon100",
            "https://revolut.com/referral/?referral-code=tiago327k",
            "https://www.topcashback.com/ref/member1244137676106",
        )
        referral = re.compile(r'<a [^>]*href="(https://[^"]*(?:ether\.fi/@|referral|/invite/|topcashback\.com/ref/)[^"]*)"[^>]*>')
        found = referral.findall(self.html)
        self.assertGreaterEqual(len(found), 8)
        self.assertNotIn("sponsored", self.html)
        self.assertIn("pelo navegador. Em 30/09/2026, a página do Trip.com no TopCashback", self.html)
        self.assertIn("Compras pelo app do Trip.com não contam", self.html)
        for match in referral.finditer(self.html):
            tag, href = match.group(0), match.group(1)
            with self.subTest(href=href[:60]):
                self.assertTrue(href.startswith(allowed), href)
                self.assertIn('rel="nofollow noopener noreferrer"', tag)
                self.assertIn('referrerpolicy="no-referrer"', tag)
                self.assertIn('target="_blank"', tag)
        self.assertNotIn("PROMO_ATUAL", self.html)
        self.assertIn("Links de indicação.", self.html)
        self.assertIn("termine o cadastro no navegador", self.html)
        self.assertIn('/guias/etherfi-cash-viagem/#como-pedir', self.html)

    def test_offer_has_one_primary_action(self) -> None:
        match = re.search(r'<div class="offer cta-verdict"[^>]*>(.*?)</div>', self.html, re.DOTALL)
        self.assertIsNotNone(match)
        self.assertEqual(1, match.group(1).count("btn-primary"))
        self.assertIn("ether.fi/@e155ee95", match.group(1))

    def test_single_primary_cta_in_hero(self) -> None:
        match = re.search(r'<section class="guide-hero piece-head">(.*?)</section>', self.html, re.DOTALL)
        self.assertIsNotNone(match)
        self.assertEqual(1, match.group(1).count("btn-primary"))

    def test_external_links_are_protected(self) -> None:
        for match in re.finditer(r'<a [^>]*href="https://(?!dlt\.academy|[a-z-]+\.dlt\.academy)[^"]+"[^>]*>', self.html):
            tag = match.group(0)
            with self.subTest(tag=tag[:80]):
                self.assertRegex(tag, r'rel="(?:nofollow )?noopener noreferrer"')
                self.assertIn('referrerpolicy="no-referrer"', tag)


if __name__ == "__main__":
    unittest.main()

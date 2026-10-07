"""Links de indicação: uma fonte única, sem variantes soltas.

Um dígito trocado num código de indicação passa por CI, revisão e documentação
sem ninguém notar e a indicação deixa de ser atribuída. Este teste compara
todo link de indicação do portal com tests/data/affiliate_links.json.
"""
from __future__ import annotations

import html
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tests" / "data" / "affiliate_links.json").read_text(encoding="utf-8"))
PROVIDERS = DATA["providers"]
SKIP_DIRS = {".git", "node_modules", "tests", "_site"}
URL = re.compile(r"https?://[^\s\"'<>)`]+")
ANCHOR = re.compile(r"<a\s[^>]*>", re.IGNORECASE)


def source_files() -> list[Path]:
    files = []
    for path in ROOT.rglob("*"):
        if path.suffix not in {".html", ".js"} or SKIP_DIRS & set(path.relative_to(ROOT).parts):
            continue
        if "vendor" in path.parts:
            continue
        files.append(path)
    return sorted(files)


def provider_for(url: str) -> dict | None:
    return next((p for p in PROVIDERS if re.search(p["pattern"], url)), None)


class AffiliateLinkTests(unittest.TestCase):
    def test_every_referral_url_is_the_canonical_one(self) -> None:
        for path in source_files():
            text = html.unescape(path.read_text(encoding="utf-8"))
            for url in URL.findall(text):
                provider = provider_for(url)
                if provider is None:
                    continue
                with self.subTest(file=str(path.relative_to(ROOT)), provider=provider["id"], url=url[:90]):
                    self.assertTrue(
                        url.startswith(provider["canonical"]),
                        f"{provider['label']}: link de indicação fora da lista canônica ({provider['canonical']})",
                    )

    def test_referral_anchors_are_nofollow_not_sponsored_and_protected(self) -> None:
        for path in source_files():
            if path.suffix != ".html":
                continue
            for tag in ANCHOR.findall(path.read_text(encoding="utf-8")):
                href = re.search(r'href="([^"]+)"', tag)
                if not href or provider_for(html.unescape(href.group(1))) is None:
                    continue
                with self.subTest(file=str(path.relative_to(ROOT)), href=href.group(1)[:80]):
                    rel = re.search(r'rel="([^"]*)"', tag)
                    tokens = set(rel.group(1).split()) if rel else set()
                    self.assertLessEqual({"nofollow", "noopener", "noreferrer"}, tokens)
                    self.assertNotIn("sponsored", tokens)
                    self.assertIn('referrerpolicy="no-referrer"', tag)
                    self.assertIn('target="_blank"', tag)

    def test_canonical_list_is_well_formed(self) -> None:
        ids = [p["id"] for p in PROVIDERS]
        self.assertEqual(len(ids), len(set(ids)))
        for provider in PROVIDERS:
            with self.subTest(provider=provider["id"]):
                self.assertTrue(provider["canonical"].startswith("https://"))
                self.assertRegex(provider["canonical"], provider["pattern"])


if __name__ == "__main__":
    unittest.main()

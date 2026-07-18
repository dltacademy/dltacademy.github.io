from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "blog" / "template-post.html"


class ArticleTemplateContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = TEMPLATE.read_text(encoding="utf-8")

    def test_obsolete_keywords_are_absent(self) -> None:
        self.assertNotIn('name="keywords"', self.html)
        self.assertNotIn("POST_" + "KEYWORDS", self.html)

    def test_social_metadata_is_complete(self) -> None:
        for marker in (
            'property="og:site_name"',
            'property="og:image:type" content="image/png"',
            'property="og:image:width" content="1200"',
            'property="og:image:height" content="630"',
            'property="og:image:alt" content="{{POST_OG_ALT}}"',
            'name="twitter:image:alt" content="{{POST_OG_ALT}}"',
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, self.html)

    def test_json_ld_has_publication_and_modification_dates(self) -> None:
        match = re.search(
            r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(match)
        data = json.loads(match.group(1))
        self.assertEqual("{{POST_DATE_ISO}}", data["datePublished"])
        self.assertEqual("{{POST_MODIFIED_ISO}}", data["dateModified"])


if __name__ == "__main__":
    unittest.main()

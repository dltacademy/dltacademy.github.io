from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DesignSystemTests(unittest.TestCase):
    def test_component_library_covers_31_patterns(self) -> None:
        css = (ROOT / "dlt-patterns.css").read_text(encoding="utf-8")
        numbers = {
            int(match)
            for match in re.findall(r"/\* -+ (\d{2}) ·", css)
        }
        self.assertEqual(set(range(1, 23)) | set(range(24, 32)), numbers)
        self.assertTrue((ROOT / "og-template.svg").is_file())

    def test_shared_interactions_contain_no_volatile_product_rules(self) -> None:
        script = (ROOT / "js" / "dlt-interactions.js").read_text(encoding="utf-8")
        for marker in (
            "ARQ Standard",
            "Wise (BR)",
            "Revolut Std",
            "atmMonthlyCost",
        ):
            with self.subTest(marker=marker):
                self.assertNotIn(marker, script)

    def test_home_uses_unified_catalog_and_situation_filter(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        portal = (ROOT / "js" / "portal.js").read_text(encoding="utf-8")
        for marker in (
            'href="dlt-patterns.css"',
            'class="situation-chips" data-filter-group',
            "data-filter-count",
            "Ferramentas, protocolos e guias",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, html)
        self.assertIn('const CATALOG_TYPES = ["tool", "protocolo", "guide"]', portal)
        self.assertIn("entry.mark", portal)
        self.assertIn("entry.effort", portal)

    def test_catalog_entries_have_situations_and_monograms(self) -> None:
        source = (ROOT / "js" / "content-registry.js").read_text(encoding="utf-8")
        start = source.index("const CONTENT = ") + len("const CONTENT = ")
        end = source.rindex("];" ) + 1
        entries = json.loads(source[start:end])
        catalog = [entry for entry in entries if entry["type"] in {"tool", "guide", "protocolo", "article"}]
        self.assertTrue(catalog)
        for entry in catalog:
            with self.subTest(entry=entry["id"]):
                self.assertTrue(entry.get("sit"))
                self.assertRegex(entry.get("mark", ""), r"^[A-Z0-9]{1,2}$")
                self.assertNotIn("icon", entry)


if __name__ == "__main__":
    unittest.main()

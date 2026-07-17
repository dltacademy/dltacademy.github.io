#!/usr/bin/env python3
"""Testes da política de segurança do portal (T1B).

Política 2026-07-17: zero JavaScript executável inline; o único <script> sem
src permitido é o data block type="application/ld+json" com JSON válido.
Estes testes devem FALHAR se a exceção for ampliada para qualquer script inline.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from security_check import check_html  # noqa: E402

CSP = (
    "default-src 'self'; script-src 'self' https://gc.zgo.at; "
    "object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'self'"
)

HEAD_OK = (
    f'<meta http-equiv="Content-Security-Policy" content="{CSP}">'
    '<meta name="referrer" content="no-referrer">'
)


def page(body: str, head: str = HEAD_OK) -> str:
    return f"<!doctype html><html><head>{head}</head><body>{body}</body></html>"


def errors_for(html: str) -> list[str]:
    with tempfile.NamedTemporaryFile(
        "w", suffix=".html", delete=False, encoding="utf-8"
    ) as handle:
        handle.write(html)
        path = Path(handle.name)
    try:
        return [error.split(": ", 1)[1] for error in check_html(path)]
    finally:
        path.unlink()


class JsonLdPolicyTests(unittest.TestCase):
    def test_valid_json_ld_is_allowed(self) -> None:
        html = page('<script type="application/ld+json">{"@context": "https://schema.org"}</script>')
        self.assertEqual(errors_for(html), [])

    def test_json_ld_type_is_normalized_safely(self) -> None:
        html = page('<script TYPE=" APPLICATION/LD+JSON ">{"a": 1}</script>')
        self.assertEqual(errors_for(html), [])

    def test_malformed_json_ld_is_rejected(self) -> None:
        html = page('<script type="application/ld+json">{"a": }</script>')
        self.assertTrue(any("JSON-LD inválido" in e for e in errors_for(html)))

    def test_empty_json_ld_is_rejected(self) -> None:
        html = page('<script type="application/ld+json">   </script>')
        self.assertTrue(any("JSON-LD vazio" in e for e in errors_for(html)))

    def test_unclosed_json_ld_is_rejected(self) -> None:
        html = page('<script type="application/ld+json">{"a": 1}')
        self.assertTrue(any("sem fechamento" in e for e in errors_for(html)))

    def test_classic_inline_javascript_is_rejected(self) -> None:
        html = page("<script>alert(1)</script>")
        self.assertTrue(any("JavaScript executável inline" in e for e in errors_for(html)))

    def test_module_inline_is_rejected(self) -> None:
        html = page('<script type="module">import x from "./x.js"</script>')
        self.assertTrue(any("JavaScript executável inline" in e for e in errors_for(html)))

    def test_importmap_inline_is_rejected(self) -> None:
        html = page('<script type="importmap">{"imports": {}}</script>')
        self.assertTrue(any("JavaScript executável inline" in e for e in errors_for(html)))

    def test_speculation_rules_inline_is_rejected(self) -> None:
        html = page('<script type="speculationrules">{"prerender": []}</script>')
        self.assertTrue(any("JavaScript executável inline" in e for e in errors_for(html)))

    def test_script_smuggled_inside_json_ld_is_rejected(self) -> None:
        html = page(
            '<script type="application/ld+json">'
            '{"a": "</script><script>alert(1)</script>"}'
            "</script>"
        )
        errors = errors_for(html)
        self.assertTrue(any("JSON-LD inválido" in e for e in errors))
        self.assertTrue(any("JavaScript executável inline" in e for e in errors))

    def test_external_script_is_allowed(self) -> None:
        html = page('<script src="js/portal.js" defer></script>')
        self.assertEqual(errors_for(html), [])

    def test_csp_is_still_required(self) -> None:
        html = page("<p>ok</p>", head='<meta name="referrer" content="no-referrer">')
        self.assertTrue(any("CSP ausente" in e for e in errors_for(html)))

    def test_referrer_policy_is_still_required(self) -> None:
        head = f'<meta http-equiv="Content-Security-Policy" content="{CSP}">'
        html = page("<p>ok</p>", head=head)
        self.assertTrue(any("referrer" in e for e in errors_for(html)))


class RecursiveScanTests(unittest.TestCase):
    def run_checker(self, target: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(REPO_ROOT / "security_check.py"), str(target)],
            capture_output=True,
            text=True,
        )

    def test_invalid_html_in_subdirectory_is_found(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            nested = Path(tmp) / "blog" / "post"
            nested.mkdir(parents=True)
            (nested / "index.html").write_text(
                page("<script>alert(1)</script>"), encoding="utf-8"
            )
            result = self.run_checker(Path(tmp))
        self.assertEqual(result.returncode, 1)
        self.assertIn("JavaScript executável inline", result.stdout)

    def test_real_portal_passes(self) -> None:
        result = self.run_checker(REPO_ROOT)
        self.assertEqual(result.returncode, 0, msg=result.stdout)
        self.assertIn("Security check: OK", result.stdout)


if __name__ == "__main__":
    unittest.main()

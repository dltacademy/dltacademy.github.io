#!/usr/bin/env python3
"""Verificação estática mínima de segurança para o portal DLT Academy."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys


# Política de segurança aplicada (T1A/T1B): zero JavaScript executável inline;
# o único <script> sem src permitido é o data block type="application/ld+json"
# com JSON estático válido.
# 2026-11-19: no restante do portal, script, estilo, fonte e conexão vêm só do
# próprio site. Apenas as páginas de oferta em produtos/*/index.html podem usar
# a CSP explícita do Meta Pixel (sem unsafe-inline nem outros hosts).
SECURITY_POLICY_VERSION = "2026-11-19"

# Diretiva -> valor exato exigido. Valor exato, não "contém": um host de
# terceiro somado a 'self' reprova.
REQUIRED_CSP = {
    "default-src": "'self'",
    "script-src": "'self'",
    "style-src": "'self'",
    "font-src": "'self'",
    "connect-src": "'self'",
    "object-src": "'none'",
    "frame-src": "'none'",
    "base-uri": "'none'",
    "form-action": "'self'",
}

# Exceção restrita às páginas de oferta (/produtos/<slug>/index.html) para o
# Meta Pixel: hosts exatos da Meta, sem inline nem eval.
SALES_PAGE_CSP = {
    **REQUIRED_CSP,
    "script-src": "'self' https://connect.facebook.net",
    "img-src": "'self' data: blob: https://www.facebook.com",
    "connect-src": "'self' https://www.facebook.com https://connect.facebook.net",
}


def _is_sales_page(path: Path, root: Path | None = None) -> bool:
    parts = path.relative_to(root).parts if root is not None else path.parts
    if root is not None:
        return len(parts) == 3 and parts[0] == "produtos" and parts[2] == "index.html"
    return len(parts) >= 3 and parts[-3] == "produtos" and parts[-1] == "index.html"


def parse_csp(policy: str) -> dict[str, str]:
    directives: dict[str, str] = {}
    for part in policy.split(";"):
        tokens = part.split()
        if tokens:
            directives[tokens[0].lower()] = " ".join(tokens[1:])
    return directives


class SecurityHTMLParser(HTMLParser):
    def __init__(self, source: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.source = source
        self.errors: list[str] = []
        self.csp: str | None = None
        self.referrer: str | None = None
        self._json_ld_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if tag == "meta":
            if values.get("http-equiv", "").lower() == "content-security-policy":
                self.csp = values.get("content")
            if values.get("name", "").lower() == "referrer":
                self.referrer = values.get("content")
        if tag == "script" and not values.get("src"):
            script_type = values.get("type", "").strip().lower()
            if script_type == "application/ld+json":
                self._json_ld_parts = []
            else:
                self.errors.append(
                    f"{self.source}: JavaScript executável inline não permitido"
                )
        if tag == "a" and values.get("target") == "_blank":
            rel = set(values.get("rel", "").split())
            missing = {"noopener", "noreferrer"} - rel
            if missing:
                self.errors.append(f"{self.source}: link target=_blank sem {', '.join(sorted(missing))}")
            if values.get("referrerpolicy") != "no-referrer":
                self.errors.append(f"{self.source}: link target=_blank sem referrerpolicy=no-referrer")

    def handle_data(self, data: str) -> None:
        if self._json_ld_parts is not None:
            self._json_ld_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._json_ld_parts is not None:
            self._validate_json_ld()

    def finish(self) -> None:
        if self._json_ld_parts is not None:
            self.errors.append(f"{self.source}: bloco JSON-LD sem fechamento")
            self._json_ld_parts = None

    def _validate_json_ld(self) -> None:
        raw_json = "".join(self._json_ld_parts or []).strip()
        self._json_ld_parts = None
        if not raw_json:
            self.errors.append(f"{self.source}: bloco JSON-LD vazio")
            return
        try:
            json.loads(raw_json, parse_constant=_reject_non_finite)
        except json.JSONDecodeError as error:
            self.errors.append(
                f"{self.source}: JSON-LD inválido "
                f"(linha {error.lineno}, coluna {error.colno}): {error.msg}"
            )
        except ValueError as error:
            self.errors.append(f"{self.source}: JSON-LD inválido: {error}")


def _reject_non_finite(value: str) -> None:
    # json.loads aceita NaN/Infinity/-Infinity como extensão do Python;
    # RFC 8259 não permite essas constantes, então o data block reprova.
    raise ValueError(f"constante não permitida ({value})")


def _csp_matches(directives: dict[str, str], expected: dict[str, str]) -> bool:
    return all(directives.get(name) == value for name, value in expected.items())


def check_html(path: Path, root: Path | None = None) -> list[str]:
    parser = SecurityHTMLParser(path)
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    parser.finish()
    errors = parser.errors
    if not parser.csp:
        errors.append(f"{path}: CSP ausente")
    else:
        parsed = parse_csp(parser.csp)
        allowed = _csp_matches(parsed, REQUIRED_CSP) or (
            _is_sales_page(path, root) and _csp_matches(parsed, SALES_PAGE_CSP)
        )
        if not allowed:
            errors.append(f"{path}: CSP incompleta ou com host de terceiro")
        elif "unsafe-inline" in parser.csp or "unsafe-eval" in parser.csp:
            errors.append(f"{path}: CSP contém diretiva insegura")
    if parser.referrer != "no-referrer":
        errors.append(f"{path}: meta referrer deve ser no-referrer")
    return errors


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    for path in sorted(root.rglob("*.html")):
        # _site/ é cópia montada por scripts/montar_site.sh; a fonte é conferida aqui.
        if {"_site", ".git", "node_modules"} & set(path.relative_to(root).parts):
            continue
        errors.extend(check_html(path, root=root))
    for path in (root / ".github" / "workflows").glob("*.yml"):
        for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            match = re.search(r"\buses:\s*[^@\s]+@([^\s#]+)", line)
            if match and not re.fullmatch(r"[0-9a-f]{40}", match.group(1)):
                errors.append(f"{path}:{line_no}: Action não fixada por SHA completo")
    if errors:
        print("Security check falhou:")
        print(*[f"- {error}" for error in errors], sep="\n")
        return 1
    print("Security check: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

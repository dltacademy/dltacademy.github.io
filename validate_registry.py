"""Valida o Registry Core V1 e sua correspondência com o sitemap."""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree


REGISTRY_MARKER = "const CONTENT = "
COMMON_FIELDS = {"id", "type", "title", "description", "url", "tag"}
EDGE_FIELDS = {"primaryNext", "related"}
MAX_RELATED = 3
TYPE_FIELDS = {
    "tool": COMMON_FIELDS | {"tone", "icon"} | EDGE_FIELDS,
    "guide": COMMON_FIELDS | {"tone", "icon"} | EDGE_FIELDS,
    "article": COMMON_FIELDS | {"publishedAt"} | EDGE_FIELDS,
}
INSTITUTIONAL_URLS = {
    "https://dlt.academy/",
    "https://dlt.academy/blog/",
    "https://dlt.academy/sobre/",
    "https://dlt.academy/transparencia/",
}
ID_PATTERN = re.compile(r"^[a-z0-9-]+$")


def _reject_non_finite(value: str) -> None:
    raise ValueError(f"constante não permitida no JSON estrito: {value}")


def _load_registry(path: Path) -> list[object]:
    source = path.read_text(encoding="utf-8")
    start = source.find(REGISTRY_MARKER)
    end = source.rfind("];")
    if start == -1 or end == -1 or end < start:
        raise ValueError(
            f"não foi possível extrair o array entre {REGISTRY_MARKER!r} e o ]; final"
        )

    payload = source[start + len(REGISTRY_MARKER) : end + 1]
    try:
        data = json.loads(payload, parse_constant=_reject_non_finite)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"JSON inválido na linha {exc.lineno}, coluna {exc.colno}: {exc.msg}"
        ) from exc
    except ValueError as exc:
        raise ValueError(str(exc)) from exc

    if not isinstance(data, list):
        raise ValueError("CONTENT deve ser um array JSON")
    return data


def _entry_label(entry: object, position: int) -> str:
    if isinstance(entry, dict) and isinstance(entry.get("id"), str):
        return f"entrada {position} ({entry['id']!r})"
    return f"entrada {position}"


def _absolute_url(url: str) -> str:
    if url.startswith("/"):
        return f"https://dlt.academy{url}"
    return url


def _load_sitemap_urls(path: Path) -> list[str]:
    try:
        root = ElementTree.parse(path).getroot()
    except (ElementTree.ParseError, OSError) as exc:
        raise ValueError(f"sitemap.xml inválido ou ilegível: {exc}") from exc

    urls: list[str] = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] == "loc" and element.text:
            urls.append(element.text.strip())
    return urls


def _validate_edges(entries: list[object], seen_ids: set[str]) -> list[str]:
    """Valida primaryNext/related: destino existente, sem autorreferência,
    máximo de related e sem ciclo em primaryNext (regras da fase T3)."""

    errors: list[str] = []
    primary_next_map: dict[str, str] = {}

    for position, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict):
            continue
        label = _entry_label(entry, position)
        entry_id = entry.get("id") if isinstance(entry.get("id"), str) else None

        if "primaryNext" in entry:
            primary_next = entry["primaryNext"]
            if not isinstance(primary_next, str) or not primary_next.strip():
                errors.append(f"{label}, campo 'primaryNext': deve ser string não vazia")
            elif entry_id is not None and primary_next == entry_id:
                errors.append(f"{label}, campo 'primaryNext': não pode autorreferenciar")
            elif primary_next not in seen_ids:
                errors.append(
                    f"{label}, campo 'primaryNext': destino inexistente {primary_next!r}"
                )
            elif entry_id is not None:
                primary_next_map[entry_id] = primary_next

        if "related" in entry:
            related = entry["related"]
            if not isinstance(related, list):
                errors.append(f"{label}, campo 'related': deve ser array de IDs")
            else:
                if len(related) > MAX_RELATED:
                    errors.append(
                        f"{label}, campo 'related': máximo de {MAX_RELATED} IDs"
                    )
                seen_related: set[str] = set()
                for related_id in related:
                    if not isinstance(related_id, str) or not related_id.strip():
                        errors.append(
                            f"{label}, campo 'related': cada item deve ser string não vazia"
                        )
                        continue
                    if entry_id is not None and related_id == entry_id:
                        errors.append(
                            f"{label}, campo 'related': não pode autorreferenciar {related_id!r}"
                        )
                    if related_id in seen_related:
                        errors.append(
                            f"{label}, campo 'related': valor duplicado {related_id!r}"
                        )
                    seen_related.add(related_id)
                    if related_id not in seen_ids:
                        errors.append(
                            f"{label}, campo 'related': destino inexistente {related_id!r}"
                        )

    cyclic_ids: set[str] = set()
    for start_id in primary_next_map:
        visited: list[str] = []
        current = start_id
        while current in primary_next_map:
            if current in visited:
                cyclic_ids.update(visited[visited.index(current):])
                break
            visited.append(current)
            current = primary_next_map[current]
    for cyclic_id in sorted(cyclic_ids):
        errors.append(f"grafo 'primaryNext': ciclo detectado envolvendo {cyclic_id!r}")

    return errors


def validate_repository(root: Path | str) -> list[str]:
    """Retorna erros determinísticos; lista vazia significa repositório válido."""

    repo = Path(root)
    errors: list[str] = []
    try:
        entries = _load_registry(repo / "js" / "content-registry.js")
    except (OSError, ValueError) as exc:
        return [f"registry: {exc}"]

    seen_ids: set[str] = set()
    valid_registry_urls: set[str] = set()

    for position, entry in enumerate(entries, start=1):
        label = _entry_label(entry, position)
        if not isinstance(entry, dict):
            errors.append(f"{label}: deve ser um objeto JSON")
            continue

        entry_type = entry.get("type")
        allowed_fields = TYPE_FIELDS.get(entry_type) if isinstance(entry_type, str) else None
        if allowed_fields is None:
            errors.append(
                f"{label}, campo 'type': deve ser um de tool, guide ou article"
            )
            allowed_fields = COMMON_FIELDS

        unknown_fields = sorted(set(entry) - allowed_fields)
        for field in unknown_fields:
            errors.append(f"{label}, campo {field!r}: campo desconhecido para {entry_type!r}")

        required_fields = COMMON_FIELDS | ({"publishedAt"} if entry_type == "article" else set())
        for field in sorted(required_fields - set(entry)):
            errors.append(f"{label}, campo {field!r}: obrigatório")

        for field in sorted(COMMON_FIELDS & set(entry)):
            value = entry[field]
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{label}, campo {field!r}: deve ser string não vazia")

        entry_id = entry.get("id")
        if isinstance(entry_id, str) and entry_id:
            if not ID_PATTERN.fullmatch(entry_id):
                errors.append(f"{label}, campo 'id': deve usar kebab-case [a-z0-9-]")
            if entry_id in seen_ids:
                errors.append(f"{label}, campo 'id': valor duplicado {entry_id!r}")
            seen_ids.add(entry_id)

        tone = entry.get("tone")
        if tone is not None and tone not in {"green", "blue"}:
            errors.append(f"{label}, campo 'tone': deve ser 'green' ou 'blue'")

        icon = entry.get("icon")
        if icon is not None and (not isinstance(icon, str) or not icon.strip()):
            errors.append(f"{label}, campo 'icon': deve ser string não vazia")

        if entry_type == "article" and "publishedAt" in entry:
            published_at = entry["publishedAt"]
            if not isinstance(published_at, str):
                errors.append(f"{label}, campo 'publishedAt': deve ser string ISO YYYY-MM-DD")
            else:
                try:
                    parsed_date = date.fromisoformat(published_at)
                    if parsed_date.isoformat() != published_at:
                        raise ValueError
                except ValueError:
                    errors.append(
                        f"{label}, campo 'publishedAt': data real obrigatória no formato YYYY-MM-DD"
                    )

        url = entry.get("url")
        if not isinstance(url, str) or not url:
            continue
        if url.startswith("/"):
            if not url.endswith("/"):
                errors.append(f"{label}, campo 'url': URL interna deve terminar com /")
                continue
            if ".." in Path(url).parts:
                errors.append(f"{label}, campo 'url': URL interna não pode conter ..")
                continue
            page = repo / url.lstrip("/") / "index.html"
            if not page.is_file():
                errors.append(
                    f"{label}, campo 'url': destino interno sem index.html em {url!r}"
                )
                continue
        else:
            parsed = urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if parsed.scheme != "https" or not hostname.endswith(".dlt.academy"):
                errors.append(
                    f"{label}, campo 'url': URL externa deve usar https em subdomínio .dlt.academy"
                )
                continue
        valid_registry_urls.add(_absolute_url(url))

    errors.extend(_validate_edges(entries, seen_ids))

    try:
        sitemap_urls = _load_sitemap_urls(repo / "sitemap.xml")
    except ValueError as exc:
        errors.append(str(exc))
        return errors

    sitemap_set = set(sitemap_urls)
    for url in sorted(valid_registry_urls - sitemap_set):
        errors.append(f"sitemap.xml: URL do registry ausente: {url}")

    allowed_sitemap_urls = valid_registry_urls | INSTITUTIONAL_URLS
    for url in sorted(sitemap_set - allowed_sitemap_urls):
        errors.append(f"sitemap.xml: URL órfã fora do registry/allowlist: {url}")

    return errors


def main() -> int:
    errors = validate_repository(Path(__file__).resolve().parent)
    if errors:
        print("Registry check: FALHOU")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Registry check: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Abre ao vivo cada link de indicação de tests/data/affiliate_links.json.

Uso manual, antes de divulgar ou depois de trocar um código. Fica fora do CI de
propósito: vários sites (ether.fi, Binance) bloqueiam robô e derrubariam o PR
por motivo que não é do conteúdo. Bloqueio aparece como "inconclusivo".

    python3 check_affiliate_links.py

Onde o provedor grava um cookie quando o código existe (live_cookie), a ausência
do cookie reprova: foi assim que se distinguiu um código válido de um inventado.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path


DATA = Path(__file__).resolve().parent / "tests" / "data" / "affiliate_links.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (verificacao manual de links de indicacao)"}
BLOCKED = {401, 403, 429}


def probe(url: str) -> tuple[int | None, str, set[str]]:
    jar = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    request = urllib.request.Request(url, headers=HEADERS)
    try:
        with opener.open(request, timeout=20) as response:
            return response.status, response.geturl(), {c.name for c in jar}
    except urllib.error.HTTPError as error:
        return error.code, url, {c.name for c in jar}
    except (urllib.error.URLError, TimeoutError) as error:
        return None, f"{type(error).__name__}: {error}", set()


def main() -> int:
    providers = json.loads(DATA.read_text(encoding="utf-8"))["providers"]
    failed = False
    for provider in providers:
        status, final, cookies = probe(provider["canonical"])
        cookie = provider.get("live_cookie")
        if status is None:
            verdict = "INCONCLUSIVO (rede)"
        elif status in BLOCKED:
            verdict = f"INCONCLUSIVO (HTTP {status}, bloqueio antirrobô: abra no navegador)"
        elif status >= 400:
            verdict, failed = f"FALHA (HTTP {status})", True
        elif cookie and cookie not in cookies:
            verdict, failed = f"FALHA (sem o cookie {cookie}: o código pode não existir)", True
        else:
            verdict = f"ok (HTTP {status}" + (f", cookie {cookie} gravado" if cookie else "") + ")"
        print(f"{provider['label']:<14} {verdict}\n{'':<14} {provider['canonical']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

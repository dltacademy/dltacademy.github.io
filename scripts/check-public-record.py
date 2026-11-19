#!/usr/bin/env python3
"""Confere que o registro público do repositório não leva assinatura de ferramenta.

Lê, nesta ordem:
- o título e a descrição do pull request;
- a mensagem, o autor e o committer de cada commit que o pull request ou o push traz;
- o nome e o texto de cada arquivo versionado, só para rodapés de assinatura
  (o assunto pode aparecer no conteúdo; a assinatura não).

Os nomes ficam codificados, para este arquivo não os carregar. O log mostra só
onde está o problema, nunca o nome.

Ambiente: PR_TITLE, PR_BODY, BASE_SHA, HEAD_SHA (todos opcionais).
"""
import base64
import os
import re
import subprocess
import sys

META = re.compile(base64.b64decode("Y1tsXWF1ZGV8YVtuXXRocm9waWN8b1twXWVuYWl8Y2hhdFtnXXB0fFxiZ1twXXRbLVxzXT9bMC05b118Z3B0W2Jdb3R8b2FpLXNlYXJjaFtiXW90fGdlW21daW5pfGNvW3BdaWxvdHxkZWVbcF1zZWVrfFxibFtsXWFtYVxifG1pW3NddHJhbHxwZXJwW2xdZXhpdHlcLmFpfFxicVt3XWVuXGJ8XGJnW3Jdb2tcYnxnZW5lcmF0ZWQgd2l0aCBcWz9jW2xdYXVkZXxcVTAwMDFGOTE2IGdlbmVyYXRlZHwoP206XlthLXpdKy1zZXNzaW9uOlxzKmh0dHBzPzovLyk=").decode("utf-8"), re.IGNORECASE)
ARQUIVOS = re.compile(base64.b64decode("Z2VuZXJhdGVkIHdpdGggXFs/Y1tsXWF1ZGV8XFUwMDAxRjkxNiBnZW5lcmF0ZWR8KD9tOl5bYS16XSstc2Vzc2lvbjpccypodHRwcz86Ly8pfGNvLWF1dGhvcmVkLVtiXXk6W15cbl0qKD86Y1tsXWF1ZGV8YVtuXXRocm9waWN8b1twXWVuYWl8Y2hhdFtnXXB0fFxiZ1twXXRbLVxzXT9bMC05b118Z3B0W2Jdb3R8b2FpLXNlYXJjaFtiXW90fGdlW21daW5pfGNvW3BdaWxvdHxkZWVbcF1zZWVrfFxibFtsXWFtYVxifG1pW3NddHJhbHxwZXJwW2xdZXhpdHlcLmFpfFxicVt3XWVuXGJ8XGJnW3Jdb2tcYik=").decode("utf-8"), re.IGNORECASE)
MAX_BYTES = 5_000_000


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout


def commits(base, head):
    if not head:
        return []
    if base and set(base) != {"0"} and git("cat-file", "-t", base).strip() == "commit":
        return git("rev-list", f"{base}..{head}").split()
    return git("rev-list", "-1", head).split()


def main():
    problemas = []

    for onde, texto in (("título do pull request", os.environ.get("PR_TITLE", "")),
                        ("descrição do pull request", os.environ.get("PR_BODY", ""))):
        if META.search(texto or ""):
            problemas.append(onde)

    for sha in commits(os.environ.get("BASE_SHA", ""), os.environ.get("HEAD_SHA", "")):
        registro = git("log", "-1", "--format=%an%n%ae%n%cn%n%ce%n%B", sha)
        if META.search(registro):
            problemas.append(f"commit {sha[:12]} (mensagem, autor ou committer)")

    for caminho in git("ls-files", "-z").split("\0"):
        if not caminho:
            continue
        if META.search(caminho):
            problemas.append(f"nome de arquivo: {caminho}")
            continue
        try:
            with open(caminho, "rb") as f:
                dados = f.read(MAX_BYTES)
        except OSError:
            continue
        if b"\0" in dados[:8000]:
            continue
        for numero, linha in enumerate(dados.decode("utf-8", "replace").splitlines(), 1):
            if ARQUIVOS.search(linha):
                problemas.append(f"{caminho}:{numero}")
                break

    if problemas:
        print("O registro público leva uma assinatura que não pode estar nele. Tire e mande de novo:")
        for item in problemas[:200]:
            print(f"  - {item}")
        return 1
    print("Registro público conferido: sem assinatura.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

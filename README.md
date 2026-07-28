# dltacademy.github.io

Portal/hub central da DLT Academy — lista todas as ferramentas web (calculadoras, simuladores, guias) num único lugar. Repo especial de organização: serve na **raiz** do domínio (`https://dltacademy.github.io/`), não num subcaminho.

Página única, zero backend, zero build — mesmo padrão do [ferramenta-kit](https://github.com/dltacademy/ferramenta-kit).

## Registrar conteúdo novo

Único arquivo a editar: **`js/content-registry.js`**. Adicione um objeto ao array `CONTENT`, usando JSON estrito:

```js
{
  "id": "tool-nome-estavel",
  "type": "tool",
  "title": "Nome da Ferramenta",
  "description": "Descrição de 1 frase.",
  "url": "https://nome.dlt.academy/",
  "tag": "Público-alvo",
  "tone": "green",
  "icon": "✦"
}
```

## Lançar ferramenta nova: dois arquivos, um commit

Ferramenta vive em subdomínio (`nome.dlt.academy`), o portal vive em `dlt.academy`. O protocolo de sitemaps exige **host único por arquivo**, então:

| Arquivo | O que recebe |
|---|---|
| `js/content-registry.js` | a entrada da ferramenta — é o card no ar |
| `sitemap-index.xml` | o `sitemap.xml` **da ferramenta** |
| ~~`sitemap.xml`~~ | **não** recebe URL de subdomínio — `validate_registry.py` reprova |

Os dois no mesmo commit. Ficar pela metade é o erro que já deixou uma ferramenta fora do sitemap desde o lançamento até uma auditoria pegar.

Páginas institucionais (`/sobre/`, `/transparencia/`, `/comunidade/`) não entram no registry — o schema só aceita `tool`/`guide`/`article`/`protocolo`. Elas vivem na allowlist `INSTITUTIONAL_URLS` do `validate_registry.py` e no `sitemap.xml` do portal, porque são do mesmo host.

Tipos aceitos: `tool`, `guide` e `article`. `tone` (`green` ou `blue`) e `icon` são opcionais e exclusivos de ferramentas/guias. Artigos exigem `publishedAt` no formato `YYYY-MM-DD`. IDs publicados nunca são renomeados.

Antes do commit, valide o registry, o sitemap e a segurança:

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
python3 validate_registry.py
python3 security_check.py .
```

Commit + push — ferramentas e guias aparecem no portal; artigos aparecem no portal e no blog (deploy via GitHub Actions).

## Hub-and-spoke

O logo no header de cada ferramenta (`ferramenta-kit/template`) linka de volta pra `https://dltacademy.github.io/`. O portal é a home; as ferramentas são os spokes.

## Estrutura

```
index.html          hero (logo grande) + grid de cards
js/content-registry.js registry único de ferramentas, guias e artigos
js/portal.js           renderiza os cards do portal a partir do registry
blog/js/blog.js        renderiza o blog a partir do mesmo registry
validate_registry.py  valida schema, destinos locais, sitemap e índice de sitemaps
tests/                 testes dos gates locais
styles-base.css        design system da marca (copiado do kit)
styles-portal.css       hero + grid de cards (específico do portal)
assets/                logo/favicon de marca
og-image.png           preview de compartilhamento
sitemap.xml             SÓ as páginas de dlt.academy — host único por arquivo
sitemap-index.xml       reúne os 5 sitemaps (portal + 4 ferramentas); é o que se submete
.github/workflows/ci.yml      gates em PR e push para main
.github/workflows/pages.yml   deploy automático a cada push
```

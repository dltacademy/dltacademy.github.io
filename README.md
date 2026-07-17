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
validate_registry.py  valida schema, destinos locais e sitemap
tests/                 testes dos gates locais
styles-base.css        design system da marca (copiado do kit)
styles-portal.css       hero + grid de cards (específico do portal)
assets/                logo/favicon de marca
og-image.png           preview de compartilhamento
sitemap.xml             lista a raiz + cada ferramenta
.github/workflows/pages.yml   deploy automático a cada push
```

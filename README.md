# dltacademy.github.io

Portal/hub central da DLT Academy — lista todas as ferramentas web (calculadoras, simuladores, guias) num único lugar. Repo especial de organização: serve na **raiz** do domínio (`https://dltacademy.github.io/`), não num subcaminho.

Página única, zero backend, zero build — mesmo padrão do [ferramenta-kit](https://github.com/dltacademy/ferramenta-kit).

## Registrar uma ferramenta nova

Único arquivo a editar: **`js/tools.js`**. Adicione um objeto ao array `TOOLS`:

```js
{
  name: "Nome da Ferramenta",
  desc: "Descrição de 1 frase.",
  url: "/nome-do-repo/",
  tag: "Público-alvo",
  tone: "green", // "green" ou "blue" — só a cor da etiqueta
}
```

Commit + push — o card aparece no portal automaticamente (deploy via GitHub Actions).

## Hub-and-spoke

O logo no header de cada ferramenta (`ferramenta-kit/template`) linka de volta pra `https://dltacademy.github.io/`. O portal é a home; as ferramentas são os spokes.

## Estrutura

```
index.html          hero (logo grande) + grid de cards
js/tools.js           registry — ÚNICO arquivo a editar pra listar uma ferramenta nova
js/portal.js            renderiza os cards a partir do registry
styles-base.css        design system da marca (copiado do kit)
styles-portal.css       hero + grid de cards (específico do portal)
assets/                logo/favicon de marca
og-image.png           preview de compartilhamento
sitemap.xml             lista a raiz + cada ferramenta
.github/workflows/pages.yml   deploy automático a cada push
```

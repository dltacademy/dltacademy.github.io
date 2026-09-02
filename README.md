# DLT Academy — Decision Lab & Tools

Portal público da DLT Academy em **https://dlt.academy/**. Reúne ferramentas, guias, artigos, protocolos e páginas institucionais num único domínio, sem backend e sem build.

O repositório especial continua se chamando `dltacademy.github.io`, mas o domínio canônico é `dlt.academy`.

Agentes devem ler [AGENTS.md](./AGENTS.md) antes de editar conteúdo ou componentes.

## O que existe hoje

- home registry-driven;
- blog estático;
- guias de referência;
- protocolos interativos;
- páginas `/sobre/`, `/transparencia/` e `/comunidade/`;
- grafo de próximos passos;
- comunidade no fim do conteúdo;
- sitemap por host reunido em `sitemap-index.xml`;
- CI e deploy automático por GitHub Actions.

## Registry Core V1

O catálogo público vive em **`js/content-registry.js`**.

Tipos aceitos:

- `tool` — ferramenta em subdomínio;
- `guide` — guia no portal;
- `article` — artigo no blog;
- `protocolo` — fluxo interativo no portal.

Exemplo de ferramenta:

```js
{
  "id": "tool-nome-estavel",
  "type": "tool",
  "title": "Nome da Ferramenta",
  "description": "Descrição de uma frase.",
  "url": "https://nome.dlt.academy/",
  "tag": "Público-alvo",
  "tone": "green",
  "sit": ["comecar", "taxas"],
  "mark": "NF",
  "effort": "6 perguntas"
}
```

`sit` aceita `comecar`, `posicao`, `viagem` e `taxas`. `mark` é um monograma de até duas letras/números. `effort` só entra quando o esforço está medido na própria peça. IDs publicados não são renomeados; relações usam `primaryNext` e `related`.

## Publicar conteúdo novo no portal

Uma nova peça precisa nascer completa:

1. página local criada;
2. entrada em `js/content-registry.js`;
3. URL no `sitemap.xml` do portal;
4. `#next-step-mount` com `data-content-id` igual ao ID do registry;
5. `content-registry.js` e `next-step.js` carregados;
6. canonical, metadata, JSON-LD e OG próprios;
7. gates verdes.

O checker reprova conteúdo sem mount, script, registro ou relação coerente.

Páginas institucionais não entram no registry. Elas vivem na allowlist `INSTITUTIONAL_URLS` e no `sitemap.xml` do portal.

## Lançar ferramenta nova

Ferramentas vivem em subdomínios e têm sitemap próprio. O protocolo exige host único por arquivo.

No portal, alterar no mesmo commit:

| Arquivo | Mudança |
|---|---|
| `js/content-registry.js` | adicionar o card da ferramenta |
| `sitemap-index.xml` | adicionar o sitemap da ferramenta |
| `sitemap.xml` | **não** recebe URL do subdomínio |

A ferramenta declara sua URL no próprio `sitemap.xml`.

## Validação

```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 validate_registry.py
python3 security_check.py .
find . -name '*.js' -not -path './.git/*' -print0 | xargs -0 -n1 node --check
```

O CI executa os gates em PR e push para `main`.

## Arquitetura de navegação

```text
ferramenta → guia → cadastro         aquisição
conteúdo → comunidade → volta        retenção
```

O registry governa o grafo dentro do portal. Ferramentas em subdomínios declaram somente sua aresta de saída local, sem duplicar o registry inteiro.

## Estrutura

```text
index.html                   home
js/content-registry.js       registry único
js/portal.js                 cards da home
js/next-step.js              grafo + comunidade
js/dlt-interactions.js       comportamentos opt-in dos componentes
dlt-patterns.css             biblioteca visual de 31 padrões
og-template.svg              base social 1200 × 630 por peça
blog/                        artigos e template
protocolos/                  protocolos interativos
js/protocol-engine.js        motor compartilhado
styles-protocols.css         tela e impressão dos protocolos
guias/                       guias de referência
sobre/ transparencia/ comunidade/
validate_registry.py         schema, destinos, mounts e sitemaps
security_check.py            baseline de segurança
tests/                       contratos automatizados
sitemap.xml                  somente URLs de dlt.academy
sitemap-index.xml            portal + 4 ferramentas
.github/workflows/ci.yml     gates
.github/workflows/pages.yml  deploy
```

## Regras permanentes

- zero backend e zero coleta de respostas pessoais;
- JavaScript executável somente em arquivos externos;
- artigo e guia usam disclosure global; ferramenta e protocolo interativo declaram junto da recomendação;
- comunidade pública, nunca contato pessoal como CTA;
- conteúdo novo sempre termina com próximo passo coerente;
- nenhuma referência ao vault ou contexto privado em repositório público.

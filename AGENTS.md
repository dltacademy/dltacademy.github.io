# Instruções para agentes

Leia este arquivo antes de criar ou alterar uma peça pública.

## Ordem de leitura

1. `README.md` e o arquivo específico da peça;
2. `dlt-patterns.css` para componentes visuais;
3. `blog/template-post.html` quando o formato for artigo;
4. `js/content-registry.js`, `sitemap.xml` e os testes relacionados antes de publicar.

## Regras duras

1. **Número, data, escopo e fonte andam juntos.** Valor não verificado não entra como fato.
2. **Conclusão derivada também é claim.** Se o número está pendente, veredito e CTA derivados também estão.
3. **“Grátis” não descreve custo parcial.** Compare custo para formar saldo, câmbio, tributos, produto, rede/ATM e benefício.
4. **Uma ação primária por tela e no máximo três blocos destacados por peça.**
5. **Experiência própria não é inventada.** Relato pessoal e fonte oficial permanecem distinguíveis.

## Sistema visual

- `dlt-patterns.css` contém os 31 padrões e é carregado depois dos estilos base/específicos;
- `js/dlt-interactions.js` contém comportamentos opt-in por `data-*`;
- nenhum claim volátil ou fórmula de produto entra no JavaScript compartilhado;
- use monograma de duas letras ou numeral, não emoji, em cards e ícones de produto;
- mínimo de 15 px para texto e 44 px para alvo de toque;
- preserve funcionamento sem JavaScript e respeite `prefers-reduced-motion`.

## Anatomia

- **Artigo:** lede → O essencial → sumário quando necessário → corpo → veredito → oferta → FAQ → fontes → compartilhar → próximo passo.
- **Guia:** objetivo → pré-requisitos → etapas → verificação → falhas → plano B → fontes → próximo passo.
- **Protocolo:** uma pergunta por tela → três desfechos → plano; em alerta, contenção antes de conversão.
- **Ferramenta:** pergunta → promessa/esforço/privacidade → controle → resultado → limites → ação contextual.

## Segurança e publicação

- CSP permanece restritiva e não recebe JavaScript inline;
- links externos usam `noopener noreferrer` e `referrerpolicy="no-referrer"`; links comerciais também usam `sponsored nofollow`;
- promoções preservam `<!-- PROMO_ATUAL -->`, `data-promotion` e `data-verified-at`;
- sem data final publicada, o rótulo é “por tempo indeterminado”;
- artigo e guia usam disclosure global no rodapé e em `/transparencia/`; ferramenta/protocolo interativo usa disclosure junto da recomendação;
- registry, sitemap, canonical, OG e testes mudam no mesmo PR quando aplicáveis;
- zero referência ao vault, a notas privadas ou a caminhos internos.

## Gates

Carregar `dlt-patterns.css` e `dlt-interactions.js` é pré-requisito, não prova de
implementação. Antes do PR, compare cada peça com o modelo correspondente e
registre a evidência: componentes presentes, adaptações justificadas, entradas
que mudam a saída, exportação/partilha quando aplicável e limites explícitos.
Confira editorial, visual, mobile, teclado, contraste, overflow, share sem dados
sensíveis e console. Valide em 1440 px, 390 px e 320 px quando a peça for
interativa; não aceite um screenshot como substituto para medir `scrollWidth`.
Depois execute:

```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 validate_registry.py
python3 security_check.py .
find . -name '*.js' -not -path './.git/*' -print0 | xargs -0 -n1 node --check
```

O gate editorial e a matriz privada do projeto devem ser atualizados no mesmo
ciclo do PR. Presença da biblioteca não comprova implementação do modelo.

# Instruções para agentes

Leia este arquivo antes de criar ou alterar uma peça pública.

Toda regra aqui serve a uma coisa: o leitor decidir bem, rápido e com confiança.
Se uma regra não ajuda nisso, ela não deve existir. Se um teste ou gate atrapalha
uma melhoria real de texto ou de experiência, o gate está errado: corrija o gate.

## Ordem de leitura

1. `README.md` e os arquivos da peça (`CLAIMS.md`, `PUBLISHING.md`, quando existirem);
2. `dlt-patterns.css` para componentes visuais;
3. `blog/template-post.html` quando o formato for artigo;
4. `js/content-registry.js`, `sitemap.xml` e `tests/data/affiliate_links.json` antes de publicar.

## Escrever para o leitor

1. **Resposta primeiro.** Nos primeiros parágrafos o leitor já sabe o que fazer e qual o caminho mais curto. A explicação vem depois, para quem quer entender.
2. **Fale com uma pessoa.** Frases curtas, voz ativa, primeira pessoa quando é experiência de quem escreve. Sem jargão interno (nome de projeto, "pilar", "camada") e sem termo técnico sem tradução na primeira vez.
3. **Concretize.** Número com unidade e contexto, exemplo com valor, cenário com uma pessoa e algo em jogo. Sem adjetivo de propaganda e sem urgência inventada.
4. **Diga quando não serve.** Toda recomendação diz para quem ela falha, o que pode dar errado e o plano B.
5. **Destaque só o que muda uma decisão.** Nota, alerta ou oferta em destaque existe para mudar o que o leitor faz. Se não muda, é parágrafo. Sem limite fixo de blocos: o critério é esse.
6. **Uma ação primária por tela.**
7. **Experiência própria não é inventada.** Relato pessoal e fonte oficial permanecem distinguíveis. Captura de tela entra recortada, sem dado de conta, cartão, hash ou ID.

## Dado, claim e fonte

1. **Número, data, escopo e fonte andam juntos.** Valor não verificado não entra como fato. Conclusão derivada (veredito, CTA, comparação) também é claim: se o número está pendente, ela também está.
2. **"Grátis" não descreve custo parcial.** Compare custo para formar saldo, câmbio, tributos, produto, rede/ATM e benefício.
3. **`CLAIMS.md` é o registro do que é volátil.** Peça com número que envelhece (tarifa, cotação, promoção, limite) ganha um `CLAIMS.md` ao lado: cada claim com evidência, data e próxima revisão. Mudou o número, muda o `CLAIMS.md` no mesmo PR. O texto da página pode ser reescrito à vontade; o registro é que precisa ficar verdadeiro.
4. **Promoções** ficam isoladas em `<!-- PROMO_ATUAL -->`, com `data-promotion` e `data-verified-at`. Sem data final publicada, o rótulo é "por tempo indeterminado".

## Links de indicação

- A fonte única é `tests/data/affiliate_links.json`. Trocar um código é editar esse arquivo e as páginas; `test_affiliate_links.py` reprova qualquer variante fora da lista.
- Nunca "corrija" um código de memória ou de um documento antigo. O código vem da conta do provedor (área de indicação) e do arquivo acima.
- Todo link de indicação usa `target="_blank"`, `rel="nofollow noopener noreferrer"` e `referrerpolicy="no-referrer"`. Não usa `sponsored`: não é publicidade paga, são indicações de produtos que o Tiago usa.
- Antes de divulgar, ou depois de trocar um código, rode `python3 check_affiliate_links.py`. Ele abre cada link ao vivo. O que voltar "inconclusivo" (bloqueio antirrobô) se confere no navegador.
- Artigo e guia usam a divulgação global do rodapé e de `/transparencia/`. Ferramenta e protocolo interativo mostram a divulgação junto da recomendação.

## Sistema visual e interação

- `dlt-patterns.css` reúne os componentes e é carregado depois dos estilos base/específicos; `js/dlt-interactions.js` reúne comportamentos opt-in por `data-*`. Carregar os dois é pré-requisito, não prova de que o modelo foi implementado.
- Guia longo usa os padrões prontos, sem reinventar na página: `.jump-nav` (atalhos por situação + índice recolhido, num bloco só), `.back-nav` (botão fixo "Índice" com a seção atual) e `.compare.is-stack` (tabela que vira cartão no celular; `data-label` em todo `td`, sem `rowspan`/`colspan`). O comentário de cada um em `dlt-patterns.css` tem o HTML.
- Não use `display:flex`/`grid` em elemento com texto misturado com `<strong>`/`<a>`: cada pedaço vira coluna e o texto sai da caixa.
- Nenhum claim volátil entra no JavaScript compartilhado. A fórmula de uma peça fica no JS da própria peça e lê as tarifas de atributos `data-*` datados no HTML.
- Monograma de duas letras ou numeral, não emoji, em cards e ícones de produto.
- Em componente novo ou alterado: texto corrido com 15 px ou mais; legenda, rótulo e metadado não abaixo de 12 px; alvo de toque com 44 px ou mais. (O CSS antigo tem rótulos menores; melhore quando mexer, sem refazer o que não está no escopo.)
- O conteúdo essencial funciona sem JavaScript. Respeite `prefers-reduced-motion`, foco visível e navegação por teclado.
- Imagem de conteúdo tem `alt`, `width` e `height`, e `loading="lazy"` fora da primeira tela. Prefira WebP.

## Anatomia

- **Artigo:** lede → O essencial → sumário quando necessário → corpo → veredito → oferta → FAQ → fontes → compartilhar → próximo passo.
- **Guia:** objetivo → pré-requisitos → etapas → verificação → falhas → plano B → fontes → próximo passo.
- **Protocolo:** uma pergunta por tela → três desfechos → plano; em alerta, contenção antes de conversão.
- **Ferramenta:** pergunta → promessa/esforço/privacidade → controle → resultado → limites → ação contextual.

## Segurança e publicação

- CSP permanece restritiva e não recebe JavaScript inline;
- links externos usam `noopener noreferrer` e `referrerpolicy="no-referrer"`;
- registry, sitemap, canonical, OG e `CLAIMS.md` mudam no mesmo PR quando aplicáveis;
- zero referência ao vault, a notas privadas ou a caminhos internos.

## Verificação

Antes do PR, rode os quatro comandos. São os mesmos do CI:

```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 validate_registry.py
python3 security_check.py .
find . -name '*.js' -not -path './.git/*' -print0 | xargs -0 -n1 node --check
```

O que eles garantem, para toda página descoberta no disco (peça nova entra sem editar teste):
metadados e imagem de compartilhamento (PNG 1200×630 com `alt`), `h1` único, ids únicos,
`alt` em imagens, links internos e âncoras que existem, ids que os scripts procuram,
promoções datadas, JSON-LD coerente, sitemap, anatomia de artigo e guia, links de
indicação canônicos, CSP e integridade do registry.

**Testes não travam prosa.** Frase, título, número, ordem de parágrafo, nome de classe e valor de CSS não são contrato: melhorar um texto nunca deve exigir editar teste. Quem quiser proteger contra um erro factual, de privacidade ou de jargão que já aconteceu, acrescenta uma linha em `tests/test_regressions.py`, com o motivo.

**Checklist manual**, só para peça interativa nova ou mudança de layout (não para passada editorial):
1440 px, 390 px e 320 px sem estouro horizontal (meça `scrollWidth`; screenshot não substitui),
teclado, contraste, console sem erro e compartilhamento sem dado sensível.

Registros privados do projeto (matriz de cobertura, gate editorial) ficam fora deste repositório e não bloqueiam PR: quem os mantém atualiza depois do merge.

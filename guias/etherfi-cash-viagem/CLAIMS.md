# Claims voláteis — revisão de 29/07/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio guia.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| ether.fi Cash | faixas de cashback, exclusões, Direct Pay, Borrow Mode, FX, saques, cartões físicos e jurisdições em fontes oficiais | 29/08/2026 |
| Promoção de indicação | oferta de 10% em delivery, restaurantes, supermercados e Uber informada no link do afiliado em 29/07/2026; campanha temporária | antes de cada divulgação e, no máximo, 05/08/2026 |
| Fluxo navegador → app | experiência pessoal do Tiago; não tratar como regra universal documentada | revisar se o onboarding mudar |
| Wise Brasil | tarifa de conversão e saques em fonte oficial | 29/08/2026 |
| Revolut Brasil | franquias e tarifas do Standard em fonte oficial | 29/08/2026 |
| Bybit Card Brasil | FX, conversão cripto e padding em fonte oficial | 29/08/2026 |

## Bloco de promoção

A oferta temporária está delimitada no HTML por:

```html
<!-- PROMO_ATUAL -->
...
<!-- /PROMO_ATUAL -->
```

Ao trocar a promoção:

1. abrir o link de afiliado e conferir benefício, categorias, prazo, região e condição de entrada;
2. alterar somente o bloco delimitado, a data `data-verified-at` e esta tabela;
3. não alterar a tese estrutural do artigo: o cartão foi escolhido pelo custo líquido e pelo cashback padrão, não por uma campanha temporária;
4. não afirmar que a oferta é garantida até a pessoa confirmar a página e a elegibilidade;
5. manter o relato do erro de cadastro como experiência pessoal, não como documentação oficial do produto.

Se uma revisão vencer, não atualizar apenas a data: conferir a fonte e registrar qualquer mudança material no histórico do Git.

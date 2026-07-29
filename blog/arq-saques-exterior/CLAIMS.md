# Claims voláteis — revisão de 29/07/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio artigo.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| Saques ARQ Standard | páginas oficiais de tarifas e ATM: 1% sobre o valor retirado; taxa do operador pode ser adicional | 29/08/2026 |
| Quantidade de saques | documentação Standard não publica franquia por número; não converter isso em promessa de saques ilimitados | 29/08/2026 |
| Disponibilidade por país | página geral informa saques globais; página Premium contém nota restritiva a Colômbia e México | 05/08/2026 ou após resposta oficial |
| ARQ Premium e Prestige | franquias publicadas de 500 e 700 USDc; preços e disponibilidade dependem do plano e país | 29/08/2026 |
| Cartão físico | envio Standard de 4,99 USD e entrega em Argentina, Brasil, Colômbia e México | 29/08/2026 |
| Conversão no Brasil | custo total aproximado de 0,5% entre BRL e USDc/EURc informado pela ARQ | 29/08/2026 |
| Revolut Standard Brasil | R$ 1.600 ou cinco saques sem tarifa própria; depois 2% ou R$ 6, o maior | 29/08/2026 |
| Promoção de indicação | oferta de US$ 10 após US$ 150 em gastos elegíveis no primeiro mês, informada para o link em 29/07/2026 | antes de cada divulgação e, no máximo, 05/08/2026 |
| Uso durante viagens | experiência pessoal do Tiago com cartão emitido ainda na fase DolarApp; não tratar como compatibilidade universal | revisar após novos testes |

## Bloco de promoção

A oferta temporária está delimitada no HTML por:

```html
<!-- PROMO_ATUAL -->
...
<!-- /PROMO_ATUAL -->
```

Ao revisar a promoção:

1. abrir o link de indicação e conferir recompensa, gasto mínimo, prazo, região e estabelecimentos elegíveis;
2. alterar somente o bloco delimitado, a data `data-verified-at` e esta tabela;
3. preservar a tese estrutural: o ARQ foi escolhido para saques e acesso a dinheiro físico, não por causa do bônus;
4. não prometer a recompensa até a pessoa confirmar a campanha na página e cumprir as condições;
5. manter a distinção entre documentação oficial e experiência pessoal com o cartão.

Se uma revisão vencer, não atualizar apenas a data: conferir a fonte e registrar qualquer mudança material no histórico do Git.

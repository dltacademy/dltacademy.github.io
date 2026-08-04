# Claims voláteis — revisão de 29/07/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio artigo.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| Saques ARQ Standard | páginas oficiais de tarifas e ATM: 1% sobre o valor retirado; taxa do operador pode ser adicional | 29/08/2026 |
| Quantidade de saques | documentação Standard não publica franquia por número; não converter isso em promessa de saques ilimitados | 29/08/2026 |
| Disponibilidade por país | página geral informa saques globais; página Premium contém nota restritiva a Colômbia e México | 05/08/2026 ou após resposta oficial |
| ARQ Premium e Prestige | franquias publicadas de 500 e 700 USDc; preços e disponibilidade dependem do plano e país | 29/08/2026 |
| Cartão físico | página geral: envio Standard de 4,99 USD; página de rebranding: primeiro físico grátis para quem nunca teve cartão e mantém mais de 100 USDc. Confirmar a condição mostrada no app | 03/09/2026 |
| Conversão no Brasil | custo total aproximado de 0,5% entre BRL e USDc/EURc informado pela ARQ | 29/08/2026 |
| Wise cartão emitido no Brasil | uma retirada gratuita por mês; depois tarifa fixa de R$ 20 por retirada; conversão e tarifa do ATM podem ser adicionais | 29/08/2026 |
| Wise conversão e IOF | tarifa de conversão a partir de 0,78%; a página atual de cartões no Brasil informa 3,5% de IOF na conversão de BRL para outra moeda e esclarece que o imposto ocorre na conversão, não na compra/saque como tarifa separada | 29/08/2026 |
| Wise mudança da franquia de ATM | a página de ajuda atualizada para 01/05/2026 informa 1 saque grátis e R$ 20 nos seguintes para cartões emitidos no Brasil; o limite monetário de R$ 1.400 em dois saques pertence ao adendo histórico de 19/11/2024 | 29/08/2026 |
| Wise programa de indicação | programas e benefícios variam por região; o benefício válido é o exibido na página personalizada no momento do cadastro | antes de cada divulgação e, no máximo, 05/08/2026 |
| Revolut Standard Brasil | R$ 1.600 ou cinco saques sem tarifa própria; depois 2% ou R$ 6, o maior | 29/08/2026 |
| Revolut conversão BRL | câmbio sem tarifa até R$ 1.000/mês; depois 1,4% para BRL→moeda estrangeira; IOF deve ser confirmado no app | 29/08/2026 |
| Promoção de indicação ARQ | oferta de US$ 10 após US$ 150 em gastos elegíveis no primeiro mês; nenhuma data final é publicada, portanto a campanha é tratada como por tempo indeterminado | antes de cada divulgação |
| Uso durante viagens | experiência pessoal do Tiago com cartão emitido ainda na fase DolarApp; não tratar como compatibilidade universal | revisar após novos testes |

## Nota editorial de 04/08/2026

A redação preserva a experiência real com o DolarApp/ARQ e deixa as comparações como apoio. O título continua **“O cartão que usamos para sacar dinheiro no exterior”**. Nesta revisão, o link afiliado concorrente e disclosures locais foram removidos, o custo total foi explicitado, a Wise foi revalidada após a mudança de 01/05/2026 e a condição do primeiro cartão físico foi reconferida em fonte oficial.

## Blocos de promoção e indicação

A oferta do ARQ, atualmente publicada por tempo indeterminado, está delimitada no HTML por:

```html
<!-- PROMO_ATUAL -->
...
<!-- /PROMO_ATUAL -->
```

Ao revisar a promoção do ARQ:

1. abrir o link de indicação e conferir recompensa, gasto mínimo, região, estabelecimentos elegíveis e se passou a existir uma data final;
2. alterar somente o bloco delimitado, a data `data-verified-at` e esta tabela;
3. preservar a tese estrutural: o ARQ foi escolhido para saques e acesso repetido a dinheiro físico, não por causa do bônus;
4. não prometer a recompensa até a pessoa confirmar a campanha na página e cumprir as condições;
5. manter a distinção entre documentação oficial e experiência pessoal com o cartão;
6. quando nenhuma fonte oficial ou página da campanha publicar data final, registrar **por tempo indeterminado**; não inventar prazo nem manter bloqueio `needs-human` apenas pela ausência de uma data.

Se uma revisão vencer, não atualizar apenas a data: conferir a fonte e registrar qualquer mudança material no histórico do Git. Wise e Revolut permanecem como comparação editorial, sem link afiliado concorrente nesta peça.

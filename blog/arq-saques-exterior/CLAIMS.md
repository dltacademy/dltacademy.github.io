# Claims voláteis — revisão de 05/08/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio artigo.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| Cartão Global ARQ e IOF | páginas específicas de impostos e do Cartão Global afirmam saldo USDc/EURc comprado sem IOF e uso internacional sem imposto adicional | 05/09/2026 |
| Inconsistência documental ARQ | FAQ promocional antiga diz que ~0,5% inclui IOF; para classificação tributária, priorizar páginas específicas de impostos e produto | 05/09/2026 |
| Conversão ARQ | taxa próxima de 0,5% para formar ou converter saldo global; tratar como custo de conversão, não IOF | 05/09/2026 |
| Saques ARQ Standard | comissão de 1% sobre o valor retirado; taxa do operador do ATM pode ser adicional | 05/09/2026 |
| ARQ Premium e Prestige | franquias publicadas de 500 e 700 USDc; disponibilidade depende do plano e país | 05/09/2026 |
| Funding ARQ | depósitos em moeda local gratuitos; recargas em USD/EUR/cripto no Standard custam 3 USDc ou 3 EURc | 05/09/2026 |
| Cartão físico ARQ | envio publicado de 4,99 USDc, sem anuidade | 05/09/2026 |
| Wise conversão e IOF | 3,5% de IOF em BRL→moeda estrangeira; tarifa variável a partir de 0,78% | 05/09/2026 |
| Wise saques Brasil | uma retirada gratuita por mês; depois R$ 20 por retirada; ATM pode cobrar por fora | 05/09/2026 |
| Revolut BRL | IOF aplicável exibido no app; cotação do provedor Ebury com spread; até R$ 1.000/mês sem tarifa própria e depois 1,4% em BRL→moeda estrangeira | 05/09/2026 |
| Revolut câmbio entre moedas | Standard: 1% no fim de semana e 0,5% acima de R$ 10.000 por ciclo | 05/09/2026 |
| Revolut saques | grátis até R$ 1.600 ou cinco saques; depois 2% ou R$ 6, o maior | 05/09/2026 |
| ATM e DCC | custos externos e variáveis; DCC deve ficar em 0% por padrão e ser recusado | revisar após novos testes |
| Promoção de indicação ARQ | em 29/07/2026 o convite mostrava US$ 10 após US$ 150 em gastos elegíveis no primeiro mês | antes de cada divulgação |

## Regra editorial

Não resumir a comparação como “ARQ 1% vs. saque grátis”. A rota padrão precisa separar:

1. formação do saldo;
2. IOF;
3. tarifa de conversão;
4. spread;
5. franquia ou sobretaxa mensal;
6. fim de semana e uso justo;
7. tarifa própria de saque;
8. tarifa do ATM;
9. DCC.

## Regra da calculadora

- `Partindo de BRL`: ARQ aplica conversão sem IOF; Wise aplica IOF + conversão; Revolut aplica IOF + tarifa BRL informada + spread.
- `Moeda local já disponível`: zera conversões e IOF.
- `Outra moeda estrangeira`: Wise mantém conversão; Revolut pode somar adicional entre moedas e spread.
- A tarifa BRL da Revolut é editável porque a cobrança depende da franquia e do valor mostrado no app.
- O adicional entre moedas da Revolut aceita 0%, 0,5%, 1% ou 1,5%.
- Não somar automaticamente 3,5% ao ARQ Global.

## Bloco de promoção

A oferta está delimitada no HTML por:

```html
<!-- PROMO_ATUAL -->
...
<!-- /PROMO_ATUAL -->
```

Antes de divulgar:

1. abrir o link e conferir a campanha ativa;
2. confirmar recompensa, gasto mínimo, prazo, região e estabelecimentos elegíveis;
3. atualizar `data-verified-at` apenas após verificação;
4. preservar a tese estrutural: ARQ Global para saques por custo total, não por causa do bônus.

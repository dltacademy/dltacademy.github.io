# Claims voláteis — revisão de 05/08/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio artigo.

## Escopo fixo da comparação

A comparação editorial e a calculadora usam somente as opções pessoais básicas gratuitas, sem mensalidade, anuidade ou assinatura paga:

- **ARQ Standard Global**;
- **cartão Wise padrão gratuito para clientes brasileiros**;
- **Revolut Standard Brasil**.

A Wise não usa “Standard” como nome de plano pessoal. Benefícios de ARQ Premium e de Revolut Plus, Premium, Metal ou Ultra não entram na comparação nem na calculadora.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| Escopo dos planos | ARQ identifica tarifas do plano Standard; Wise publica conta/cartão sem mensalidade ou anuidade; Revolut identifica Standard como plano sem taxa mensal | 05/09/2026 |
| IOF ARQ Global | páginas específicas de impostos e do Cartão Global: USDc/EURc comprados sem IOF; não atribuir IOF aos ~0,5% | 05/09/2026 |
| Conversão ARQ | custo total aproximado de 0,5% informado pela empresa; tratar como conversão estimada e conferir no app | 05/09/2026 |
| Saque ARQ Standard | 1% sobre o valor retirado; taxa do operador pode ser adicional | 05/09/2026 |
| Quantidade de saques ARQ | documentação Standard não publica franquia por número; não converter isso em promessa de saques ilimitados | 05/09/2026 |
| Cartão Local ARQ | uso internacional pode sofrer 3,5% de imposto e taxa cambial da bandeira; não misturar com Cartão Global | 05/09/2026 |
| Wise cartão pessoal Brasil | conta e cartão sem mensalidade ou anuidade; uma retirada gratuita por mês e R$ 20 nas seguintes | 05/09/2026 |
| Wise conversão e IOF | 3,5% de IOF na rota BRL; tarifa variável a partir de 0,78% | 05/09/2026 |
| Revolut Standard Brasil | sem taxa mensal; R$ 1.600 ou cinco saques sem tarifa própria e depois 2% ou R$ 6, o maior | 05/09/2026 |
| Revolut câmbio BRL | IOF aplicável, spread da cotação e até 1,4% após a franquia de R$ 1.000 | 05/09/2026 |
| Revolut entre moedas | Standard publica 1% no fim de semana e 0,5% acima de R$ 10.000 no ciclo de uso justo | 05/09/2026 |
| ATM e DCC | valores variáveis e externos; a calculadora permite informar tarifa fixa por retirada e DCC, cujo padrão é zero | revisar após novos testes |
| Funding e emissão | ARQ Standard pode cobrar 3 USDc/3 EURc em certas recargas e 4,99 USDc no envio físico; manter fora do saque recorrente | 05/09/2026 |
| Promoção de indicação ARQ | em 29/07/2026 o convite mostrava US$ 10 após US$ 150 em gastos elegíveis no primeiro mês; campanhas podem mudar | antes de cada divulgação |
| Uso durante viagens | experiência pessoal com cartão emitido ainda na fase DolarApp; não tratar como compatibilidade universal | revisar após novos testes |

## Regra de cálculo

A calculadora diferencia três origens:

1. **BRL:** inclui formação do saldo e IOF onde aplicável;
2. **moeda local do saque:** zera conversão e IOF;
3. **outra moeda estrangeira:** mantém conversão da Wise e spread/adicionais entre moedas da Revolut Standard.

Referência central:

- ARQ Standard Global: 0% de IOF + ~0,5% de conversão + 1% de saque;
- Wise padrão gratuito: 3,5% de IOF na rota BRL + conversão variável + regra de saque;
- Revolut Standard: 3,5% de IOF quando aplicável + spread/tarifas de câmbio + regra de saque;
- todos: ATM e DCC quando aplicáveis.

## Inconsistência documental da ARQ

Uma FAQ promocional antiga usa a expressão “incluindo IOF”. Para a classificação tributária, o artigo prioriza as páginas específicas de impostos e do Cartão Global, que afirmam explicitamente que USDc/EURc são comprados sem IOF. Se essas páginas mudarem, revisar imediatamente o artigo, a calculadora e este arquivo.

## Bloco de promoção

A oferta está delimitada no HTML por:

```html
<!-- PROMO_ATUAL -->
...
<!-- /PROMO_ATUAL -->
```

Antes de divulgar:

1. abrir o link e conferir se a conta continua atribuída a uma campanha ativa;
2. confirmar recompensa, gasto mínimo, prazo, região e estabelecimentos elegíveis;
3. atualizar `data-verified-at` apenas se a condição for efetivamente exibida;
4. não transformar ausência de data final em promessa de duração indefinida;
5. preservar a tese estrutural: o ARQ foi escolhido para saques, não por causa do bônus.

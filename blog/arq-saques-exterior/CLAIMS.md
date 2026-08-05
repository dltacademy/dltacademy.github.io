# Claims voláteis — revisão de 05/08/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio artigo.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| Saques ARQ Standard | páginas oficiais de tarifas e ATM: 1% sobre o valor retirado; taxa do operador pode ser adicional | 05/09/2026 |
| Quantidade de saques ARQ | documentação Standard não publica franquia por número; não converter isso em promessa de saques ilimitados | 05/09/2026 |
| ARQ Premium e Prestige | franquias publicadas de 500 e 700 USDc; disponibilidade depende do plano e país | 05/09/2026 |
| IOF do Cartão Global ARQ | páginas específicas de impostos e de comparação Global × Local afirmam que USDc/EURc é comprado e usado no exterior sem IOF | 05/09/2026 |
| Conversão ARQ no Brasil | a ARQ divulga custo total aproximado de 0,5% para BRL↔USDc/EURc, sem IOF; tratar como custo de conversão, não imposto | 05/09/2026 |
| Wise cartão emitido no Brasil | uma retirada gratuita por mês; depois tarifa fixa de R$ 20 por retirada; ATM pode cobrar por fora | 05/09/2026 |
| Wise conversão e IOF | tarifa variável a partir de 0,78%; 3,5% de IOF na conversão de BRL para outra moeda | 05/09/2026 |
| Revolut Standard Brasil | R$ 1.600 ou cinco saques por ciclo sem tarifa própria; depois 2% ou R$ 6, o maior | 05/09/2026 |
| Revolut conversão BRL | franquia de tarifa cambial de R$ 1.000 por ciclo; depois 1,4% para BRL→moeda estrangeira; IOF aplicável e cotação devem ser conferidos no app | 05/09/2026 |
| ATM e DCC | valores variáveis; a calculadora permite informar tarifa fixa por retirada e percentual de DCC, cujo padrão é zero | revisar após novos testes |
| Promoção de indicação ARQ | em 29/07/2026 o convite mostrava US$ 10 após US$ 150 em gastos elegíveis no primeiro mês; campanhas podem mudar ou parar de aceitar novos convites | antes de cada divulgação |
| Uso durante viagens | experiência pessoal com cartão emitido ainda na fase DolarApp; não tratar como compatibilidade universal | revisar após novos testes |

## Nota editorial de 05/08/2026

A ausência de IOF passou a ser tratada como um dos principais diferenciais do Cartão Global ARQ. A calculadora mantém aproximadamente 0,5% como custo total de conversão informado pela empresa e não adiciona IOF à rota ARQ.

Existe uma inconsistência na documentação oficial: a FAQ de uma campanha encerrada usa a expressão “incluindo IOF” ao descrever os 0,5%, enquanto as páginas específicas de impostos e do Cartão Global afirmam que USDc/EURc é comprado sem IOF, e a página “Desafio ARQ” descreve explicitamente o custo de aproximadamente 0,5% como “sem IOF”. Para o artigo, prevalecem as páginas específicas do produto e de impostos. A inconsistência deve continuar registrada aqui e ser revalidada mensalmente.

A campanha de indicação não é descrita como “por tempo indeterminado”. A condição de US$ 10 após US$ 150 é apresentada como a oferta vista em 29/07/2026, com confirmação obrigatória no link e no aplicativo antes do cadastro.

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
3. revisar as páginas específicas de impostos e do Cartão Global antes de repetir “sem IOF”;
4. atualizar `data-verified-at` apenas se a condição for efetivamente exibida;
5. não transformar ausência de data final em promessa de duração indefinida;
6. preservar a tese estrutural: o ARQ foi escolhido para saques e pela formação de saldo global sem IOF, não apenas pelo bônus.

# Claims voláteis — revisão de 05/08/2026

Este arquivo registra o que precisa ser revalidado. As fontes públicas continuam vinculadas no próprio artigo.

## Escopo fixo

A comparação usa somente as opções pessoais básicas gratuitas para clientes brasileiros:

- **ARQ Standard Global**;
- **cartão Wise padrão gratuito**;
- **Revolut Standard Brasil**.

| Bloco | Evidência usada | Próxima revisão |
|---|---|---|
| IOF ARQ Global | USDc/EURc comprados sem IOF nas páginas específicas do Cartão Global | 05/09/2026 |
| Formação do saldo ARQ | custo aproximado de 0,5% informado pela empresa | 05/09/2026 |
| Câmbio até a moeda do saque | varia conforme a cotação aplicada; fica editável na calculadora | revisar após novo saque real |
| Saque ARQ Standard | 1% sobre o valor retirado; ATM pode cobrar por fora | 05/09/2026 |
| Cartão Local ARQ | não entra na comparação do Cartão Global | 05/09/2026 |
| Wise Brasil | 3,5% de IOF na rota BRL, conversão a partir de 0,78%, uma retirada grátis e R$ 20 nas seguintes | 05/09/2026 |
| Revolut Standard Brasil | IOF aplicável, spread, franquia de câmbio, R$ 1.600 ou cinco saques e cobrança posterior | 05/09/2026 |
| Revolut planos pagos | franquias oficiais de saque de R$ 2.000 no Plus, R$ 3.000 no Premium, R$ 6.000 no Metal e R$ 14.000 no exterior no Ultra | 05/09/2026 |
| ATM e DCC | valores variáveis; campos editáveis na calculadora | revisar após novos testes |
| Promoção ARQ | em 29/07/2026 o convite mostrava US$ 10 após US$ 150 em gastos elegíveis no primeiro mês | antes de cada divulgação |

## Regra da calculadora

A calculadora foca na rota central do artigo: **BRL → saldo internacional → saque**.

- ARQ: formação de USDc/EURc + ajuste cambial até a moeda do saque + 1% de retirada;
- Wise: IOF + conversão + regra mensal de retirada;
- Revolut: IOF + spread/tarifas de câmbio + regra de retirada;
- todos: tarifa do ATM e DCC quando aplicáveis.

O ajuste cambial do ARQ começa em zero e deve ser preenchido com a diferença observada na cotação ou no débito liquidado. Os planos pagos da Revolut não entram na calculadora; aparecem apenas como alternativa contextual.

## Links de indicação

- ARQ: botão principal da oferta, com a campanha datada;
- Wise: link contextual `https://wise.com/invite/irhc/tiagon100`, sem CTA concorrente;
- Revolut: link contextual e CTA secundário `https://revolut.com/referral/?referral-code=tiago327k!AUG1-26-AR-BR-H3&geo-redirect`.

## Bloco de promoção

A oferta do ARQ está delimitada por `PROMO_ATUAL`. Antes de divulgar, abrir o link, confirmar a condição exibida e atualizar `data-verified-at` apenas depois da verificação.

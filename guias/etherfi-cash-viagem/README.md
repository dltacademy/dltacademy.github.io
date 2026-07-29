# Por que uso o ether.fi Cash no exterior

Guia pessoal e comparativo da DLT Academy. A página documenta a pesquisa e a experiência real que levaram o ether.fi Cash a se tornar o cartão principal do Tiago para compras internacionais.

## Tese editorial

- conclusão forte, mas delimitada ao perfil e ao uso documentado;
- 3% de cashback como benefício estrutural que pode cobrir os poucos custos e deixar retorno líquido;
- promoções como vantagem temporária, nunca como fundamento permanente;
- Direct Pay como modo usado; Borrow Mode apenas como risco explicado e não recomendado;
- Wise, Revolut, Bybit e cartões brasileiros aparecem para explicar a decisão, não para simular um empate;
- cartão físico e saques como principal lacuna do setup;
- relato do cadastro pelo navegador como experiência real que evita a repetição do erro.

## Atualização da promoção

O bloco temporário está entre `<!-- PROMO_ATUAL -->` e `<!-- /PROMO_ATUAL -->`.

Antes de cada divulgação:

1. abrir `https://www.ether.fi/@e155ee95`;
2. conferir a oferta, o prazo, as categorias, a região e as condições;
3. atualizar o texto do bloco, `data-verified-at` e `CLAIMS.md`;
4. preservar o link com `rel="sponsored nofollow noopener noreferrer"`;
5. não transformar uma campanha temporária em promessa permanente.

## Gates

Execute no diretório raiz do portal:

```bash
python3 security_check.py
python3 validate_registry.py
python3 -m unittest discover -s tests -p 'test_*.py'
```

Revise também desktop, celular, teclado, console, links externos e a renderização do SVG social.

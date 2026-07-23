# Guia ether.fi Cash para viagem

Página editorial estática da DLT Academy.

## Atualização

Claims de produto, taxas, faixas, elegibilidade e restrições são voláteis. Antes de alterar ou republicar números:

1. revalidar nas fontes oficiais vinculadas na página;
2. atualizar as datas visíveis e o `dateModified`;
3. preservar a distinção entre residência da conta e país de uso;
4. manter Direct Pay como caminho padrão e Borrow Mode como modo avançado não recomendado;
5. manter Wise, Revolut e a saída “não abrir outra conta” como alternativas legítimas.

## Gates

Execute no diretório raiz do portal:

```bash
python3 security_check.py
python3 validate_registry.py
python3 -m unittest discover -s tests -p 'test_*.py'
```

A imagem social em SVG é a fonte vetorial. Antes da publicação final, exporte também `og-image.png` em 1200 × 630 se o canal de distribuição exigir compatibilidade raster.

# Calculadora de Multa Compensatória — versão 2.6.0

Aplicação estática para GitHub Pages, sem dependências de framework e sem servidor.

## Arquivos

- `index.html` — estrutura do formulário, resultado e demonstrativo de impressão.
- `style.css` — layout responsivo e folha A4 própria.
- `script.js` — busca cadastral, validações, cálculo, relatório e histórico local.
- `identidade-itajai.svg` — arquivo da identidade visual utilizada no cabeçalho e na impressão.
- `zonasfiscais.txt` — base cadastral completa usada pela busca automática (deve ser adicionada por você).

## Publicação no repositório atual

1. Faça uma cópia de segurança dos arquivos atuais.
2. Substitua `index.html`, `style.css` e `script.js` pelos arquivos desta pasta.
3. Mantenha `identidade-itajai.svg` na raiz do repositório.
4. Se quiser manter compatibilidade, também pode deixar o `cabecalho.png` antigo como imagem de fallback.
5. Adicione à raiz o arquivo completo usado pela busca cadastral com o nome exato `zonasfiscais.txt`.
6. Confirme que o GitHub Pages publica a raiz da branch selecionada.

A aplicação tenta carregar automaticamente `./zonasfiscais.txt`. Se o arquivo não estiver disponível, a tela permite carregá-lo manualmente pelo navegador e também permite selecionar manualmente a zona fiscal.

## Regra correta do Fator de Localização da multa

A última coluna do arquivo `zonasfiscais.txt` pode conter o fator utilizado pela Planta Genérica de Valores, com valores aproximadamente entre 1,64 e 25. Esse número é mantido apenas como dado cadastral e **não entra no cálculo da multa compensatória**.

A calculadora usa exclusivamente a zona fiscal para obter o FL da multa:

| Zona fiscal | Cor | FL da multa |
|---:|---|---:|
| 1 | Azul | 1,00 |
| 2 | Ciano | 1,10 |
| 3 | Laranja | 1,20 |
| 4 | Verde | 1,40 |
| 5 | Vermelho | 1,70 |
| 6 | Cinza | 2,00 |
| 7 | Magenta | 2,50 |
| 8 | Preto | 3,30 |
| 9 | Marrom | 4,00 |
| 10 | Bege | 5,00 |

## Parâmetros centralizados

Os parâmetros anuais ficam no início de `script.js`, no objeto `CONFIG`:

```js
const CONFIG = Object.freeze({
  ufm: 252.59,
  exercicio: 2026,
  decretoUfm: 'Decreto nº 13.857, de 13 de novembro de 2025',
  leiMulta: 'Lei Complementar nº 429/2023',
  leiFatores: 'Lei Complementar nº 20/2002',
  versao: '2.6.0',
  arquivoZonas: './zonasfiscais.txt',
  areaPorVaga: 15,
  historyStorageKey: 'multaCompensatoriaHistoricoV26'
});
```

## Principais melhorias incluídas na versão 2.6.0

- adaptação visual à nova identidade do Município de Itajaí;
- novo cabeçalho com marca oficial e navegação rápida;
- nova hero section com linguagem visual alinhada ao portal do município;
- paleta institucional em azul e amarelo;
- atualização do cabeçalho de impressão com a nova identidade visual;
- manutenção de todas as melhorias anteriores de usabilidade, cálculo e relatório.

## Verificações recomendadas antes da publicação

- testar pelo menos uma inscrição de cada zona fiscal;
- comparar três cálculos conhecidos com a versão anterior;
- imprimir em PDF e em impressora monocromática;
- conferir os textos de ajuda com a equipe responsável pela análise;
- revisar a cada exercício o valor da UFM e o decreto correspondente.

## Privacidade

Não há envio de dados para servidor. O histórico utiliza `localStorage`, permanece somente no navegador e pode ser apagado na própria página.

## Alteração da versão 2.6.0

- removidos da tela de resultado os três cards de resumo: BMC, critério de incidência e quantidade de irregularidades;
- a síntese permanece disponível no demonstrativo de impressão e na memória matemática.

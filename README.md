# Calculadora de Multa Compensatória — versão 2.0

Aplicação estática para GitHub Pages, sem dependências de framework e sem servidor.

## Arquivos

- `index.html` — estrutura do formulário, resultado e demonstrativo de impressão.
- `style.css` — layout responsivo e folha A4 própria.
- `script.js` — busca cadastral, validações, cálculo, relatório e histórico local.
- `zonasfiscais.modelo.txt` — exemplo do formato aceito pela busca automática.
- `cabecalho.png` — deve ser mantido do repositório atual, caso se deseje usar o cabeçalho institucional existente.

## Publicação no repositório atual

1. Faça uma cópia de segurança dos arquivos atuais.
2. Substitua `index.html`, `style.css` e `script.js` pelos arquivos desta pasta.
3. Mantenha o arquivo atual `cabecalho.png` na raiz do repositório.
4. Adicione à raiz o arquivo completo usado pela busca cadastral com o nome exato `zonasfiscais.txt`.
5. Confirme que o GitHub Pages publica a raiz da branch selecionada.

A aplicação tenta carregar automaticamente `./zonasfiscais.txt`. Se o arquivo não estiver disponível, a tela permite carregá-lo manualmente pelo navegador e também permite informar a zona/fator de forma excepcional.

## Formato de `zonasfiscais.txt`

O leitor aceita a tabela em texto com linhas delimitadas por `|`, nesta ordem:

`Setor | Quadra | Face | Descrição Logradouro | Descrição Bairro | Zona | Cor | Fator de localização`

Exemplo:

```text
| 214 | 80 | 2 | OSVALDO REIS - AVENIDA | BALNEARIO SANTA CLARA | 7 | Magenta | 8,75301 |
```

A inscrição `214.080.02.0000` usa setor `214`, quadra `080` e face `02`; o lote não interfere na consulta da zona.

## Parâmetros centralizados

Os parâmetros anuais ficam no início de `script.js`, no objeto `CONFIG`:

```js
const CONFIG = Object.freeze({
  ufm: 252.59,
  exercicio: 2026,
  decretoUfm: 'Decreto nº 13.857, de 13 de novembro de 2025',
  leiMulta: 'Lei Complementar nº 429/2023',
  leiFatores: 'Lei Complementar nº 20/2002',
  versao: '2.0.0',
  arquivoZonas: './zonasfiscais.txt',
  areaPorVaga: 15
});
```

Na atualização anual, altere pelo menos `ufm`, `exercicio`, `decretoUfm` e `versao`.

## Principais melhorias incluídas

- fluxo em quatro etapas;
- máscara rígida da inscrição imobiliária;
- endereço, bairro, zona e FL preenchidos automaticamente;
- contingência para carregamento manual da tabela;
- explicações contextuais para todos os fatores;
- fatores e multiplicadores visíveis durante o preenchimento;
- seleção apenas das irregularidades existentes;
- conversor de vagas faltantes para área;
- conferência antes do cálculo;
- valor parcial de cada irregularidade;
- memória matemática resumida e detalhada;
- modos “Simulação orientativa” e “Demonstrativo administrativo”;
- impressão A4 própria, com tabelas, notas e rodapé;
- histórico local dos oito últimos cálculos, salvo apenas no navegador;
- layout responsivo e navegação por teclado.

## Verificações recomendadas antes da publicação

- testar pelo menos uma inscrição de cada zona fiscal;
- comparar três cálculos conhecidos com a versão anterior;
- imprimir em PDF e em impressora monocromática;
- conferir os textos de ajuda com a equipe responsável pela análise;
- revisar a cada exercício o valor da UFM e o decreto correspondente.

## Privacidade

Não há envio de dados para servidor. O histórico utiliza `localStorage`, permanece somente no navegador e pode ser apagado na própria página.

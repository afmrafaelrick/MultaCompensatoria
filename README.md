# Calculadora de Multa Compensatória — versão 2.9.0

Aplicação estática para GitHub Pages, sem servidor próprio.

## Novidade da versão 2.9.0 — geração direta de PDF

O botão do resultado passou de **“Imprimir / salvar PDF”** para **“Gerar PDF”**.

Agora o aplicativo:

- cria o documento PDF diretamente no navegador;
- baixa o arquivo sem abrir a janela de impressão;
- não acrescenta URL, data, título da página ou outros cabeçalhos automáticos do navegador;
- gera paginação, cabeçalhos e rodapés próprios;
- utiliza a identidade visual do Município de Itajaí;
- cria um nome de arquivo com natureza do documento, inscrição imobiliária e data-base;
- mantém a exigência de sessão administrativa válida para gerar o demonstrativo administrativo.

A geração usa as bibliotecas **jsPDF 3.0.3** e **jsPDF-AutoTable 5.0.2**, carregadas pelo `index.html` por CDN. Portanto, a conexão com a internet precisa estar disponível no momento da geração.

## Arquivos

- `index.html` — estrutura do formulário, resultado e carregamento das bibliotecas de PDF.
- `style.css` — layout responsivo e estados visuais.
- `script.js` — busca cadastral, validações, cálculo, autenticação, geração de PDF e histórico.
- `identidade-itajai.svg` — identidade visual usada no cabeçalho e no PDF.
- `gerar-hash-senha.html` — ferramenta local para gerar o hash de uma nova senha administrativa.
- `zonasfiscais.txt` — base cadastral completa usada pela busca automática; deve permanecer na raiz do site.

## Publicação

1. Faça uma cópia de segurança do repositório atual.
2. Substitua `index.html`, `style.css` e `script.js`.
3. Adicione ou mantenha `identidade-itajai.svg` na raiz.
4. Mantenha `zonasfiscais.txt` na raiz.
5. Mantenha a senha administrativa já definida ou altere seu hash antes da publicação.
6. Faça um cálculo de teste e confirme que o botão **Gerar PDF** baixa o arquivo diretamente.

## Como alterar a senha administrativa

1. Abra localmente `gerar-hash-senha.html`.
2. Digite a nova senha e clique em **Gerar hash**.
3. Copie o resultado.
4. Abra `script.js`.
5. Substitua o conteúdo de `adminPasswordHash` pelo novo hash.

```js
adminPasswordHash: 'COLE_AQUI_O_NOVO_HASH',
```

## Limitação da proteção por senha

Como o GitHub Pages publica arquivos estáticos, a senha é uma barreira de uso contra acesso casual, não uma autenticação segura em servidor. Para controle rigoroso de usuários, seria necessário proteger o endereço por autenticação institucional, VPN, Cloudflare Access ou backend próprio.

## Regra do Fator de Localização da multa

A última coluna do arquivo `zonasfiscais.txt` pode conter o fator da Planta Genérica de Valores. Esse número não entra no cálculo da multa compensatória. O FL da multa é obtido exclusivamente pela zona fiscal:

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

## Fator de Acabamento — FA

O FA deve ser obtido objetivamente pela soma da pontuação da tabela correspondente da Lei Complementar nº 20/2002. A ajuda da aplicação apresenta as faixas de enquadramento para residencial multifamiliar, residencial unifamiliar e comercial.

## Privacidade

Os dados do cálculo não são enviados a servidor próprio. O histórico utiliza `localStorage`, e a autorização administrativa utiliza `sessionStorage` na aba atual.

# Calculadora de Multa Compensatória — versão 2.8.0

Aplicação estática para GitHub Pages, sem dependências de framework e sem servidor.

## Novidade desta versão

O modo **Demonstrativo administrativo** passou a exigir senha. A proteção inclui:

- solicitação da senha em uma janela própria;
- hash SHA-256, sem senha escrita diretamente no código;
- sessão válida por 60 minutos e somente na aba atual;
- botão para bloquear novamente o acesso;
- limite de cinco tentativas;
- bloqueio de dez minutos após o limite de erros;
- nova validação no momento de calcular, caso a sessão tenha expirado.

### Senha temporária desta versão

```text
ITJ-Adm#2026-L7q9!
```

Troque essa senha antes de publicar o aplicativo.

## Como alterar a senha

1. Abra localmente o arquivo `gerar-hash-senha.html`.
2. Digite a nova senha e clique em **Gerar hash**.
3. Copie o resultado.
4. Abra `script.js`.
5. No objeto `CONFIG`, substitua o conteúdo de `adminPasswordHash` pelo novo hash.

Exemplo:

```js
adminPasswordHash: 'COLE_AQUI_O_NOVO_HASH',
```

O arquivo `gerar-hash-senha.html` não é necessário no site publicado. Ele pode ser guardado apenas como ferramenta administrativa.

## Limitação de segurança do GitHub Pages

O GitHub Pages publica arquivos estáticos, e toda a lógica executa no navegador. Portanto, essa senha é uma **barreira de uso e conveniência**, adequada para impedir acesso casual, mas não equivale a autenticação segura em servidor. Uma pessoa com conhecimento técnico e acesso ao código público pode contornar a restrição.

Para controle efetivamente seguro, a aplicação deve ser protegida por autenticação externa ou migrada para uma estrutura com servidor, por exemplo:

- Cloudflare Access;
- autenticação institucional;
- servidor interno ou VPN;
- aplicação com backend e controle de usuários.

## Arquivos

- `index.html` — estrutura do formulário, resultado, diálogos e demonstrativo de impressão.
- `style.css` — layout responsivo e folha A4 própria.
- `script.js` — busca cadastral, validações, cálculo, autenticação local, relatório e histórico.
- `identidade-itajai.svg` — identidade visual usada no cabeçalho e na impressão.
- `gerar-hash-senha.html` — ferramenta local para gerar o hash de uma nova senha.
- `zonasfiscais.txt` — base cadastral completa usada pela busca automática; deve permanecer na raiz do site.

## Publicação

1. Faça uma cópia de segurança do repositório atual.
2. Substitua `index.html`, `style.css` e `script.js`.
3. Mantenha `identidade-itajai.svg` na raiz.
4. Mantenha ou adicione `zonasfiscais.txt` na raiz.
5. Altere a senha temporária antes da publicação.
6. Teste o modo administrativo em janela normal e em janela anônima.

## Parâmetros de acesso no `script.js`

```js
adminPasswordHash: '...',
adminSessionMinutes: 60,
adminMaxAttempts: 5,
adminLockMinutes: 10,
adminSessionStorageKey: 'multaCompensatoriaAdminSessionV1',
adminAttemptsStorageKey: 'multaCompensatoriaAdminAttemptsV1'
```

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

## Privacidade

Não há envio de dados para servidor. O histórico utiliza `localStorage`. A autorização administrativa utiliza `sessionStorage`, permanecendo somente na aba atual até o encerramento ou até o prazo de expiração.


## Ajuda objetiva do Fator de Acabamento — FA

A versão 2.8.0 esclarece que o FA deve ser obtido pela soma da pontuação da tabela correspondente da Lei Complementar nº 20/2002. A ajuda apresenta as faixas de enquadramento para residencial multifamiliar, residencial unifamiliar e comercial, e recomenda registrar a pontuação no demonstrativo administrativo.

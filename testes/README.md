# Testes das especificações

Material para testar as capacidades da Jornada Guiada com casos reais. Nada desta pasta faz parte do catálogo: as especificações em `especificações/` são genéricas e não citam nenhum caso.

| Item | Para que serve |
|---|---|
| `termos-proibidos.txt` | Termos dos casos de teste que o validador recusa dentro de `especificações/`. Ao incluir um caso novo, acrescente aqui os nomes de cliente, projeto, produto e pessoas. |
| `credit-on-wealth/` | Caso de teste do DarkLab e do fluxo ponta a ponta: gabarito, roteiro, lista do corpus e conferidor. |

Comandos, na raiz do repositório:

```bash
npm install                      # instala ajv para o validador checar schemas e exemplos
npm run validar:especificacoes   # confere o catálogo (scripts/validar-catalogo.mjs)
node testes/credit-on-wealth/conferir-darklab.mjs <pasta-com-as-saidas-do-darklab>
```

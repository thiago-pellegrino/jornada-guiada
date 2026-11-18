# Caso de teste Credit on Wealth

Este caso serve **apenas** para testar a plataforma. O HTML do caso mostra como o DarkLab deve apresentar os resultados de cada motor: insumos, métodos, atividades com data e fonte, entregáveis com situação, nota e fonte, e uma ressalva de leitura. As especificações reproduzem só essa forma (estrutura comum dos motores, `02-darklab-000` §5.5); o conteúdo do caso fica aqui.

| Arquivo | Conteúdo |
|---|---|
| `gabarito-darklab.html` | HTML original do caso (cópia do arquivo que estava na raiz do repositório). |
| `gabarito-darklab.json` | Gabarito extraído do HTML: os 7 motores com insumos, métodos, produtos, atividades, entregáveis com status e ressalva, e as 40 fontes citadas. Status já convertidos para o `workStatus` da plataforma. |
| `roteiro-de-teste.md` | Cenários do teste ponta a ponta e o que conferir em cada fase. |
| `conferir-darklab.mjs` | Compara as saídas dos 7 motores com o gabarito. |
| `corpus/lista-de-fontes.csv` | As 40 fontes que o HTML cita, com título, nome do arquivo e motores que as usam. |
| `corpus/` | Onde colocar os documentos do caso para o teste. Não versionar documentos confidenciais. |
| `esperado/` | Saídas aprovadas do teste, usadas como referência de regressão. |
| `perfil-credit-on-wealth.md` | Perfil de protocolo de 5 etapas do caso, retirado das especificações em 18/11/2026. Mantido como referência do caso. |
| `_retirado-02-darklab-008-aplicar-perfil-de-protocolo.md` | Capacidade de perfil de protocolo retirada do catálogo em 18/11/2026. |

Situação do gabarito por motor (posição documental de 16/11/2026):

| Motor | Entregáveis no gabarito |
|---|---|
| M1 Enquadrar | 3 em aceite, 1 em andamento |
| M2 Compreender | 2 concluídos, 1 em aceite, 1 em andamento |
| M3 Direcionar | 3 em andamento, 1 impedido |
| M4 Materializar | 3 em aceite, 1 em andamento, 1 pendente |
| M5 Construir | 4 pendentes |
| M6 Comprovar | 3 pendentes |
| M7 Antecipar | 3 pendentes |

O conferidor não compara nomes de entregáveis, porque os do caso (ex.: Project Charter) são próprios do projeto e os da plataforma são genéricos. Ele compara a situação de cada motor, os bloqueios, os concluídos, a presença de atividades e de ressalvas, e exige evidência para todo status diferente de `pendente`.

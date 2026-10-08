# Logística

O módulo do time de Logística: o Dashboard Logístico em `/logistica` e, mais
adiante, a ponte que leva a solicitação de presente aprovada até o ClickUp e
o Tiny. Por que é um módulo desta aplicação: [ADR 0008](adr/0008-logistica-no-mesmo-app.md).

## De onde vem

Dois documentos da área, guardados fora do repositório:

- **Proposta de Dashboard Logístico**: um painel "simples, visual e prático",
  com leitura rápida por qualquer colaborador, da operação à diretoria. O
  detalhamento operacional continua no ClickUp.
- **1º Relatório de Melhorias**: a primeira rodada sobre o protótipo.

O protótipo não tinha código. Tudo aqui foi construído do zero.

## O que o painel mostra

| Pedido da área                                                                | Onde                                               | Situação   |
| ----------------------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| Filtro global: semanal, mensal, anual ou datas livres (relatório, item 3)     | `src/lib/periodo.ts`                               | pronto     |
| Status operacional em destaque: normal, alto volume, risco, crítica (item 1)  | dashboard                                          | em seguida |
| "Volume de Pedidos por Departamento", com subsidiária e departamento (item 2) | dashboard                                          | em seguida |
| Comparativo com o período anterior e evolução semanal (proposta, item 1)      | dashboard                                          | em seguida |
| Horas por produto e tempo médio por envio (proposta, item 2)                  | dashboard                                          | em seguida |
| Trilha de demandas com a esteira prioritária dentro dela (item 4)             | dashboard                                          | em seguida |
| Status, item ou "Kit", observações no hover, previsão obrigatória (item 4)    | trilha                                             | em seguida |
| Exportar a trilha respeitando o filtro de período (item 4)                    | trilha                                             | em seguida |
| Título ou ID da demanda como link para a tarefa no ClickUp (item 5)           | trilha                                             | em seguida |
| Apresentação da equipe (item 6)                                               | `/logistica/equipe`                                | em seguida |
| FAQ, com conteúdo em elaboração (item 7)                                      | `/logistica/faq`                                   | em seguida |
| Fases operacionais padronizadas (proposta, item 5)                            | enum no schema                                     | em seguida |
| Leitura das tarefas do ClickUp                                                | provider, sincronização                            | depois     |
| Solicitação aprovada vira tarefa no ClickUp e pedido no Tiny                  | fila, [ADR 0009](adr/0009-integracoes-por-fila.md) | depois     |

## O período

Um só período vale para o painel inteiro e para a exportação, e mora na URL:

| Tipo          | URL                                                   | Cobre                         |
| ------------- | ----------------------------------------------------- | ----------------------------- |
| Semanal       | `?periodo=semana&ref=2026-W34`                        | segunda a domingo, semana ISO |
| Mensal        | `?periodo=mes&ref=2026-08`                            | dia 1 ao último dia           |
| Anual         | `?periodo=ano&ref=2026`                               | 1º de janeiro a 31/12         |
| Personalizado | `?periodo=personalizado&de=2026-08-01&ate=2026-08-31` | as duas datas, inclusive      |

Regras, todas em `src/lib/periodo.ts` e cobertas por teste:

- **Semana ISO**, numerada como a área escreve, `2026-34`. A semana é do ano da
  sua quinta-feira: 01/01/2027, uma sexta, ainda é a `2026-53`.
- **Calendário de São Paulo.** Domingo às 23h ainda é a semana que termina,
  mesmo já sendo segunda em UTC.
- **Trocar de tipo mantém o ponto.** Quem olha a semana 34 e clica em "Mensal"
  vai para agosto, não para o mês de hoje.
- **Anterior e próximo** andam uma unidade do tipo; no personalizado, andam o
  mesmo número de dias, para comparar igual com igual.
- **Endereço inválido não quebra a tela:** volta para a semana atual e avisa.
- O personalizado vai até três anos.

## Perfis

Ver [perfis e permissões](02-perfis-e-permissoes.md#perfil-logística). Todo
perfil lê o dashboard; Logística e Admin cuidam do status manual, da equipe e
do FAQ, e são os únicos que leem as observações das demandas.

## O que depende da área

Ver [perguntas em aberto](05-perguntas-em-aberto.md#logística).

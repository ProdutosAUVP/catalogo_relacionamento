# 0008: Logística como módulo desta aplicação

## Contexto

O time de Logística precisa de um Dashboard Logístico: status da operação na
semana, volume de pedidos por departamento, horas por produto, a trilha de
demandas com previsão de entrega, equipe e FAQ. A proposta e a primeira rodada
de melhorias estão descritas em [docs/11-logistica.md](../11-logistica.md). O
que existia era um protótipo, sem código.

Ao mesmo tempo, a ferramenta de presentes chega na expedição: a solicitação
aprovada vira um envio, e quem envia é a Logística. As duas coisas se tocam
no meio.

Havia duas formas de construir:

1. **uma aplicação separada**, com repositório, deploy e client no Keycloak
   próprios;
2. **um módulo desta aplicação**, sob `/logistica`, com um perfil novo.

A outra plataforma que a Logística usa, o AUVP-Eventos, não entra como base:
ela usa outra stack (Supabase, login por senha), não tem testes, e tem
problemas de autorização que exigiriam refazer o acesso de qualquer forma. Ela
fica como referência de como conversar com o Tiny.

## Decisão

Logística é um módulo desta aplicação:

- perfil novo, `logistica`, na mesma matriz de permissões (ADR 0003);
- rotas sob `/logistica`, com o mesmo Design System (ADR 0006);
- o mesmo SSO, o mesmo banco, o mesmo deploy e a mesma entrega para a TI.

O dashboard é leitura para todos os perfis. O que é do time, status manual da
semana, equipe, FAQ e as observações das demandas, fica atrás de
`logistica.gerenciar` e `logistica.verObservacoes`.

## Consequências

Uma entrega só para a TI, um client no Keycloak, um lugar onde a pessoa entra.
A ponte entre a solicitação aprovada e a demanda da Logística (ADR 0009) vira
uma chamada interna, e não uma integração entre dois sistemas nossos.

Em troca:

- a aplicação deixa de ser só "Catálogo de Presentes", e um problema no módulo
  de um time derruba o do outro;
- o modelo de dados cresce com tabelas que a área de Relacionamento não usa.

Se a Logística crescer a ponto de precisar de outra cadência de deploy, o
módulo sai inteiro: ele não lê tabelas de solicitação diretamente, só pela
ponte.

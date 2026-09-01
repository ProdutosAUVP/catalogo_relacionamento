# 0003 — Permissões numa matriz única

## Contexto

Três perfis, treze ações, e uma regra que não é binária: o consultor vê
solicitações, mas só as dele.

O jeito comum — `if (perfil === 'admin')` espalhado por telas e actions —
diverge com o tempo. O botão some mas a action continua aceitando, ou o
contrário.

## Decisão

Uma matriz `perfil × ação` em `src/lib/permissions.ts`, consultada por todo
mundo: menu, guarda de rota e server action.

O escopo é separado da permissão. `escopoDeSolicitacoes` devolve `todas`,
`proprias` ou `nenhum`, e `filtroDeSolicitacoes` traduz isso no `where` do
Prisma. Nenhuma tela escreve o filtro de consultor à mão.

Decisões ainda não confirmadas pela área ficam num objeto
`PENDENTE_CONFIRMACAO`, para que a resposta vire a troca de uma linha em vez de
uma caçada pela matriz.

## Consequências

Adicionar um perfil é preencher uma coluna, e o TypeScript exige que todas as
ações sejam respondidas — esquecer uma vira erro de compilação, não brecha.

Em troca, a matriz é grosseira: não expressa "pode editar enquanto estiver
pendente". Se aparecer regra desse tipo, ela vai precisar de um lugar próprio,
e o risco é a autorização voltar a ficar em dois lugares.

# 0005 — Perfil e limite fora do provedor de identidade

## Contexto

A autenticação é o SSO da AUVP, via OIDC. A pergunta é onde moram perfil e
limite mensal: no provedor de identidade, em grupos, ou na tabela `usuarios`.

Grupos no SSO parecem mais corretos — identidade e autorização juntas. Mas cada
mudança de perfil passaria por TI, e a spec quer justamente o contrário: a
área ajusta sozinha.

## Decisão

O provedor de identidade responde **quem é a pessoa**. O banco responde **o que
ela pode fazer**. Perfil e limite mensal ficam em `usuarios`, editáveis pelo
Admin dentro da ferramenta.

A sessão é JWT, sem adapter de banco. O perfil é relido do banco a cada
renovação do token, e não fixado no login: promover alguém passa a valer na
próxima navegação, sem exigir que a pessoa saia e entre de novo.

O primeiro login cria o usuário como `consultor`. `BOOTSTRAP_ADMIN_EMAILS`
resolve o ovo e a galinha do primeiro Admin.

## Consequências

Relacionamento gerencia os próprios perfis. Desligar alguém no SSO tira o
acesso na hora, porque sem SSO não há login.

Em troca, há dois lugares de verdade sobre pessoas: quem existe está no SSO,
quem pode o quê está no banco. Alguém desligado da empresa continua como linha
em `usuarios` — desativado por não conseguir mais entrar, mas ainda listado.
É aceitável: o histórico de solicitações precisa do nome de quem pediu.

`AUTH_OIDC_GROUPS_CLAIM` fica reservado caso o SSO passe a devolver grupos e a
área queira mapear perfil automaticamente.

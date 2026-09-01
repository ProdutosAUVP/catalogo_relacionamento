# Catálogo e Solicitação de Presentes — Spec de construção (V1)

**Origem:** solicitação da área de Relacionamento (via Bia)
**Uso deste documento:** briefing de construção no Claude Code
**Escopo desta versão:** V1 sem integração com Tiny e sem integração com Salesforce. As duas APIs estão disponíveis e entram em uma segunda fase, então o schema e as camadas de acesso já nascem preparados para elas.

---

## 1. O que a ferramenta resolve

O consultor precisa selecionar o cliente, escolher o presente, escrever a carta que acompanha o envio e concluir a solicitação sem redigitar dados a cada pedido. Quem gerencia precisa de visibilidade do fluxo inteiro: aprovação, compra, envio, entrega e custo por consultor.

O catálogo muda com frequência, então cadastro, edição e ativação de produtos são feitos pela própria área de Relacionamento, sem depender do time técnico. Esse é um requisito de primeira ordem, não uma conveniência.

---

## 2. Escopo

### Dentro do V1

- Catálogo com CRUD completo pelo Admin, busca e filtro por categoria
- Presente específico: o consultor descreve o item e informa o link onde comprar
- Cadastro de cliente manual, com importação por CSV como atalho
- Formulário de solicitação com múltiplos itens
- Painel de gestão com os nove status, filtros e edição
- Saldo gasto no mês por consultor
- Exportação para CSV/XLSX
- Perfis Consultor, Admin e Financeiro

### Fora do V1, com arquitetura preparada

- **Tiny ERP:** consulta de produtos e estoque, criação do pedido após aprovação, retorno de número, status e rastreio
- **Salesforce:** busca do cliente por CPF ou ID, preenchimento automático dos dados
- Notificações automáticas de mudança de status
- Geração da carta em formato de impressão

Preparar significa: os campos `tiny_*`, `rastreio` e `salesforce_id` já existem no schema desde o V1, e o acesso a produtos e clientes passa por uma camada de provider com implementação local. Trocar a implementação depois não deve exigir migração de dados nem mudança de tela.

---

## 3. Perfis e permissões

| Ação | Consultor | Admin | Financeiro |
|---|:---:|:---:|:---:|
| Ver catálogo | ✓ | ✓ | ✓ |
| Criar solicitação | ✓ | ✓ | — |
| Ver as próprias solicitações | ✓ | ✓ | ✓ |
| Ver todas as solicitações | — | ✓ | ✓ |
| Ver dados sensíveis do cliente (CPF, telefone, endereço) | só das próprias | ✓ | a definir |
| Alterar status | — | ✓ | a definir |
| Editar/corrigir solicitação | — | ✓ | — |
| Gerenciar catálogo, categorias e usuários | — | ✓ | — |
| Exportar | — | ✓ | ✓ |
| Ver saldo gasto | próprio | todos | todos |

O perfil Financeiro veio citado na solicitação sem permissões descritas. A linha acima é uma proposta: enxerga tudo e exporta, não altera nada. Precisa de confirmação.

---

## 4. Modelo de dados

### usuarios
`id`, `nome`, `email`, `perfil` (consultor | admin | financeiro), `limite_mensal` (nullable), `ativo`, `criado_em`

### categorias
`id`, `nome`, `ativo`

### produtos
`id`, `nome`, `descricao`, `categoria_id`, `foto_url`, `valor`, `tipo_valor` (exato | medio), `controla_estoque` (bool), `estoque` (nullable), `ativo`, `sku_tiny` (nullable, reservado para a fase 2), `criado_em`, `atualizado_em`

`controla_estoque = false` cobre produtos externos e específicos, que não têm essa informação. Nesse caso a tela não mostra disponibilidade em vez de mostrar zero.

Produto nunca é deletado, só desativado. Produto desativado some do catálogo do consultor e continua visível em solicitações antigas.

### clientes
`id`, `nome`, `cpf`, `telefone`, `email` (nullable), `salesforce_id` (nullable), `origem` (manual | importacao | salesforce), `criado_por`, `criado_em`

CPF é a chave de deduplicação. Ao digitar um CPF já existente, a tela oferece o cliente encontrado em vez de criar duplicata.

### solicitacoes
`id`, `codigo` (sequencial legível, ex. SOL-2026-0001), `consultor_id`, `cliente_id`, `motivo` (aniversario | casamento | nascimento | reforco_relacionamento | primeiro_milhao | outro), `motivo_outro` (nullable), `mensagem_carta`, `observacoes`, `status`, `valor_total` (calculado), `data_solicitacao`, `atualizado_em`

Entrega, gravada como snapshot na própria solicitação para não mudar retroativamente se o cliente se mudar: `entrega_cep`, `entrega_logradouro`, `entrega_numero`, `entrega_complemento`, `entrega_bairro`, `entrega_cidade`, `entrega_uf`, `entrega_destinatario`

Reservados para a fase 2, nulos no V1: `tiny_pedido_id`, `tiny_status`, `rastreio`, `transportadora`

### solicitacao_itens
`id`, `solicitacao_id`, `produto_id` (nullable), `descricao_livre` (nullable), `url_externa` (nullable), `valor_unitario`, `quantidade`

Ou `produto_id` está preenchido, ou `descricao_livre` + `url_externa` estão. Item de catálogo puxa o valor do produto no momento da criação e congela; item específico tem o valor digitado pelo consultor.

### solicitacao_historico
`id`, `solicitacao_id`, `status_anterior`, `status_novo`, `usuario_id`, `motivo` (nullable), `criado_em`

Toda mudança de status grava uma linha. É o que sustenta auditoria e a resposta de "por que essa solicitação parou".

---

## 5. Fluxo de status

```
Pendente → Aguardando aprovação → Aguardando compra → Comprado
                                                          ↓
                                              Organizando envio
                                                          ↓
                                        Entregue / rastreio finalizado
                                                          ↓
                                         Cliente confirmou recebimento

Deu problema  ← pode ser acionado a partir de qualquer status
Devolvido     ← pode ser acionado a partir de Entregue em diante
```

Regras:

- Só o Admin muda status. O consultor acompanha.
- "Deu problema" e "Devolvido" exigem preenchimento de motivo, gravado no histórico.
- De "Deu problema" a solicitação pode voltar para qualquer status anterior ou ser cancelada.
- O status é único por solicitação, não por item. Se um item de uma solicitação com três itens der problema, o Admin usa observações e histórico. Vale confirmar com a solicitante se isso atende.

---

## 6. Telas

**Consultor**

- `/catalogo` — grid com foto, nome, categoria, valor e disponibilidade quando houver; busca por texto e filtro por categoria
- `/solicitacoes/nova` — fluxo em etapas: cliente (busca por CPF ou cadastro novo) → itens (catálogo ou item específico) → entrega (CEP com autopreenchimento via ViaCEP) → carta e motivo → revisão
- `/solicitacoes` — lista das próprias solicitações, com status e o total gasto no mês em destaque

**Admin**

- `/admin/solicitacoes` — tabela com filtros por período, consultor, cliente, produto e status; ação de mudar status; edição de qualquer campo; exportação do resultado filtrado
- `/admin/solicitacoes/[id]` — detalhe com itens, dados de entrega, carta e histórico completo
- `/admin/catalogo` — CRUD de produtos com upload de foto, e CRUD de categorias
- `/admin/usuarios` — CRUD de usuários, perfil e limite mensal
- `/admin/clientes` — lista, edição e importação por CSV

---

## 7. Exportação

CSV e XLSX, respeitando os filtros aplicados na tela. Colunas: código, data da solicitação, consultor, cliente, CPF, telefone, produto ou descrição, quantidade, valor unitário, valor total, motivo do envio, endereço completo, cidade, UF, status, data da última mudança de status, número do pedido no Tiny e rastreio (vazios no V1).

Uma linha por item, não por solicitação, para que a soma de valores feche.

---

## 8. Saldo gasto no mês

Soma do `valor_total` das solicitações do consultor no mês corrente, considerando todos os status exceto os cancelados e devolvidos. Se o usuário tiver `limite_mensal` preenchido, a tela mostra o consumo contra o limite.

Não ficou definido se estourar o limite bloqueia a solicitação ou apenas sinaliza. O V1 só sinaliza; bloqueio depende de decisão da área.

---

## 9. Stack e autenticação

Decidido: Next.js 15 com App Router e TypeScript, Tailwind e shadcn/ui no front, Postgres com Prisma, storage das fotos de produto em bucket S3-compatível. Hospedagem no Railway, junto com as outras ferramentas internas, com o Postgres no mesmo projeto.

A escolha considera três coisas: o painel administrativo é a maior parte do trabalho e o shadcn resolve tabela, filtro e formulário sem construir do zero; a exportação e a futura chamada ao Tiny rodam melhor no servidor, o que o App Router entrega sem serviço separado; e o Railway já é terreno conhecido pelo time.

**Autenticação:** SSO da AUVP, via NextAuth com provider OIDC. Nada de senha própria. O primeiro login cria o usuário com perfil `consultor` por padrão e o Admin promove quem precisa. Perfil e limite mensal ficam na tabela `usuarios`, não no provedor de identidade, para que a área consiga ajustar sem passar por TI.

Para configurar, o Claude Code vai precisar de `ISSUER_URL`, `CLIENT_ID` e `CLIENT_SECRET`, além de saber qual é o provedor (Google Workspace, Entra ID, Keycloak ou outro) e se ele devolve grupos que possam ser mapeados para os perfis.

---

## 10. Critérios de aceite do V1

- [ ] Admin cadastra, edita, ativa e desativa produto sem intervenção técnica
- [ ] Produto desativado some do catálogo e permanece em solicitações antigas
- [ ] Busca do catálogo encontra por nome e descrição
- [ ] Consultor cria solicitação com dois itens de catálogo e um item específico com link
- [ ] CEP preenche cidade, UF, bairro e logradouro automaticamente
- [ ] CPF repetido oferece o cliente existente em vez de duplicar
- [ ] Consultor só enxerga as próprias solicitações
- [ ] Admin muda status e a mudança aparece no histórico com autor e horário
- [ ] "Deu problema" sem motivo preenchido é recusado
- [ ] Filtros combinados no painel funcionam em conjunto
- [ ] Exportação respeita os filtros e soma os valores corretamente
- [ ] Saldo do mês bate com a soma das solicitações do consultor

---

## 11. Perguntas em aberto

**Para a solicitante / Relacionamento**

- Permissões exatas do perfil Financeiro
- Diferença prática entre "Solicitações pendentes" e "Aguardando aprovação": são dois momentos distintos ou o mesmo?
- Quem aprova e existe alçada por valor?
- Existe limite mensal por consultor? Qual valor e quem define?
- A plaquinha do primeiro milhão entra no catálogo como produto e "primeiro milhão" como motivo de envio?
- Como a carta chega ao cliente hoje: impressa internamente, enviada pelo fornecedor, escrita à mão?
- Há histórico de solicitações a migrar para a ferramenta?

**Técnicas, para começar**

- Qual é o provedor de SSO da AUVP e quem libera as credenciais do client OIDC
- O SSO devolve grupo ou departamento? Se sim, dá para mapear perfil automaticamente em vez de o Admin promover na mão

**Técnicas, para a fase 2**

- Quais campos do Salesforce podem ser consultados e por qual chave (CPF ou ID)
- Quem detém as credenciais de API do Tiny
- Como tratar itens externos, que não geram pedido no Tiny e podem não ter rastreio

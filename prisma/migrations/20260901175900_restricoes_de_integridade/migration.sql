-- Regras que o Prisma não expressa no schema e que não podem depender só da
-- camada de aplicação: uma escrita por script, seed ou correção manual passaria
-- por cima da validação em TypeScript.

-- Um item é do catálogo OU é um presente específico com descrição e link.
-- Nunca os dois, nunca nenhum.
ALTER TABLE "solicitacao_itens"
  ADD CONSTRAINT "item_catalogo_ou_especifico" CHECK (
    (
      "produto_id" IS NOT NULL
      AND "descricao_livre" IS NULL
      AND "url_externa" IS NULL
    )
    OR (
      "produto_id" IS NULL
      AND "descricao_livre" IS NOT NULL
      AND "url_externa" IS NOT NULL
    )
  );

-- Quantidade e valores não podem ser negativos.
ALTER TABLE "solicitacao_itens"
  ADD CONSTRAINT "item_quantidade_positiva" CHECK ("quantidade" > 0);

ALTER TABLE "solicitacao_itens"
  ADD CONSTRAINT "item_valor_nao_negativo" CHECK ("valor_unitario" >= 0);

ALTER TABLE "produtos"
  ADD CONSTRAINT "produto_valor_nao_negativo" CHECK ("valor" >= 0);

ALTER TABLE "solicitacoes"
  ADD CONSTRAINT "solicitacao_valor_nao_negativo" CHECK ("valor_total" >= 0);

-- Produto que controla estoque precisa ter a quantidade preenchida.
ALTER TABLE "produtos"
  ADD CONSTRAINT "produto_estoque_coerente" CHECK (
    "controla_estoque" = false OR "estoque" IS NOT NULL
  );

-- CPF é gravado só com dígitos: é a chave de deduplicação e não pode variar
-- com a máscara usada na digitação.
ALTER TABLE "clientes"
  ADD CONSTRAINT "cliente_cpf_somente_digitos" CHECK ("cpf" ~ '^[0-9]{11}$');

-- Motivo é obrigatório ao registrar problema, devolução ou cancelamento.
ALTER TABLE "solicitacao_historico"
  ADD CONSTRAINT "historico_motivo_obrigatorio" CHECK (
    "status_novo" NOT IN ('deu_problema', 'devolvido', 'cancelado')
    OR ("motivo" IS NOT NULL AND btrim("motivo") <> '')
  );

-- Busca do catálogo por nome e descrição sem varrer a tabela inteira.
CREATE INDEX "produtos_busca_idx" ON "produtos"
  USING gin (to_tsvector('portuguese', "nome" || ' ' || coalesce("descricao", '')));

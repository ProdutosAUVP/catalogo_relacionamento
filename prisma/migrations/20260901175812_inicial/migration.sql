-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('consultor', 'admin', 'financeiro');

-- CreateEnum
CREATE TYPE "TipoValor" AS ENUM ('exato', 'medio');

-- CreateEnum
CREATE TYPE "OrigemCliente" AS ENUM ('manual', 'importacao', 'salesforce');

-- CreateEnum
CREATE TYPE "MotivoEnvio" AS ENUM ('aniversario', 'casamento', 'nascimento', 'reforco_relacionamento', 'primeiro_milhao', 'outro');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('pendente', 'aguardando_aprovacao', 'aguardando_compra', 'comprado', 'organizando_envio', 'entregue', 'cliente_confirmou', 'deu_problema', 'devolvido', 'cancelado');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sso_subject" TEXT,
    "perfil" "Perfil" NOT NULL DEFAULT 'consultor',
    "limite_mensal" DECIMAL(12,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria_id" TEXT NOT NULL,
    "foto_url" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "tipo_valor" "TipoValor" NOT NULL DEFAULT 'exato',
    "controla_estoque" BOOLEAN NOT NULL DEFAULT false,
    "estoque" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "sku_tiny" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "salesforce_id" TEXT,
    "origem" "OrigemCliente" NOT NULL DEFAULT 'manual',
    "criado_por" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "consultor_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "motivo" "MotivoEnvio" NOT NULL,
    "motivo_outro" TEXT,
    "mensagem_carta" TEXT NOT NULL,
    "observacoes" TEXT,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'pendente',
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "entrega_cep" TEXT NOT NULL,
    "entrega_logradouro" TEXT NOT NULL,
    "entrega_numero" TEXT NOT NULL,
    "entrega_complemento" TEXT,
    "entrega_bairro" TEXT NOT NULL,
    "entrega_cidade" TEXT NOT NULL,
    "entrega_uf" CHAR(2) NOT NULL,
    "entrega_destinatario" TEXT NOT NULL,
    "tiny_pedido_id" TEXT,
    "tiny_status" TEXT,
    "rastreio" TEXT,
    "transportadora" TEXT,
    "data_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_itens" (
    "id" TEXT NOT NULL,
    "solicitacao_id" TEXT NOT NULL,
    "produto_id" TEXT,
    "descricao_livre" TEXT,
    "url_externa" TEXT,
    "valor_unitario" DECIMAL(12,2) NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_historico" (
    "id" TEXT NOT NULL,
    "solicitacao_id" TEXT NOT NULL,
    "status_anterior" "StatusSolicitacao",
    "status_novo" "StatusSolicitacao" NOT NULL,
    "usuario_id" TEXT,
    "motivo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contador_codigo" (
    "ano" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contador_codigo_pkey" PRIMARY KEY ("ano")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_sso_subject_key" ON "usuarios"("sso_subject");

-- CreateIndex
CREATE INDEX "usuarios_perfil_ativo_idx" ON "usuarios"("perfil", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE INDEX "categorias_ativo_idx" ON "categorias"("ativo");

-- CreateIndex
CREATE INDEX "produtos_ativo_categoria_id_idx" ON "produtos"("ativo", "categoria_id");

-- CreateIndex
CREATE INDEX "produtos_nome_idx" ON "produtos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_salesforce_id_key" ON "clientes"("salesforce_id");

-- CreateIndex
CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_codigo_key" ON "solicitacoes"("codigo");

-- CreateIndex
CREATE INDEX "solicitacoes_consultor_id_data_solicitacao_idx" ON "solicitacoes"("consultor_id", "data_solicitacao");

-- CreateIndex
CREATE INDEX "solicitacoes_status_idx" ON "solicitacoes"("status");

-- CreateIndex
CREATE INDEX "solicitacoes_cliente_id_idx" ON "solicitacoes"("cliente_id");

-- CreateIndex
CREATE INDEX "solicitacoes_data_solicitacao_idx" ON "solicitacoes"("data_solicitacao");

-- CreateIndex
CREATE INDEX "solicitacao_itens_solicitacao_id_idx" ON "solicitacao_itens"("solicitacao_id");

-- CreateIndex
CREATE INDEX "solicitacao_itens_produto_id_idx" ON "solicitacao_itens"("produto_id");

-- CreateIndex
CREATE INDEX "solicitacao_historico_solicitacao_id_criado_em_idx" ON "solicitacao_historico"("solicitacao_id", "criado_em");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_consultor_id_fkey" FOREIGN KEY ("consultor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_itens" ADD CONSTRAINT "solicitacao_itens_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_itens" ADD CONSTRAINT "solicitacao_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_historico" ADD CONSTRAINT "solicitacao_historico_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_historico" ADD CONSTRAINT "solicitacao_historico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "FaseOperacional" AS ENUM ('recebido', 'em_analise', 'aguardando_documentacao', 'aguardando_suprimentos', 'em_execucao', 'revisao', 'finalizacao', 'concluido');

-- CreateEnum
CREATE TYPE "PrioridadeDemanda" AS ENUM ('urgente', 'alta', 'normal', 'baixa');

-- CreateEnum
CREATE TYPE "ComplexidadeDemanda" AS ENUM ('baixa', 'media', 'alta');

-- CreateEnum
CREATE TYPE "SituacaoOperacional" AS ENUM ('normal', 'alto_volume', 'risco_de_atraso', 'critica');

-- CreateEnum
CREATE TYPE "OrigemDemanda" AS ENUM ('clickup', 'solicitacao');

-- CreateTable
CREATE TABLE "demandas_logistica" (
    "id" TEXT NOT NULL,
    "origem" "OrigemDemanda" NOT NULL DEFAULT 'clickup',
    "clickup_id" TEXT,
    "clickup_url" TEXT,
    "titulo" TEXT NOT NULL,
    "subsidiaria" TEXT,
    "departamento" TEXT,
    "produto" TEXT,
    "itens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fase" "FaseOperacional" NOT NULL DEFAULT 'recebido',
    "prioridade" "PrioridadeDemanda" NOT NULL DEFAULT 'normal',
    "complexidade" "ComplexidadeDemanda",
    "responsavel" TEXT,
    "observacoes" TEXT,
    "link_formulario" TEXT,
    "solicitada_em" TIMESTAMP(3) NOT NULL,
    "previsao_inicio" TIMESTAMP(3),
    "previsao_conclusao" TIMESTAMP(3),
    "concluida_em" TIMESTAMP(3),
    "minutos_apontados" INTEGER NOT NULL DEFAULT 0,
    "sincronizada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandas_logistica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_operacional_semana" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "situacao" "SituacaoOperacional",
    "observacao" TEXT,
    "definido_por_id" TEXT,
    "definido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_operacional_semana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_equipe" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "descricao" TEXT,
    "email" TEXT,
    "foto_url" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perguntas_frequentes" (
    "id" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perguntas_frequentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demandas_logistica_clickup_id_key" ON "demandas_logistica"("clickup_id");

-- CreateIndex
CREATE INDEX "demandas_logistica_solicitada_em_idx" ON "demandas_logistica"("solicitada_em");

-- CreateIndex
CREATE INDEX "demandas_logistica_concluida_em_idx" ON "demandas_logistica"("concluida_em");

-- CreateIndex
CREATE INDEX "demandas_logistica_previsao_conclusao_idx" ON "demandas_logistica"("previsao_conclusao");

-- CreateIndex
CREATE UNIQUE INDEX "status_operacional_semana_ano_semana_key" ON "status_operacional_semana"("ano", "semana");

-- CreateIndex
CREATE INDEX "membros_equipe_ativo_ordem_idx" ON "membros_equipe"("ativo", "ordem");

-- CreateIndex
CREATE INDEX "perguntas_frequentes_ativo_ordem_idx" ON "perguntas_frequentes"("ativo", "ordem");

-- AddForeignKey
ALTER TABLE "status_operacional_semana" ADD CONSTRAINT "status_operacional_semana_definido_por_id_fkey" FOREIGN KEY ("definido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regras que nenhum script pode furar, mesmo passando por fora da aplicação.

-- Semana ISO vai de 1 a 53.
ALTER TABLE "status_operacional_semana"
  ADD CONSTRAINT "semana_iso_valida" CHECK ("semana" BETWEEN 1 AND 53);

-- Tempo apontado não é negativo.
ALTER TABLE "demandas_logistica"
  ADD CONSTRAINT "minutos_apontados_nao_negativos" CHECK ("minutos_apontados" >= 0);

-- A demanda que veio do ClickUp tem a tarefa de onde veio.
ALTER TABLE "demandas_logistica"
  ADD CONSTRAINT "demanda_do_clickup_tem_tarefa" CHECK (
    "origem" <> 'clickup' OR "clickup_id" IS NOT NULL
  );

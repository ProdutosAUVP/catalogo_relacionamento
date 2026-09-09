-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "dados" BYTEA NOT NULL,
    "criado_por" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- Arquivo vazio é upload que falhou pela metade: recusa na origem, para não
-- sobrar produto apontando para foto que não abre.
ALTER TABLE "arquivos"
  ADD CONSTRAINT "arquivo_tamanho_positivo" CHECK ("tamanho" > 0);

-- Teto de 5 MB. O mesmo limite vale na aplicação; aqui ele resiste a script,
-- seed e correção manual.
ALTER TABLE "arquivos"
  ADD CONSTRAINT "arquivo_tamanho_maximo" CHECK ("tamanho" <= 5242880);

-- Só imagem. A foto é servida de volta com o `content-type` gravado aqui, e
-- um tipo arbitrário viraria conteúdo servido do nosso domínio.
ALTER TABLE "arquivos"
  ADD CONSTRAINT "arquivo_tipo_de_imagem" CHECK (
    "tipo" IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
  );

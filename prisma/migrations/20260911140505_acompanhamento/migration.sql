-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "exige_acompanhamento" TEXT,
ADD COLUMN     "serve_como_acompanhamento" TEXT;

-- Um produto que exige acompanhamento não pode ser, ele mesmo, o
-- acompanhamento que satisfaz a própria exigência: a solicitação passaria com
-- o kit sozinho, que é justamente o que a regra existe para impedir.
ALTER TABLE "produtos"
  ADD CONSTRAINT "produto_acompanhamento_nao_circular" CHECK (
    "exige_acompanhamento" IS NULL
    OR "serve_como_acompanhamento" IS NULL
    OR "exige_acompanhamento" <> "serve_como_acompanhamento"
  );

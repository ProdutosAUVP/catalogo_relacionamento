-- CreateEnum
CREATE TYPE "OrigemProduto" AS ENUM ('estoque_interno', 'mediante_pedido');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "nota_de_compra" TEXT,
ADD COLUMN     "origem" "OrigemProduto" NOT NULL DEFAULT 'mediante_pedido',
ADD COLUMN     "url_compra" TEXT,
ALTER COLUMN "valor" DROP NOT NULL;

-- Produtos já cadastrados: quem controlava estoque era, na prática, item de
-- prateleira. Sem isto todos cairiam no padrão `mediante_pedido` e passariam a
-- ser mandados ao Financeiro.
UPDATE "produtos" SET "origem" = 'estoque_interno' WHERE "controla_estoque" = true;

-- Valor negativo continua recusado; nulo agora é permitido e significa "a área
-- ainda não informou o preço". A CHECK que já existia (`valor >= 0`) aceita
-- nulo sozinha, porque comparação com nulo é desconhecida, não falsa.

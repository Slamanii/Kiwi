-- CreateEnum
CREATE TYPE "AgreementItemKind" AS ENUM ('CONTENT', 'CHECKPOINT');

-- CreateEnum
CREATE TYPE "AgreementSentiment" AS ENUM ('GOOD', 'BAD');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'AGREEMENT_ITEM_DUE';

-- AlterTable
ALTER TABLE "AgreementItem" ADD COLUMN     "kind" "AgreementItemKind" NOT NULL DEFAULT 'CONTENT',
ADD COLUMN     "notifiedAt" TIMESTAMP(3),
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentiment" "AgreementSentiment",
ADD COLUMN     "unlocksAt" TIMESTAMP(3);

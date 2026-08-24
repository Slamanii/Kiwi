-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DEAL_DISPUTED';

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputedBy" TEXT;

-- Fold any legacy ESCROW_FUNDED rows into IN_PROGRESS before the value is dropped from the enum below
UPDATE "Agreement" SET "status" = 'IN_PROGRESS' WHERE "status" = 'ESCROW_FUNDED';

-- AlterEnum: drop ESCROW_FUNDED from AgreementStatus (Postgres has no direct DROP VALUE, so recreate the type)
CREATE TYPE "AgreementStatus_new" AS ENUM ('PENDING', 'SIGNED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED');
ALTER TABLE "Agreement" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Agreement" ALTER COLUMN "status" TYPE "AgreementStatus_new" USING ("status"::text::"AgreementStatus_new");
ALTER TABLE "Agreement" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "AgreementStatus";
ALTER TYPE "AgreementStatus_new" RENAME TO "AgreementStatus";

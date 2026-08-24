-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "SeekComment" DROP CONSTRAINT "SeekComment_parentId_fkey";

-- AlterTable
ALTER TABLE "Seek" ADD COLUMN     "allowsChildren" BOOLEAN,
ADD COLUMN     "allowsPets" BOOLEAN,
ADD COLUMN     "allowsSingle" BOOLEAN,
ADD COLUMN     "currency" TEXT DEFAULT 'NGN',
ADD COLUMN     "hasChildren" BOOLEAN,
ADD COLUMN     "hasCofO" BOOLEAN,
ADD COLUMN     "hasFlexiblePayment" BOOLEAN,
ADD COLUMN     "hasGenerator" BOOLEAN,
ADD COLUMN     "hasLegalRep" BOOLEAN,
ADD COLUMN     "hasParking" BOOLEAN,
ADD COLUMN     "hasWater" BOOLEAN,
ADD COLUMN     "isFurnished" BOOLEAN,
ADD COLUMN     "isStudent" BOOLEAN,
ADD COLUMN     "needsMortgage" BOOLEAN,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "worksFromHome" BOOLEAN;

-- AlterTable
ALTER TABLE "SeekComment" ALTER COLUMN "parentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SeekComment" ADD CONSTRAINT "SeekComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SeekComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

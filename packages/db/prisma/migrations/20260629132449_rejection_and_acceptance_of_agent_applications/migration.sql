/*
  Warnings:

  - Added the required column `rejectionReason` to the `AgentApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentApplication" ADD COLUMN     "rejectionReason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifyExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "pendingEmail" TEXT;

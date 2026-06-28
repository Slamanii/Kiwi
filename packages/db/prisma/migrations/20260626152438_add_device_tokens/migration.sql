/*
  Warnings:

  - Added the required column `conversationId` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgreementStage" AS ENUM ('BEFORE', 'DURING', 'AFTER');

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "agentSignature" TEXT,
ADD COLUMN     "agentSignedAt" TIMESTAMP(3),
ADD COLUMN     "clientSignature" TEXT,
ADD COLUMN     "clientSignedAt" TIMESTAMP(3),
ADD COLUMN     "documentUrl" TEXT;

-- AlterTable
ALTER TABLE "AgreementItem" ADD COLUMN     "answer" TEXT,
ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "answeredBy" TEXT,
ADD COLUMN     "stage" "AgreementStage" NOT NULL DEFAULT 'BEFORE';

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "lastMessage" TEXT,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "conversationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "inspectionFee" DOUBLE PRECISION,
ADD COLUMN     "ongoing" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requests" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "rating" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Seek" ADD COLUMN     "commentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isReseek" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalSeekId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "paystackRecipientCode" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AgentApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentReferralCode" TEXT,
    "phone" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "policyNote" TEXT NOT NULL,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idDocumentUrl" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "accountNumber" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeekComment" (
    "id" TEXT NOT NULL,
    "seekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeekComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DMConversation" (
    "id" TEXT NOT NULL,
    "participantA" TEXT NOT NULL,
    "participantB" TEXT NOT NULL,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DMConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentApplication_userId_key" ON "AgentApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DMConversation_participantA_participantB_key" ON "DMConversation"("participantA", "participantB");

-- AddForeignKey
ALTER TABLE "AgentApplication" ADD CONSTRAINT "AgentApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeekComment" ADD CONSTRAINT "SeekComment_seekId_fkey" FOREIGN KEY ("seekId") REFERENCES "Seek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeekComment" ADD CONSTRAINT "SeekComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "DMConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

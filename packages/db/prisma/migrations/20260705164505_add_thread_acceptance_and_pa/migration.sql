/*
  Warnings:

  - Added the required column `parentId` to the `SeekComment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrendingCategory" AS ENUM ('PROPERTY_TYPE', 'LOCATION', 'URGENCY', 'ROOMS', 'INFO');

-- CreateEnum
CREATE TYPE "PAMilestone" AS ENUM ('FIRST_CONTACT', 'INSPECTION_SCHEDULED', 'INSPECTION_DONE', 'NEGOTIATING', 'DOCUMENTS_SUBMITTED', 'AGREEMENT_SIGNED', 'PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PAHealthTag" AS ENUM ('COMMUNICATING_WELL', 'SLOW_RESPONSE', 'NOT_GOING_ANYWHERE', 'WAITING_ON_LANDLORD', 'PRICE_DISPUTE');

-- CreateEnum
CREATE TYPE "PAMood" AS ENUM ('GOOD', 'OKAY', 'BAD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COMPLIANCE_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'TERMS_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'TERMS_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'PA_DUE';
ALTER TYPE "NotificationType" ADD VALUE 'THREAD_STALLED';
ALTER TYPE "NotificationType" ADD VALUE 'THREAD_ENDED';

-- AlterTable
ALTER TABLE "SeekComment" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "agentAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clientAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endReason" TEXT,
ADD COLUMN     "endedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressAssessment" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "mood" "PAMood",
    "healthTags" "PAHealthTag"[],
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadMilestone" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "milestone" "PAMilestone" NOT NULL,
    "reachedBy" TEXT NOT NULL,
    "reachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trending" (
    "id" TEXT NOT NULL,
    "category" "TrendingCategory" NOT NULL,
    "headline" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "location" TEXT,
    "propertyType" "PropertyType",
    "urgency" TEXT,
    "rooms" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingSeek" (
    "id" TEXT NOT NULL,
    "trendingId" TEXT NOT NULL,
    "seekId" TEXT NOT NULL,

    CONSTRAINT "TrendingSeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressAssessment_threadId_userId_weekNumber_year_key" ON "ProgressAssessment"("threadId", "userId", "weekNumber", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadMilestone_threadId_milestone_key" ON "ThreadMilestone"("threadId", "milestone");

-- CreateIndex
CREATE UNIQUE INDEX "TrendingSeek_trendingId_seekId_key" ON "TrendingSeek"("trendingId", "seekId");

-- AddForeignKey
ALTER TABLE "Seek" ADD CONSTRAINT "Seek_originalSeekId_fkey" FOREIGN KEY ("originalSeekId") REFERENCES "Seek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeekComment" ADD CONSTRAINT "SeekComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SeekComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SeekComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressAssessment" ADD CONSTRAINT "ProgressAssessment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressAssessment" ADD CONSTRAINT "ProgressAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadMilestone" ADD CONSTRAINT "ThreadMilestone_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingSeek" ADD CONSTRAINT "TrendingSeek_trendingId_fkey" FOREIGN KEY ("trendingId") REFERENCES "Trending"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingSeek" ADD CONSTRAINT "TrendingSeek_seekId_fkey" FOREIGN KEY ("seekId") REFERENCES "Seek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

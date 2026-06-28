-- CreateEnum
CREATE TYPE "CommunityMessagingMode" AS ENUM ('ADMIN_ONLY', 'ALL_MEMBERS', 'SELECTED_MEMBERS');

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "messagingMode" "CommunityMessagingMode" NOT NULL DEFAULT 'ADMIN_ONLY';

-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN     "canPost" BOOLEAN NOT NULL DEFAULT false;

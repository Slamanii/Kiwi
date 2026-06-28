/*
  Warnings:

  - You are about to drop the column `roles` on the `CommunityMember` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommunityMember" DROP COLUMN "roles",
ADD COLUMN     "role" "CommunityRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "title";

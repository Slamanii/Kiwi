/*
  Warnings:

  - Added the required column `roles` to the `CommunityMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommunityRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterEnum
ALTER TYPE "SeekStatus" ADD VALUE 'DEPRECATED';

-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN     "roles" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "title" TEXT NOT NULL;

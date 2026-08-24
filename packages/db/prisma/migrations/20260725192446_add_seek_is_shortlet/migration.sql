/*
  Warnings:

  - Added the required column `city` to the `Seek` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Seek" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "isShortlet" BOOLEAN NOT NULL DEFAULT false;

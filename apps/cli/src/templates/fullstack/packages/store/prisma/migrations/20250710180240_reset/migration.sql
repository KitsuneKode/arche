/*
  Warnings:

  - You are about to drop the column `password_hash` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Video` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "user_email_idx";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "password_hash",
ALTER COLUMN "createdAt" DROP DEFAULT;

-- DropTable
DROP TABLE "Video";

/*
  Warnings:

  - The `locale` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `theme` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ENGLISH', 'FRENCH', 'JAPANESE');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "locale",
ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'ENGLISH',
DROP COLUMN "theme",
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'SYSTEM';

/*
  Warnings:

  - You are about to drop the column `mae` on the `Statistics` table. All the data in the column will be lost.
  - Added the required column `accuracy` to the `Statistics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Statistics" DROP COLUMN "mae",
ADD COLUMN     "accuracy" DOUBLE PRECISION NOT NULL;

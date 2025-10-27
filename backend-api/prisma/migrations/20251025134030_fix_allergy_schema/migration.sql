/*
  Warnings:

  - You are about to drop the column `name` on the `allergy` table. All the data in the column will be lost.
  - Added the required column `allergen` to the `Allergy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reaction` to the `Allergy` table without a default value. This is not possible if the table is not empty.
  - Made the column `severity` on table `allergy` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `allergy` DROP COLUMN `name`,
    ADD COLUMN `allergen` VARCHAR(191) NOT NULL,
    ADD COLUMN `reaction` VARCHAR(191) NOT NULL,
    MODIFY `severity` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM';

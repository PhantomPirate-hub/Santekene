/*
  Warnings:

  - A unique constraint covering the columns `[deviceToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `deviceToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_deviceToken_key` ON `User`(`deviceToken`);

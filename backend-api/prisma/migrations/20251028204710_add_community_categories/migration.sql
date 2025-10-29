/*
  Warnings:

  - You are about to drop the column `category` on the `communitypost` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `CommunityPost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `communitypost` DROP COLUMN `category`,
    ADD COLUMN `categoryId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `CommunityCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CommunityCategory_name_key`(`name`),
    UNIQUE INDEX `CommunityCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommunityPost` ADD CONSTRAINT `CommunityPost_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `CommunityCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

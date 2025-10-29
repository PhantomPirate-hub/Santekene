/*
  Warnings:

  - A unique constraint covering the columns `[facilityRequestId]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mimeType` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `admin` ADD COLUMN `facilityRequestId` INTEGER NULL;

-- AlterTable
ALTER TABLE `doctor` ADD COLUMN `facilityId` INTEGER NULL;

-- AlterTable
ALTER TABLE `document` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `fileUrl` TEXT NULL,
    ADD COLUMN `mimeType` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `size` INTEGER NOT NULL,
    ADD COLUMN `uploadedBy` INTEGER NOT NULL,
    MODIFY `url` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `healthfacilityrequest` MODIFY `documentUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `prescription` ADD COLUMN `duration` VARCHAR(191) NULL,
    ADD COLUMN `instructions` TEXT NULL,
    ADD COLUMN `nftSerialNumber` INTEGER NULL;

-- CreateTable
CREATE TABLE `UserWallet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `balance` DOUBLE NOT NULL DEFAULT 0,
    `totalEarned` DOUBLE NOT NULL DEFAULT 0,
    `totalSpent` DOUBLE NOT NULL DEFAULT 0,
    `lastUpdate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserWallet_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `walletId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `type` ENUM('REWARD', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'SPEND', 'REFUND', 'ADJUSTMENT', 'BONUS') NOT NULL,
    `reason` TEXT NOT NULL,
    `relatedEntityId` INTEGER NULL,
    `relatedEntityType` VARCHAR(191) NULL,
    `hederaTxId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Admin_facilityRequestId_key` ON `Admin`(`facilityRequestId`);

-- AddForeignKey
ALTER TABLE `Doctor` ADD CONSTRAINT `Doctor_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `HealthFacilityRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_facilityRequestId_fkey` FOREIGN KEY (`facilityRequestId`) REFERENCES `HealthFacilityRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWallet` ADD CONSTRAINT `UserWallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `UserWallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

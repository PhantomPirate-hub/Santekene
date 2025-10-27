/*
  Warnings:

  - You are about to drop the column `dosage` on the `prescription` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `prescription` table. All the data in the column will be lost.
  - You are about to drop the column `medication` on the `prescription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedReason` VARCHAR(191) NULL,
    ADD COLUMN `videoRoomId` VARCHAR(191) NULL,
    MODIFY `date` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `consultation` ADD COLUMN `allergies` VARCHAR(191) NULL,
    MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `doctor` ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `structure` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `document` ADD COLUMN `consultationId` INTEGER NULL,
    ADD COLUMN `title` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `patient` ADD COLUMN `height` DOUBLE NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `weight` DOUBLE NULL;

-- AlterTable
ALTER TABLE `prescription` DROP COLUMN `dosage`,
    DROP COLUMN `duration`,
    DROP COLUMN `medication`;

-- CreateTable
CREATE TABLE `HealthFacilityRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facilityName` VARCHAR(191) NOT NULL,
    `facilityType` VARCHAR(191) NOT NULL,
    `facilityAddress` VARCHAR(191) NOT NULL,
    `facilityCity` VARCHAR(191) NOT NULL,
    `facilityPhone` VARCHAR(191) NOT NULL,
    `facilityEmail` VARCHAR(191) NOT NULL,
    `responsibleName` VARCHAR(191) NOT NULL,
    `responsiblePosition` VARCHAR(191) NOT NULL,
    `responsiblePhone` VARCHAR(191) NOT NULL,
    `responsibleEmail` VARCHAR(191) NOT NULL,
    `documentUrl` VARCHAR(191) NULL,
    `documentType` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` VARCHAR(191) NULL,
    `approvedBy` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HealthFacilityRequest_facilityEmail_key`(`facilityEmail`),
    INDEX `HealthFacilityRequest_status_idx`(`status`),
    INDEX `HealthFacilityRequest_facilityEmail_idx`(`facilityEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DseAccessRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doctorId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `reason` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DseAccessRequest_doctorId_patientId_key`(`doctorId`, `patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescriptionId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HealthFacilityRequest` ADD CONSTRAINT `HealthFacilityRequest_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `SuperAdmin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DseAccessRequest` ADD CONSTRAINT `DseAccessRequest_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DseAccessRequest` ADD CONSTRAINT `DseAccessRequest_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medication` ADD CONSTRAINT `Medication_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

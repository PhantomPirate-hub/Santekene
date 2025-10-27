-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'Consultation générale',
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `isVideo` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `videoLink` VARCHAR(191) NULL;


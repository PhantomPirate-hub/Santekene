-- AlterTable: Simplification du modèle CommunityCategory
-- Suppression des colonnes inutiles (garder seulement name et isActive)

ALTER TABLE `communitycategory` DROP COLUMN `color`;
ALTER TABLE `communitycategory` DROP COLUMN `description`;
ALTER TABLE `communitycategory` DROP COLUMN `icon`;
ALTER TABLE `communitycategory` DROP COLUMN `slug`;


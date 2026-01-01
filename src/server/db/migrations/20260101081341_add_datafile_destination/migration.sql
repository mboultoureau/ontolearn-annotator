-- AlterTable
ALTER TABLE `DataFile` ADD COLUMN `destination` ENUM('ML', 'HEADWORK', 'MANUAL') NOT NULL DEFAULT 'ML';

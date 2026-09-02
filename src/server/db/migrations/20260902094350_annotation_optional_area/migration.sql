-- DropForeignKey
ALTER TABLE `Annotation` DROP FOREIGN KEY `Annotation_areaOfInterestId_fkey`;
-- AlterTable
ALTER TABLE `Annotation` MODIFY `areaOfInterestId` VARCHAR(191) NULL;
-- AddForeignKey
ALTER TABLE `Annotation` ADD CONSTRAINT `Annotation_areaOfInterestId_fkey` FOREIGN KEY (`areaOfInterestId`) REFERENCES `AreaOfInterest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

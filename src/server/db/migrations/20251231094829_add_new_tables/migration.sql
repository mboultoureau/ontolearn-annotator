/*
  Warnings:

  - You are about to drop the column `image` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Project` DROP COLUMN `image`,
    ADD COLUMN `icon` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Configuration` (
    `projectId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `settings` JSON NULL,

    PRIMARY KEY (`projectId`, `type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataFile` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `previewPath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DataFile_filePath_key`(`filePath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassType` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE',
    `relatedId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AreaOfInterest` (
    `id` VARCHAR(191) NOT NULL,
    `area` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Annotation` (
    `id` VARCHAR(191) NOT NULL,
    `dataFileId` VARCHAR(191) NOT NULL,
    `areaOfInterestId` VARCHAR(191) NOT NULL,
    `parentAnnotationId` VARCHAR(191) NULL,
    `quality` VARCHAR(191) NULL,
    `author` ENUM('USER', 'ML', 'HEADWORK') NOT NULL,
    `userId` VARCHAR(191) NULL,
    `confidence` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnnotationType` (
    `annotationId` VARCHAR(191) NOT NULL,
    `classTypeId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,

    PRIMARY KEY (`annotationId`, `classTypeId`, `rank`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `parentQuestionId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `dataFileId` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `answers` JSON NULL,
    `status` ENUM('PENDING', 'ASKED', 'ANSWERING', 'ANSWERED', 'CLOSED', 'INVALID') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expert` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `accuracy` DOUBLE NULL,
    `pace` DOUBLE NULL,

    UNIQUE INDEX `Expert_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpertAssignment` (
    `expertId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `opinion` VARCHAR(191) NULL,
    `status` ENUM('ASSIGNED', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'ASSIGNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`expertId`, `questionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Configuration` ADD CONSTRAINT `Configuration_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataFile` ADD CONSTRAINT `DataFile_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassType` ADD CONSTRAINT `ClassType_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Annotation` ADD CONSTRAINT `Annotation_dataFileId_fkey` FOREIGN KEY (`dataFileId`) REFERENCES `DataFile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Annotation` ADD CONSTRAINT `Annotation_areaOfInterestId_fkey` FOREIGN KEY (`areaOfInterestId`) REFERENCES `AreaOfInterest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnnotationType` ADD CONSTRAINT `AnnotationType_annotationId_fkey` FOREIGN KEY (`annotationId`) REFERENCES `Annotation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnnotationType` ADD CONSTRAINT `AnnotationType_classTypeId_fkey` FOREIGN KEY (`classTypeId`) REFERENCES `ClassType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_parentQuestionId_fkey` FOREIGN KEY (`parentQuestionId`) REFERENCES `Question`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_dataFileId_fkey` FOREIGN KEY (`dataFileId`) REFERENCES `DataFile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpertAssignment` ADD CONSTRAINT `ExpertAssignment_expertId_fkey` FOREIGN KEY (`expertId`) REFERENCES `Expert`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpertAssignment` ADD CONSTRAINT `ExpertAssignment_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

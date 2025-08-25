-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('TEXT', 'IMAGE', 'DEEP_ZOOM_IMAGE', 'FILE');

-- CreateEnum
CREATE TYPE "Job" AS ENUM ('GUEST', 'EXPERT', 'PHOTOGRAPH', 'ADMIN');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ENGLISH', 'FRENCH', 'JAPANESE');

-- CreateEnum
CREATE TYPE "PlaygroundTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SourceTypeFieldType" AS ENUM ('STRING', 'FILE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "User" (
    "id_user" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'ENGLISH',
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "job" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("credentialID")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Project" (
    "id_project" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "image" TEXT,
    "useHeadwork" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id_project")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id_user" TEXT NOT NULL,
    "id_project" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id_user","id_project")
);

-- CreateTable
CREATE TABLE "DataFile" (
    "id_data" TEXT NOT NULL,
    "id_dataSource" TEXT NOT NULL,
    "id_project" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DataType" NOT NULL DEFAULT 'TEXT',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "preview" TEXT,
    "metadata" JSONB,
    "filePath" TEXT NOT NULL,
    "previewPath" TEXT NOT NULL,

    CONSTRAINT "DataFile_pkey" PRIMARY KEY ("id_data")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id_dataSource" TEXT NOT NULL,
    "id_sourceType" TEXT NOT NULL,
    "id_project" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceStatus" "SourceStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusInfo" JSONB,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id_dataSource")
);

-- CreateTable
CREATE TABLE "SourceType" (
    "id_sourceType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "SourceType_pkey" PRIMARY KEY ("id_sourceType")
);

-- CreateTable
CREATE TABLE "SourceTypeField" (
    "id_sourceTypeField" TEXT NOT NULL,
    "id_sourceType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "SourceTypeFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL,

    CONSTRAINT "SourceTypeField_pkey" PRIMARY KEY ("id_sourceTypeField")
);

-- CreateTable
CREATE TABLE "SourceField" (
    "id_sourceField" TEXT NOT NULL,
    "id_dataSource" TEXT NOT NULL,
    "id_sourceTypeField" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SourceField_pkey" PRIMARY KEY ("id_sourceField")
);

-- CreateTable
CREATE TABLE "ProjectCategory" (
    "id_category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,

    CONSTRAINT "ProjectCategory_pkey" PRIMARY KEY ("id_category")
);

-- CreateTable
CREATE TABLE "CategoryToProject" (
    "id_project" TEXT NOT NULL,
    "id_category" TEXT NOT NULL,

    CONSTRAINT "CategoryToProject_pkey" PRIMARY KEY ("id_project","id_category")
);

-- CreateTable
CREATE TABLE "PlaygroundTask" (
    "id_pgTask" TEXT NOT NULL,
    "id_project" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "playgroundTaskStatus" "PlaygroundTaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,

    CONSTRAINT "PlaygroundTask_pkey" PRIMARY KEY ("id_pgTask")
);

-- CreateTable
CREATE TABLE "Question" (
    "id_question" SERIAL NOT NULL,
    "id_project" TEXT NOT NULL,
    "id_data" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "taskStatus" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id_question")
);

-- CreateTable
CREATE TABLE "Assigned" (
    "id_user" TEXT NOT NULL,
    "id_question" INTEGER NOT NULL,
    "id_aoi" INTEGER NOT NULL,
    "opinion" TEXT NOT NULL,
    "output" JSONB,
    "questionId_question" INTEGER,

    CONSTRAINT "Assigned_pkey" PRIMARY KEY ("id_user","id_question","id_aoi")
);

-- CreateTable
CREATE TABLE "AreaOfInterest" (
    "id_aoi" SERIAL NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_classType" TEXT,
    "id_data" TEXT,
    "area" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AreaOfInterest_pkey" PRIMARY KEY ("id_aoi")
);

-- CreateTable
CREATE TABLE "ClassType" (
    "id_classType" TEXT NOT NULL,
    "id_project" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ClassType_pkey" PRIMARY KEY ("id_classType")
);

-- CreateTable
CREATE TABLE "Statistics" (
    "id_stats" TEXT NOT NULL,
    "id_project" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL,
    "loss" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id_stats")
);

-- CreateTable
CREATE TABLE "Annotated" (
    "id_annotated" TEXT NOT NULL,

    CONSTRAINT "Annotated_pkey" PRIMARY KEY ("id_annotated")
);

-- CreateTable
CREATE TABLE "NonAnnotated" (
    "id_nonannotated" TEXT NOT NULL,

    CONSTRAINT "NonAnnotated_pkey" PRIMARY KEY ("id_nonannotated")
);

-- CreateTable
CREATE TABLE "Classified" (
    "id_classType" TEXT NOT NULL,
    "id_aoi" INTEGER NOT NULL,
    "id_data" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quality" TEXT NOT NULL,
    "dataFileId_data" TEXT,

    CONSTRAINT "Classified_pkey" PRIMARY KEY ("id_classType","id_aoi","id_data")
);

-- CreateTable
CREATE TABLE "prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DataFile_filePath_key" ON "DataFile"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "DataFile_previewPath_key" ON "DataFile"("previewPath");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCategory_slug_key" ON "ProjectCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryToProject_id_category_id_project_key" ON "CategoryToProject"("id_category", "id_project");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataFile" ADD CONSTRAINT "DataFile_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataFile" ADD CONSTRAINT "DataFile_id_dataSource_fkey" FOREIGN KEY ("id_dataSource") REFERENCES "DataSource"("id_dataSource") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_id_sourceType_fkey" FOREIGN KEY ("id_sourceType") REFERENCES "SourceType"("id_sourceType") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceTypeField" ADD CONSTRAINT "SourceTypeField_id_sourceType_fkey" FOREIGN KEY ("id_sourceType") REFERENCES "SourceType"("id_sourceType") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceField" ADD CONSTRAINT "SourceField_id_dataSource_fkey" FOREIGN KEY ("id_dataSource") REFERENCES "DataSource"("id_dataSource") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceField" ADD CONSTRAINT "SourceField_id_sourceTypeField_fkey" FOREIGN KEY ("id_sourceTypeField") REFERENCES "SourceTypeField"("id_sourceTypeField") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryToProject" ADD CONSTRAINT "CategoryToProject_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryToProject" ADD CONSTRAINT "CategoryToProject_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "ProjectCategory"("id_category") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaygroundTask" ADD CONSTRAINT "PlaygroundTask_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaygroundTask" ADD CONSTRAINT "PlaygroundTask_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_id_data_fkey" FOREIGN KEY ("id_data") REFERENCES "DataFile"("id_data") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assigned" ADD CONSTRAINT "Assigned_questionId_question_fkey" FOREIGN KEY ("questionId_question") REFERENCES "Question"("id_question") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaOfInterest" ADD CONSTRAINT "AreaOfInterest_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaOfInterest" ADD CONSTRAINT "AreaOfInterest_id_data_fkey" FOREIGN KEY ("id_data") REFERENCES "DataFile"("id_data") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassType" ADD CONSTRAINT "ClassType_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statistics" ADD CONSTRAINT "Statistics_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "Project"("id_project") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotated" ADD CONSTRAINT "Annotated_id_annotated_fkey" FOREIGN KEY ("id_annotated") REFERENCES "DataFile"("id_data") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonAnnotated" ADD CONSTRAINT "NonAnnotated_id_nonannotated_fkey" FOREIGN KEY ("id_nonannotated") REFERENCES "DataFile"("id_data") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classified" ADD CONSTRAINT "Classified_dataFileId_data_fkey" FOREIGN KEY ("dataFileId_data") REFERENCES "DataFile"("id_data") ON DELETE SET NULL ON UPDATE CASCADE;

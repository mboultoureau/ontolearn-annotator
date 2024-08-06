-- CreateEnum
CREATE TYPE "PlaygroundTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "PlaygroundTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "PlaygroundTaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,

    CONSTRAINT "PlaygroundTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlaygroundTask" ADD CONSTRAINT "PlaygroundTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaygroundTask" ADD CONSTRAINT "PlaygroundTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

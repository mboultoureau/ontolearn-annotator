-- CreateTable
CREATE TABLE "Statistics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL,
    "loss" DOUBLE PRECISION NOT NULL,
    "mae" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Statistics" ADD CONSTRAINT "Statistics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

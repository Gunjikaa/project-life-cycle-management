-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('PMRB', 'EB');

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "reviewType" "ReviewType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_projectId_idx" ON "Review"("projectId");

-- CreateIndex
CREATE INDEX "Review_scheduledAt_idx" ON "Review"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ClosureType" AS ENUM ('TECHNICAL', 'ADMINISTRATIVE', 'FINANCIAL');

-- CreateTable
CREATE TABLE "Closure" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "closureType" "ClosureType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Closure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Closure_projectId_idx" ON "Closure"("projectId");

-- AddForeignKey
ALTER TABLE "Closure" ADD CONSTRAINT "Closure_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

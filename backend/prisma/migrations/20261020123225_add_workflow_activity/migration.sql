-- CreateEnum
CREATE TYPE "WorkflowActivityType" AS ENUM ('FORECAST', 'CCM', 'TIEC', 'CEC', 'AON', 'SOC', 'COSTING', 'ADDIFA_CONCURRENCE', 'SECRETARY_SANCTION', 'GL_ISSUE', 'PROJECT_SANCTION', 'PROCUREMENT');

-- CreateEnum
CREATE TYPE "WorkflowActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'RETURNED');

-- CreateTable
CREATE TABLE "WorkflowActivity" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "activityType" "WorkflowActivityType" NOT NULL,
    "status" "WorkflowActivityStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowActivity_projectId_idx" ON "WorkflowActivity"("projectId");

-- AddForeignKey
ALTER TABLE "WorkflowActivity" ADD CONSTRAINT "WorkflowActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowActivity" ADD CONSTRAINT "WorkflowActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

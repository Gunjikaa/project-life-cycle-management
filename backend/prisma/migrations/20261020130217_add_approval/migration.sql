-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'RETURNED', 'PENDING');

-- CreateTable
CREATE TABLE "Approval" (
    "id" SERIAL NOT NULL,
    "workflowActivityId" INTEGER NOT NULL,
    "approverId" INTEGER NOT NULL,
    "decision" "ApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Approval_workflowActivityId_idx" ON "Approval"("workflowActivityId");

-- CreateIndex
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_workflowActivityId_fkey" FOREIGN KEY ("workflowActivityId") REFERENCES "WorkflowActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

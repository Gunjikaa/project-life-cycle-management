-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "evaluator" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evaluation_projectId_idx" ON "Evaluation"("projectId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

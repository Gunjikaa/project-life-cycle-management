-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowActivityType" ADD VALUE 'MONITORING_REVIEW';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'PMRB_REVIEW';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'EB_REVIEW';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'INDEPENDENT_EVALUATION';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'TECHNICAL_CLOSURE';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'ADMINISTRATIVE_CLOSURE';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'TS_FINANCIAL_CLOSURE';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'CDA_SUBMISSION';
ALTER TYPE "WorkflowActivityType" ADD VALUE 'CFA_APPROVAL';

-- Persist the evaluation workflow state alongside its outcome and date.
ALTER TABLE "Evaluation"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

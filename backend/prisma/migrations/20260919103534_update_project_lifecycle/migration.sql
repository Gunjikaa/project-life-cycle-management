/*
  Warnings:

  - You are about to drop the column `status` on the `Project` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('PROPOSAL', 'PRE_PROJECT', 'AON', 'SANCTION', 'EXECUTION', 'MONITORING', 'CLOSURE', 'POST_CLOSURE');

-- CreateEnum
CREATE TYPE "PreProjectStage" AS ENUM ('PRC', 'TIEC', 'CEC', 'CCM', 'DMC');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "status",
ADD COLUMN     "phase" "ProjectPhase" NOT NULL DEFAULT 'PROPOSAL',
ADD COLUMN     "preProjectStage" "PreProjectStage";

-- DropEnum
DROP TYPE "ProjectStatus";

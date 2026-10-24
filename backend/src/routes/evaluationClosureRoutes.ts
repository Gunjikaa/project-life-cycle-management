import { Router } from "express";
import prisma from "../lib/prisma";
import { recordAuditLog } from "../lib/audit";
import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

const evaluationRoles = authorizeRoles("ADMIN", "REVIEWER");
const closureRoles = authorizeRoles("ADMIN", "PROJECT_DIRECTOR");
const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "RETURNED"];
const evaluationPhases = ["MONITORING", "CLOSURE", "POST_CLOSURE"];
const closurePhases = ["CLOSURE", "POST_CLOSURE"];

const closureActivityTypes = {
  TECHNICAL: "TECHNICAL_CLOSURE",
  ADMINISTRATIVE: "ADMINISTRATIVE_CLOSURE",
  FINANCIAL: "TS_FINANCIAL_CLOSURE",
} as const;

type ClosureType = keyof typeof closureActivityTypes;

const firstParam = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parseProjectId = (value: string | string[]) => {
  const projectId = Number(firstParam(value));
  return Number.isInteger(projectId) && projectId > 0 ? projectId : null;
};

const cleanText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

async function getCurrentUserName(userId?: number) {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return user?.name ?? null;
}

async function getSupportingActivity(projectId: number, activityType: string) {
  return prisma.workflowActivity.findFirst({
    where: { projectId, activityType: activityType as never },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });
}

async function syncActivityStatus(
  activityId: number,
  currentStartedAt: Date | null,
  currentCompletedAt: Date | null,
  status: string
) {
  return prisma.workflowActivity.update({
    where: { id: activityId },
    data: {
      status: status as never,
      startedAt:
        status === "IN_PROGRESS"
          ? currentStartedAt ?? new Date()
          : currentStartedAt,
      completedAt:
        status === "COMPLETED"
          ? currentCompletedAt ?? new Date()
          : status === "PENDING" || status === "RETURNED"
            ? null
            : currentCompletedAt,
    },
  });
}

router.get("/:id/evaluation", authenticateToken, async (req, res) => {
  try {
    const projectId = parseProjectId(req.params.id);

    if (!projectId) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const [evaluation, activity] = await Promise.all([
      prisma.evaluation.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
      getSupportingActivity(projectId, "INDEPENDENT_EVALUATION"),
    ]);

    return res.json({ evaluation, activity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch evaluation." });
  }
});

router.put(
  "/:id/evaluation",
  authenticateToken,
  evaluationRoles,
  async (req, res) => {
    try {
      const projectId = parseProjectId(req.params.id);
      const status = cleanText(req.body.status);
      const outcome = cleanText(req.body.outcome);
      const remarks = cleanText(req.body.remarks);
      const evaluatedAt = parseDate(req.body.evaluatedAt);

      if (!projectId) {
        return res.status(400).json({ message: "Invalid project ID." });
      }

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid evaluation status." });
      }

      if (status === "COMPLETED" && (!evaluatedAt || !outcome || !remarks)) {
        return res.status(400).json({
          message:
            "Completed evaluations require an evaluation date, outcome, and remarks.",
        });
      }

      if (status === "RETURNED" && !remarks) {
        return res.status(400).json({
          message: "Returned evaluations require remarks.",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, phase: true },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      if (!evaluationPhases.includes(project.phase)) {
        return res.status(400).json({
          message: "Independent evaluation is available from the Monitoring phase.",
        });
      }

      const userId = req.user?.userId;
      const evaluator = await getCurrentUserName(userId);

      if (!userId || !evaluator) {
        return res.status(401).json({ message: "Authenticated user not found." });
      }

      let activity = await getSupportingActivity(
        projectId,
        "INDEPENDENT_EVALUATION"
      );

      if (!activity && status === "COMPLETED") {
        return res.status(400).json({
          message:
            "Start the evaluation and upload a supporting document before completion.",
        });
      }

      if (!activity) {
        activity = await prisma.workflowActivity.create({
          data: {
            projectId,
            activityType: "INDEPENDENT_EVALUATION",
            status: status as never,
            startedAt: status === "IN_PROGRESS" ? new Date() : null,
            remarks: remarks || null,
            createdById: userId,
          },
          include: { documents: true },
        });
      }

      if (status === "COMPLETED" && activity.documents.length === 0) {
        return res.status(400).json({
          message: "Upload at least one supporting evaluation document first.",
        });
      }

      const existing = await prisma.evaluation.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });

      const evaluation = existing
        ? await prisma.evaluation.update({
            where: { id: existing.id },
            data: {
              status,
              evaluator,
              evaluatedAt: status === "COMPLETED" ? evaluatedAt : null,
              outcome: outcome || null,
              remarks: remarks || null,
            },
          })
        : await prisma.evaluation.create({
            data: {
              projectId,
              status,
              evaluator,
              evaluatedAt: status === "COMPLETED" ? evaluatedAt : null,
              outcome: outcome || null,
              remarks: remarks || null,
            },
          });

      await syncActivityStatus(
        activity.id,
        activity.startedAt,
        activity.completedAt,
        status
      );

      const refreshedActivity = await getSupportingActivity(
        projectId,
        "INDEPENDENT_EVALUATION"
      );

      await recordAuditLog({
        userId,
        action: "INDEPENDENT_EVALUATION_UPDATED",
        entityType: "Evaluation",
        entityId: evaluation.id,
        details: { projectId, status },
      });

      return res.json({ evaluation, activity: refreshedActivity });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to update evaluation." });
    }
  }
);

router.get("/:id/closures", authenticateToken, async (req, res) => {
  try {
    const projectId = parseProjectId(req.params.id);

    if (!projectId) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const closures = await prisma.closure.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    const result = await Promise.all(
      (Object.keys(closureActivityTypes) as ClosureType[]).map(
        async (closureType) => ({
          closureType,
          closure:
            closures.find((item) => item.closureType === closureType) ?? null,
          activity: await getSupportingActivity(
            projectId,
            closureActivityTypes[closureType]
          ),
        })
      )
    );

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch closures." });
  }
});

router.put(
  "/:id/closures/:closureType",
  authenticateToken,
  closureRoles,
  async (req, res) => {
    try {
      const projectId = parseProjectId(req.params.id);
      const closureType = firstParam(req.params.closureType).toUpperCase() as ClosureType;
      const status = cleanText(req.body.status);
      const remarks = cleanText(req.body.remarks);
      const completedAt = parseDate(req.body.completedAt);

      if (!projectId) {
        return res.status(400).json({ message: "Invalid project ID." });
      }

      if (!(closureType in closureActivityTypes)) {
        return res.status(400).json({ message: "Invalid closure type." });
      }

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid closure status." });
      }

      if (status === "COMPLETED" && (!completedAt || !remarks)) {
        return res.status(400).json({
          message: "Completed closures require a completion date and remarks.",
        });
      }

      if (status === "RETURNED" && !remarks) {
        return res.status(400).json({
          message: "Returned closures require remarks.",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, phase: true },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      if (!closurePhases.includes(project.phase)) {
        return res.status(400).json({
          message: "Closure records are available from the Closure phase.",
        });
      }

      const userId = req.user?.userId;
      const approvedBy = await getCurrentUserName(userId);

      if (!userId || !approvedBy) {
        return res.status(401).json({ message: "Authenticated user not found." });
      }

      const activityType = closureActivityTypes[closureType];
      let activity = await getSupportingActivity(projectId, activityType);

      if (!activity && status === "COMPLETED") {
        return res.status(400).json({
          message:
            "Start this closure and upload a supporting document before completion.",
        });
      }

      if (!activity) {
        activity = await prisma.workflowActivity.create({
          data: {
            projectId,
            activityType,
            status: status as never,
            startedAt: status === "IN_PROGRESS" ? new Date() : null,
            remarks: remarks || null,
            createdById: userId,
          },
          include: { documents: true },
        });
      }

      if (status === "COMPLETED" && activity.documents.length === 0) {
        return res.status(400).json({
          message: "Upload at least one supporting closure document first.",
        });
      }

      const existing = await prisma.closure.findFirst({
        where: { projectId, closureType },
        orderBy: { createdAt: "desc" },
      });

      const closure = existing
        ? await prisma.closure.update({
            where: { id: existing.id },
            data: {
              status,
              completedAt: status === "COMPLETED" ? completedAt : null,
              remarks: remarks || null,
              approvedBy: status === "COMPLETED" ? approvedBy : null,
            },
          })
        : await prisma.closure.create({
            data: {
              projectId,
              closureType,
              status,
              completedAt: status === "COMPLETED" ? completedAt : null,
              remarks: remarks || null,
              approvedBy: status === "COMPLETED" ? approvedBy : null,
            },
          });

      await syncActivityStatus(
        activity.id,
        activity.startedAt,
        activity.completedAt,
        status
      );

      const refreshedActivity = await getSupportingActivity(
        projectId,
        activityType
      );

      await recordAuditLog({
        userId,
        action: "PROJECT_CLOSURE_UPDATED",
        entityType: "Closure",
        entityId: closure.id,
        details: { projectId, closureType, status },
      });

      return res.json({ closure, activity: refreshedActivity });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to update closure." });
    }
  }
);

export default router;

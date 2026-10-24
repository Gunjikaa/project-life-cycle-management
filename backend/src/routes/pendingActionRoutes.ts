import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();
const upcomingReviewWindowDays = 30;

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  dueDate: Date | null;
  href: string;
  project: {
    id: number;
    projectId: string;
    projectName: string;
  };
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    const role = req.user?.role;
    const actions = new Map<string, PendingAction>();
    const projectSelect = {
      id: true,
      projectId: true,
      projectName: true,
    } as const;

    if (role === "ADMIN" || role === "REVIEWER") {
      const activities = await prisma.workflowActivity.findMany({
        where: {
          status: "IN_PROGRESS",
          activityType: {
            notIn: [
              "INDEPENDENT_EVALUATION",
              "TECHNICAL_CLOSURE",
              "ADMINISTRATIVE_CLOSURE",
              "TS_FINANCIAL_CLOSURE",
              "PMRB_REVIEW",
              "EB_REVIEW",
            ],
          },
        },
        include: {
          project: { select: projectSelect },
          approvals: { orderBy: { createdAt: "desc" } },
        },
      });

      for (const activity of activities) {
        const latestDecision = activity.approvals[0]?.decision;
        if (latestDecision && latestDecision !== "PENDING") continue;

        const id = `approval-${activity.id}`;
        actions.set(id, {
          id,
          type: "APPROVAL",
          title: "Workflow approval pending",
          description: `${activity.activityType.replaceAll("_", " ")} is in progress and has no recorded decision.`,
          status: "PENDING",
          priority: "MEDIUM",
          dueDate: null,
          href: `/projects/${activity.project.id}#workflow-activities`,
          project: activity.project,
        });
      }

      const now = new Date();
      const upcomingLimit = new Date(
        now.getTime() + upcomingReviewWindowDays * 24 * 60 * 60 * 1000
      );
      const reviews = await prisma.review.findMany({
        where: {
          status: { not: "COMPLETED" },
          scheduledAt: { lte: upcomingLimit },
        },
        include: { project: { select: projectSelect } },
        orderBy: { scheduledAt: "asc" },
      });

      for (const review of reviews) {
        const overdue = review.scheduledAt < now;
        const id = `review-${review.id}`;
        actions.set(id, {
          id,
          type: "REVIEW",
          title: `${overdue ? "Overdue" : "Upcoming"} ${review.reviewType} review`,
          description: overdue
            ? "The scheduled review date has passed and the review is not completed."
            : `The review is due within ${upcomingReviewWindowDays} days.`,
          status: overdue ? "OVERDUE" : "UPCOMING",
          priority: overdue ? "HIGH" : "MEDIUM",
          dueDate: review.scheduledAt,
          href: `/projects/${review.project.id}#review-calendar`,
          project: review.project,
        });
      }

      const evaluationProjects = await prisma.project.findMany({
        where: { phase: { in: ["MONITORING", "CLOSURE", "POST_CLOSURE"] } },
        select: {
          ...projectSelect,
          evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      for (const project of evaluationProjects) {
        const evaluation = project.evaluations[0];
        if (evaluation?.status === "COMPLETED") continue;

        const id = `evaluation-${project.id}`;
        actions.set(id, {
          id,
          type: "EVALUATION",
          title: evaluation ? "Independent evaluation incomplete" : "Independent evaluation not started",
          description:
            evaluation?.status === "RETURNED"
              ? "The evaluation was returned and requires attention."
              : "Complete the evaluation record and supporting evidence.",
          status: evaluation?.status ?? "NOT_STARTED",
          priority: evaluation?.status === "RETURNED" ? "HIGH" : "MEDIUM",
          dueDate: null,
          href: `/projects/${project.id}#evaluation-closure`,
          project: {
            id: project.id,
            projectId: project.projectId,
            projectName: project.projectName,
          },
        });
      }
    }

    if (role === "ADMIN" || role === "PROJECT_DIRECTOR") {
      const returnedActivities = await prisma.workflowActivity.findMany({
        where: {
          status: { in: ["RETURNED", "IN_PROGRESS"] },
          activityType: {
            notIn: [
              "INDEPENDENT_EVALUATION",
              "TECHNICAL_CLOSURE",
              "ADMINISTRATIVE_CLOSURE",
              "TS_FINANCIAL_CLOSURE",
              "PMRB_REVIEW",
              "EB_REVIEW",
            ],
          },
          approvals: {
            some: { decision: { in: ["RETURNED", "REJECTED"] } },
          },
        },
        include: {
          project: { select: projectSelect },
          approvals: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      for (const activity of returnedActivities) {
        const latestDecision = activity.approvals[0]?.decision;
        if (latestDecision !== "RETURNED" && latestDecision !== "REJECTED") {
          continue;
        }

        const id = `returned-activity-${activity.id}`;
        actions.set(id, {
          id,
          type: "WORKFLOW",
          title: `Activity ${latestDecision.toLowerCase()}`,
          description: `${activity.activityType.replaceAll("_", " ")} requires project-team attention.`,
          status: latestDecision,
          priority: "HIGH",
          dueDate: null,
          href: `/projects/${activity.project.id}#workflow-activities`,
          project: activity.project,
        });
      }

      const closureProjects = await prisma.project.findMany({
        where: { phase: { in: ["CLOSURE", "POST_CLOSURE"] } },
        select: {
          ...projectSelect,
          closures: true,
        },
      });
      const closureTypes = ["TECHNICAL", "ADMINISTRATIVE", "FINANCIAL"] as const;

      for (const project of closureProjects) {
        for (const closureType of closureTypes) {
          const closure = project.closures.find(
            (item) => item.closureType === closureType
          );
          if (closure?.status === "COMPLETED") continue;

          const id = `closure-${project.id}-${closureType}`;
          actions.set(id, {
            id,
            type: "CLOSURE",
            title: `${closureType.replaceAll("_", " ")} closure incomplete`,
            description:
              closure?.status === "RETURNED"
                ? "This closure was returned and requires attention."
                : "Complete the closure record and supporting evidence.",
            status: closure?.status ?? "NOT_STARTED",
            priority: closure?.status === "RETURNED" ? "HIGH" : "MEDIUM",
            dueDate: null,
            href: `/projects/${project.id}#evaluation-closure`,
            project: {
              id: project.id,
              projectId: project.projectId,
              projectName: project.projectName,
            },
          });
        }
      }
    }

    const priorityOrder: Record<Priority, number> = {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2,
    };
    const result = [...actions.values()].sort((a, b) => {
      const priorityDifference =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDifference !== 0) return priorityDifference;
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.title.localeCompare(b.title);
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch pending actions." });
  }
});

export default router;

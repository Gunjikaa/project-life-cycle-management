import { authenticateToken } from "../middleware/authMiddleware";
import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();
router.get("/", authenticateToken, async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(projects);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch projects.",
    });
  }
});

router.post("/",authenticateToken, async (req, res) => {
  try {
    const {
      projectId,
      projectName,
      objective,
      projectDirector,
      concernedLab,
      estimatedCost,
      startDate,
      completionDate,
      remarks,
    } = req.body;

    if (
      !projectId ||
      !projectName ||
      !objective ||
      !projectDirector ||
      !concernedLab ||
      estimatedCost === undefined ||
      !startDate ||
      !completionDate
    ) {
      return res.status(400).json({
        message: "Please provide all required project fields.",
      });
    }

    const project = await prisma.project.create({
      data: {
        projectId,
        projectName,
        objective,
        projectDirector,
        concernedLab,
        estimatedCost: Number(estimatedCost),
        startDate: new Date(startDate),
        completionDate: new Date(completionDate),
        remarks,
      },
    });

    return res.status(201).json(project);
  } catch (error: any) {
  console.error(error);

  if (error?.code === "P2002") {
    return res.status(409).json({
      message: "Project ID already exists.",
    });
  }

  return res.status(500).json({
    message: "Failed to create project.",
  });
}
});
router.patch("/:id/lifecycle", authenticateToken, async (req, res) => {
  try {
    const { phase, preProjectStage } = req.body;

    const projectId = Number(req.params.id);
    const validPhases = [
  "PROPOSAL",
  "PRE_PROJECT",
  "AON",
  "SANCTION",
  "EXECUTION",
  "MONITORING",
  "CLOSURE",
  "POST_CLOSURE",

];
const allowedTransitions: Record<string, string[]> = {
  PROPOSAL: ["PRE_PROJECT"],
  PRE_PROJECT: ["AON"],
  AON: ["SANCTION"],
  SANCTION: ["EXECUTION"],
  EXECUTION: ["MONITORING"],
  MONITORING: ["CLOSURE"],
  CLOSURE: ["POST_CLOSURE"],
  POST_CLOSURE: [],
};

const validPreProjectStages = [
  "PRC",
  "TIEC",
  "CEC",
  "CCM",
  "DMC",
];
if (phase === "PRE_PROJECT" && !preProjectStage) {
  return res.status(400).json({
    message: "Pre-Project stage is required.",
  });
}
if (!validPhases.includes(phase)) {
  return res.status(400).json({
    message: "Invalid project phase.",
  });
}

if (
  preProjectStage !== null &&
  preProjectStage !== undefined &&
  !validPreProjectStages.includes(preProjectStage)
) {
  return res.status(400).json({
    message: "Invalid pre-project stage.",
  });
}

    if (!phase) {
      return res.status(400).json({
        message: "Phase is required.",
      });
    }
    const currentProject = await prisma.project.findUnique({
  where: {
    id: projectId,
  },
});

if (!currentProject) {
  return res.status(404).json({
    message: "Project not found.",
  });
}
if (
  currentProject.phase !== phase &&
  !allowedTransitions[currentProject.phase].includes(phase)
) {
  return res.status(400).json({
    message: `Transition from ${currentProject.phase} to ${phase} is not allowed.`,
  });
}


    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        phase,
        preProjectStage: preProjectStage || null,
      },
    });

    return res.json(project);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update project lifecycle.",
    });
  }
});


router.get("/:id/activities", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const activities = await prisma.workflowActivity.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(activities);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch workflow activities.",
    });
  }
});


router.post("/:id/activities", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { activityType, remarks } = req.body;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const validActivityTypes = [
  "FORECAST",
  "CCM",
  "TIEC",
  "CEC",
  "AON",
  "SOC",
  "COSTING",
  "ADDIFA_CONCURRENCE",
  "SECRETARY_SANCTION",
  "GL_ISSUE",
  "PROJECT_SANCTION",
  "PROCUREMENT",
  "MONITORING_REVIEW",
  "PMRB_REVIEW",
  "EB_REVIEW",
  "INDEPENDENT_EVALUATION",
  "TECHNICAL_CLOSURE",
  "ADMINISTRATIVE_CLOSURE",
  "TS_FINANCIAL_CLOSURE",
  "CDA_SUBMISSION",
  "CFA_APPROVAL",
];

    if (!validActivityTypes.includes(activityType)) {
      return res.status(400).json({
        message: "Invalid workflow activity type.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    // Verify that authentication middleware provides the user ID.
    const userId = Number((req as any).user?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Authenticated user ID is unavailable.",
      });
    }

    const activity = await prisma.workflowActivity.create({
      data: {
        projectId,
        activityType,
        remarks,
        createdById: userId,
      },
    });

    return res.status(201).json(activity);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create workflow activity.",
    });
  }
});


router.patch(
  "/:id/activities/:activityId/status",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const activityId = Number(req.params.activityId);
      const { status } = req.body;

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(activityId) ||
        activityId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid project or activity ID.",
        });
      }

      const validStatuses = [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "RETURNED",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid workflow activity status.",
        });
      }

      const activity = await prisma.workflowActivity.findFirst({
        where: {
          id: activityId,
          projectId,
        },
      });

      if (!activity) {
        return res.status(404).json({
          message: "Workflow activity not found for this project.",
        });
      }

      const updatedActivity = await prisma.workflowActivity.update({
        where: {
          id: activityId,
        },
        data: {
          status,
          startedAt:
            status === "IN_PROGRESS"
              ? activity.startedAt ?? new Date()
              : activity.startedAt,
          completedAt:
            status === "COMPLETED"
              ? new Date()
              : status === "PENDING" || status === "RETURNED"
                ? null
                : activity.completedAt,
        },
      });

      return res.json(updatedActivity);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to update workflow activity status.",
      });
    }
  }
);

router.post(
  "/:id/activities/:activityId/approvals",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const activityId = Number(req.params.activityId);
      const { decision, remarks } = req.body;
      const approverId = Number((req as any).user?.userId);

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(activityId) ||
        activityId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid project or activity ID.",
        });
      }

      if (!Number.isInteger(approverId) || approverId <= 0) {
        return res.status(401).json({
          message: "Authenticated user ID is unavailable.",
        });
      }

      const validDecisions = ["APPROVED", "REJECTED", "RETURNED"];

      if (typeof decision !== "string" ||
  !validDecisions.includes(decision)) {
        return res.status(400).json({
          message: "Invalid approval decision.",
        });
      }

      const activity = await prisma.workflowActivity.findFirst({
        where: {
          id: activityId,
          projectId,
        },
        select: { id: true },
      });

      if (!activity) {
        return res.status(404).json({
          message: "Workflow activity not found for this project.",
        });
      }

      const approval = await prisma.approval.create({
        data: {
          workflowActivityId: activityId,
          approverId,
          decision: decision as "APPROVED" | "REJECTED" | "RETURNED",
          
          remarks:
            typeof remarks === "string" ? remarks.trim() || null : null,
          decidedAt: new Date(),
        },
      });

      return res.status(201).json(approval);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to record approval decision.",
      });
    }
  }
);
router.post("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { reviewType, scheduledAt, remarks } = req.body;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    if (!["PMRB", "EB"].includes(reviewType)) {
      return res.status(400).json({
        message: "Review type must be PMRB or EB.",
      });
    }

    const date = new Date(scheduledAt);

    if (!scheduledAt || Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "A valid scheduled date is required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const review = await prisma.review.create({
      data: {
        projectId,
        reviewType,
        scheduledAt: date,
        remarks: typeof remarks === "string" ? remarks.trim() || null : null,
      },
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to schedule review." });
  }
});
router.get("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const reviews = await prisma.review.findMany({
      where: { projectId },
      orderBy: { scheduledAt: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviewsWithStatus = reviews.map((review) => {
      let displayStatus = review.status;

      if (review.status !== "COMPLETED") {
        const scheduledDate = new Date(review.scheduledAt);
        scheduledDate.setHours(0, 0, 0, 0);

        displayStatus =
          scheduledDate < today ? "DELAYED" : "UPCOMING";
      }

      return {
        ...review,
        displayStatus,
      };
    });

    return res.json(reviewsWithStatus);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch project reviews.",
    });
  }
});

router.patch(
  "/:id/reviews/:reviewId/complete",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const reviewId = Number(req.params.reviewId);
      const { remarks } = req.body;

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(reviewId) ||
        reviewId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid project or review ID.",
        });
      }

      const review = await prisma.review.findFirst({
        where: {
          id: reviewId,
          projectId,
        },
      });

      if (!review) {
        return res.status(404).json({
          message: "Review not found for this project.",
        });
      }

      // Prevent completing the same review twice.
      if (review.status === "COMPLETED") {
        return res.status(400).json({
          message: "This review is already completed.",
        });
      }

      // Calculate the next review date from the original scheduled date.
      const nextScheduledAt = new Date(review.scheduledAt);
      


      if (review.reviewType === "PMRB") {
        nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 3);
      } else {
        nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 6);
      }
      
      // Update the completed review and schedule the next review atomically.
      const updatedReview = await prisma.$transaction(async (tx) => {
        const completedReview = await tx.review.update({
          where: { id: reviewId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            remarks:
              typeof remarks === "string"
                ? remarks.trim() || null
                : review.remarks,
          },
        });

        // Avoid creating a duplicate review for the same project,
        // review type, and scheduled date.
        const existingNextReview = await tx.review.findFirst({
          where: {
            projectId,
            reviewType: review.reviewType,
            scheduledAt: nextScheduledAt,
          },
        });

        if (!existingNextReview) {
          await tx.review.create({
            data: {
              projectId,
              reviewType: review.reviewType,
              scheduledAt: nextScheduledAt,
              remarks: "Automatically scheduled after the previous review.",
            },
          });
        }

        return completedReview;
      });
      const savedReviews = await prisma.review.findMany({
  where: {
    projectId,
    reviewType: review.reviewType,
  },
  orderBy: {
    scheduledAt: "asc",
  },
});


      return res.json({
        message: "Review completed and next review scheduled.",
        review: updatedReview,
        nextScheduledAt,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to complete review.",
      });
    }
  }
);

export default router;
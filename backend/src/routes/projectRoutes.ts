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
  } catch (error) {
    console.error(error);

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

export default router;
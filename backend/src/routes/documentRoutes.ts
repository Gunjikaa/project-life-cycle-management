
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/authMiddleware";
import prisma from "../lib/prisma";

const router = Router();

const uploadDirectory = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname).toLowerCase()}`;

    callback(null, uniqueName);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Unsupported file type."));
    }

    callback(null, true);
  },
});

router.post(
  "/projects/:projectId/activities/:activityId/documents",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const activityId = Number(req.params.activityId);
      const userId = Number((req as any).user?.userId);

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(activityId) ||
        activityId <= 0 ||
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid project, activity, or user ID.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a file to upload.",
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
        fs.unlinkSync(req.file.path);

        return res.status(404).json({
          message: "Workflow activity not found for this project.",
        });
      }

      const document = await prisma.document.create({
        data: {
          projectId,
          workflowActivityId: activityId,
          uploadedById: userId,
          fileName: req.file.originalname,
          filePath: req.file.filename,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          description:
            typeof req.body.description === "string"
              ? req.body.description
              : null,
        },
      });

      return res.status(201).json(document);
    } catch (error) {
      console.error(error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        message: "Failed to upload document.",
      });
    }
  }
);
router.get(
  "/documents/:documentId/download",
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = Number(req.params.documentId);

      if (!Number.isInteger(documentId) || documentId <= 0) {
        return res.status(400).json({
          message: "Invalid document ID.",
        });
      }

      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return res.status(404).json({
          message: "Document not found.",
        });
      }

      const filePath = path.resolve(
        process.cwd(),
        "uploads",
        path.basename(document.filePath)
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Stored file not found.",
        });
      }

      return res.download(filePath, document.fileName);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to download document.",
      });
    }
  }
);
export default router;

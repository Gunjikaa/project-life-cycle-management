import { Router } from "express";
import prisma from "../lib/prisma";
import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch users.",
    });
  }
  }
);

export default router;

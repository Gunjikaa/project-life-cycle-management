import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  role: UserRole;
}

export type UserRole =
  | "ADMIN"
  | "PROJECT_DIRECTOR"
  | "REVIEWER"
  | "VIEWER";

const validRoles: UserRole[] = [
  "ADMIN",
  "PROJECT_DIRECTOR",
  "REVIEWER",
  "VIEWER",
];

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token required.",
    });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "Authentication is not configured.",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (
      !Number.isInteger(decoded.userId) ||
      decoded.userId <= 0 ||
      !validRoles.includes(decoded.role)
    ) {
      return res.status(403).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };

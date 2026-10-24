declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: "ADMIN" | "PROJECT_DIRECTOR" | "REVIEWER" | "VIEWER";
      };
    }
  }
}

export {};

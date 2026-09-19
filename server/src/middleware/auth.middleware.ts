import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication token missing or invalid", message: "Authentication token missing or invalid" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as TokenPayload;
    if (!decoded || !decoded.userId || !decoded.role) {
      res.status(401).json({ error: "Invalid token payload", message: "Invalid token payload" });
      return;
    }
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token", message: "Invalid or expired token" });
    return;
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions", message: "Forbidden: Insufficient permissions" });
      return;
    }
    next();
  };
};

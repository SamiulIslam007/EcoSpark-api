/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if ((session.user as any).isActive === false) {
    res.status(403).json({ message: "Your account has been deactivated. Contact support." });
    return;
  }

  req.user = {
    id: session.user.id,
    role: (session.user as any).role ?? "MEMBER",
  };

  next();
};

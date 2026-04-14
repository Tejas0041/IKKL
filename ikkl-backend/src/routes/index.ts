import { Router } from "express";
import teamsRouter from "./teams.js";
import matchesRouter from "./matches.js";
import settingsRouter from "./settings.js";
import uploadRouter from "./upload.js";
import timerRouter from "./timer.js";
import authRouter from "./auth.js";
import { requireAuth } from "../lib/authMiddleware.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

// Auth — public
router.use("/auth", authRouter);

/**
 * Middleware to allow GET requests without authentication,
 * while requiring authentication for all other methods (POST, PUT, DELETE, etc.)
 */
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.method === "GET") return next();
  return requireAuth(req, res, next);
};

// Mount routers with public read-only access and authenticated write access
router.use("/teams", optionalAuth, teamsRouter);
router.use("/matches", optionalAuth, matchesRouter);
router.use("/settings", optionalAuth, settingsRouter);
router.use("/timer", optionalAuth, timerRouter);

// Upload always requires authentication as it's typically a POST-only mutation
router.use("/upload", requireAuth, uploadRouter);

export default router;


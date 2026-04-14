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

// Public read-only routes (GET only, no auth)
router.get("/teams", (req, res, next) => teamsRouter(req, res, next));
router.get("/matches", (req, res, next) => matchesRouter(req, res, next));
router.get("/matches/:matchId", (req, res, next) => matchesRouter(req, res, next));
router.get("/settings", (req, res, next) => settingsRouter(req, res, next));
router.get("/timer/:matchId", (req, res, next) => timerRouter(req, res, next));

// All mutations require auth
router.use("/teams", requireAuth, teamsRouter);
router.use("/matches", requireAuth, matchesRouter);
router.use("/settings", requireAuth, settingsRouter);
router.use("/upload", requireAuth, uploadRouter);
router.use("/timer", requireAuth, timerRouter);

export default router;

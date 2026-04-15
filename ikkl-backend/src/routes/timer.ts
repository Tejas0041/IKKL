import { Router } from "express";
import { Settings } from "../models/Settings.js";

const router = Router();

const DEFAULT_TIMER = { remainingMs: 7 * 60 * 1000, running: false, visible: true, savedAt: null };
const DEFAULT_BREAK = { remainingMs: 5 * 60 * 1000, running: false, savedAt: null };

router.get("/:matchId", async (req, res) => {
  const doc = await Settings.findOne({ key: `timer:${req.params.matchId}` });
  if (!doc) return res.json(DEFAULT_TIMER);
  res.json(JSON.parse(doc.value));
});

router.put("/:matchId", async (req, res) => {
  const { remainingMs, running, visible } = req.body;
  const value = JSON.stringify({ remainingMs, running, visible, savedAt: Date.now() });
  const doc = await Settings.findOneAndUpdate(
    { key: `timer:${req.params.matchId}` },
    { value },
    { new: true, upsert: true }
  );
  res.json(doc);
});

// Break timer
router.get("/break/:matchId", async (req, res) => {
  const doc = await Settings.findOne({ key: `break:${req.params.matchId}` });
  if (!doc) return res.json(DEFAULT_BREAK);
  res.json(JSON.parse(doc.value));
});

router.put("/break/:matchId", async (req, res) => {
  const { remainingMs, running } = req.body;
  const value = JSON.stringify({ remainingMs, running, savedAt: Date.now() });
  const doc = await Settings.findOneAndUpdate(
    { key: `break:${req.params.matchId}` },
    { value },
    { new: true, upsert: true }
  );
  res.json(doc);
});

export default router;

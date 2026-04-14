import { Router } from "express";
import { Settings } from "../models/Settings.js";

const router = Router();

// Timer state shape: { remainingMs, running, visible, savedAt }
// savedAt lets us compute drift on resume

router.get("/:matchId", async (req, res) => {
  const doc = await Settings.findOne({ key: `timer:${req.params.matchId}` });
  if (!doc) return res.json({ remainingMs: 7 * 60 * 1000, running: false, visible: true, savedAt: null });
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

export default router;

import { Router } from "express";
import { Settings } from "../models/Settings.js";

const router = Router();

const DEFAULTS: Record<string, string> = {
  leagueStartDate: "2026-04-03T00:00",
  leagueEndDate: "2026-04-05T00:00",
  leagueVenue: "Parade Ground, IIEST Shibpur",
};

// GET /api/settings  — returns all settings merged with defaults
router.get("/", async (_req, res) => {
  const docs = await Settings.find();
  const result = { ...DEFAULTS };
  for (const doc of docs) result[doc.key] = doc.value;
  res.json(result);
});

// GET /api/settings/:key
router.get("/:key", async (req, res) => {
  const doc = await Settings.findOne({ key: req.params.key });
  const value = doc?.value ?? DEFAULTS[req.params.key];
  if (value === undefined) return res.status(404).json({ error: "Not found" });
  res.json({ key: req.params.key, value });
});

// PUT /api/settings/:key
router.put("/:key", async (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "value required" });
  const doc = await Settings.findOneAndUpdate(
    { key: req.params.key },
    { value },
    { new: true, upsert: true }
  );
  res.json(doc);
});

export default router;

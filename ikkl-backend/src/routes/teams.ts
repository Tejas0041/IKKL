import { Router } from "express";
import { Team } from "../models/Team.js";

const router = Router();

router.get("/", async (_req, res) => {
  const teams = await Team.find();
  res.json(teams);
});

router.get("/:id", async (req, res) => {
  const team = await Team.findOne({ id: req.params.id });
  if (!team) return res.status(404).json({ error: "Team not found" });
  res.json(team);
});

router.post("/", async (req, res) => {
  const body = req.body;
  // Auto-generate id from shortName if not provided
  if (!body.id && body.shortName) {
    body.id = body.shortName.toUpperCase().replace(/\s+/g, "").slice(0, 6);
  }
  const team = new Team(body);
  await team.save();
  res.status(201).json(team);
});

router.put("/:id", async (req, res) => {
  const team = await Team.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  if (!team) return res.status(404).json({ error: "Team not found" });
  res.json(team);
});

router.delete("/:id", async (req, res) => {
  await Team.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

export default router;

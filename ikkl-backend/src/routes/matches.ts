import { Router } from "express";
import { Match } from "../models/Match.js";
import { Team } from "../models/Team.js";
import { emitScoreUpdate, getIO } from "../lib/socket.js";

const router = Router();

// Helper: enrich embedded team refs with latest logo from Team collection
async function enrichMatches(matches: any[]) {
  const teamIds = [...new Set(matches.flatMap(m => [m.teamA?.id, m.teamB?.id].filter(Boolean)))];
  const teams = await Team.find({ id: { $in: teamIds } });
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
  return matches.map(m => {
    const obj = m.toObject ? m.toObject() : m;
    if (obj.teamA?.id && teamMap[obj.teamA.id]) obj.teamA.logo = teamMap[obj.teamA.id].logo;
    if (obj.teamB?.id && teamMap[obj.teamB.id]) obj.teamB.logo = teamMap[obj.teamB.id].logo;
    return obj;
  });
}

router.get("/", async (req, res) => {
  const { status, team } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (team) filter.$or = [{ "teamA.id": team }, { "teamB.id": team }];
  const matches = await Match.find(filter).sort({ dateStr: 1, time: 1 });
  res.json(await enrichMatches(matches));
});

router.get("/live", async (_req, res) => {
  const matches = await Match.find({ status: "LIVE" });
  res.json(await enrichMatches(matches));
});

router.get("/:matchId", async (req, res) => {
  const match = await Match.findOne({ matchId: req.params.matchId });
  if (!match) return res.status(404).json({ error: "Match not found" });
  const [enriched] = await enrichMatches([match]);
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const match = new Match(req.body);
  await match.save();
  res.status(201).json(match);
});

router.put("/:matchId", async (req, res) => {
  const match = await Match.findOneAndUpdate(
    { matchId: req.params.matchId },
    req.body,
    { new: true }
  );
  if (!match) return res.status(404).json({ error: "Match not found" });
  res.json(match);
});

// Update score only
router.patch("/:matchId/score", async (req, res) => {
  const { scoreA, scoreB, status, scoringTeam, points, category, teamName } = req.body;
  const match = await Match.findOneAndUpdate(
    { matchId: req.params.matchId },
    { $set: { scoreA, scoreB, ...(status && { status }) } },
    { new: true }
  );
  if (!match) return res.status(404).json({ error: "Match not found" });

  // Emit real-time update
  if (scoringTeam) {
    emitScoreUpdate(req.params.matchId, {
      scoreA, scoreB, status: status || match.status,
      scoringTeam, points: points || 1,
      category: category || "normal",
      teamName: teamName || "",
    });
  }

  res.json(match);
});

// End inning / declare result
router.patch("/:matchId/inning", async (req, res) => {
  const match = await Match.findOne({ matchId: req.params.matchId });
  if (!match) return res.status(404).json({ error: "Match not found" });

  const { action } = req.body; // "end_inning1" | "end_match"

  if (action === "end_inning1") {
    // Save inning 1 snapshot — scores keep accumulating, no reset
    await Match.findOneAndUpdate(
      { matchId: req.params.matchId },
      { $set: { inning: 2, inning1ScoreA: match.scoreA ?? 0, inning1ScoreB: match.scoreB ?? 0 } },
      { new: true }
    );
    getIO()?.emit("scores:changed");
    return res.json({ ok: true, inning: 2 });
  }

  if (action === "end_match") {
    // Final scores are already the running total — just mark completed
    const updated = await Match.findOneAndUpdate(
      { matchId: req.params.matchId },
      { $set: { status: "COMPLETED" } },
      { new: true }
    );
    getIO()?.emit("scores:changed");
    return res.json(updated);
  }

  res.status(400).json({ error: "Invalid action" });
});

router.delete("/:matchId", async (req, res) => {
  await Match.findOneAndDelete({ matchId: req.params.matchId });
  res.json({ success: true });
});

export default router;

import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Flag, Award, Flame, CheckCircle2, Activity } from "lucide-react";
import { fetchMatch, fetchTimer } from "@/lib/api";
import { getSocket, type ScoreUpdate, type TimerUpdate } from "@/lib/socket";
import { setFullscreen } from "@/lib/fullscreen";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { TeamBadge } from "@/components/ui/TeamBadge";
import type { Match } from "@/lib/types";

export default function Scorecard() {
  const params = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreToast, setScoreToast] = useState<ScoreUpdate | null>(null);
  const [timer, setTimer] = useState<TimerUpdate | null>(null);
  const [localMs, setLocalMs] = useState(0);
  const msStartRef = useRef<number>(0);
  const msRafRef = useRef<number>(0);

  // Load timer from DB on mount
  useEffect(() => {
    if (!params.matchId) return;
    fetchTimer(params.matchId).then(t => {
      let ms = t.remainingMs;
      if (t.running && t.savedAt) ms = Math.max(0, t.remainingMs - (Date.now() - t.savedAt));
      setTimer({ matchId: params.matchId!, seconds: Math.floor(ms / 1000), running: t.running, visible: t.visible });
      setLocalMs(Math.floor((ms % 1000) / 10));
    }).catch(() => {});
  }, [params.matchId]);

  // RAF-based local ms counter — accurate, pauses at exact value
  useEffect(() => {
    if (!timer?.running) {
      cancelAnimationFrame(msRafRef.current);
      return;
    }
    const startMs = localMs * 10; // ms offset at start
    const startTime = msStartRef.current || performance.now();
    msStartRef.current = startTime;
    const tick = () => {
      const elapsed = performance.now() - startTime;
      setLocalMs(Math.floor((startMs + elapsed) % 1000 / 10));
      msRafRef.current = requestAnimationFrame(tick);
    };
    msRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(msRafRef.current);
  }, [timer?.running, timer?.seconds]);
  const [isFullscreen, setIsFullscreenLocal] = useState(false);

  // F key toggles fullscreen (desktop only)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && window.innerWidth >= 768) {
        setIsFullscreenLocal(prev => {
          const next = !prev;
          setFullscreen(next);
          return next;
        });
      }
      if (e.key === "Escape") {
        setIsFullscreenLocal(false);
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setFullscreen(false);
    };
  }, []);

  useEffect(() => {
    if (!params.matchId) return;
    fetchMatch(params.matchId)
      .then(m => setMatch(m as Match))
      .catch(() => setMatch(null))
      .finally(() => setLoading(false));
  }, [params.matchId]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!params.matchId) return;
    const socket = getSocket();
    socket.emit("join:match", params.matchId);

    socket.on("score:update", (update: ScoreUpdate) => {
      setMatch(prev => prev ? { ...prev, scoreA: update.scoreA, scoreB: update.scoreB, status: update.status as Match["status"] } : prev);
      setScoreToast(update);
      setTimeout(() => setScoreToast(null), 3000);
    });

    // Re-fetch match on inning change or match end
    socket.on("scores:changed", () => {
      if (!params.matchId) return;
      fetchMatch(params.matchId).then(m => setMatch(m as Match)).catch(() => {});
    });

    socket.on("timer:update", (update: TimerUpdate) => {
      setTimer(update);
      // Use exact ms from admin — don't reset to 0
      setLocalMs(update.ms ?? 0);
      // Reset RAF start so it continues from this ms value
      msStartRef.current = performance.now();
    });

    return () => {
      socket.emit("leave:match", params.matchId);
      socket.off("score:update");
      socket.off("timer:update");
    };
  }, [params.matchId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/40 text-sm">Loading…</p>
    </div>
  );

  if (!match) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Scorecard Not Found</h1>
        <Link href="/scores" className="text-primary hover:underline">Back to Scores</Link>
      </div>
    </div>
  );

  const { teamA, teamB, scoreA, scoreB } = match;
  const isLive = match.status === "LIVE";
  const isCompleted = match.status === "COMPLETED";
  const hasStats = isCompleted && match.statsA && match.statsB;
  const winner = (scoreA ?? 0) > (scoreB ?? 0) ? teamA : teamB;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-20">
      {/* Score toast notification */}
      <AnimatePresence>
        {scoreToast && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{
              background: scoreToast.category === "dive" ? "rgba(249,115,22,0.95)" : "rgba(255,195,0,0.95)",
              boxShadow: scoreToast.category === "dive" ? "0 0 40px rgba(249,115,22,0.5)" : "0 0 40px rgba(255,195,0,0.5)",
            }}>
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 0.4 }}
              className="font-display font-black text-3xl text-[#000814]">
              +{scoreToast.points}
            </motion.span>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm text-[#000814] leading-tight">{scoreToast.teamName}</span>
              <span className="text-[11px] font-bold text-[#000814]/70 uppercase tracking-wider">
                {scoreToast.category === "dive" ? "🔥 Dive Touch" : "✓ Normal Touch"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <div className={clsx("flex items-center justify-between mb-6 sm:mb-8 gap-4", isFullscreen && "hidden")}>
          <Link href="/scores" className="inline-flex items-center gap-2 text-white/50 hover:text-primary transition-colors group outline-none text-sm sm:text-base">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" /> Back to Scores
          </Link>
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500 block" />
              <span className="text-xs font-bold text-red-400 tracking-widest uppercase">Live Now</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold text-green-400 tracking-widest uppercase">Full Time</span>
            </div>
          )}
        </div>

        {/* Score board */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 relative overflow-hidden mb-8 sm:mb-12"
          style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.9),rgba(0,6,18,0.97))", border: isLive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,195,0,0.15)" }}>
          {isCompleted && (
            <div className={clsx("absolute inset-y-0 w-1/2 opacity-20 blur-[100px] pointer-events-none", winner.id === teamA.id ? "left-0" : "right-0")}
              style={{ background: "rgba(255,195,0,0.6)" }} />
          )}

          <div className="text-center mb-6 sm:mb-10 relative z-10 flex flex-col items-center gap-2 sm:gap-3">
            <span className="px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-widest text-white/60 uppercase"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {match.dateStr} · {match.venue}
            </span>
            {isLive && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(255,195,0,0.12)", border: "1px solid rgba(255,195,0,0.3)", color: "rgba(255,195,0,0.9)" }}>
                Inning {match.inning ?? 1} of 2
              </span>
            )}
            {isLive && (match.inning ?? 1) === 2 && match.inning1ScoreA !== undefined && (
              <span className="text-[11px] text-white/40">
                Inning 1: {match.inning1ScoreA} – {match.inning1ScoreB}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between relative z-10 gap-2 sm:gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center flex-1 min-w-0 gap-2 sm:gap-4">
              <TeamBadge team={teamA} size="xl" />
              <h2 className="text-sm sm:text-xl md:text-2xl font-display font-bold text-center text-white leading-tight">{teamA.name}</h2>
              {isCompleted && winner.id === teamA.id && (
                <div className="flex items-center gap-1 text-[#001d3d] bg-primary text-[10px] sm:text-sm font-bold tracking-widest px-2 sm:px-3 py-1 rounded-full"
                  style={{ boxShadow: "0 0 10px rgba(255,195,0,0.5)" }}>
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" /> WINNER
                </div>
              )}
            </div>

            {/* Score */}
            <div className="flex flex-col items-center shrink-0 px-1 sm:px-4 md:px-12 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
                <span className={clsx("text-4xl sm:text-6xl md:text-8xl font-display font-bold", isCompleted && winner.id === teamA.id ? "text-white" : isCompleted ? "text-white/40" : "text-white")}
                  style={isCompleted && winner.id === teamA.id ? { textShadow: "0 0 30px rgba(255,195,0,0.5)" } : {}}>
                  {scoreA ?? 0}
                </span>
                <span className="text-lg sm:text-3xl text-primary/30 font-display">–</span>
                <span className={clsx("text-4xl sm:text-6xl md:text-8xl font-display font-bold", isCompleted && winner.id === teamB.id ? "text-white" : isCompleted ? "text-white/40" : "text-white")}
                  style={isCompleted && winner.id === teamB.id ? { textShadow: "0 0 30px rgba(255,195,0,0.5)" } : {}}>
                  {scoreB ?? 0}
                </span>
              </div>
              <span className="text-[10px] sm:text-sm text-white/40 font-medium tracking-wider px-3 py-1 rounded-full"
                style={{ background: "rgba(0,29,61,0.6)", border: "1px solid rgba(0,53,102,0.8)" }}>
                {isLive ? "LIVE SCORE" : "FINAL SCORE"}
              </span>
              {isLive && (
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
                  className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Match in progress</span>
                </motion.div>
              )}

              {/* Timer — show when visible, running or paused */}
              {isLive && timer?.visible && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-0.5 mt-1">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-display font-black text-2xl sm:text-3xl tabular-nums"
                      style={{
                        color: timer.seconds < 60 ? "#ef4444" : timer.seconds < 120 ? "#f97316" : "rgba(255,195,0,0.9)",
                        textShadow: timer.seconds < 60 ? "0 0 20px rgba(239,68,68,0.6)" : "0 0 20px rgba(255,195,0,0.4)",
                      }}>
                      {String(Math.floor(timer.seconds / 60)).padStart(2, "0")}:{String(timer.seconds % 60).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums"
                      style={{ color: timer.seconds < 60 ? "rgba(239,68,68,0.5)" : "rgba(255,195,0,0.4)" }}>
                      .{String(localMs).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest">
                    {timer.running ? "Running" : "Paused"}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center flex-1 min-w-0 gap-2 sm:gap-4">
              <TeamBadge team={teamB} size="xl" />
              <h2 className="text-sm sm:text-xl md:text-2xl font-display font-bold text-center text-white leading-tight">{teamB.name}</h2>
              {isCompleted && winner.id === teamB.id && (
                <div className="flex items-center gap-1 text-[#001d3d] bg-primary text-[10px] sm:text-sm font-bold tracking-widest px-2 sm:px-3 py-1 rounded-full"
                  style={{ boxShadow: "0 0 10px rgba(255,195,0,0.5)" }}>
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" /> WINNER
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Detailed stats — only for completed matches with stats */}
        {hasStats && match.statsA && match.statsB && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 mb-8 sm:mb-12">
              {[{ team: teamA, stats: match.statsA }, { team: teamB, stats: match.statsB }].map(({ team, stats }, idx) => (
                <motion.div key={team.id} initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
                  className="p-5 sm:p-6 rounded-2xl"
                  style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.8),rgba(0,6,18,0.95))", border: "1px solid rgba(0,53,102,0.6)" }}>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-5 pb-4 border-b flex items-center gap-2"
                    style={{ borderColor: "rgba(0,53,102,0.6)" }}>
                    {team.name}
                  </h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 rounded-lg"
                      style={{ background: "rgba(0,29,61,0.5)", border: "1px solid rgba(0,53,102,0.5)" }}>
                      <span className="text-white/70 text-sm">Normal Touches (+1)</span>
                      <div className="text-right text-sm">
                        <span className="text-white font-bold">{stats.normalTouches.count}</span>
                        <span className="text-white/40 text-xs ml-2">({stats.normalTouches.points} pts)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg"
                      style={{ background: "rgba(255,195,0,0.05)", border: "1px solid rgba(255,195,0,0.2)" }}>
                      <span className="text-primary flex items-center gap-2 text-sm"><Flame className="w-4 h-4" /> Dive Touches (+2)</span>
                      <div className="text-right text-sm">
                        <span className="text-white font-bold">{stats.diveTouches.count}</span>
                        <span className="text-primary/60 text-xs ml-2">({stats.diveTouches.points} pts)</span>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold text-white/50 tracking-widest uppercase mb-3">Top Performers</h4>
                  <div className="space-y-3">
                    {stats.topPlayers.map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center pb-2 border-b last:border-0 text-sm"
                        style={{ borderColor: "rgba(0,53,102,0.5)" }}>
                        <span className="text-white/90 font-medium flex items-center gap-2">
                          <span className="text-white/30 text-xs w-4">{i + 1}.</span>{p.name}
                        </span>
                        <span className="font-display font-bold text-primary">{p.points} <span className="text-xs text-white/40 font-sans">pts</span></span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-5 sm:p-6 md:p-8 rounded-2xl"
              style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.8),rgba(0,6,18,0.95))", border: "1px solid rgba(0,53,102,0.6)" }}>
              <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-6 sm:mb-8 flex items-center gap-2">
                <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Innings Timeline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Inning 1", sub: `${teamA.shortName} Attacks`, val: match.statsA.innings[0] },
                  { label: "Inning 2", sub: `${teamB.shortName} Attacks`, val: match.statsB.innings[0] },
                  { label: "Inning 3", sub: `${teamA.shortName} Attacks`, val: match.statsA.innings[1] },
                  { label: "Inning 4", sub: `${teamB.shortName} Attacks`, val: match.statsB.innings[1] },
                ].map(({ label, sub, val }) => (
                  <div key={label} className="p-3 sm:p-4 rounded-xl text-center"
                    style={{ background: "rgba(0,8,20,0.6)", border: "1px solid rgba(0,53,102,0.6)" }}>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1 sm:mb-2">{label}</p>
                    <p className="text-xs sm:text-sm font-medium text-white/70 mb-1">{sub}</p>
                    <p className="font-display text-2xl sm:text-3xl font-bold text-white">{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Live match — no stats yet */}
        {isLive && !hasStats && (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Activity className="w-10 h-10 text-red-400/40 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Detailed stats will be available after the match ends.</p>
          </div>
        )}
      </div>
    </div>
  );
}

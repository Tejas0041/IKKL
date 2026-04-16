import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Flag, Award, Flame, CheckCircle2, Activity, Clock } from "lucide-react";
import { fetchMatch, fetchTimer, fetchBreakTimer } from "@/lib/api";
import { getSocket, type ScoreUpdate, type TimerUpdate, type BreakUpdate } from "@/lib/socket";
import { setFullscreen } from "@/lib/fullscreen";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { DotsLoader } from "@/components/ui/DotsLoader";
import { PageBg } from "@/components/layout/PageBg";
import { victoryMarginStr } from "@/lib/utils";
import type { Match, ScoreHistoryEntry } from "@/lib/types";

export default function Scorecard() {
  const params = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreToast, setScoreToast] = useState<ScoreUpdate | null>(null);
  const [timer, setTimer] = useState<TimerUpdate | null>(null);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);

  // Break timer — simple state, driven entirely by socket
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);
  const [breakRunning, setBreakRunning] = useState(false);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Match timer RAF
  const timerRunningRef = useRef(false);
  const timerSecondsRef = useRef(0);
  const rafRef = useRef<number>(0);
  const rafStartTimeRef = useRef<number>(0);
  const rafStartMsRef = useRef<number>(0);

  const [isFullscreen, setIsFullscreenLocal] = useState(false);

  const stopBreakInterval = () => {
    if (breakIntervalRef.current) { clearInterval(breakIntervalRef.current); breakIntervalRef.current = null; }
  };
  const startBreakInterval = (fromSeconds: number) => {
    stopBreakInterval();
    let s = fromSeconds;
    breakIntervalRef.current = setInterval(() => {
      s = Math.max(0, s - 1);
      setBreakSeconds(s);
      if (s <= 0) { stopBreakInterval(); setBreakRunning(false); }
    }, 1000);
  };
  useEffect(() => () => stopBreakInterval(), []);

  // Load timers on mount
  useEffect(() => {
    if (!params.matchId) return;
    fetchTimer(params.matchId).then(t => {
      let ms = t.remainingMs;
      if (t.running && t.savedAt) ms = Math.max(0, t.remainingMs - (Date.now() - t.savedAt));
      const seconds = Math.floor(ms / 1000);
      const msVal = Math.floor((ms % 1000) / 10);
      timerSecondsRef.current = seconds;
      timerRunningRef.current = t.running;
      setTimer({ matchId: params.matchId!, seconds, running: t.running, visible: t.visible, ms: msVal });
    }).catch(() => {});
    fetchBreakTimer(params.matchId).then(t => {
      let ms = t.remainingMs;
      if (t.running && t.savedAt) ms = Math.max(0, t.remainingMs - (Date.now() - t.savedAt));
      const s = Math.floor(ms / 1000);
      setBreakSeconds(s || 5 * 60);
      setBreakRunning(t.running);
      if (t.running && s > 0) startBreakInterval(s);
    }).catch(() => {});
  }, [params.matchId]);

  // Match timer RAF — only restarts on running transition
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!timerRunningRef.current) return;
    rafStartTimeRef.current = performance.now();
    rafStartMsRef.current = (timer?.ms ?? 0) * 10;
    const tick = () => {
      const elapsed = performance.now() - rafStartTimeRef.current;
      const msVal = Math.floor((rafStartMsRef.current + elapsed) % 1000 / 10);
      setTimer(prev => prev ? { ...prev, ms: msVal } : prev);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunningRef.current]);

  // Fullscreen key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && window.innerWidth >= 768) {
        setIsFullscreenLocal(prev => { const next = !prev; setFullscreen(next); return next; });
      }
      if (e.key === "Escape") { setIsFullscreenLocal(false); setFullscreen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); setFullscreen(false); };
  }, []);

  // Fetch match
  useEffect(() => {
    if (!params.matchId) return;
    fetchMatch(params.matchId).then(m => {
      const match = m as Match;
      setMatch(match);
      setHistory(match.scoreHistory ?? []);
    }).catch(() => setMatch(null)).finally(() => setLoading(false));
  }, [params.matchId]);

  // Socket
  useEffect(() => {
    if (!params.matchId) return;
    const socket = getSocket();
    socket.emit("join:match", params.matchId);

    socket.on("score:update", (update: ScoreUpdate) => {
      setMatch(prev => prev ? { ...prev, scoreA: update.scoreA, scoreB: update.scoreB, status: update.status as Match["status"] } : prev);
      setScoreToast(update);
      setTimeout(() => setScoreToast(null), 3000);
    });
    socket.on("scores:changed", () => {
      if (!params.matchId) return;
      fetchMatch(params.matchId).then(m => {
        const match = m as Match;
        setMatch(match);
        setHistory(match.scoreHistory ?? []);
      }).catch(() => {});
    });
    socket.on("history:update", (h: ScoreHistoryEntry[]) => {
      setHistory(h);
    });
    socket.on("timer:update", (update: TimerUpdate) => {
      const wasRunning = timerRunningRef.current;
      timerRunningRef.current = update.running;
      timerSecondsRef.current = update.seconds;
      if (update.running && !wasRunning) {
        rafStartTimeRef.current = performance.now();
        rafStartMsRef.current = (update.ms ?? 0) * 10;
      }
      setTimer(prev => ({ ...update, ms: update.running ? (prev?.ms ?? update.ms ?? 0) : (update.ms ?? 0) }));
    });
    socket.on("break:update", (update: BreakUpdate) => {
      stopBreakInterval();
      setBreakSeconds(update.seconds);
      setBreakRunning(update.running);
      if (update.running && update.seconds > 0) startBreakInterval(update.seconds);
    });

    return () => {
      socket.emit("leave:match", params.matchId);
      socket.off("score:update");
      socket.off("scores:changed");
      socket.off("timer:update");
      socket.off("break:update");
      socket.off("history:update");
    };
  }, [params.matchId]);

  if (loading) return <DotsLoader variant="page" label="Loading scorecard" />;
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
  const breakColor = breakSeconds < 60 ? "#ef4444" : breakSeconds < 120 ? "#f97316" : "#60a5fa";

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-20 relative">
      <PageBg />
      <AnimatePresence>
        {scoreToast && (
          <motion.div initial={{ opacity: 0, y: -60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{ background: scoreToast.category === "dive" ? "rgba(249,115,22,0.95)" : "rgba(255,195,0,0.95)",
              boxShadow: scoreToast.category === "dive" ? "0 0 40px rgba(249,115,22,0.5)" : "0 0 40px rgba(255,195,0,0.5)" }}>
            <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 0.4 }}
              className="font-display font-black text-3xl text-[#000814]">+{scoreToast.points}</motion.span>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm text-[#000814] leading-tight">{scoreToast.teamName}</span>
              <span className="text-[11px] font-bold text-[#000814]/70 uppercase tracking-wider">
                {scoreToast.category === "dive" ? "🔥 Dive Touch" : "✓ Normal Touch"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <div className={clsx("flex items-center justify-between mb-6 sm:mb-8 gap-4", isFullscreen && "hidden")}>
          <Link href="/scores" className="inline-flex items-center gap-2 text-white/50 hover:text-primary transition-colors group outline-none text-sm sm:text-base">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" /> Back to Scores
          </Link>
          {isLive && !match.inningBreak && (
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

        {/* ── INNING BREAK OVERLAY ── */}
        {isLive && match.inningBreak && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl sm:rounded-3xl p-8 sm:p-12 mb-8 flex flex-col items-center gap-6 relative overflow-hidden"
            style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.95),rgba(0,6,18,0.98))", border: "1px solid rgba(59,130,246,0.3)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(59,130,246,0.12),transparent 65%)" }} />
            <div className="relative z-10 text-center">
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(96,165,250,0.7)" }}>
                {match.matchType === "final" ? "🏆 Final" : "Half Time"}
              </p>
              <h2 className="text-5xl sm:text-7xl font-display font-black text-white mb-2"
                style={{ textShadow: "0 0 40px rgba(59,130,246,0.5)" }}>INNING BREAK</h2>
              <p className="text-white/40 text-sm">
                Inning {match.inning ?? 1} starts soon
              </p>
            </div>
            {/* Score snapshot at break */}
            <div className="relative z-10 flex items-center gap-6 px-8 py-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-center">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{match.teamA.shortName}</p>
                <p className="font-display font-black text-4xl text-white">{match.scoreA ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/25 uppercase tracking-widest">After Inning {(match.inning ?? 2) - 1}</p>
                <p className="text-white/20 font-bold text-xl">–</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{match.teamB.shortName}</p>
                <p className="font-display font-black text-4xl text-white">{match.scoreB ?? 0}</p>
              </div>
            </div>
            {/* Break countdown */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span className="font-display font-black text-5xl sm:text-6xl tabular-nums"
                style={{ color: breakColor, textShadow: `0 0 30px ${breakColor}80` }}>
                {String(Math.floor(breakSeconds / 60)).padStart(2, "0")}:{String(breakSeconds % 60).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: breakRunning ? "rgba(96,165,250,0.6)" : "rgba(255,255,255,0.2)" }}>
                {breakRunning ? "Break ends in" : "Break timer paused"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Score board — hidden during break */}
        {!(isLive && match.inningBreak) && (
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
            {match.matchType === "final" && (
              <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
                style={{ background: "linear-gradient(90deg,rgba(255,195,0,0.25),rgba(255,150,0,0.25))", border: "1px solid rgba(255,195,0,0.6)", color: "var(--primary)", letterSpacing: "0.2em" }}>
                🏆 Final
              </span>
            )}
            {isLive && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(255,195,0,0.12)", border: "1px solid rgba(255,195,0,0.3)", color: "rgba(255,195,0,0.9)" }}>
                Inning {match.inning ?? 1} of {match.matchType === "final" ? 4 : 2}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between relative z-10 gap-2 sm:gap-4">
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
              {isCompleted && victoryMarginStr(match) && (
                <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: "rgba(255,195,0,0.1)", border: "1px solid rgba(255,195,0,0.3)", color: "rgba(255,195,0,0.9)" }}>
                  {victoryMarginStr(match)}
                </span>
              )}
              {isLive && (
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
                  className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Match in progress</span>
                </motion.div>
              )}
              {isLive && timer?.visible && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-1 mt-2 px-6 py-4 rounded-2xl"
                  style={{ background: "rgba(0,8,20,0.6)", border: `1px solid ${(timer.seconds ?? 0) < 60 ? "rgba(239,68,68,0.3)" : "rgba(255,195,0,0.2)"}` }}>
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-display font-black text-5xl sm:text-6xl tabular-nums leading-none"
                      style={{ color: (timer.seconds ?? 0) < 60 ? "#ef4444" : (timer.seconds ?? 0) < 120 ? "#f97316" : "rgba(255,195,0,0.95)",
                        textShadow: (timer.seconds ?? 0) < 60 ? "0 0 30px rgba(239,68,68,0.7)" : "0 0 30px rgba(255,195,0,0.5)" }}>
                      {String(Math.floor((timer.seconds ?? 0) / 60)).padStart(2, "0")}:{String((timer.seconds ?? 0) % 60).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-xl font-bold tabular-nums mb-1"
                      style={{ color: (timer.seconds ?? 0) < 60 ? "rgba(239,68,68,0.55)" : "rgba(255,195,0,0.45)" }}>
                      .{String(timer.ms ?? 0).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: timer.running ? "rgba(34,197,94,0.7)" : "rgba(255,255,255,0.25)" }}>
                    {timer.running ? "● Running" : "⏸ Paused"}
                  </span>
                </motion.div>
              )}
            </div>
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
        )}

        {/* Stats */}
        {hasStats && match.statsA && match.statsB && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 mb-8 sm:mb-12">
              {[{ team: teamA, stats: match.statsA }, { team: teamB, stats: match.statsB }].map(({ team, stats }, idx) => (
                <motion.div key={team.id} initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
                  className="p-5 sm:p-6 rounded-2xl"
                  style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.8),rgba(0,6,18,0.95))", border: "1px solid rgba(0,53,102,0.6)" }}>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-5 pb-4 border-b" style={{ borderColor: "rgba(0,53,102,0.6)" }}>{team.name}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: "rgba(0,29,61,0.5)", border: "1px solid rgba(0,53,102,0.5)" }}>
                      <span className="text-white/70 text-sm">Normal Touches (+1)</span>
                      <div className="text-right text-sm">
                        <span className="text-white font-bold">{stats.normalTouches.count}</span>
                        <span className="text-white/40 text-xs ml-2">({stats.normalTouches.points} pts)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: "rgba(255,195,0,0.05)", border: "1px solid rgba(255,195,0,0.2)" }}>
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
                      <div key={p.id} className="flex justify-between items-center pb-2 border-b last:border-0 text-sm" style={{ borderColor: "rgba(0,53,102,0.5)" }}>
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
                  { label: "Inning 1", sub: `${teamA.shortName} Attacks`, val: match.statsA?.innings[0] ?? 0 },
                  { label: "Inning 2", sub: `${teamB.shortName} Attacks`, val: match.statsB?.innings[0] ?? 0 },
                  { label: "Inning 3", sub: `${teamA.shortName} Attacks`, val: match.statsA?.innings[1] ?? 0 },
                  { label: "Inning 4", sub: `${teamB.shortName} Attacks`, val: match.statsB?.innings[1] ?? 0 },
                ].map(({ label, sub, val }) => (
                  <div key={label} className="p-3 sm:p-4 rounded-xl text-center" style={{ background: "rgba(0,8,20,0.6)", border: "1px solid rgba(0,53,102,0.6)" }}>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1 sm:mb-2">{label}</p>
                    <p className="text-xs sm:text-sm font-medium text-white/70 mb-1">{sub}</p>
                    <p className="font-display text-2xl sm:text-3xl font-bold text-white">{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
        {isLive && !hasStats && !match.inningBreak && (
          <div className="text-center py-12 rounded-2xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Activity className="w-10 h-10 text-red-400/40 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Detailed stats will be available after the match ends.</p>
          </div>
        )}

        {/* ── Score History (live only) ── */}
        {isLive && history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-5 sm:p-6 rounded-2xl"
            style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.8),rgba(0,6,18,0.95))", border: "1px solid rgba(0,53,102,0.6)" }}>
            <h3 className="text-base sm:text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Score History
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {[...history].reverse().map((entry, i) => {
                const isA = entry.team === "A";
                const teamColor = isA ? teamA.color : teamB.color;
                const teamName = entry.teamName ?? (isA ? teamA.name : teamB.name);
                const isDive = entry.category === "dive";
                const timerStr = entry.timerSeconds != null
                  ? `${String(Math.floor(entry.timerSeconds / 60)).padStart(2, "0")}:${String(entry.timerSeconds % 60).padStart(2, "0")} remaining`
                  : null;
                return (
                  <div key={entry._id ?? i}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: i === 0 ? "rgba(255,195,0,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(255,195,0,0.2)" : "rgba(0,53,102,0.4)"}` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: teamColor }} />
                      <span className="text-sm font-bold text-white truncate">{teamName}</span>
                      <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0",
                        isDive ? "text-orange-400" : "text-primary/90")}
                        style={{ background: isDive ? "rgba(249,115,22,0.15)" : "rgba(255,195,0,0.1)" }}>
                        {isDive ? "🔥 Dive" : "✓ Normal"}
                      </span>
                      <span className="text-[10px] text-white/30 shrink-0">Inn.{entry.inning ?? 1}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {timerStr && (
                        <span className="text-[10px] text-white/30 hidden sm:block">{timerStr}</span>
                      )}
                      <span className={clsx("font-display font-black text-lg", isDive ? "text-orange-400" : "text-primary")}>
                        +{entry.points ?? 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

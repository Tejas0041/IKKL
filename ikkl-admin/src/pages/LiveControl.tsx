import { useEffect, useRef, useState } from "react";
import type { Match } from "@/lib/types";
import { Activity, Minus, CheckCircle, Play, Pause, RotateCcw, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const DEFAULT_SECONDS = 7 * 60; // 7 minutes

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ── Confirm modal ── */
function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="card p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <RotateCcw className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>Reset Timer?</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>This will reset to 7:00 and stop the timer.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Timer panel for a match ── */
function TimerPanel({ matchId }: { matchId: string }) {
  const [display, setDisplay] = useState({ seconds: DEFAULT_SECONDS, ms: 0 });
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const remainingMsRef = useRef<number>(DEFAULT_SECONDS * 1000);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lastSavedRef = useRef<number>(0);

  // Load from DB on mount
  useEffect(() => {
    api.getTimer(matchId).then(t => {
      let ms = t.remainingMs;
      // If it was running when saved, compute drift
      if (t.running && t.savedAt) {
        const drift = Date.now() - t.savedAt;
        ms = Math.max(0, t.remainingMs - drift);
      }
      remainingMsRef.current = ms;
      setVisible(t.visible);
      setDisplay({ seconds: Math.floor(ms / 1000), ms: Math.floor((ms % 1000) / 10) });
      // Don't auto-resume — admin must press play
    }).catch(() => {});
  }, [matchId]);

  const saveToDb = (ms: number, r: boolean, v: boolean) => {
    const now = Date.now();
    if (now - lastSavedRef.current < 500) return; // throttle
    lastSavedRef.current = now;
    api.saveTimer(matchId, { remainingMs: ms, running: r, visible: v }).catch(() => {});
  };

  const emit = (s: number, ms: number, r: boolean, v: boolean) => {
    getSocket().emit("timer:update", { matchId, seconds: s, ms, running: r, visible: v });
  };

  const tick = () => {
    const elapsed = performance.now() - startTimeRef.current;
    const left = Math.max(0, remainingMsRef.current - elapsed);
    setDisplay({ seconds: Math.floor(left / 1000), ms: Math.floor((left % 1000) / 10) });
    if (left <= 0) {
      remainingMsRef.current = 0;
      setRunning(false);
      emit(0, 0, false, visible);
      saveToDb(0, false, visible);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (running) {
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      saveToDb(remainingMsRef.current, true, visible);
      emit(display.seconds, display.ms, true, visible);
    } else {
      cancelAnimationFrame(rafRef.current);
      if (startTimeRef.current > 0) {
        const elapsed = performance.now() - startTimeRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
        startTimeRef.current = 0;
        const left = remainingMsRef.current;
        const s = Math.floor(left / 1000);
        const ms = Math.floor((left % 1000) / 10);
        setDisplay({ seconds: s, ms });
        emit(s, ms, false, visible);
        saveToDb(left, false, visible);
      }
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  // Emit seconds to socket every ~250ms while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const left = Math.max(0, remainingMsRef.current - elapsed);
      emit(Math.floor(left / 1000), Math.floor((left % 1000) / 10), true, visible);
    }, 250);
    return () => clearInterval(id);
  }, [running, visible]);

  const toggle = () => setRunning(r => !r);

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    remainingMsRef.current = DEFAULT_SECONDS * 1000;
    startTimeRef.current = 0;
    setDisplay({ seconds: DEFAULT_SECONDS, ms: 0 });
    emit(DEFAULT_SECONDS, 0, false, visible);
    saveToDb(DEFAULT_SECONDS * 1000, false, visible);
    setShowConfirm(false);
  };

  const toggleVisible = () => {
    const next = !visible;
    setVisible(next);
    emit(display.seconds, display.ms, running, next);
    saveToDb(remainingMsRef.current, running, next);
  };

  // Spacebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("07:00");

  const applyEdit = () => {
    setEditing(false);
    const parts = editVal.split(":");
    const m = parseInt(parts[0]) || 0;
    const s = parseInt(parts[1]) || 0;
    const newMs = (m * 60 + s) * 1000;
    remainingMsRef.current = newMs;
    startTimeRef.current = 0;
    const newS = Math.floor(newMs / 1000);
    setDisplay({ seconds: newS, ms: 0 });
    emit(newS, 0, running, visible);
    saveToDb(newMs, running, visible);
  };

  const pct = (display.seconds * 1000 + display.ms * 10) / (DEFAULT_SECONDS * 1000);
  const color = display.seconds < 60 ? "#ef4444" : display.seconds < 120 ? "#f97316" : "var(--primary)";

  return (
    <>
      {showConfirm && <ConfirmModal onConfirm={reset} onCancel={() => setShowConfirm(false)} />}

      <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Match Timer</span>
          <button onClick={toggleVisible}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
            style={{ background: visible ? "rgba(255,195,0,0.1)" : "rgba(255,255,255,0.05)", color: visible ? "var(--primary)" : "var(--text-muted)", border: `1px solid ${visible ? "rgba(255,195,0,0.3)" : "var(--border)"}` }}>
            {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {visible ? "Visible" : "Hidden"}
          </button>
        </div>

        {/* Timer card */}
        <div className="rounded-xl p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
          {/* Progress bar */}
          <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, background: color, transition: "width 0.25s linear" }} />
          </div>

          {/* Time + controls in one row */}
          <div className="flex items-center justify-between gap-2">
            {editing ? (
              <input autoFocus
                className="font-display font-black text-2xl bg-transparent outline-none border-b-2 w-24 text-center"
                style={{ color, borderColor: color }}
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={applyEdit}
                onKeyDown={e => { if (e.key === "Enter") applyEdit(); if (e.key === "Escape") setEditing(false); }}
                placeholder="MM:SS"
              />
            ) : (
              <button onClick={() => { if (!running) { setEditVal(fmt(display.seconds)); setEditing(true); } }}
                className="flex items-baseline gap-0.5 group" title={running ? "" : "Click to edit"}>
                <span className="font-display font-black text-2xl tabular-nums" style={{ color }}>
                  {fmt(display.seconds)}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums" style={{ color: `${color}60` }}>
                  .{String(display.ms).padStart(2, "0")}
                </span>
                {!running && <span className="text-[9px] ml-1 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: "var(--text-muted)" }}>edit</span>}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all"
                style={{ background: running ? "rgba(239,68,68,0.2)" : "rgba(255,195,0,0.2)", border: `1px solid ${running ? "rgba(239,68,68,0.4)" : "rgba(255,195,0,0.4)"}`, color: running ? "#ef4444" : "var(--primary)" }}>
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button onClick={() => setShowConfirm(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main page ── */
export default function LiveControl() {
  const [matches, setMatches] = useState<Match[]>([]);

  const load = () => api.getMatches().then(d => setMatches(d as Match[])).catch(() => {});
  useEffect(() => { load(); }, []);

  const liveMatches = matches.filter(m => m.status === "LIVE");
  const upcoming = matches.filter(m => m.status === "UPCOMING");

  const adjustScore = async (m: Match, team: "A" | "B", delta: number) => {
    const scoreA = Math.max(0, (m.scoreA ?? 0) + (team === "A" ? delta : 0));
    const scoreB = Math.max(0, (m.scoreB ?? 0) + (team === "B" ? delta : 0));
    await api.updateScore(m.matchId || m.id, {
      scoreA, scoreB, status: "LIVE",
      scoringTeam: team, points: delta,
      category: delta === 2 ? "dive" : "normal",
      teamName: team === "A" ? m.teamA.name : m.teamB.name,
    });
    load();
  };

  const setLive = async (m: Match) => {
    await api.updateScore(m.matchId || m.id, { scoreA: 0, scoreB: 0, status: "LIVE" });
    load();
  };

  const endMatch = async (m: Match) => {
    await api.updateScore(m.matchId || m.id, { scoreA: m.scoreA ?? 0, scoreB: m.scoreB ?? 0, status: "COMPLETED" });
    load();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: "var(--text)" }}>Live Control</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage live match scores in real-time</p>
      </div>

      {liveMatches.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
          <p className="font-display font-bold text-xl mb-2" style={{ color: "var(--text)" }}>No Live Matches</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start a match from the Upcoming section below</p>
        </div>
      ) : (
        <div className="space-y-4">
          {liveMatches.map(m => (
            <div key={m.id} className="card p-4 sm:p-6" style={{ border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 30px rgba(239,68,68,0.08)" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-bold tracking-widest text-red-400 uppercase">Live Now</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                    Inning {m.inning ?? 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(m.inning ?? 1) === 1 ? (
                    <button onClick={async () => {
                      await api.endInning(m.matchId || m.id, "end_inning1");
                      load();
                    }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                      End Inning 1
                    </button>
                  ) : (
                    <button onClick={async () => {
                      await api.endInning(m.matchId || m.id, "end_match");
                      load();
                    }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                      <CheckCircle className="w-4 h-4" /> End Match
                    </button>
                  )}
                </div>
              </div>

              {/* Inning 1 score summary (shown during inning 2) */}
              {(m.inning ?? 1) === 2 && (
                <div className="mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-3"
                  style={{ background: "rgba(255,195,0,0.06)", border: "1px solid rgba(255,195,0,0.15)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Inning 1:</span>
                  <span className="font-bold" style={{ color: "var(--primary)" }}>{m.inning1ScoreA ?? 0} – {m.inning1ScoreB ?? 0}</span>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <span style={{ color: "var(--text-muted)" }}>Inning 2 in progress</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
                {/* Team A */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-display text-xl sm:text-2xl font-bold text-white overflow-hidden"
                    style={{ background: m.teamA.logo ? "transparent" : m.teamA.color }}>
                    {m.teamA.logo ? <img src={m.teamA.logo} alt={m.teamA.name} className="w-full h-full object-contain" /> : m.teamA.shortName}
                  </div>
                  <p className="font-display font-bold text-sm sm:text-lg text-center" style={{ color: "var(--text)" }}>{m.teamA.name}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustScore(m, "A", -1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <span className="font-display font-black text-4xl sm:text-5xl w-12 sm:w-16 text-center" style={{ color: "var(--primary)" }}>{m.scoreA ?? 0}</span>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => adjustScore(m, "A", 1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(255,195,0,0.15)", border: "1px solid rgba(255,195,0,0.3)", color: "var(--primary)" }}>+1</button>
                      <button onClick={() => adjustScore(m, "A", 2)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}>+2</button>
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-2">
                  <span className="font-display font-bold text-xl sm:text-2xl" style={{ color: "var(--text-muted)" }}>VS</span>
                  <div className="text-xs font-medium px-2 sm:px-3 py-1 rounded-full text-center" style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>{m.venue}</div>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-display text-xl sm:text-2xl font-bold text-white overflow-hidden"
                    style={{ background: m.teamB.logo ? "transparent" : m.teamB.color }}>
                    {m.teamB.logo ? <img src={m.teamB.logo} alt={m.teamB.name} className="w-full h-full object-contain" /> : m.teamB.shortName}
                  </div>
                  <p className="font-display font-bold text-sm sm:text-lg text-center" style={{ color: "var(--text)" }}>{m.teamB.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => adjustScore(m, "B", 1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(255,195,0,0.15)", border: "1px solid rgba(255,195,0,0.3)", color: "var(--primary)" }}>+1</button>
                      <button onClick={() => adjustScore(m, "B", 2)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}>+2</button>
                    </div>
                    <span className="font-display font-black text-4xl sm:text-5xl w-12 sm:w-16 text-center" style={{ color: "var(--primary)" }}>{m.scoreB ?? 0}</span>
                    <button onClick={() => adjustScore(m, "B", -1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 flex gap-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <span className="px-2 py-1 rounded" style={{ background: "rgba(255,195,0,0.1)", color: "var(--primary)" }}>+1 = Normal Touch</span>
                <span className="px-2 py-1 rounded" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>+2 = Dive Touch</span>
              </div>

              {/* Timer */}
              <TimerPanel matchId={m.matchId || m.id} />
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-display font-bold mb-4" style={{ color: "var(--text)" }}>Start a Match</h2>
          <div className="space-y-3">
            {upcoming.slice(0, 5).map(m => (
              <div key={m.id} className="card2 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{m.teamA.name} vs {m.teamB.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.dateStr} · {m.time}</p>
                </div>
                <button onClick={() => setLive(m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <Activity className="w-3.5 h-3.5" /> Go Live
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

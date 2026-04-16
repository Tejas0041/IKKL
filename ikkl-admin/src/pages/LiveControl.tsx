import { useEffect, useRef, useState } from "react";
import type { Match, VictoryType, ScoreHistoryEntry } from "@/lib/types";
import { Activity, CheckCircle, Play, Pause, RotateCcw, Eye, EyeOff, Clock, Trophy, RefreshCw, Undo2 } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { AdminLoader } from "@/components/AdminLoader";

const DEFAULT_SECONDS = 7 * 60; // 7 minutes

/* ── End Match Modal ── */
function EndMatchModal({
  match,
  timerSeconds,
  onConfirm,
  onCancel,
}: {
  match: Match;
  timerSeconds: number;
  onConfirm: (victoryType: VictoryType, winMarginSeconds: number) => void;
  onCancel: () => void;
}) {
  const [victoryType, setVictoryType] = useState<VictoryType>("POINTS");
  // pre-fill with current timer value so admin just confirms
  const [mins, setMins] = useState(String(Math.floor(timerSeconds / 60)));
  const [secs, setSecs] = useState(String(timerSeconds % 60));

  const totalSeconds = (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-lg font-display font-bold" style={{ color: "var(--text)" }}>End Match</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {match.teamA.shortName} {match.scoreA ?? 0} – {match.scoreB ?? 0} {match.teamB.shortName}
          </p>
        </div>

        {/* Victory type */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>How was the match decided?</p>
          <div className="grid grid-cols-2 gap-2">
            {(["POINTS", "TIME"] as VictoryType[]).map(v => (
              <button
                key={v}
                onClick={() => setVictoryType(v)}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold transition-all"
                style={victoryType === v
                  ? { background: "rgba(255,195,0,0.2)", border: "1px solid rgba(255,195,0,0.6)", color: "var(--primary)" }
                  : { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                {v === "POINTS" ? <Trophy className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {v === "POINTS" ? "By Points" : "By Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Time remaining — only shown for TIME victory */}
        {victoryType === "TIME" && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Time remaining when match ended</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Minutes</label>
                <input
                  type="number" min="0" max="7" value={mins}
                  onChange={e => setMins(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono font-bold outline-none"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>
              <span className="text-xl font-bold mt-4" style={{ color: "var(--text-muted)" }}>:</span>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Seconds</label>
                <input
                  type="number" min="0" max="59" value={secs}
                  onChange={e => setSecs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono font-bold outline-none"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              NRR delta: <span style={{ color: "var(--primary)" }}>±{(totalSeconds / 100).toFixed(2)}</span>
              <span className="ml-1 opacity-50">(0.1 per 10s)</span>
            </p>
          </div>
        )}

        {victoryType === "POINTS" && (
          <p className="text-[11px] rounded-lg px-3 py-2" style={{ background: "rgba(255,195,0,0.06)", border: "1px solid rgba(255,195,0,0.15)", color: "var(--text-muted)" }}>
            NRR delta: <span style={{ color: "var(--primary)" }}>
              ±{(Math.abs((match.scoreA ?? 0) - (match.scoreB ?? 0)) / 10).toFixed(2)}
            </span>
            <span className="ml-1 opacity-50">(margin {Math.abs((match.scoreA ?? 0) - (match.scoreB ?? 0))} ÷ 10)</span>
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(victoryType, victoryType === "TIME" ? totalSeconds : 0)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e" }}>
            <CheckCircle className="w-4 h-4" /> Confirm End
          </button>
        </div>
      </div>
    </div>
  );
}
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
function TimerPanel({ matchId, onSecondsChange }: { matchId: string; onSecondsChange?: (s: number) => void }) {
  const [display, setDisplay] = useState({ seconds: DEFAULT_SECONDS, ms: 0 });

  const updateDisplay = (val: { seconds: number; ms: number }) => {
    setDisplay(val);
    onSecondsChange?.(val.seconds);
  };
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
      if (t.running && t.savedAt) {
        const drift = Date.now() - t.savedAt;
        ms = Math.max(0, t.remainingMs - drift);
      }
      remainingMsRef.current = ms;
      setVisible(t.visible);
      updateDisplay({ seconds: Math.floor(ms / 1000), ms: Math.floor((ms % 1000) / 10) });
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
    updateDisplay({ seconds: Math.floor(left / 1000), ms: Math.floor((left % 1000) / 10) });
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
        updateDisplay({ seconds: s, ms });
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
    updateDisplay({ seconds: DEFAULT_SECONDS, ms: 0 });
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

  const sync = () => {
    // Re-fetch from DB and broadcast current state to all clients
    api.getTimer(matchId).then(t => {
      let ms = t.remainingMs;
      if (t.running && t.savedAt) ms = Math.max(0, t.remainingMs - (Date.now() - t.savedAt));
      remainingMsRef.current = ms;
      const s = Math.floor(ms / 1000);
      const msVal = Math.floor((ms % 1000) / 10);
      updateDisplay({ seconds: s, ms: msVal });
      setRunning(t.running);
      setVisible(t.visible);
      emit(s, msVal, t.running, t.visible);
    }).catch(() => {});
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
    updateDisplay({ seconds: newS, ms: 0 });
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
              <button onClick={sync} title="Sync timer to all clients"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", background: "rgba(59,130,246,0.1)" }}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Break timer panel ── */
const DEFAULT_BREAK_SECONDS = 5 * 60;

function BreakPanel({ matchId, match, load }: { matchId: string; match: Match; load: () => void }) {
  const [display, setDisplay] = useState({ seconds: DEFAULT_BREAK_SECONDS });
  const [running, setRunning] = useState(false);
  const [durationMins, setDurationMins] = useState(5);

  const remainingRef = useRef(DEFAULT_BREAK_SECONDS * 1000);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const lastSavedRef = useRef(0);

  const emitBreak = (s: number, r: boolean) =>
    getSocket().emit("break:update", { matchId, seconds: s, running: r });

  const saveToDb = (ms: number, r: boolean) => {
    const now = Date.now();
    if (now - lastSavedRef.current < 500) return;
    lastSavedRef.current = now;
    api.saveBreakTimer(matchId, { remainingMs: ms, running: r }).catch(() => {});
  };

  // Always reset to default on mount — never resume previous break
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    remainingRef.current = DEFAULT_BREAK_SECONDS * 1000;
    startTimeRef.current = 0;
    setDisplay({ seconds: DEFAULT_BREAK_SECONDS });
    setDurationMins(5);
    emitBreak(DEFAULT_BREAK_SECONDS, false);
    saveToDb(DEFAULT_BREAK_SECONDS * 1000, false);
  }, [matchId]);

  const tick = () => {
    const elapsed = performance.now() - startTimeRef.current;
    const left = Math.max(0, remainingRef.current - elapsed);
    setDisplay({ seconds: Math.floor(left / 1000) });
    if (left <= 0) {
      remainingRef.current = 0;
      setRunning(false);
      emitBreak(0, false);
      saveToDb(0, false);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (running) {
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      saveToDb(remainingRef.current, true);
      emitBreak(Math.floor(remainingRef.current / 1000), true);
    } else {
      cancelAnimationFrame(rafRef.current);
      if (startTimeRef.current > 0) {
        const elapsed = performance.now() - startTimeRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        startTimeRef.current = 0;
        const s = Math.floor(remainingRef.current / 1000);
        setDisplay({ seconds: s });
        emitBreak(s, false);
        saveToDb(remainingRef.current, false);
      }
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  // Emit every 250ms while running so frontend stays in sync
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const left = Math.max(0, remainingRef.current - elapsed);
      emitBreak(Math.floor(left / 1000), true);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const applyDuration = (mins: number) => {
    const newMs = mins * 60 * 1000;
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    remainingRef.current = newMs;
    startTimeRef.current = 0;
    setDisplay({ seconds: mins * 60 });
    setDurationMins(mins);
    emitBreak(mins * 60, false);
    saveToDb(newMs, false);
  };

  const reset = () => applyDuration(durationMins);

  const sync = () => {
    const s = Math.floor(remainingRef.current / 1000);
    emitBreak(s, running);
    saveToDb(remainingRef.current, running);
  };

  const endBreak = async () => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    emitBreak(0, false);
    const inning = match.inning ?? 1;
    const isFinal = match.matchType === "final";
    // Determine which inning we're starting next
    let action: Parameters<typeof api.endInning>[1] = "start_inning2";
    let nextLabel = "Inning 2";
    if (isFinal && inning === 2) { action = "start_inning3"; nextLabel = "Inning 3"; }
    else if (isFinal && inning === 3) { action = "start_inning4"; nextLabel = "Inning 4"; }
    await api.endInning(matchId, action);
    load();
    void nextLabel;
  };

  const inning = match.inning ?? 1;
  const isFinal = match.matchType === "final";
  let nextInningLabel = "Inning 2";
  if (isFinal && inning === 2) nextInningLabel = "Inning 3";
  else if (isFinal && inning === 3) nextInningLabel = "Inning 4";

  const color = display.seconds < 60 ? "#ef4444" : display.seconds < 120 ? "#f97316" : "#60a5fa";

  return (
    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Break Timer</span>
        <button onClick={endBreak}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa" }}>
          End Break → Start {nextInningLabel}
        </button>
      </div>

      <div className="rounded-xl p-3 space-y-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
        {/* Duration editor */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Duration:</span>
          <input type="number" min="1" max="30"
            className="w-14 text-center font-mono font-bold rounded px-1 py-0.5 outline-none text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--primary)" }}
            value={durationMins}
            onChange={e => setDurationMins(Math.max(1, parseInt(e.target.value) || 1))}
            onBlur={e => applyDuration(Math.max(1, parseInt(e.target.value) || 1))}
            onKeyDown={e => { if (e.key === "Enter") applyDuration(durationMins); }}
          />
          <span>min</span>
        </div>

        {/* Timer + controls */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-black text-2xl tabular-nums" style={{ color }}>
            {String(Math.floor(display.seconds / 60)).padStart(2, "0")}:{String(display.seconds % 60).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setRunning(r => !r)}
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all"
              style={{ background: running ? "rgba(239,68,68,0.2)" : "rgba(255,195,0,0.2)", border: `1px solid ${running ? "rgba(239,68,68,0.4)" : "rgba(255,195,0,0.4)"}`, color: running ? "#ef4444" : "var(--primary)" }}>
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={reset} title="Reset to duration"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={sync} title="Sync to all clients"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", background: "rgba(59,130,246,0.1)" }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ── Inning 1 editor ── */
function Inning1Editor({ m, load }: { m: Match; load: () => void }) {
  const [i1A, setI1A] = useState(m.inning1ScoreA ?? 0);
  const [i1B, setI1B] = useState(m.inning1ScoreB ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const inning2A = (m.scoreA ?? 0) - (m.inning1ScoreA ?? 0);
    const inning2B = (m.scoreB ?? 0) - (m.inning1ScoreB ?? 0);
    await api.updateMatch(m.matchId || m.id, {
      ...m,
      inning1ScoreA: i1A,
      inning1ScoreB: i1B,
      scoreA: i1A + inning2A,
      scoreB: i1B + inning2B,
    });
    setSaving(false);
    load();
  };

  return (
    <div className="mb-4 px-3 py-2 rounded-lg flex items-center gap-2 flex-wrap"
      style={{ background: "rgba(255,195,0,0.06)", border: "1px solid rgba(255,195,0,0.15)" }}>
      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Inning 1:</span>
      <input type="number" min="0"
        className="w-12 text-center font-bold text-sm rounded px-1 py-0.5 outline-none"
        style={{ background: "var(--surface2)", border: "1px solid rgba(255,195,0,0.3)", color: "var(--primary)" }}
        value={i1A} onChange={e => setI1A(Math.max(0, parseInt(e.target.value) || 0))} />
      <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>–</span>
      <input type="number" min="0"
        className="w-12 text-center font-bold text-sm rounded px-1 py-0.5 outline-none"
        style={{ background: "var(--surface2)", border: "1px solid rgba(255,195,0,0.3)", color: "var(--primary)" }}
        value={i1B} onChange={e => setI1B(Math.max(0, parseInt(e.target.value) || 0))} />
      <button onClick={save} disabled={saving}
        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0"
        style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e" }}>
        {saving ? "…" : "Save"}
      </button>
      <span className="text-xs opacity-50" style={{ color: "var(--text-muted)" }}>updates total score</span>
    </div>
  );
}

/* ── Score button with press feedback ── */
function ScoreBtn({ label, color, borderColor, textColor, onClick }: {
  label: string; color: string; borderColor: string; textColor: string; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const handle = () => {
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 350);
  };
  return (
    <button
      onClick={handle}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 select-none"
      style={{
        background: color,
        border: `1px solid ${borderColor}`,
        color: textColor,
        transform: pressed ? "scale(0.88)" : "scale(1)",
        filter: pressed ? "brightness(1.6)" : "brightness(1)",
        boxShadow: pressed ? `0 0 12px ${borderColor}` : "none",
      }}>
      {label}
    </button>
  );
}

/* ── Score History Panel ── */
function fmtTimer(s: number | null | undefined) {
  if (s == null) return "–";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} remaining`;
}

function ScoreHistoryPanel({ history, match, onUndo }: {
  history: ScoreHistoryEntry[];
  match: Match;
  onUndo: () => void;
}) {
  const [undoing, setUndoing] = useState(false);

  const handle = async () => {
    setUndoing(true);
    await onUndo();
    setUndoing(false);
  };

  return (
    <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Score History
        </span>
        {history.length > 0 && (
          <button onClick={handle} disabled={undoing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <Undo2 className="w-3 h-3" />
            {undoing ? "Undoing…" : "Undo Last"}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No points scored yet</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {[...history].reverse().map((entry, i) => {
            const isA = entry.team === "A";
            const teamColor = isA ? match.teamA.color : match.teamB.color;
            const isDive = entry.category === "dive";
            return (
              <div key={entry._id ?? i}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                style={{ background: i === 0 ? "rgba(255,195,0,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(255,195,0,0.15)" : "var(--border)"}` }}>
                <div className="flex items-center gap-2 min-w-0">
                  {/* Team dot */}
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: teamColor }} />
                  <span className="text-xs font-bold truncate" style={{ color: "var(--text)" }}>
                    {entry.teamName ?? (isA ? match.teamA.name : match.teamB.name)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
                    style={isDive
                      ? { background: "rgba(249,115,22,0.15)", color: "#f97316" }
                      : { background: "rgba(255,195,0,0.1)", color: "var(--primary)" }}>
                    {isDive ? "Dive" : "Normal"}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                    Inn.{entry.inning ?? 1}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {fmtTimer(entry.timerSeconds)}
                  </span>
                  <span className="font-display font-black text-base" style={{ color: isDive ? "#f97316" : "var(--primary)" }}>
                    +{entry.points ?? 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function LiveControl() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [endMatchTarget, setEndMatchTarget] = useState<Match | null>(null);
  const [timerSecondsMap, setTimerSecondsMap] = useState<Record<string, number>>({});
  const [historyMap, setHistoryMap] = useState<Record<string, ScoreHistoryEntry[]>>({});

  const load = () => api.getMatches().then(d => {
    const ms = d as Match[];
    setMatches(ms);
    setLoading(false);
    // load history for live matches
    ms.filter(m => m.status === "LIVE").forEach(m => {
      const mid = m.matchId || m.id;
      api.getHistory(mid).then(h => setHistoryMap(prev => ({ ...prev, [mid]: h as ScoreHistoryEntry[] }))).catch(() => {});
    });
  }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Socket: listen for history updates per match
  useEffect(() => {
    const socket = getSocket();
    // history:update is emitted to match room with the array directly
    // We track which matches we've joined via the room join in TimerPanel
    // Re-fetch history on scores:changed as fallback
    socket.on("scores:changed", () => load());
    return () => { socket.off("scores:changed"); };
  }, []);

  const liveMatches = matches.filter(m => m.status === "LIVE");
  const upcoming = matches.filter(m => m.status === "UPCOMING");

  const adjustScore = async (m: Match, team: "A" | "B", delta: number) => {
    const mid = m.matchId || m.id;
    const scoreA = Math.max(0, (m.scoreA ?? 0) + (team === "A" ? delta : 0));
    const scoreB = Math.max(0, (m.scoreB ?? 0) + (team === "B" ? delta : 0));
    await api.updateScore(mid, {
      scoreA, scoreB, status: "LIVE",
      scoringTeam: team, points: delta,
      category: delta === 2 ? "dive" : "normal",
      teamName: team === "A" ? m.teamA.name : m.teamB.name,
      timerSeconds: timerSecondsMap[mid] ?? undefined,
    });
    load();
  };

  const undoScore = async (m: Match) => {
    const mid = m.matchId || m.id;
    await api.undoScore(mid);
    load();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: "var(--text)" }}>Live Control</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage live match scores in real-time</p>
      </div>

      {loading ? (
        <div className="card"><AdminLoader label="Loading matches" /></div>
      ) : liveMatches.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
          <p className="font-display font-bold text-xl mb-2" style={{ color: "var(--text)" }}>No Live Matches</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start a match from the Upcoming section below</p>
        </div>
      ) : (
        <div className="space-y-4">
          {liveMatches.map(m => (
            <div key={m.id} className="card p-4 sm:p-6" style={{ border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 30px rgba(239,68,68,0.08)" }}>
              {/* Header row — single line, no wrap */}
              <div className="flex items-center justify-between gap-2 mb-6 min-w-0">
                {/* Left: live dot + inning badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold tracking-widest text-red-400 uppercase shrink-0">Live</span>
                  {m.matchType === "final" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                      style={{ background: "rgba(255,195,0,0.2)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.5)" }}>
                      🏆 Final
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                    style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                    Inning {m.inning ?? 1}{m.matchType === "final" ? " of 4" : " of 2"}
                  </span>
                </div>
                {/* Right: action button — varies by match type + inning */}
                {(() => {
                  const inning = m.inning ?? 1;
                  const mid = m.matchId || m.id;
                  const isFinal = m.matchType === "final";

                  if (m.inningBreak) {
                    return (
                      <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
                        Inning Break
                      </span>
                    );
                  }

                  // League: inning 1 → end inning 1
                  if (!isFinal && inning === 1) {
                    return (
                      <button onClick={async () => { await api.endInning(mid, "end_inning1"); load(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                        style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                        End Inning 1
                      </button>
                    );
                  }

                  // Final: inning 1 (Team A 1st) → end → break → inning 2 (Team B 1st)
                  if (isFinal && inning === 1) {
                    return (
                      <button onClick={async () => { await api.endInning(mid, "end_inning1"); load(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                        style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                        End Inning 1
                      </button>
                    );
                  }

                  // Final: inning 2 (Team B 1st) → end → break → inning 3 (Team A 2nd)
                  if (isFinal && inning === 2) {
                    return (
                      <button onClick={async () => { await api.endInning(mid, "end_inning2_final"); load(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                        style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                        End Inning 2
                      </button>
                    );
                  }

                  // Final: inning 3 (Team A 2nd) → end → break → inning 4 (Team B 2nd) OR end match
                  if (isFinal && inning === 3) {
                    return (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={async () => { await api.endInning(mid, "end_inning3_final"); load(); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                          style={{ background: "rgba(255,195,0,0.15)", color: "var(--primary)", border: "1px solid rgba(255,195,0,0.3)" }}>
                          End Inning 3 → Inning 4
                        </button>
                        <button onClick={() => {
                          api.getTimer(mid).then(t => {
                            let s = Math.floor(t.remainingMs / 1000);
                            if (t.running && t.savedAt) s = Math.max(0, Math.floor((t.remainingMs - (Date.now() - t.savedAt)) / 1000));
                            setTimerSecondsMap(prev => ({ ...prev, [mid]: s }));
                            setEndMatchTarget(m);
                          }).catch(() => { setEndMatchTarget(m); });
                        }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                          <CheckCircle className="w-3.5 h-3.5" /> End Match
                        </button>
                      </div>
                    );
                  }

                  // League inning 2 or Final inning 4 → End Match
                  return (
                    <button onClick={() => {
                      api.getTimer(mid).then(t => {
                        let s = Math.floor(t.remainingMs / 1000);
                        if (t.running && t.savedAt) s = Math.max(0, Math.floor((t.remainingMs - (Date.now() - t.savedAt)) / 1000));
                        setTimerSecondsMap(prev => ({ ...prev, [mid]: s }));
                        setEndMatchTarget(m);
                      }).catch(() => { setEndMatchTarget(m); });
                    }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                      <CheckCircle className="w-3.5 h-3.5" /> End Match
                    </button>
                  );
                })()}
              </div>

              {/* Inning score summaries */}
              {(m.inning ?? 1) === 2 && <Inning1Editor m={m} load={load} />}
              {m.matchType === "final" && (m.inning ?? 1) >= 3 && <Inning1Editor m={m} load={load} />}

              {/* ── MOBILE layout: two team rows ── */}
              <div className="flex flex-col gap-3 sm:hidden">
                {/* Team A */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm font-bold text-white overflow-hidden shrink-0"
                      style={{ background: m.teamA.logo ? "transparent" : m.teamA.color }}>
                      {m.teamA.logo ? <img src={m.teamA.logo} alt={m.teamA.name} className="w-full h-full object-contain" /> : m.teamA.shortName}
                    </div>
                    <p className="font-display font-bold text-sm truncate" style={{ color: "var(--text)" }}>{m.teamA.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ScoreBtn label="−" color="rgba(255,255,255,0.05)" borderColor="var(--border)" textColor="var(--text-muted)" onClick={() => adjustScore(m, "A", -1)} />
                    <span className="font-display font-black text-3xl w-10 text-center tabular-nums" style={{ color: "var(--primary)" }}>{m.scoreA ?? 0}</span>
                    <ScoreBtn label="+1" color="rgba(255,195,0,0.15)" borderColor="rgba(255,195,0,0.3)" textColor="var(--primary)" onClick={() => adjustScore(m, "A", 1)} />
                    <ScoreBtn label="+2" color="rgba(249,115,22,0.15)" borderColor="rgba(249,115,22,0.3)" textColor="#f97316" onClick={() => adjustScore(m, "A", 2)} />
                  </div>
                </div>

                <div className="h-px mx-1" style={{ background: "var(--border)" }} />

                {/* Team B */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm font-bold text-white overflow-hidden shrink-0"
                      style={{ background: m.teamB.logo ? "transparent" : m.teamB.color }}>
                      {m.teamB.logo ? <img src={m.teamB.logo} alt={m.teamB.name} className="w-full h-full object-contain" /> : m.teamB.shortName}
                    </div>
                    <p className="font-display font-bold text-sm truncate" style={{ color: "var(--text)" }}>{m.teamB.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ScoreBtn label="−" color="rgba(255,255,255,0.05)" borderColor="var(--border)" textColor="var(--text-muted)" onClick={() => adjustScore(m, "B", -1)} />
                    <span className="font-display font-black text-3xl w-10 text-center tabular-nums" style={{ color: "var(--primary)" }}>{m.scoreB ?? 0}</span>
                    <ScoreBtn label="+1" color="rgba(255,195,0,0.15)" borderColor="rgba(255,195,0,0.3)" textColor="var(--primary)" onClick={() => adjustScore(m, "B", 1)} />
                    <ScoreBtn label="+2" color="rgba(249,115,22,0.15)" borderColor="rgba(249,115,22,0.3)" textColor="#f97316" onClick={() => adjustScore(m, "B", 2)} />
                  </div>
                </div>
              </div>

              {/* ── DESKTOP layout: 3-col grid ── */}
              <div className="hidden sm:grid grid-cols-3 gap-4 items-center">
                {/* Team A */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-2xl font-bold text-white overflow-hidden"
                    style={{ background: m.teamA.logo ? "transparent" : m.teamA.color }}>
                    {m.teamA.logo ? <img src={m.teamA.logo} alt={m.teamA.name} className="w-full h-full object-contain" /> : m.teamA.shortName}
                  </div>
                  <p className="font-display font-bold text-lg text-center" style={{ color: "var(--text)" }}>{m.teamA.name}</p>
                  <div className="flex items-center gap-2">
                    <ScoreBtn label="−" color="rgba(255,255,255,0.05)" borderColor="var(--border)" textColor="var(--text-muted)" onClick={() => adjustScore(m, "A", -1)} />
                    <span className="font-display font-black text-5xl w-16 text-center" style={{ color: "var(--primary)" }}>{m.scoreA ?? 0}</span>
                    <div className="flex flex-col gap-1">
                      <ScoreBtn label="+1" color="rgba(255,195,0,0.15)" borderColor="rgba(255,195,0,0.3)" textColor="var(--primary)" onClick={() => adjustScore(m, "A", 1)} />
                      <ScoreBtn label="+2" color="rgba(249,115,22,0.15)" borderColor="rgba(249,115,22,0.3)" textColor="#f97316" onClick={() => adjustScore(m, "A", 2)} />
                    </div>
                  </div>
                </div>
                {/* VS */}
                <div className="flex flex-col items-center gap-2">
                  <span className="font-display font-bold text-2xl" style={{ color: "var(--text-muted)" }}>VS</span>
                  <div className="text-xs font-medium px-3 py-1 rounded-full text-center" style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>{m.venue}</div>
                </div>
                {/* Team B */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-2xl font-bold text-white overflow-hidden"
                    style={{ background: m.teamB.logo ? "transparent" : m.teamB.color }}>
                    {m.teamB.logo ? <img src={m.teamB.logo} alt={m.teamB.name} className="w-full h-full object-contain" /> : m.teamB.shortName}
                  </div>
                  <p className="font-display font-bold text-lg text-center" style={{ color: "var(--text)" }}>{m.teamB.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <ScoreBtn label="+1" color="rgba(255,195,0,0.15)" borderColor="rgba(255,195,0,0.3)" textColor="var(--primary)" onClick={() => adjustScore(m, "B", 1)} />
                      <ScoreBtn label="+2" color="rgba(249,115,22,0.15)" borderColor="rgba(249,115,22,0.3)" textColor="#f97316" onClick={() => adjustScore(m, "B", 2)} />
                    </div>
                    <span className="font-display font-black text-5xl w-16 text-center" style={{ color: "var(--primary)" }}>{m.scoreB ?? 0}</span>
                    <ScoreBtn label="−" color="rgba(255,255,255,0.05)" borderColor="var(--border)" textColor="var(--text-muted)" onClick={() => adjustScore(m, "B", -1)} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 flex gap-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <span className="px-2 py-1 rounded" style={{ background: "rgba(255,195,0,0.1)", color: "var(--primary)" }}>+1 = Normal Touch</span>
                <span className="px-2 py-1 rounded" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>+2 = Dive Touch</span>
              </div>

              {/* Timer or Break panel */}
              {m.inningBreak
                ? <BreakPanel matchId={m.matchId || m.id} match={m} load={load} />
                : <>
                    <TimerPanel matchId={m.matchId || m.id} onSecondsChange={s => setTimerSecondsMap(prev => ({ ...prev, [m.matchId || m.id]: s }))} />
                    {/* Take Break button — shown in inning 2+ when not in break (league: inning 2, final: inning 2, 3, 4) */}
                    {((m.matchType !== "final" && (m.inning ?? 1) === 2) || (m.matchType === "final" && (m.inning ?? 1) >= 2)) && (
                      <div className="mt-3">
                        <button onClick={async () => {
                          await api.updateMatch(m.matchId || m.id, { ...m, inningBreak: true });
                          load();
                        }}
                          className="w-full py-2 rounded-lg text-xs font-bold transition-colors"
                          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}>
                          ☕ Take Break
                        </button>
                      </div>
                    )}
                  </>
              }

              {/* ── Score History ── */}
              <ScoreHistoryPanel
                history={historyMap[m.matchId || m.id] ?? (m.scoreHistory ?? [])}
                match={m}
                onUndo={() => undoScore(m)}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && upcoming.length > 0 && (
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

      {/* End Match Modal */}
      {endMatchTarget && (
        <EndMatchModal
          match={endMatchTarget}
          timerSeconds={timerSecondsMap[endMatchTarget.matchId || endMatchTarget.id] ?? 0}
          onCancel={() => setEndMatchTarget(null)}
          onConfirm={async (victoryType, winMarginSeconds) => {
            const mid = endMatchTarget.matchId || endMatchTarget.id;
            await api.endInning(mid, "end_match", { victoryType, winMarginSeconds });
            setEndMatchTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
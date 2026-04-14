import { useEffect, useRef, useState } from "react";
import type { Match, MatchStatus, Team } from "@/lib/types";
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api";

/* ── date/time helpers ── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

// "YYYY-MM-DDTHH:mm" → "April 3" style dateStr for frontend
function toDateStr(iso: string) {
  const [datePart] = iso.split("T");
  const [, m, d] = datePart.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}
// "YYYY-MM-DDTHH:mm" → "2:00 PM" style time for frontend
function toTimeStr(iso: string) {
  const timePart = iso.split("T")[1] || "00:00";
  const [hh, mm] = timePart.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
}

/* ── Mini time scroller ── */
function TimeScroller({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hh, mm] = value.split(":").map(Number);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 32;
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, idx: number) =>
    ref.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  useEffect(() => { scrollTo(hourRef, hh); }, [hh]);
  useEffect(() => { scrollTo(minRef, mm); }, [mm]);
  const col: React.CSSProperties = { height: ITEM_H * 5, overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none" };
  return (
    <div className="flex items-center gap-2 justify-center">
      {[{ ref: hourRef, items: Array.from({length:24},(_,i)=>i), val: hh,
          onScroll: () => { if (!hourRef.current) return; onChange(`${String(Math.round(hourRef.current.scrollTop/ITEM_H)).padStart(2,"0")}:${String(mm).padStart(2,"0")}`); },
          onClick: (v: number) => { onChange(`${String(v).padStart(2,"0")}:${String(mm).padStart(2,"0")}`); scrollTo(hourRef, v); }, label: "HH" },
       { ref: minRef, items: Array.from({length:60},(_,i)=>i), val: mm,
          onScroll: () => { if (!minRef.current) return; onChange(`${String(hh).padStart(2,"0")}:${String(Math.round(minRef.current.scrollTop/ITEM_H)).padStart(2,"0")}`); },
          onClick: (v: number) => { onChange(`${String(hh).padStart(2,"0")}:${String(v).padStart(2,"0")}`); scrollTo(minRef, v); }, label: "MM" }
      ].map((c, ci) => (
        <div key={ci} className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>{c.label}</span>
          <div style={{ position: "relative", borderRadius: "0.5rem", overflow: "hidden", background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <div className="pointer-events-none absolute inset-x-0" style={{ top: ITEM_H*2, height: ITEM_H, background: "rgba(255,195,0,0.12)", borderTop: "1px solid rgba(255,195,0,0.3)", borderBottom: "1px solid rgba(255,195,0,0.3)", zIndex: 1 }} />
            <div ref={c.ref} style={{ ...col, width: 52 }} onScroll={c.onScroll}>
              <div style={{ height: ITEM_H*2 }} />
              {c.items.map(v => (
                <div key={v} onClick={() => c.onClick(v)}
                  style={{ height: ITEM_H, scrollSnapAlign: "start", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    color: v === c.val ? "var(--primary)" : "var(--text-muted)", fontWeight: v === c.val ? 700 : 400, fontSize: "0.85rem" }}>
                  {String(v).padStart(2,"0")}
                </div>
              ))}
              <div style={{ height: ITEM_H*2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Inline date+time picker ── */
function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const datePart = value.split("T")[0] || "2026-04-03";
  const timePart = value.includes("T") ? value.split("T")[1].slice(0,5) : "10:00";
  const [y, m, d] = datePart.split("-").map(Number);
  const [viewY, setViewY] = useState(y || 2026);
  const [viewM, setViewM] = useState((m || 4) - 1);

  const selectDay = (day: number) => {
    const nd = `${viewY}-${String(viewM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(`${nd}T${timePart}`);
  };
  const totalCells = Math.ceil((firstDay(viewY, viewM) + daysInMonth(viewY, viewM)) / 7) * 7;
  const displayDate = d ? `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}` : "DD/MM/YYYY";

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
      {/* Selected display */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
        <span className="text-sm font-medium" style={{ color: d ? "var(--text)" : "var(--text-muted)" }}>{displayDate}</span>
        <span className="text-white/20 mx-1">|</span>
        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{timePart}</span>
      </div>

      <div className="flex">
        {/* Calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={() => viewM === 0 ? (setViewM(11), setViewY(y => y-1)) : setViewM(m => m-1)}
              className="p-1 rounded hover:bg-white/5">
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            </button>
            <span className="text-xs font-bold tracking-wider" style={{ color: "var(--text)" }}>{MONTHS[viewM]} {viewY}</span>
            <button type="button" onClick={() => viewM === 11 ? (setViewM(0), setViewY(y => y+1)) : setViewM(m => m+1)}
              className="p-1 rounded hover:bg-white/5">
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
          <div className="grid grid-cols-7 px-2 pt-1.5">
            {DAYS.map(day => <div key={day} className="text-center text-[9px] font-bold pb-1 tracking-wider" style={{ color: "var(--text-muted)" }}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dn = i - firstDay(viewY, viewM) + 1;
              const valid = dn >= 1 && dn <= daysInMonth(viewY, viewM);
              const sel = valid && dn === d && viewM === (m-1) && viewY === y;
              return (
                <button key={i} type="button" disabled={!valid} onClick={() => valid && selectDay(dn)}
                  className="h-7 w-full rounded text-xs font-medium transition-all"
                  style={{ color: !valid ? "transparent" : sel ? "#000814" : "var(--text)", background: sel ? "var(--primary)" : "transparent", cursor: valid ? "pointer" : "default" }}
                  onMouseEnter={e => { if (valid && !sel) (e.target as HTMLElement).style.background = "rgba(255,195,0,0.12)"; }}
                  onMouseLeave={e => { if (!sel) (e.target as HTMLElement).style.background = "transparent"; }}>
                  {valid ? dn : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div className="flex flex-col justify-center px-3 py-3 border-l" style={{ borderColor: "var(--border)" }}>
          <TimeScroller value={timePart} onChange={t => onChange(`${datePart}T${t}`)} />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<MatchStatus, string> = {
  LIVE: "badge-live", UPCOMING: "badge-upcoming", COMPLETED: "badge-completed",
};
const VENUE = "Parade Ground, IIEST Shibpur";
const EMPTY_FORM = (firstTeamId = "") => ({ teamAId: firstTeamId, teamBId: firstTeamId, datetime: "2026-04-03T10:00", status: "UPCOMING" as MatchStatus, scoreA: 0, scoreB: 0 });

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());

  const load = () => {
    setLoading(true);
    api.getMatches().then(data => setMatches(data as Match[])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    setTeamsLoading(true);
    api.getTeams()
      .then(data => {
        const t = data as Team[];
        setTeams(t);
        setForm(EMPTY_FORM(t[0]?.id || ""));
      })
      .finally(() => setTeamsLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM(teams[0]?.id || ""));
    setShowModal(true);
  };
  const openEdit = (m: Match) => {
    setEditing(m);
    setForm({ teamAId: m.teamA.id, teamBId: m.teamB.id, datetime: "2026-04-03T10:00", status: m.status, scoreA: m.scoreA ?? 0, scoreB: m.scoreB ?? 0 });
    setShowModal(true);
  };

  const save = async () => {
    const teamA = teams.find(t => t.id === form.teamAId);
    const teamB = teams.find(t => t.id === form.teamBId);
    if (!teamA || !teamB || !form.datetime) return;
    const dateStr = toDateStr(form.datetime);
    const time = toTimeStr(form.datetime);
    const payload = {
      matchId: editing?.matchId || `m${Date.now()}`,
      teamA, teamB, dateStr, time, venue: VENUE,
      status: form.status,
      scoreA: form.scoreA,
      scoreB: form.scoreB,
    };
    try {
      if (editing) {
        await api.updateMatch(editing.matchId || editing.id, payload);
      } else {
        await api.createMatch(payload);
      }
      setShowModal(false);
      load();
    } catch (e) {
      alert("Failed to save match: " + (e as Error).message);
    }
  };

  const remove = async (m: Match) => {
    if (!confirm("Delete this match?")) return;
    try {
      await api.deleteMatch(m.matchId || m.id);
      load();
    } catch (e) {
      alert("Failed to delete: " + (e as Error).message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: "var(--text)" }}>Matches</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{matches.length} total matches</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add Match</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading matches…</div>
        ) : matches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display font-bold text-xl mb-2" style={{ color: "var(--text)" }}>No Matches Yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Click "+ Add Match" to create the first match.</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                {["Match", "Date", "Time", "Score", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                        style={{ background: m.teamA.logo ? "transparent" : m.teamA.color }}>
                        {m.teamA.logo ? <img src={m.teamA.logo} alt={m.teamA.name} className="w-full h-full object-contain" /> : m.teamA.shortName}
                      </div>
                      <span className="font-medium" style={{ color: "var(--text)" }}>{m.teamA.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>vs</span>
                      <span className="font-medium" style={{ color: "var(--text)" }}>{m.teamB.name}</span>
                      <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                        style={{ background: m.teamB.logo ? "transparent" : m.teamB.color }}>
                        {m.teamB.logo ? <img src={m.teamB.logo} alt={m.teamB.name} className="w-full h-full object-contain" /> : m.teamB.shortName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{m.dateStr}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{m.time}</td>
                  <td className="px-4 py-3 font-display font-bold" style={{ color: "var(--primary)" }}>
                    {m.scoreA !== undefined ? `${m.scoreA} – ${m.scoreB}` : "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("text-xs font-bold px-2 py-1 rounded-full", STATUS_COLORS[m.status])}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(m)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="card w-full max-w-xl p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "92vh" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold" style={{ color: "var(--text)" }}>{editing ? "Edit Match" : "Add Match"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-white/10" style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Team A</label>
                {teamsLoading
                  ? <div className="input opacity-50 text-sm" style={{ color: "var(--text-muted)" }}>Loading teams…</div>
                  : teams.length === 0
                  ? <div className="input opacity-50 text-sm" style={{ color: "var(--text-muted)" }}>No teams — add teams first</div>
                  : <select className="input" value={form.teamAId} onChange={e => setForm(f => ({ ...f, teamAId: e.target.value }))}>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Team B</label>
                {teamsLoading
                  ? <div className="input opacity-50 text-sm" style={{ color: "var(--text-muted)" }}>Loading teams…</div>
                  : teams.length === 0
                  ? <div className="input opacity-50 text-sm" style={{ color: "var(--text-muted)" }}>No teams — add teams first</div>
                  : <select className="input" value={form.teamBId} onChange={e => setForm(f => ({ ...f, teamBId: e.target.value }))}>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                }
              </div>
            </div>

            {/* Date & Time picker */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Date &amp; Time</label>
              <DateTimePicker value={form.datetime} onChange={v => setForm(f => ({ ...f, datetime: v }))} />
            </div>

            {/* Venue (readonly) + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Venue</label>
                <input className="input opacity-60 cursor-not-allowed" value={VENUE} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as MatchStatus }))}>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="LIVE">LIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            {/* Scores (only for live/completed) */}
            {(form.status === "LIVE" || form.status === "COMPLETED") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Score A</label>
                  <input type="number" className="input" value={form.scoreA} onChange={e => setForm(f => ({ ...f, scoreA: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Score B</label>
                  <input type="number" className="input" value={form.scoreB} onChange={e => setForm(f => ({ ...f, scoreB: +e.target.value }))} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>{editing ? "Save Changes" : "Create Match"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

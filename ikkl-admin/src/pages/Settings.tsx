import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

function TimeScroller({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hh, mm] = value.split(":").map(Number);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 36;
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, idx: number) =>
    ref.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  useEffect(() => { scrollTo(hourRef, hh); }, [hh]);
  useEffect(() => { scrollTo(minRef, mm); }, [mm]);
  const col: React.CSSProperties = { height: ITEM_H * 5, overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none" };
  const cols = [
    { ref: hourRef, items: Array.from({length:24},(_,i)=>i), val: hh, label:"HH",
      onScroll: () => hourRef.current && onChange(`${String(Math.round(hourRef.current.scrollTop/ITEM_H)).padStart(2,"0")}:${String(mm).padStart(2,"0")}`),
      onClick: (v: number) => { onChange(`${String(v).padStart(2,"0")}:${String(mm).padStart(2,"0")}`); scrollTo(hourRef,v); } },
    { ref: minRef, items: Array.from({length:60},(_,i)=>i), val: mm, label:"MM",
      onScroll: () => minRef.current && onChange(`${String(hh).padStart(2,"0")}:${String(Math.round(minRef.current.scrollTop/ITEM_H)).padStart(2,"0")}`),
      onClick: (v: number) => { onChange(`${String(hh).padStart(2,"0")}:${String(v).padStart(2,"0")}`); scrollTo(minRef,v); } },
  ];
  return (
    <div className="flex items-center justify-center gap-2">
      {cols.map((c, ci) => (
        <div key={ci} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>{c.label}</span>
          <div style={{ position:"relative", borderRadius:"0.5rem", overflow:"hidden", background:"var(--surface2)", border:"1px solid var(--border)" }}>
            <div className="pointer-events-none absolute inset-x-0" style={{ top:ITEM_H*2, height:ITEM_H, background:"rgba(255,195,0,0.12)", borderTop:"1px solid rgba(255,195,0,0.3)", borderBottom:"1px solid rgba(255,195,0,0.3)", zIndex:1 }} />
            <div ref={c.ref} style={{ ...col, width:64 }} onScroll={c.onScroll}>
              <div style={{ height:ITEM_H*2 }} />
              {c.items.map(v => (
                <div key={v} onClick={() => c.onClick(v)}
                  style={{ height:ITEM_H, scrollSnapAlign:"start", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                    color: v===c.val ? "var(--primary)" : "var(--text-muted)", fontWeight: v===c.val ? 700 : 400, fontSize:"0.95rem" }}>
                  {String(v).padStart(2,"0")}
                </div>
              ))}
              <div style={{ height:ITEM_H*2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DTPickerProps { value: string; onChange: (v: string) => void; withTime?: boolean; label: string; hint?: string; }

function DateTimePicker({ value, onChange, withTime = false, label, hint }: DTPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  useEffect(() => {
    if (isMobile) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [isMobile]);

  const datePart = value.split("T")[0] || "2026-04-03";
  const timePart = value.includes("T") ? value.split("T")[1].slice(0,5) : "00:00";
  const [y, m, d] = datePart.split("-").map(Number);
  const [viewY, setViewY] = useState(y || 2026);
  const [viewM, setViewM] = useState((m || 4) - 1);

  const selectDay = (day: number) => {
    const nd = `${viewY}-${String(viewM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(withTime ? `${nd}T${timePart}` : nd);
  };
  const setTime = (hhmm: string) => onChange(`${datePart}T${hhmm}`);
  const prevMonth = () => viewM === 0 ? (setViewM(11), setViewY(y => y-1)) : setViewM(m => m-1);
  const nextMonth = () => viewM === 11 ? (setViewM(0), setViewY(y => y+1)) : setViewM(m => m+1);

  const displayDate = d ? `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}` : "DD/MM/YYYY";
  const displayVal = withTime ? `${displayDate}  ${timePart}` : displayDate;
  const totalCells = Math.ceil((firstDay(viewY, viewM) + daysInMonth(viewY, viewM)) / 7) * 7;

  const body = (
    <>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid var(--border)" }}>
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-4 h-4" style={{ color:"var(--text-muted)" }} />
        </button>
        <span className="font-display font-bold text-sm tracking-wider" style={{ color:"var(--text)" }}>{MONTHS[viewM]} {viewY}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
          <ChevronRight className="w-4 h-4" style={{ color:"var(--text-muted)" }} />
        </button>
      </div>
      <div className="grid grid-cols-7 px-3 pt-2">
        {DAYS.map(day => <div key={day} className="text-center text-[10px] font-bold pb-1.5 tracking-wider" style={{ color:"var(--text-muted)" }}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dn = i - firstDay(viewY, viewM) + 1;
          const valid = dn >= 1 && dn <= daysInMonth(viewY, viewM);
          const sel = valid && dn === d && viewM === (m-1) && viewY === y;
          return (
            <button key={i} type="button" disabled={!valid} onClick={() => valid && selectDay(dn)}
              className="h-8 w-full rounded-lg text-xs font-medium transition-all"
              style={{ color: !valid ? "transparent" : sel ? "#000814" : "var(--text)", background: sel ? "var(--primary)" : "transparent", cursor: valid ? "pointer" : "default" }}
              onMouseEnter={e => { if (valid && !sel) (e.target as HTMLElement).style.background = "rgba(255,195,0,0.12)"; }}
              onMouseLeave={e => { if (!sel) (e.target as HTMLElement).style.background = "transparent"; }}>
              {valid ? dn : ""}
            </button>
          );
        })}
      </div>
      {withTime && (
        <div className="px-4 pb-4 pt-3" style={{ borderTop:"1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5" style={{ color:"var(--primary)" }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color:"var(--text-muted)" }}>Time</span>
          </div>
          <TimeScroller value={timePart} onChange={setTime} />
        </div>
      )}
      <div className="px-4 pb-4 pt-1" style={{ borderTop:"1px solid var(--border)" }}>
        <button type="button" onClick={() => setOpen(false)} className="btn-primary w-full text-center text-xs py-2">Done</button>
      </div>
    </>
  );

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-medium mb-1.5 block" style={{ color:"var(--text-muted)" }}>{label}</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="input flex items-center gap-2 text-left cursor-pointer"
        style={{ borderColor: open ? "var(--primary)" : undefined }}>
        <Calendar className="w-4 h-4 shrink-0" style={{ color:"var(--primary)" }} />
        <span className="flex-1" style={{ color: d ? "var(--text)" : "var(--text-muted)" }}>{displayVal}</span>
        {withTime && <Clock className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--text-muted)" }} />}
      </button>
      {hint && <p className="text-xs mt-1.5" style={{ color:"var(--text-muted)" }}>{hint}</p>}

      {open && !isMobile && (
        <div className="absolute z-50 mt-2 rounded-xl overflow-hidden"
          style={{ background:"var(--surface)", border:"1px solid rgba(255,195,0,0.2)", boxShadow:"0 20px 60px rgba(0,0,0,0.6)", width:300, left:0 }}>
          {body}
        </div>
      )}

      {open && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)" }}
          onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="rounded-t-2xl overflow-y-auto" style={{ background:"var(--surface)", border:"1px solid rgba(255,195,0,0.2)", maxHeight:"92vh" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid var(--border)" }}>
              <span className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>{label}</span>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color:"var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    leagueStartDate: "2026-04-03T00:00",
    leagueEndDate: "2026-04-05",
    leagueVenue: "Parade Ground, IIEST Shibpur",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => setSettings(prev => ({ ...prev, ...s }))).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.entries(settings).map(([key, value]) => api.updateSetting(key, value)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color:"var(--text)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Configure IKKL admin panel</p>
      </div>
      <div className="card p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-display font-bold" style={{ color:"var(--text)" }}>League Info</h2>
        <DateTimePicker label="League Start Date & Time" value={settings.leagueStartDate}
          onChange={v => setSettings(s => ({ ...s, leagueStartDate: v }))} withTime
          hint="Controls the countdown timer on the frontend." />
        <DateTimePicker label="League End Date" value={settings.leagueEndDate}
          onChange={v => setSettings(s => ({ ...s, leagueEndDate: v }))} />
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color:"var(--text-muted)" }}>Venue</label>
          <input className="input" value={settings.leagueVenue} onChange={e => setSettings(s => ({ ...s, leagueVenue: e.target.value }))} />
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>
      <div className="card p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-display font-bold" style={{ color:"var(--text)" }}>API Configuration</h2>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color:"var(--text-muted)" }}>Backend API URL</label>
          <input className="input" defaultValue="http://localhost:3001/api" />
          <p className="text-xs mt-1.5" style={{ color:"var(--text-muted)" }}>Set VITE_API_URL in your .env to override</p>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color:"var(--text-muted)" }}>Event Name</label>
          <input className="input" defaultValue="IKKL – IIEST Kho-Kho League" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color:"var(--text-muted)" }}>Season</label>
          <input className="input" defaultValue="2026 · Inaugural Edition" />
        </div>
      </div>
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-display font-bold mb-4" style={{ color:"var(--text)" }}>About</h2>
        <div className="space-y-2 text-sm" style={{ color:"var(--text-muted)" }}>
          <p>IKKL Admin Panel v1.0</p>
          <p>Backend: Node.js + Express + MongoDB</p>
          <p>Frontend: React + Vite + Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { clsx } from "clsx";
import { fetchMatches } from "@/lib/api";
import type { Match } from "@/lib/types";

interface TeamRow { team: { id: string; name: string; shortName: string; color: string }; played: number; won: number; lost: number; pts: number; nrr: number; }

function computeTable(matches: Match[]): TeamRow[] {
  const base: Record<string, TeamRow> = {};

  matches.forEach(m => {
    [m.teamA, m.teamB].forEach(t => {
      if (!base[t.id]) base[t.id] = { team: t, played: 0, won: 0, lost: 0, pts: 0, nrr: 0 };
    });
    if (m.status !== "COMPLETED" || m.scoreA === undefined || m.scoreB === undefined) return;
    const margin = Math.abs(m.scoreA - m.scoreB);
    const delta = margin / 10;
    const winA = m.scoreA > m.scoreB;
    base[m.teamA.id].played++; base[m.teamB.id].played++;
    if (winA) {
      base[m.teamA.id].won++; base[m.teamA.id].pts += 2; base[m.teamA.id].nrr += delta;
      base[m.teamB.id].lost++;                            base[m.teamB.id].nrr -= delta;
    } else {
      base[m.teamB.id].won++; base[m.teamB.id].pts += 2; base[m.teamB.id].nrr += delta;
      base[m.teamA.id].lost++;                            base[m.teamA.id].nrr -= delta;
    }
  });

  return Object.values(base)
    .map(r => ({ ...r, nrr: Math.round(r.nrr * 100) / 100 }))
    .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.nrr - a.nrr);
}

export default function PointsTable() {
  const [table, setTable] = useState<TeamRow[]>([]);
  useEffect(() => { fetchMatches().then(m => setTable(computeTable(m))); }, []);
  const TABLE = table;

  if (TABLE.length === 0) return (
    <div className="min-h-screen pt-20 sm:pt-24 flex items-center justify-center">
      <p className="text-white/40 text-sm">No match data available yet.</p>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-20 sm:pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs font-bold tracking-[0.3em] text-primary/60 uppercase mb-3 sm:mb-4">
            IKKL 1.0 · Season 2026
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-white mb-2"
            style={{ textShadow: "0 0 60px rgba(255,195,0,0.25)" }}>
            POINTS TABLE
          </motion.h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="w-24 h-0.5 mx-auto mt-4 sm:mt-5"
            style={{ background: "linear-gradient(90deg,transparent,#ffc300,transparent)" }} />
        </div>

        {/* Table — no horizontal scroll, fits all screens */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden mb-5"
          style={{ background: "linear-gradient(160deg,rgba(0,29,61,0.6),rgba(0,8,20,0.8))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Header row */}
          <div className="grid px-3 sm:px-5 py-2.5 sm:py-3 border-b"
            style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2.5rem 4rem 2.5rem", gap: "0.25rem", borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,53,102,0.25)" }}>
            <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase">#</div>
            <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase pl-1">Team</div>
            <div className="text-[10px] font-bold tracking-widest text-green-400/70 uppercase text-center">W</div>
            <div className="text-[10px] font-bold tracking-widest text-red-400/70 uppercase text-center">L</div>
            <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase text-center">NRR</div>
            <div className="text-[10px] font-bold tracking-widest text-primary uppercase text-center">Pts</div>
          </div>

          {TABLE.map((row, i) => {
            const isTop4 = i < 4;
            return (
              <div key={row.team.id}>
                {i === 4 && (
                  <div className="flex items-center gap-2 px-3 sm:px-5 py-1.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
                    <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,rgba(255,195,0,0.4),transparent)" }} />
                    <span className="text-[9px] font-bold tracking-[0.2em] text-white/25 uppercase whitespace-nowrap">Elimination Zone</span>
                    <div className="h-px flex-1" style={{ background: "linear-gradient(270deg,rgba(255,195,0,0.4),transparent)" }} />
                  </div>
                )}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className={clsx("grid px-3 sm:px-5 py-3 sm:py-3.5 relative transition-colors", isTop4 ? "hover:bg-white/[0.03]" : "opacity-55 hover:opacity-75")}
                  style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2.5rem 4rem 2.5rem", gap: "0.25rem", borderLeft: isTop4 ? "3px solid #ffc300" : "3px solid transparent", borderBottom: i < TABLE.length - 1 && i !== 3 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                  {isTop4 && <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.05] to-transparent pointer-events-none" />}

                  {/* Pos */}
                  <div className="flex items-center relative">
                    {i === 0
                      ? <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,195,0,0.2)", border: "1px solid rgba(255,195,0,0.4)" }}>
                          <Crown className="w-3 h-3 text-primary" />
                        </div>
                      : <span className="font-display font-bold text-sm text-white/35">{i + 1}</span>
                    }
                  </div>

                  {/* Team */}
                  <div className="flex items-center min-w-0 pl-1 relative">
                    <span className="font-display font-bold text-xs sm:text-sm text-white">{row.team.name}</span>
                  </div>

                  {/* W */}
                  <div className="flex items-center justify-center relative">
                    <span className="font-bold text-sm text-green-400">{row.won}</span>
                  </div>

                  {/* L */}
                  <div className="flex items-center justify-center relative">
                    <span className="font-bold text-sm text-red-400">{row.lost}</span>
                  </div>

                  {/* NRR */}
                  <div className="flex items-center justify-center relative">
                    <span className={clsx("text-xs sm:text-sm font-mono font-medium", row.nrr > 0 ? "text-green-400" : row.nrr < 0 ? "text-red-400" : "text-white/40")}>
                      {row.nrr > 0 ? "+" : ""}{row.nrr.toFixed(2)}
                    </span>
                  </div>

                  {/* Pts */}
                  <div className="flex items-center justify-center relative">
                    <span className={clsx("font-display font-black text-lg sm:text-xl", isTop4 ? "text-primary" : "text-white/40")}>
                      {row.pts}
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mt-4 rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>

          {/* Qualifying criteria */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,53,102,0.15)" }}>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase mb-2.5">Qualifying Criteria</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "#ffc300" }} />
                <span className="text-xs text-white/70">Top 4 → Knockout stage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />
                <span className="text-xs text-white/50">Below 4th → Eliminated</span>
              </div>
            </div>
          </div>

          {/* Scoring & NRR */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-2.5">Scoring &amp; NRR</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="px-2.5 py-2 rounded-lg text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Win</div>
                <div className="text-sm font-bold text-green-400">+2 pts</div>
              </div>
              <div className="px-2.5 py-2 rounded-lg text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Loss</div>
                <div className="text-sm font-bold text-red-400">0 pts</div>
              </div>
              <div className="px-2.5 py-2 rounded-lg text-center" style={{ background: "rgba(255,195,0,0.08)", border: "1px solid rgba(255,195,0,0.2)" }}>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Tie</div>
                <div className="text-sm font-bold text-primary">NRR</div>
              </div>
            </div>
            <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(0,29,61,0.5)", border: "1px solid rgba(255,195,0,0.15)" }}>
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-1.5">NRR Formula</p>
              <div className="flex flex-col gap-1 text-xs text-white/55">
                <span>Winner NRR <span className="text-green-400 font-mono">+= margin ÷ 10</span></span>
                <span>Loser NRR <span className="text-red-400 font-mono">−= margin ÷ 10</span></span>
                <span className="text-white/30 text-[11px] pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  e.g. A 34 – B 21 → margin 13 → A <span className="text-green-400">+1.30</span>, B <span className="text-red-400">−1.30</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

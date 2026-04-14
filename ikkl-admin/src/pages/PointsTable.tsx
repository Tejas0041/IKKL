import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { Crown } from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api";

interface Row { team: { id: string; name: string; shortName: string; color: string }; played: number; won: number; lost: number; pts: number; nrr: number; }

function compute(matches: Match[]): Row[] {
  const base: Record<string, Row> = {};
  matches.forEach(m => {
    [m.teamA, m.teamB].forEach(t => {
      if (!base[t.id]) base[t.id] = { team: t, played: 0, won: 0, lost: 0, pts: 0, nrr: 0 };
    });
    if (m.status !== "COMPLETED" || m.scoreA === undefined || m.scoreB === undefined) return;
    const delta = Math.abs(m.scoreA - m.scoreB) / 10;
    const winA = m.scoreA > m.scoreB;
    base[m.teamA.id].played++; base[m.teamB.id].played++;
    if (winA) { base[m.teamA.id].won++; base[m.teamA.id].pts += 2; base[m.teamA.id].nrr += delta; base[m.teamB.id].lost++; base[m.teamB.id].nrr -= delta; }
    else       { base[m.teamB.id].won++; base[m.teamB.id].pts += 2; base[m.teamB.id].nrr += delta; base[m.teamA.id].lost++; base[m.teamA.id].nrr -= delta; }
  });
  return Object.values(base).map(r => ({ ...r, nrr: Math.round(r.nrr * 100) / 100 }))
    .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.nrr - a.nrr);
}

export default function PointsTable() {
  const [table, setTable] = useState<Row[]>([]);
  useEffect(() => { api.getMatches().then(d => setTable(compute(d as Match[]))).catch(() => {}); }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: "var(--text)" }}>Points Table</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Live standings · auto-computed from match results</p>
      </div>

      {table.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display font-bold text-xl mb-2" style={{ color: "var(--text)" }}>No Data Yet</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Points table will populate once matches are completed.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                  {["#", "Team", "W", "L", "NRR", "Pts"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: h === "Pts" ? "var(--primary)" : "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => {
                  const isTop2 = i < 2;
                  return (
                    <tr key={row.team.id}
                      className={clsx("transition-colors", isTop2 ? "hover:bg-white/[0.03]" : "opacity-60 hover:opacity-80")}
                      style={{ borderBottom: "1px solid var(--border)", borderLeft: isTop2 ? "3px solid var(--primary)" : "3px solid transparent" }}>
                      <td className="px-4 py-3">
                        {i === 0
                          ? <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,195,0,0.15)", border: "1px solid rgba(255,195,0,0.3)" }}><Crown className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} /></div>
                          : <span className="font-display font-bold text-base" style={{ color: "var(--text-muted)" }}>{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: row.team.color }} />
                          <span className="font-medium" style={{ color: "var(--text)" }}>{row.team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-400">{row.won}</td>
                      <td className="px-4 py-3 font-bold text-red-400">{row.lost}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: row.nrr > 0 ? "#22c55e" : row.nrr < 0 ? "#ef4444" : "var(--text-muted)" }}>
                        {row.nrr > 0 ? "+" : ""}{row.nrr.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-display font-black text-xl" style={{ color: isTop2 ? "var(--primary)" : "var(--text-muted)" }}>{row.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ borderTop: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text-muted)" }}>
            Win = 2 pts · NRR = margin ÷ 10 · Top 2 qualify
          </div>
        </div>
      )}
    </div>
  );
}

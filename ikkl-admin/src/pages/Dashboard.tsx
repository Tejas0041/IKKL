import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Match } from "@/lib/types";
import { Activity, Calendar, CheckCircle, Users } from "lucide-react";
import { AdminLoader, CardSkeleton } from "@/components/AdminLoader";

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMatches().then(d => setMatches(d as Match[])),
      api.getTeams().then(d => setTeamCount((d as unknown[]).length)),
    ]).finally(() => setLoading(false));
  }, []);

  const liveMatches = matches.filter(m => m.status === "LIVE");
  const recentMatches = matches.filter(m => m.status === "COMPLETED").slice(-3).reverse();
  const upcoming = matches.filter(m => m.status === "UPCOMING").slice(0, 3);

  const stats = [
    { label: "Total Matches", value: matches.length, icon: Calendar, color: "#3b82f6" },
    { label: "Live Now", value: liveMatches.length, icon: Activity, color: "#ef4444" },
    { label: "Completed", value: matches.filter(m => m.status === "COMPLETED").length, icon: CheckCircle, color: "#22c55e" },
    { label: "Teams", value: teamCount, icon: Users, color: "#ffc300" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>IKKL 1.0 · Season 2026 Overview</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-4xl font-display font-bold" style={{ color: "var(--text)" }}>{value}</p>
          </div>
        ))}
      </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0,1].map(i => <div key={i} className="card p-5"><AdminLoader /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" /> Live Matches
          </h2>
          {liveMatches.length === 0
            ? <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No live matches right now</p>
            : liveMatches.map(m => (
              <div key={m.id} className="card2 p-4 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                    style={{ background: m.teamA.logo ? "transparent" : m.teamA.color }}>
                    {m.teamA.logo ? <img src={m.teamA.logo} alt={m.teamA.name} className="w-full h-full object-contain" /> : m.teamA.shortName}
                  </div>
                  <span className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>{m.scoreA ?? 0}</span>
                  <span style={{ color: "var(--text-muted)" }}>vs</span>
                  <span className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>{m.scoreB ?? 0}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                    style={{ background: m.teamB.logo ? "transparent" : m.teamB.color }}>
                    {m.teamB.logo ? <img src={m.teamB.logo} alt={m.teamB.name} className="w-full h-full object-contain" /> : m.teamB.shortName}
                  </div>
                </div>
                <span className="badge-live text-xs font-bold px-2 py-1 rounded-full">LIVE</span>
              </div>
            ))
          }
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-display font-bold mb-4" style={{ color: "var(--text)" }}>Upcoming Matches</h2>
          {upcoming.length === 0
            ? <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No upcoming matches</p>
            : <div className="space-y-3">
              {upcoming.map(m => (
                <div key={m.id} className="card2 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{m.teamA.name} vs {m.teamB.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.dateStr} · {m.time}</p>
                  </div>
                  <span className="badge-upcoming text-xs font-bold px-2 py-1 rounded-full">UPCOMING</span>
                </div>
              ))}
            </div>
          }
        </div>
        </div>
      )}

      {loading ? (
        <div className="card p-5"><AdminLoader label="Loading results" /></div>
      ) : (
      <div className="card p-5">
        <h2 className="text-lg font-display font-bold mb-4" style={{ color: "var(--text)" }}>Recent Results</h2>
        {recentMatches.length === 0
          ? <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>No completed matches yet</p>
          : <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Match", "Score", "Date", "Status"].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMatches.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-3 pr-4 font-medium" style={{ color: "var(--text)" }}>{m.teamA.shortName} vs {m.teamB.shortName}</td>
                    <td className="py-3 pr-4 font-display font-bold" style={{ color: "var(--primary)" }}>{m.scoreA} – {m.scoreB}</td>
                    <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{m.dateStr}</td>
                    <td className="py-3"><span className="badge-completed text-xs font-bold px-2 py-1 rounded-full">DONE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
      )}
    </div>
  );
}

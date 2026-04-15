import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { fetchMatches, fetchTeams } from "@/lib/api";
import { Filter, Calendar as CalIcon, MapPin, Clock, Trophy, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import type { Match, Team } from "@/lib/types";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { DotsLoader, MatchCardSkeleton } from "@/components/ui/DotsLoader";
import { PageBg } from "@/components/layout/PageBg";
import { victoryMarginStr } from "@/lib/utils";

type FilterTab = "ALL" | "TODAY" | "UPCOMING" | "COMPLETED";

const TEAM_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  THU: { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.45)",  text: "#93c5fd", glow: "rgba(59,130,246,0.25)"  },
  PHO: { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.45)",  text: "#fdba74", glow: "rgba(249,115,22,0.25)"  },
  VEL: { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.45)",  text: "#c4b5fd", glow: "rgba(168,85,247,0.25)"  },
  STE: { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.45)", text: "#cbd5e1", glow: "rgba(148,163,184,0.25)" },
  BLA: { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.45)",   text: "#fca5a5", glow: "rgba(239,68,68,0.25)"   },
  NIG: { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.45)",  text: "#a5b4fc", glow: "rgba(99,102,241,0.25)"  },
  CYC: { bg: "rgba(20,184,166,0.12)",  border: "rgba(20,184,166,0.45)",  text: "#5eead4", glow: "rgba(20,184,166,0.25)"  },
  IRO: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.45)",  text: "#fcd34d", glow: "rgba(245,158,11,0.25)"  },
};

const fallback = TEAM_COLORS.THU;

const MatchCard = ({ match, index, matchNumber }: { match: Match; index: number; matchNumber: number }) => {
  const isLive      = match.status === "LIVE";
  const isCompleted = match.status === "COMPLETED";
  const hasScores   = match.scoreA !== undefined && match.scoreB !== undefined;
  const cA = TEAM_COLORS[match.teamA.id] ?? fallback;
  const cB = TEAM_COLORS[match.teamB.id] ?? fallback;
  const winA = hasScores && match.scoreA! > match.scoreB!;
  const winB = hasScores && match.scoreB! > match.scoreA!;

  const card = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{
        background: "linear-gradient(155deg, rgba(4,20,50,0.9) 0%, rgba(0,6,18,0.97) 100%)",
        border: isLive
          ? "1px solid rgba(239,68,68,0.4)"
          : isCompleted
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isLive
          ? "0 0 0 1px rgba(239,68,68,0.12), 0 16px 48px rgba(0,0,0,0.55)"
          : "0 16px 48px rgba(0,0,0,0.45)",
      }}
    >
      {/* Live ambient glow */}
      {isLive && (
        <motion.div
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(239,68,68,0.18) 0%, transparent 65%)" }}
        />
      )}

      {/* Hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,195,0,0.04) 0%, transparent 55%)" }} />

      {/* Status accent line */}
      <div className="h-[2px] w-full" style={{
        background: isLive
          ? "linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.9) 50%, transparent 100%)"
          : isCompleted
          ? "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.6) 50%, transparent 100%)"
          : "linear-gradient(90deg, transparent 0%, rgba(255,195,0,0.4) 50%, transparent 100%)"
      }} />

      {/* Meta row */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-3 sm:gap-4 text-white/35 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            {match.time}
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {match.venue}
          </span>
        </div>

        {/* Status pill */}
        {isLive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <motion.span
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-red-500 block shrink-0"
            />
            <span className="text-[10px] font-black text-red-400 tracking-widest uppercase">Live</span>
          </div>
        )}
        {isCompleted && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Trophy className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-[10px] font-black text-green-400 tracking-widest uppercase">FT</span>
          </div>
        )}
        {!isLive && !isCompleted && (
          <span className="text-[10px] font-bold text-primary/50 tracking-widest uppercase shrink-0">Upcoming</span>
        )}
      </div>

      {/* ── TEAMS ROW ── */}
      <div className="px-4 sm:px-5 py-5 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Team A — left aligned */}
          <div className="flex-1 flex items-center gap-2.5 sm:gap-3 min-w-0">
            <TeamBadge team={match.teamA} size="md" />
            <div className="min-w-0">
              <p className="font-display font-bold text-white text-sm sm:text-[15px] leading-tight truncate">
                {match.teamA.name}
              </p>
              {winA && (
                <span className="inline-flex items-center gap-1 mt-0.5">
                  <Trophy className="w-2.5 h-2.5 text-yellow-400" />
                  <span className="text-[9px] font-black text-yellow-400 tracking-widest uppercase">Winner</span>
                </span>
              )}
            </div>
          </div>

          {/* Centre — score or VS */}
          <div className="shrink-0 flex flex-col items-center gap-1 px-1 sm:px-2">
            {hasScores ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <span
                  className={clsx("font-display font-black text-2xl sm:text-3xl leading-none tabular-nums transition-all", winA ? "text-white" : "text-white/35")}
                  style={winA ? { textShadow: `0 0 18px ${cA.glow}` } : {}}
                >
                  {match.scoreA}
                </span>
                <span className="text-white/15 font-light text-lg leading-none select-none">–</span>
                <span
                  className={clsx("font-display font-black text-2xl sm:text-3xl leading-none tabular-nums transition-all", winB ? "text-white" : "text-white/35")}
                  style={winB ? { textShadow: `0 0 18px ${cB.glow}` } : {}}
                >
                  {match.scoreB}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="font-display font-black text-[11px] text-white/20 tracking-[0.2em]">VS</span>
              </div>
            )}
          </div>

          {/* Team B — right aligned */}
          <div className="flex-1 flex items-center gap-2.5 sm:gap-3 justify-end min-w-0">
            <div className="min-w-0 text-right">
              <p className="font-display font-bold text-white text-sm sm:text-[15px] leading-tight truncate">
                {match.teamB.name}
              </p>
              {winB && (
                <span className="inline-flex items-center gap-1 mt-0.5 justify-end w-full">
                  <Trophy className="w-2.5 h-2.5 text-yellow-400" />
                  <span className="text-[9px] font-black text-yellow-400 tracking-widest uppercase">Winner</span>
                </span>
              )}
            </div>
            <TeamBadge team={match.teamB} size="md" />
          </div>
        </div>

        {/* Footer */}
        {(isCompleted || isLive) && (
          <div className="mt-4 pt-3.5 border-t flex items-center justify-between"
            style={{ borderColor: isLive ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)" }}>
            <span className="text-[11px] font-medium"
              style={{ color: isCompleted && victoryMarginStr(match) ? "rgba(255,195,0,0.6)" : "rgba(255,255,255,0.2)" }}>
              {isCompleted && victoryMarginStr(match) ? victoryMarginStr(match) : `Match #${matchNumber}`}
            </span>
            <Link href={`/scorecard/${match.matchId || match.id}`}
              className="flex items-center gap-1.5 transition-colors duration-200"
              style={{ color: isLive ? "rgba(239,68,68,0.7)" : "rgba(255,195,0,0.7)" }}
              onClick={e => e.stopPropagation()}>
              <span className="text-xs font-display font-bold tracking-wider">
                {isLive ? "Live Scorecard" : "Scorecard"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      {isCompleted ? <Link href={`/scorecard/${match.matchId || match.id}`}>{card}</Link> : card}
    </motion.div>
  );
};

export default function Schedule() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [selectedTeam, setSelectedTeam] = useState("ALL");

  useEffect(() => {
    Promise.all([fetchMatches(), fetchTeams()]).then(([m, t]) => {
      setAllMatches(m);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  const filteredMatches = useMemo(() => allMatches.filter(m => {
    if (activeTab === "UPCOMING"  && m.status !== "UPCOMING" && m.status !== "LIVE")    return false;
    if (activeTab === "COMPLETED" && m.status !== "COMPLETED")                          return false;
    if (selectedTeam !== "ALL"   && m.teamA.id !== selectedTeam && m.teamB.id !== selectedTeam) return false;
    return true;
  }), [allMatches, activeTab, selectedTeam]);

  const groupedMatches = useMemo(() => {
    const g: Record<string, Match[]> = {};
    filteredMatches.forEach(m => { if (!g[m.dateStr]) g[m.dateStr] = []; g[m.dateStr].push(m); });
    return g;
  }, [filteredMatches]);

  // Sequential match numbers based on full sorted list
  const matchNumberMap = useMemo(() => {
    const map: Record<string, number> = {};
    allMatches.forEach((m, i) => { map[m.matchId || m.id] = i + 1; });
    return map;
  }, [allMatches]);

  const liveCount = allMatches.filter(m => m.status === "LIVE").length;

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-x-hidden w-full">

      <PageBg />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(255,195,0,0.07)", border: "1px solid rgba(255,195,0,0.2)" }}>
            <CalIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-primary/80 uppercase">IKKL 2026 · 14 – 16 April</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white leading-[1.05]">
              Match{" "}
              <span className="text-primary" style={{ textShadow: "0 0 40px rgba(255,195,0,0.4)" }}>Schedule</span>
            </h1>

            {liveCount > 0 && (
              <motion.div
                animate={{ boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 22px rgba(239,68,68,0.35)", "0 0 0px rgba(239,68,68,0)"] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl self-start sm:self-auto shrink-0"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <motion.span animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-500 block shrink-0" />
                <span className="text-sm font-bold text-red-400 tracking-wide">{liveCount} Match Live</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── FILTER BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-[68px] z-40 mb-10 rounded-2xl"
          style={{
            background: "rgba(0,5,16,0.97)",
            backdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.65)"
          }}
        >
          <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 items-start sm:items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(["ALL", "TODAY", "UPCOMING", "COMPLETED"] as FilterTab[]).map(tab => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      "px-4 py-2 rounded-xl font-display font-bold tracking-wider text-xs whitespace-nowrap transition-all duration-200 outline-none",
                      active ? "text-[#000814]" : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                    )}
                    style={active
                      ? { background: "linear-gradient(135deg,#ffc300,#ffd60a)", boxShadow: "0 0 18px rgba(255,195,0,0.35)" }
                      : {}}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Team select */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-white/25 shrink-0" />
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="flex-1 sm:flex-none bg-transparent border border-white/10 text-white/70 text-xs rounded-xl px-3 py-2 outline-none focus:border-primary/40 transition-colors cursor-pointer"
                style={{ minWidth: "160px" }}
              >
                <option value="ALL" className="bg-[#00050f]">All Teams</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#00050f]">{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* ── MATCH GROUPS ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)}
            </motion.div>
          ) : Object.keys(groupedMatches).length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-24 rounded-3xl"
              style={{ background: "rgba(0,18,45,0.35)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <CalIcon className="w-14 h-14 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-white/50 mb-2">No Matches Found</h3>
              <p className="text-white/25 text-sm">Try a different filter.</p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              {Object.entries(groupedMatches).map(([date, matches], idx) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl shrink-0"
                      style={{ background: "rgba(255,195,0,0.06)", border: "1px solid rgba(255,195,0,0.18)" }}>
                      <CalIcon className="w-3.5 h-3.5 text-primary/60" />
                      <span className="font-display font-bold text-primary text-sm tracking-wider">{date}</span>
                    </div>
                    <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,195,0,0.2), transparent)" }} />
                    <span className="text-[11px] text-white/20 font-medium shrink-0">
                      {matches.length} {matches.length === 1 ? "match" : "matches"}
                    </span>
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {matches.map((m, i) => <MatchCard key={m.matchId || m.id || i} match={m} index={i} matchNumber={matchNumberMap[m.matchId || m.id] ?? i + 1} />)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

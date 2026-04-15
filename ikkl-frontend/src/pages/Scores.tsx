import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { fetchMatches } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { MatchCard } from "@/components/ui/MatchCard";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { DotsLoader, MatchCardSkeleton } from "@/components/ui/DotsLoader";
import { PageBg } from "@/components/layout/PageBg";
import { Activity, MapPin, Maximize2 } from "lucide-react";
import type { Match } from "@/lib/types";

export default function Scores() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetchMatches().then(m => { setMatches(m); setLoading(false); });
  useEffect(() => { load(); }, []);

  // Real-time: reload on any score change
  useEffect(() => {
    const socket = getSocket();
    socket.on("scores:changed", load);
    return () => { socket.off("scores:changed", load); };
  }, []);

  const liveMatch = matches.find(m => m.status === "LIVE");
  const completedMatches = matches.filter(m => m.status === "COMPLETED");

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-20 relative">
      <PageBg />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-white">
            Live Scores <span className="text-primary">&amp;</span> Results
          </h1>
        </div>

        {loading && (
          <div className="mb-12 sm:mb-16 rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse"
            style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.7),rgba(0,6,18,0.85))", border: "1px solid rgba(255,255,255,0.05)", height: 200 }}>
            <div className="flex items-center justify-center h-full">
              <DotsLoader variant="inline" />
            </div>
          </div>
        )}

        {!loading && liveMatch && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mb-12 sm:mb-16">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(155deg,rgba(4,20,50,0.95),rgba(0,6,18,0.98))", border: "1px solid rgba(239,68,68,0.35)", boxShadow: "0 0 60px rgba(239,68,68,0.08)" }}>

              {/* Live header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
                style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-display font-bold tracking-widest text-red-400 uppercase text-xs sm:text-sm">Live Now</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{liveMatch.venue}</span>
                  </div>
                  <Link href={`/scorecard/${liveMatch.matchId || liveMatch.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Full Scorecard</span>
                    <span className="sm:hidden">Scorecard</span>
                  </Link>
                </div>
              </div>

              {/* Score board */}
              <div className="p-5 sm:p-8 md:p-12">
                <div className="flex items-center justify-between gap-3 sm:gap-6">
                  {/* Team A */}
                  <div className="flex flex-col items-center flex-1 gap-2 sm:gap-4 min-w-0">
                    <TeamBadge team={liveMatch.teamA} size="xl" />
                    <h2 className="text-sm sm:text-lg md:text-2xl font-display font-bold text-center text-white leading-tight truncate w-full text-center">{liveMatch.teamA.name}</h2>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center shrink-0 gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
                      <span className="text-4xl sm:text-6xl md:text-8xl font-display font-bold text-white" style={{ textShadow: "0 0 30px rgba(255,195,0,0.4)" }}>{liveMatch.scoreA}</span>
                      <span className="text-xl sm:text-3xl text-white/20">–</span>
                      <span className="text-4xl sm:text-6xl md:text-8xl font-display font-bold text-white/60">{liveMatch.scoreB}</span>
                    </div>
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
                      className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] sm:text-xs font-bold text-red-400 tracking-widest uppercase">In Progress</span>
                    </motion.div>
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col items-center flex-1 gap-2 sm:gap-4 min-w-0">
                    <TeamBadge team={liveMatch.teamB} size="xl" />
                    <h2 className="text-sm sm:text-lg md:text-2xl font-display font-bold text-center text-white leading-tight truncate w-full text-center">{liveMatch.teamB.name}</h2>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div>
          <div className="flex items-center gap-4 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Recent Results</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 3 }).map((_, i) => <MatchCardSkeleton key={i} />)}
            </div>
          ) : completedMatches.length === 0 ? (
            <div className="py-10 text-center rounded-2xl" style={{ background: "rgba(0,29,61,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/40 text-sm">No completed matches yet.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {completedMatches.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link href={`/scorecard/${match.id}`}>
                  <MatchCard match={match} />
                </Link>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

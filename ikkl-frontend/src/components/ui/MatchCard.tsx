import { clsx } from "clsx";
import { Link } from "wouter";
import type { Match } from "@/lib/types";
import { MapPin, Clock, CalendarDays } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { victoryMarginStr } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  className?: string;
}

export function MatchCard({ match, className }: MatchCardProps) {
  const isLive = match.status === "LIVE";
  const isCompleted = match.status === "COMPLETED";
  const matchId = match.matchId || match.id;
  const href = (isLive || isCompleted) ? `/scorecard/${matchId}` : `/scores`;
  return (
    <Link href={href}>
      <div className={clsx(
        "relative group cursor-pointer glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col h-full",
        isLive && "border-primary/50 shadow-[0_0_20px_rgba(255,195,0,0.2)] animate-glow",
        className
      )}>
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-primary/50 transition-colors" />

        <div className="px-5 pt-5 pb-4 flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-white/50 bg-white/5 px-2.5 py-1 rounded-md border border-[#003566]">
              <CalendarDays className="w-3.5 h-3.5" />
              {match.dateStr}
            </div>
            <div className={clsx(
              "px-3 py-1 rounded-full text-xs font-display font-bold tracking-widest flex items-center gap-2",
              isLive ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_10px_rgba(255,195,0,0.3)]" :
              isCompleted ? "bg-white/10 text-white/60 border border-white/10" :
              "bg-secondary/20 text-secondary border border-secondary/30"
            )}>
              {isLive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse-fast" />}
              {match.status}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 gap-2">
            {/* Team A */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamBadge team={match.teamA} size="lg" />
              <span className="font-display font-semibold text-center text-sm leading-tight w-full truncate px-1">{match.teamA.name}</span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center justify-center shrink-0 px-1">
              {isCompleted || isLive ? (
                <div className="flex items-center gap-2 font-display font-bold text-2xl">
                  <span className={clsx(match.scoreA! >= match.scoreB! ? "text-white" : "text-white/50")}>{match.scoreA}</span>
                  <span className="text-white/30 text-base">–</span>
                  <span className={clsx(match.scoreB! > match.scoreA! ? "text-white" : "text-white/50")}>{match.scoreB}</span>
                </div>
              ) : (
                <span className="font-display font-bold text-xl text-primary/70 italic">VS</span>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamBadge team={match.teamB} size="lg" />
              <span className="font-display font-semibold text-center text-sm leading-tight w-full truncate px-1">{match.teamB.name}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#003566]/50 bg-[#000814]/40 flex justify-between items-center text-xs text-white/50">
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary/70" />{match.time}</div>
          {isCompleted && victoryMarginStr(match)
            ? <span className="text-primary/70 font-medium">{victoryMarginStr(match)}</span>
            : <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-secondary/70" />{match.venue}</div>
          }
        </div>

        {(isCompleted || isLive) && (
          <div className="absolute inset-0 bg-[#001d3d]/0 group-hover:bg-[#001d3d]/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
            <span className="bg-[#000814]/90 text-primary border border-primary/50 px-4 py-2 rounded-full font-display font-bold tracking-wider text-sm shadow-[0_0_15px_rgba(255,195,0,0.3)] transform translate-y-4 group-hover:translate-y-0 transition-transform">
              {isLive ? "LIVE SCORECARD" : "VIEW SCORECARD"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

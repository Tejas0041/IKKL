import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Match } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns a human-readable victory margin string for a completed match */
export function victoryMarginStr(match: Match): string | null {
  if (match.status !== "COMPLETED") return null;
  const sA = match.scoreA ?? 0;
  const sB = match.scoreB ?? 0;
  if (sA === sB) return null;
  const winner = sA > sB ? match.teamA.name : match.teamB.name;

  if (match.victoryType === "TIME" && match.winMarginSeconds !== undefined && match.winMarginSeconds > 0) {
    const m = Math.floor(match.winMarginSeconds / 60);
    const s = match.winMarginSeconds % 60;
    const timeStr = m > 0
      ? `${m}m ${s > 0 ? `${s}s` : ""}`.trim()
      : `${s}s`;
    return `${winner} won · ${timeStr} remaining`;
  }

  const margin = Math.abs(sA - sB);
  return `${winner} won by ${margin} pt${margin !== 1 ? "s" : ""}`;
}

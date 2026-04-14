import type { Team } from "@/lib/types";

interface Props {
  team: Team;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm:  "w-8 h-8 rounded-lg text-[10px]",
  md:  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-xs",
  lg:  "w-14 h-14 rounded-xl text-xl",
  xl:  "w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-2xl text-lg sm:text-2xl md:text-4xl",
};

export function TeamBadge({ team, size = "md", className = "" }: Props) {
  const sizeClass = SIZES[size];
  return (
    <div
      className={`${sizeClass} flex items-center justify-center shrink-0 overflow-hidden font-display font-black text-white ${className}`}
      style={{ background: team.logo ? "transparent" : team.color, border: "1px solid rgba(255,255,255,0.15)" }}
    >
      {team.logo
        ? <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
        : team.shortName}
    </div>
  );
}

import { motion } from "framer-motion";

interface DotsLoaderProps {
  /** "page" = full-screen centered, "section" = inline centered block, "inline" = small inline */
  variant?: "page" | "section" | "inline";
  label?: string;
}

export function DotsLoader({ variant = "section", label }: DotsLoaderProps) {
  const dots = [0, 1, 2];

  const dot = (i: number) => (
    <motion.span
      key={i}
      className="block rounded-full bg-primary"
      style={{ width: variant === "inline" ? 6 : 8, height: variant === "inline" ? 6 : 8 }}
      animate={{ y: [0, -10, 0], opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
    />
  );

  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">{dots.map(dot)}</div>
      {label && (
        <span className="text-[11px] font-bold tracking-[0.2em] text-white/30 uppercase">{label}</span>
      )}
    </div>
  );

  if (variant === "page") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {inner}
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className="flex items-center justify-center py-20">
        {inner}
      </div>
    );
  }

  // inline
  return (
    <div className="flex items-center gap-1.5">
      {dots.map(dot)}
    </div>
  );
}

/** Skeleton card for match card placeholders */
export function MatchCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: "linear-gradient(155deg, rgba(4,20,50,0.7) 0%, rgba(0,6,18,0.85) 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="h-[2px] w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      {/* meta row */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="h-3 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
      {/* teams row */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-4 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>
        <div className="shrink-0 w-14 h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="h-4 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>
      </div>
    </div>
  );
}

/** Skeleton row for points table */
export function TableRowSkeleton({ i }: { i: number }) {
  return (
    <div
      className="grid px-3 sm:px-5 py-3.5 animate-pulse"
      style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2.5rem 4rem 2.5rem", gap: "0.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center"><div className="w-5 h-5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} /></div>
      <div className="flex items-center pl-1"><div className="h-3.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", width: `${55 + (i % 3) * 20}px` }} /></div>
      {[0,1,2,3].map(j => (
        <div key={j} className="flex items-center justify-center">
          <div className="h-3.5 w-5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>
      ))}
    </div>
  );
}

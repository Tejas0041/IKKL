import { motion } from "framer-motion";

export function AdminLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="block w-2 h-2 rounded-full"
            style={{ background: "var(--primary)" }}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
        ))}
      </div>
      {label && <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>{label}</span>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="w-8 h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
      <div className="h-8 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse" style={{ borderBottom: "1px solid var(--border)" }}>
      {[40, 120, 60, 80, 60, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded-full" style={{ width: w, background: "rgba(255,255,255,0.07)" }} />
        </td>
      ))}
    </tr>
  );
}

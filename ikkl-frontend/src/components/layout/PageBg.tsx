import { useMemo } from "react";
import { motion } from "framer-motion";

/* Floating gold particles */
function Particles() {
  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 14}s`,
    duration: `${9 + Math.random() * 10}s`,
    size: Math.random() > 0.7 ? 3 : 2,
    opacity: 0.08 + Math.random() * 0.18,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-primary"
          style={{ left: p.left, bottom: "-4px", width: p.size, height: p.size, opacity: p.opacity, animation: `drift ${p.duration} ${p.delay} linear infinite` }} />
      ))}
    </div>
  );
}

/* Shared animated background used on all inner pages */
export function PageBg() {
  return (
    <>
      {/* Base gradient + grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full">
        {/* Radial top glow */}
        <div className="absolute inset-0 w-full"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0,53,102,0.45) 0%, transparent 70%)" }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 w-full opacity-[0.028]"
          style={{ backgroundImage: "linear-gradient(rgba(255,195,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,195,0,1) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />

        {/* Animated blobs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 left-[5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(255,195,0,0.07) 0%,transparent 70%)", filter: "blur(80px)" }} />

        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 35, 0], scale: [1, 0.92, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-[30%] right-[-8%] w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(30,80,200,0.09) 0%,transparent 70%)", filter: "blur(100px)" }} />

        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(255,195,0,0.05) 0%,transparent 70%)", filter: "blur(90px)" }} />

        {/* Slow horizontal scan line */}
        <div className="absolute inset-x-0 h-[1px] opacity-[0.06] w-full pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.9),transparent)", animation: "scan 10s linear infinite" }} />
      </div>

      <Particles />
    </>
  );
}

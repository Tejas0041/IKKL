import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Activity } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useFullscreen } from "@/lib/fullscreen";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Schedule", href: "/schedule" },
  { name: "Scores", href: "/scores" },
  { name: "Points Table", href: "/points-table" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hasLive, setHasLive] = useState(false);
  const fullscreen = useFullscreen();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const check = () =>
      fetch((import.meta.env.VITE_API_URL || "http://localhost:3000/api") + "/matches?status=LIVE")
        .then(r => r.json()).then((d: unknown[]) => setHasLive(d.length > 0)).catch(() => setHasLive(false));
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  // Use CSS visibility — never return null (would break hooks count)
  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{ opacity: fullscreen ? 0 : 1, pointerEvents: fullscreen ? "none" : "auto" }}>
      <motion.div
        animate={isScrolled
          ? { backgroundColor: "rgba(0,5,15,0.92)", boxShadow: "0 0 0 1px rgba(255,195,0,0.08), 0 16px 48px rgba(0,0,0,0.5)" }
          : { backgroundColor: "rgba(0,0,0,0)", boxShadow: "none" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ backdropFilter: isScrolled ? "blur(24px) saturate(1.6)" : "none" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link href="/" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 group outline-none shrink-0">
              <img src="/images/ikkl-logo.webp" alt="IKKL Logo"
                className="w-8 h-8 object-contain shrink-0"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,195,0,0.4))" }} />
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-[22px] tracking-[0.15em] text-white group-hover:text-primary transition-colors duration-200"
                  style={{ textShadow: "0 0 20px rgba(255,195,0,0.3)" }}>IKKL</span>
                <span className="text-[9px] font-bold tracking-[0.3em] text-white/30 uppercase -mt-0.5">Kho-Kho League</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center gap-0.5 p-1 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {navLinks.map((link) => {
                  const active = location === link.href;
                  return (
                    <Link key={link.href} href={link.href} className="relative outline-none">
                      <div className={clsx(
                        "relative px-5 py-2 rounded-xl font-display font-semibold text-sm tracking-wider transition-all duration-200 cursor-pointer",
                        active ? "text-[#000814]" : "text-white/55 hover:text-white"
                      )}>
                        {active && (
                          <motion.div key={link.href} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }} className="absolute inset-0 rounded-xl"
                            style={{ background: "linear-gradient(135deg,#ffc300,#ffd60a)", boxShadow: "0 0 16px rgba(255,195,0,0.4)" }} />
                        )}
                        <span className="relative z-10">{link.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              {hasLive && (
                <Link href="/scores" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full outline-none group"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-bold tracking-[0.2em] text-red-400 uppercase group-hover:text-red-300 transition-colors">Live</span>
                </Link>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: mobileOpen ? "rgba(255,195,0,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen
                    ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <X className="w-4 h-4 text-primary" />
                      </motion.div>
                    : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Menu className="w-4 h-4 text-white/70" />
                      </motion.div>
                  }
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px w-full transition-opacity duration-300"
          style={{
            background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.2) 30%,rgba(255,195,0,0.4) 50%,rgba(255,195,0,0.2) 70%,transparent)",
            opacity: (isMobile || location !== "/" || isScrolled) ? 1 : 0,
          }} />
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{ background: "rgba(0,5,15,0.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,195,0,0.1)" }}>
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link, i) => {
                const active = location === link.href;
                return (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={link.href} onClick={() => setMobileOpen(false)}>
                      <div className={clsx("flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer",
                        active ? "text-[#000814] font-bold" : "text-white/60 hover:text-white hover:bg-white/5")}
                        style={active ? { background: "linear-gradient(135deg,#ffc300,#ffd60a)", boxShadow: "0 0 20px rgba(255,195,0,0.25)" } : {}}>
                        <span className="font-display font-semibold tracking-wider text-base">{link.name}</span>
                        {active && <Activity className="w-4 h-4" />}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
              {hasLive && (
                <div className="pt-2 pb-1">
                  <Link href="/scores" onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold tracking-[0.25em] text-red-400 uppercase">Live Scores</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

import { useEffect, useState, useRef, useMemo } from "react";
import type React from "react";
import { Link } from "wouter";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Trophy, Users, MapPin, Calendar, ChevronRight, Activity, Clock, Star, Flame } from "lucide-react";
import { MatchCard } from "@/components/ui/MatchCard";
import { fetchSettings, fetchMatches, fetchTeams } from "@/lib/api";
import type { Match, Team } from "@/lib/types";

/* ── Floating particles ── */
const Particles = () => {
  const particles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 12}s`, duration: `${8 + Math.random() * 10}s`,
    size: Math.random() > 0.7 ? 3 : 2, opacity: 0.12 + Math.random() * 0.25,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-primary"
          style={{ left: p.left, bottom: "-4px", width: p.size, height: p.size, opacity: p.opacity, animation: `drift ${p.duration} ${p.delay} linear infinite` }} />
      ))}
    </div>
  );
};

/* ── Animated counter ── */
const AnimatedCounter = ({ value, label }: { value: number; label: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const inc = value / (2000 / 16);
    const t = setInterval(() => {
      start += inc;
      if (start >= value) { setCount(value); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [value, isInView]);
  return (
    <div ref={ref} className="relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl overflow-hidden group"
      style={{ background: "linear-gradient(135deg,rgba(0,29,61,0.6),rgba(0,8,20,0.8))", border: "1px solid rgba(255,195,0,0.15)", backdropFilter: "blur(20px)" }}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <span className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-primary mb-1 sm:mb-2 relative z-10"
        style={{ textShadow: "0 0 30px rgba(255,195,0,0.5)" }}>{count}</span>
      <span className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest text-center relative z-10">{label}</span>
    </div>
  );
};

/* ── Countdown ── */
const getTimeLeft = (startDate: string) => {
  // startDate is "YYYY-MM-DDTHH:mm" — treat as IST (+05:30)
  const iso = startDate.includes("+") ? startDate : `${startDate}:00+05:30`;
  const d = new Date(iso).getTime() - Date.now();
  if (d < 0) return null;
  return { days: Math.floor(d/86400000), hours: Math.floor((d%86400000)/3600000), minutes: Math.floor((d%3600000)/60000), seconds: Math.floor((d%60000)/1000) };
};
const CountdownTimer = ({ startDate }: { startDate: string }) => {
  const [t, setT] = useState(() => getTimeLeft(startDate));
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(startDate)), 1000);
    return () => clearInterval(id);
  }, [startDate]);
  if (!t) return (
    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md"
      style={{ background: "rgba(255,195,0,0.1)", border: "1px solid rgba(255,195,0,0.35)" }}>
      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
      <span className="font-display font-bold text-base sm:text-xl text-primary whitespace-nowrap">The League Has Started!</span>
    </div>
  );
  const units = [["Days", t.days], ["Hours", t.hours], ["Mins", t.minutes], ["Secs", t.seconds]] as const;
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 sm:mb-5 justify-center">
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-primary/70 uppercase">Tournament Begins In</span>
      </div>
      <div className="flex items-end gap-1.5 sm:gap-2 justify-center">
        {units.map(([label, val]) => (
          <div key={label} className="flex flex-col items-center gap-1 sm:gap-1.5">
            <div className="relative w-[52px] xs:w-[58px] sm:w-[72px] md:w-[80px] h-[56px] xs:h-[64px] sm:h-[80px] md:h-[88px] rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl" style={{ background: "linear-gradient(160deg,rgba(0,29,61,0.9),rgba(0,8,20,0.95))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,195,0,0.25)" }} />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
              <div className="absolute top-1/2 inset-x-0 h-px bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span key={val} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className="font-display font-bold text-xl xs:text-2xl sm:text-3xl md:text-[2.4rem] text-white leading-none"
                  style={{ textShadow: "0 0 20px rgba(255,195,0,0.6)" }}>
                  {val.toString().padStart(2, "0")}
                </motion.span>
              </div>
            </div>
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-white/40 uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Global bg ── */
const GlobalBg = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full">
    <div className="absolute inset-0 w-full" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,53,102,0.4) 0%, transparent 70%)" }} />
    <div className="absolute inset-0 w-full opacity-[0.035]"
      style={{ backgroundImage: "linear-gradient(rgba(255,195,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,195,0,1) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
    <div className="absolute top-[8%] left-[3%] w-[250px] sm:w-[400px] md:w-[700px] h-[250px] sm:h-[400px] md:h-[700px] rounded-full animate-blob"
      style={{ background: "radial-gradient(circle,rgba(255,195,0,0.07) 0%,transparent 70%)", filter: "blur(70px)" }} />
    <div className="absolute top-[35%] right-[-10%] w-[200px] sm:w-[300px] md:w-[600px] h-[200px] sm:h-[300px] md:h-[600px] rounded-full animate-blob"
      style={{ background: "radial-gradient(circle,rgba(30,80,200,0.09) 0%,transparent 70%)", filter: "blur(90px)", animationDelay: "3s" }} />
    <div className="absolute inset-x-0 h-[1px] opacity-[0.07] w-full"
      style={{ background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.9),transparent)", animation: "scan 8s linear infinite" }} />
  </div>
);

/* ── Section label ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 sm:mb-4"
    style={{ background: "rgba(255,195,0,0.08)", border: "1px solid rgba(255,195,0,0.2)" }}>
    <Flame className="w-3 h-3 text-primary" />
    <span className="text-[10px] font-bold tracking-[0.25em] text-primary/80 uppercase">{children}</span>
  </div>
);

/* ── Neon divider ── */
const NeonDivider = () => (
  <div className="relative h-px w-full overflow-visible pointer-events-none">
    <div className="absolute inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.15) 20%,rgba(255,195,0,0.5) 50%,rgba(255,195,0,0.15) 80%,transparent)" }} />
    <div className="absolute left-1/2 -translate-x-1/2 -top-[5px] w-2.5 h-2.5 rounded-full"
      style={{ background: "#ffc300", boxShadow: "0 0 12px rgba(255,195,0,0.9)" }} />
  </div>
);

export default function Home() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const featuredMatches = allMatches.slice(0, 4);
  const liveMatch = allMatches.find(m => m.status === "LIVE");

  const highlights = useMemo(() => ({
    matchesPlayed: allMatches.filter(m => m.status === "COMPLETED").length,
    totalPointsScored: allMatches.filter(m => m.status === "COMPLETED").reduce((s, m) => s + (m.scoreA ?? 0) + (m.scoreB ?? 0), 0),
    activeTeams: new Set(allMatches.flatMap(m => [m.teamA.id, m.teamB.id])).size,
    avgPointsMatch: (() => {
      const completed = allMatches.filter(m => m.status === "COMPLETED");
      if (!completed.length) return 0;
      const total = completed.reduce((s, m) => s + (m.scoreA ?? 0) + (m.scoreB ?? 0), 0);
      return Math.round(total / completed.length);
    })(),
  }), [allMatches]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const logoY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [settings, setSettings] = useState({
    leagueStartDate: "2026-04-03T00:00",
    leagueEndDate: "2026-04-05T00:00",
    leagueVenue: "Parade Ground, IIEST Shibpur",
  });

  useEffect(() => {
    fetchSettings().then(s => setSettings(prev => ({ ...prev, ...s })));
    fetchMatches().then(m => setAllMatches(m));
    fetchTeams().then(t => setTeams(t));
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden w-full">
      <GlobalBg />
      <Particles />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden z-10 w-full">
        <div className="absolute inset-0 w-full">
          <img src="/images/stadium-bg.png" alt="" className="w-full h-full object-cover opacity-10 mix-blend-luminosity absolute inset-0" />
          <div className="absolute inset-0 w-full" style={{ background: "linear-gradient(to bottom,rgba(0,8,20,0.3) 0%,rgba(0,8,20,0.6) 50%,rgba(0,8,20,1) 100%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">

            {/* Left — text */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
              className="flex-1 w-full max-w-2xl text-center lg:text-left overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 sm:mb-8 backdrop-blur-sm"
                style={{ background: "rgba(255,195,0,0.07)", border: "1px solid rgba(255,195,0,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-fast" />
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.25em] text-primary/70 uppercase">Season 2026 · Inaugural Edition</span>
              </div>

              <div className="flex items-end gap-2 xs:gap-3 sm:gap-6 mb-3 justify-center lg:justify-start">
                <motion.h1
                  initial={{ opacity: 0, y: 60, skewY: 3 }}
                  animate={{ opacity: 1, y: 0, skewY: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl xs:text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-display font-bold leading-none text-white tracking-tight animate-flicker"
                  style={{ textShadow: "0 0 80px rgba(255,195,0,0.3)" }}>IKKL</motion.h1>
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }} className="mb-1 xs:mb-2 sm:mb-5">
                  <div className="px-2 xs:px-2.5 sm:px-4 py-0.5 xs:py-1 sm:py-2 rounded-lg xs:rounded-xl font-display font-black text-lg xs:text-xl sm:text-3xl md:text-4xl text-[#000814] leading-none tracking-wider"
                    style={{ background: "linear-gradient(135deg,#ffc300,#ffd60a)", boxShadow: "0 0 30px rgba(255,195,0,0.6)" }}>1.0</div>
                </motion.div>
              </div>

              <h2 className="text-lg xs:text-xl sm:text-3xl md:text-4xl font-display font-semibold text-white/80 mb-4 sm:mb-6 tracking-wide px-2 sm:px-0">
                IIEST <span className="text-primary font-bold" style={{ textShadow: "0 0 20px rgba(255,195,0,0.4)" }}>Kho-Kho</span> League
              </h2>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white/50 mb-4 sm:mb-5 font-light leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Speed. Strategy. Spirit. Witness the ultimate test of endurance as the top college teams clash for glory.
              </p>

              {/* Mobile logo — after description, before date/venue */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="lg:hidden flex items-center justify-center relative mx-auto mb-4 sm:mb-6"
                style={{ width: 180, height: 180 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute rounded-full pointer-events-none" style={{ inset: 0, border: "1px solid rgba(255,195,0,0.15)" }}>
                  <div className="absolute w-2.5 h-2.5 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ background: "rgba(255,195,0,0.7)", boxShadow: "0 0 8px rgba(255,195,0,0.9)" }} />
                </motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute rounded-full pointer-events-none" style={{ inset: "24px", border: "1px dashed rgba(255,195,0,0.2)" }}>
                  <div className="absolute w-1.5 h-1.5 rounded-full bottom-0 right-0 translate-x-1/2 translate-y-1/2"
                    style={{ background: "rgba(255,195,0,0.5)", boxShadow: "0 0 6px rgba(255,195,0,0.7)" }} />
                </motion.div>
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle,rgba(255,195,0,0.12) 0%,transparent 65%)", filter: "blur(16px)" }} />
                <motion.img src="/images/ikkl-logo.webp" alt="IKKL Logo"
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 object-contain relative z-10"
                  style={{ filter: "drop-shadow(0 0 30px rgba(255,195,0,0.5))" }} />
              </motion.div>
              <p className="text-white/50 font-medium mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs sm:text-sm justify-center lg:justify-start px-2 sm:px-0">
                <span className="flex items-center gap-2 justify-center lg:justify-start">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{(() => {
                    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    const [sy, sm, sd] = settings.leagueStartDate.split("T")[0].split("-").map(Number);
                    const [, , ed] = settings.leagueEndDate.split("T")[0].split("-").map(Number);
                    return `${sd} – ${ed} ${months[sm - 1]} ${sy}`;
                  })()}</span>
                </span>
                <span className="hidden sm:inline text-white/20">|</span>
                <span className="flex items-center gap-2 justify-center lg:justify-start">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{settings.leagueVenue}</span>
                </span>
              </p>

              <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-4 justify-center lg:justify-start px-2 sm:px-0">
                <Link href="/schedule"
                  className="px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-full font-display font-black text-xs xs:text-sm sm:text-base tracking-wider text-[#000814] transition-all outline-none hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#ffc300,#ffd60a)", boxShadow: "0 0 30px rgba(255,195,0,0.4)" }}>
                  VIEW SCHEDULE
                </Link>
                <Link href="/scores"
                  className="px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-full font-display font-bold text-xs xs:text-sm sm:text-base tracking-wider text-white transition-all outline-none backdrop-blur-md flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <Activity className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-primary" /> LIVE SCORES
                </Link>
              </div>

              {/* Live pill — only show if there's a live match */}
              {liveMatch && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 xs:gap-2 sm:gap-3 px-2.5 xs:px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl xs:rounded-2xl backdrop-blur-md max-w-full"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse-fast shrink-0" />
                <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-red-400 tracking-wider uppercase">Live</span>
                <span className="text-white/20 text-xs shrink-0">·</span>
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-white/50 truncate">
                  {liveMatch.teamA.shortName} <span className="text-white font-bold">{liveMatch.scoreA}</span>
                  {" – "}
                  <span className="text-white font-bold">{liveMatch.scoreB}</span> {liveMatch.teamB.shortName}
                </span>
                <Link href="/scores" className="text-[9px] xs:text-[10px] font-bold text-primary tracking-wider uppercase shrink-0">Watch →</Link>
              </motion.div>
              )}

              {/* Countdown on mobile (shown below live pill, hidden on lg+) */}
              <div className="lg:hidden mt-4">
                <CountdownTimer startDate={settings.leagueStartDate} />
              </div>
            </motion.div>

            {/* Right — logo + countdown (hidden on mobile, shown lg+) */}
            <motion.div initial={{ opacity: 0, scale: 0.8, x: 60 }} animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
              className="hidden lg:flex flex-col items-center justify-center shrink-0 gap-6 w-[280px] lg:w-[320px] xl:w-[340px]">

              {/* Logo ring */}
              <div className="relative flex items-center justify-center w-[280px] lg:w-[320px] xl:w-[340px] h-[260px] lg:h-[300px] xl:h-[320px]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute rounded-full pointer-events-none" style={{ inset: 0, border: "1px solid rgba(255,195,0,0.12)" }}>
                  <div className="absolute w-3 h-3 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ background: "rgba(255,195,0,0.6)", boxShadow: "0 0 8px rgba(255,195,0,0.8)" }} />
                </motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute rounded-full pointer-events-none" style={{ inset: "40px", border: "1px dashed rgba(255,195,0,0.18)" }}>
                  <div className="absolute w-2 h-2 rounded-full bottom-0 right-0 translate-x-1/2 translate-y-1/2"
                    style={{ background: "rgba(255,195,0,0.4)", boxShadow: "0 0 6px rgba(255,195,0,0.6)" }} />
                </motion.div>
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle,rgba(255,195,0,0.1) 0%,transparent 65%)", filter: "blur(20px)" }} />
                <motion.div style={{ y: logoY, opacity: logoOpacity }}
                  animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10">
                  <img src="/images/ikkl-logo.webp" alt="IKKL Logo" className="w-40 lg:w-48 xl:w-52 h-40 lg:h-48 xl:h-52 object-contain"
                    style={{ filter: "drop-shadow(0 0 40px rgba(255,195,0,0.45))" }} />
                </motion.div>
              </div>

              {/* Countdown / League Started below logo */}
              <CountdownTimer startDate={settings.leagueStartDate} />
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[9px] sm:text-[10px] tracking-[0.3em] text-primary/30 uppercase">Scroll</span>
          <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-primary/40 to-transparent" />
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <NeonDivider />
      <div className="relative z-10 py-4 sm:py-5 overflow-hidden w-full" style={{ background: "rgba(0,8,20,0.5)", backdropFilter: "blur(10px)" }}>
        {teams.length === 0 ? (
          <p className="text-center text-white/25 text-xs tracking-widest uppercase">No teams yet</p>
        ) : (
          <div className="flex gap-0 w-max" style={{ animation: "marquee 20s linear infinite" }}>
            {[...Array(3)].map((_, rep) =>
              teams.map((t, i) => (
                <div key={`${rep}-${i}`} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 shrink-0">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary opacity-60" />
                  <span className="font-display font-bold text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.15em] text-white/30 uppercase whitespace-nowrap">{t.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <NeonDivider />

      {/* ── ABOUT ── */}
      <section className="py-10 sm:py-14 relative z-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <SectionLabel>About the League</SectionLabel>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
                About <span className="text-primary" style={{ textShadow: "0 0 30px rgba(255,195,0,0.4)" }}>IKKL 1.0</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/55 leading-relaxed mb-6 sm:mb-8">
                IKKL – IIEST Kho-Kho League is the premier inter-college Kho-Kho tournament hosted at IIEST Shibpur, Howrah. Born from a passion for India's traditional sport, IKKL 1.0 brings together elite college teams in a high-energy format that celebrates speed, strategy, and team spirit at its finest.
              </p>
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl backdrop-blur-md"
                style={{ background: "linear-gradient(135deg,rgba(0,29,61,0.6),rgba(0,8,20,0.4))", border: "1px solid rgba(255,195,0,0.15)" }}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,195,0,0.15)", border: "1px solid rgba(255,195,0,0.3)" }}>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-primary font-display font-bold tracking-widest uppercase text-xs sm:text-sm">IKKL 1.0</p>
                  <p className="text-white/40 text-[10px] sm:text-xs mt-0.5">Inaugural Season</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-3 sm:gap-4">
              {([
                { icon: Users, title: "8 Teams", sub: "Top college squads", color: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
                { icon: Calendar, title: "3–5 April", sub: "League matchdays", color: "rgba(255,195,0,0.1)", border: "rgba(255,195,0,0.25)" },
                { icon: MapPin, title: "Parade Ground", sub: "IIEST Shibpur", color: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
                { icon: null as React.ElementType | null, title: "IKKL 1.0", sub: "Inaugural edition", color: "rgba(255,195,0,0.08)", border: "rgba(255,195,0,0.2)" },
              ]).map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="group relative p-4 sm:p-6 rounded-2xl overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "linear-gradient(135deg,rgba(0,29,61,0.5),rgba(0,8,20,0.7))", border: `1px solid ${item.border}`, backdropFilter: "blur(16px)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 30%,${item.color},transparent 70%)` }} />
                  {item.icon
                    ? <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 relative transition-transform group-hover:scale-110"
                        style={{ background: item.color, border: `1px solid ${item.border}` }}>
                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
                      </div>
                    : <img src="/images/ikkl-logo.webp" alt="IKKL" className="w-10 h-10 sm:w-14 sm:h-14 object-contain mb-3 sm:mb-4 transition-transform group-hover:scale-110"
                        style={{ filter: "drop-shadow(0 0 10px rgba(255,195,0,0.4))" }} />
                  }
                  <h3 className="text-base sm:text-xl font-display font-bold text-white mb-0.5 sm:mb-1">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-white/40">{item.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURED MATCHES ── */}
      <section className="py-10 sm:py-14 relative z-10 overflow-hidden w-full">
        <div className="absolute top-0 inset-x-0 h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.15),transparent)" }} />
        <div className="absolute inset-0 pointer-events-none w-full"
          style={{ background: "linear-gradient(180deg,rgba(0,29,61,0.15) 0%,rgba(0,8,20,0.4) 50%,rgba(0,29,61,0.1) 100%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-end mb-8 sm:mb-14">
            <div>
              <SectionLabel>This Week</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white">
                Featured <span className="text-primary" style={{ textShadow: "0 0 20px rgba(255,195,0,0.3)" }}>Matches</span>
              </h2>
              <div className="mt-2 sm:mt-3 h-0.5 w-24 sm:w-32" style={{ background: "linear-gradient(90deg,#ffc300,transparent)" }} />
            </div>
            <Link href="/schedule" className="hidden sm:flex items-center gap-2 text-primary font-display font-semibold tracking-wider hover:text-white transition-colors group outline-none text-sm">
              VIEW ALL <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {/* Mobile: horizontal scroll showing 1.3 cards; desktop: grid */}
          {featuredMatches.length === 0 ? (
            <div className="py-10 text-center rounded-2xl" style={{ background: "rgba(0,29,61,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/40 text-sm">No matches scheduled yet.</p>
            </div>
          ) : (
          <>
          <div className="sm:hidden -mx-4 flex pb-2"
            style={{ scrollbarWidth: "none", overflowX: "auto", overflowY: "hidden", paddingLeft: "1rem", paddingRight: "1rem" }}>
            {featuredMatches.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                className="shrink-0 mr-3"
                style={{ width: "76vw", maxWidth: 300 }}>
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredMatches.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
          </>
          )}
          <div className="mt-6 sm:hidden">
            <Link href="/schedule" className="flex items-center justify-center gap-2 py-3 rounded-xl text-primary font-display font-semibold tracking-wider text-sm"
              style={{ background: "rgba(255,195,0,0.06)", border: "1px solid rgba(255,195,0,0.15)" }}>
              VIEW ALL MATCHES <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 sm:py-14 relative z-10 w-full overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.15),transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[800px] h-[200px] sm:h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(255,195,0,0.05) 0%,transparent 70%)", filter: "blur(40px)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-6 sm:mb-8">
            <SectionLabel>Season 2026</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white">
              Season <span className="text-primary" style={{ textShadow: "0 0 20px rgba(255,195,0,0.3)" }}>Highlights</span>
            </h2>
            <div className="w-20 sm:w-24 h-0.5 mx-auto mt-3 sm:mt-4" style={{ background: "linear-gradient(90deg,transparent,#ffc300,transparent)" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <AnimatedCounter value={highlights.matchesPlayed} label="Matches Played" />
            <AnimatedCounter value={highlights.totalPointsScored} label="Total Points" />
            <AnimatedCounter value={highlights.activeTeams} label="Active Teams" />
            <AnimatedCounter value={highlights.avgPointsMatch} label="Avg Pts/Match" />
          </div>
        </div>
      </section>

      {/* ── ORGANIZERS ── */}
      <section className="py-12 sm:py-16 relative z-10 overflow-hidden w-full">
        <div className="absolute top-0 inset-x-0 h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,195,0,0.25),transparent)" }} />
        <div className="absolute inset-0 pointer-events-none w-full" style={{ background: "linear-gradient(180deg,rgba(0,8,20,0) 0%,rgba(0,20,50,0.25) 50%,rgba(0,8,20,0) 100%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[900px] h-[300px] sm:h-[500px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(255,195,0,0.07) 0%,transparent 60%)", filter: "blur(80px)" }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-8 sm:mb-10">
            <SectionLabel>The People</SectionLabel>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-white mb-2 sm:mb-3">
              Meet the <span className="text-primary" style={{ textShadow: "0 0 40px rgba(255,195,0,0.5)" }}>Team</span>
            </h2>
            <p className="text-white/30 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase font-medium">The people behind IKKL 1.0</p>
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.8 }}
              className="w-24 sm:w-32 h-0.5 mx-auto mt-4 sm:mt-5" style={{ background: "linear-gradient(90deg,transparent,#ffc300,transparent)" }} />
          </motion.div>

          {/* Cards — stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 sm:gap-4 lg:gap-4 w-full max-w-full">

            {/* LEFT — Abhishek */}
            <motion.div initial={{ opacity: 0, x: -40, y: 20 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 60, damping: 20 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="w-full sm:w-64 lg:w-72 cursor-pointer group">
              <div className="relative rounded-2xl overflow-hidden"
                style={{ background: "linear-gradient(150deg,rgba(0,22,55,0.85),rgba(0,8,20,0.95))", backdropFilter: "blur(20px)", border: "1px solid rgba(59,130,246,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,rgba(59,130,246,0.8),rgba(99,102,241,0.5))" }} />
                <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4 sm:gap-5">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,rgba(0,40,100,0.9),rgba(0,20,60,0.8))", border: "1px solid rgba(59,130,246,0.35)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                      <span className="font-display font-black text-2xl sm:text-3xl" style={{ color: "rgba(147,197,253,0.8)" }}>AD</span>
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-white mb-1">Abhishek Dahiya</h3>
                    <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase mb-2 sm:mb-3" style={{ color: "rgba(147,197,253,0.7)" }}>Main Coordinator</p>
                    <p className="text-[11px] sm:text-xs text-white/30 leading-relaxed">Coordinating the inaugural edition of IKKL with passion and precision.</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 w-full justify-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(147,197,253,0.5)" }} />
                    <span className="text-[9px] sm:text-[10px] text-white/20 tracking-wider">IKKL 1.0 · IIEST Shibpur</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CENTER — Yashkumar */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.92 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 65, damping: 16 }}
              whileHover={{ y: -12, transition: { duration: 0.3 } }}
              className="w-full sm:w-[280px] lg:w-[300px] cursor-pointer relative z-10 sm:-mb-6 lg:-mb-8">
              <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
                className="absolute -inset-4 sm:-inset-6 rounded-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(255,195,0,0.15),transparent 65%)", filter: "blur(24px)" }} />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -inset-[1.5px] rounded-2xl pointer-events-none"
                style={{ background: "linear-gradient(135deg,rgba(255,195,0,0.8),rgba(255,195,0,0.1),rgba(255,214,10,0.7),rgba(255,195,0,0.1),rgba(255,195,0,0.8))", borderRadius: "1rem" }} />
              <div className="relative rounded-2xl overflow-hidden"
                style={{ background: "linear-gradient(160deg,rgba(0,22,58,0.98),rgba(0,8,20,1))", backdropFilter: "blur(32px)", boxShadow: "0 40px 100px rgba(0,0,0,0.8),0 0 60px rgba(255,195,0,0.1)" }}>
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,rgba(255,195,0,0.4),rgba(255,195,0,1),rgba(255,195,0,0.4))" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(255,195,0,0.07),transparent 50%)" }} />
                <div className="p-7 sm:p-10 flex flex-col items-center text-center gap-5 sm:gap-6">
                  <div className="relative flex items-center justify-center" style={{ width: "112px", height: "112px" }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute rounded-full pointer-events-none"
                      style={{ inset: "-18px", border: "1px dashed rgba(255,195,0,0.3)" }} />
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="relative">
                      <div className="absolute -inset-2 rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle,rgba(255,195,0,0.2),transparent 70%)", filter: "blur(10px)" }} />
                      <div className="w-28 h-28 rounded-full flex items-center justify-center relative"
                        style={{ background: "linear-gradient(135deg,rgba(0,40,110,0.95),rgba(0,60,150,0.75))", border: "2px solid rgba(255,195,0,0.6)", boxShadow: "0 0 40px rgba(255,195,0,0.3)" }}>
                        <span className="font-display font-black text-4xl sm:text-5xl text-primary" style={{ textShadow: "0 0 24px rgba(255,195,0,0.7)" }}>YS</span>
                      </div>
                    </motion.div>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 sm:mb-3"
                      style={{ background: "rgba(255,195,0,0.1)", border: "1px solid rgba(255,195,0,0.2)" }}>
                      <Star className="w-3 h-3 text-primary" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Chief Organizer</span>
                    </div>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-1 sm:mb-2">Yashkumar Senma</h3>
                    <p className="text-[11px] sm:text-xs text-white/30 leading-relaxed">Visionary behind IKKL 1.0 — bringing the spirit of Kho-Kho to IIEST Shibpur.</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 sm:pt-3 w-full justify-center" style={{ borderTop: "1px solid rgba(255,195,0,0.1)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] sm:text-[10px] text-white/25 tracking-wider">IKKL 1.0 · IIEST Shibpur</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Tejas */}
            <motion.div initial={{ opacity: 0, x: 40, y: 20 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 60, damping: 20 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="w-full sm:w-64 lg:w-72 cursor-pointer group">
              <div className="relative rounded-2xl overflow-hidden"
                style={{ background: "linear-gradient(150deg,rgba(0,22,55,0.85),rgba(0,8,20,0.95))", backdropFilter: "blur(20px)", border: "1px solid rgba(168,85,247,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,rgba(168,85,247,0.8),rgba(99,102,241,0.5))" }} />
                <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4 sm:gap-5">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,rgba(40,0,80,0.9),rgba(20,0,50,0.8))", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                      <span className="font-display font-black text-2xl sm:text-3xl" style={{ color: "rgba(196,181,253,0.8)" }}>TP</span>
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-white mb-1">Tejas Pawar</h3>
                    <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase mb-2 sm:mb-3" style={{ color: "rgba(196,181,253,0.7)" }}>Website Developer</p>
                    <p className="text-[11px] sm:text-xs text-white/30 leading-relaxed">Designed and built the official IKKL platform from the ground up.</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 w-full justify-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(196,181,253,0.5)" }} />
                    <span className="text-[9px] sm:text-[10px] text-white/20 tracking-wider">IKKL 1.0 · IIEST Shibpur</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}

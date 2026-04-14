import { Link } from "wouter";
import { Instagram, Youtube, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#000814]/90 border-t border-[#003566] pt-16 pb-8 mt-24 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5 group w-fit outline-none">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg"
                style={{ border: "1px solid rgba(255,195,0,0.25)", boxShadow: "0 0 20px rgba(255,195,0,0.1)" }}>
                <img src="/images/ikkl-logo.webp" alt="IKKL Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-3xl tracking-[0.15em] text-white group-hover:text-primary transition-colors"
                  style={{ textShadow: "0 0 20px rgba(255,195,0,0.25)" }}>
                  IKKL <sup className="text-[0.45em] text-primary/70 font-bold">1.0</sup>
                </span>
                <span className="text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase mt-0.5">Kho-Kho League</span>
              </div>
            </Link>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              IIEST Kho-Kho League. Experience the speed, strategy, and unyielding spirit of the greatest traditional sport at the highest competitive level.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Youtube].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/60 hover:text-primary transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold tracking-wider text-white mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[["Home", "/"], ["Schedule", "/schedule"], ["Live Scores", "/scores"], ["Points Table", "/points-table"]].map(([label, href]) => (
                <li key={href}><Link href={href} className="text-sm text-white/60 hover:text-primary transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold tracking-wider text-white mb-4">Event Info</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="text-primary font-medium">3–5 April 2026</li>
              <li>Parade Ground, IIEST Shibpur</li>
              <li>Howrah, West Bengal</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[#003566]/50 text-center text-xs text-white/30">
          © 2026 IKKL – IIEST Kho-Kho League. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

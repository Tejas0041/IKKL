import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, Activity, Users, Trophy, Settings, Menu, X } from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/matches", icon: Calendar, label: "Matches" },
  { href: "/live", icon: Activity, label: "Live Control" },
  { href: "/teams", icon: Users, label: "Teams" },
  { href: "/points", icon: Trophy, label: "Points Table" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function NavLinks({ onNav }: { onNav?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {links.map(({ href, icon: Icon, label }) => {
        const active = location === href;
        return (
          <Link key={href} href={href}>
            <div onClick={onNav}
              className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium",
                active ? "text-[#000814]" : "hover:bg-white/5")}
              style={active ? { background: "var(--primary)", color: "#000814" } : { color: "var(--text-muted)" }}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNav }: { onNav?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-dim)", border: "1px solid rgba(255,195,0,0.3)" }}>
            <Trophy className="w-4 h-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-widest" style={{ color: "var(--primary)" }}>IKKL</span>
            <span className="text-xs block" style={{ color: "var(--text-muted)", marginTop: "-2px" }}>Admin Panel</span>
          </div>
        </div>
      </div>
      <NavLinks onNav={onNav} />
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--surface2)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>AD</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Admin</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>IKKL 1.0</p>
          </div>
          <button onClick={() => { localStorage.removeItem("ikkl_token"); window.location.reload(); }}
            className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }} title="Sign out">
            ⏻
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col border-r" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-dim)", border: "1px solid rgba(255,195,0,0.3)" }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          </div>
          <span className="font-display font-bold text-lg tracking-widest" style={{ color: "var(--primary)" }}>IKKL</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Admin</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)} />
          <div className="relative w-72 h-full flex flex-col border-r" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onNav={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

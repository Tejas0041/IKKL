import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Matches from "@/pages/Matches";
import LiveControl from "@/pages/LiveControl";
import Teams from "@/pages/Teams";
import PointsTable from "@/pages/PointsTable";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("ikkl_token");
    if (!token) { setAuthed(false); return; }
    // Verify token is still valid
    fetch((import.meta.env.VITE_API_URL || "http://localhost:3000/api") + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (r.ok) setAuthed(true);
      else { localStorage.removeItem("ikkl_token"); setAuthed(false); }
    }).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0" style={{ background: "var(--bg)" }}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/matches" component={Matches} />
              <Route path="/live" component={LiveControl} />
              <Route path="/teams" component={Teams} />
              <Route path="/points" component={PointsTable} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </main>
        </div>
      </AuthGuard>
    </QueryClientProvider>
  );
}

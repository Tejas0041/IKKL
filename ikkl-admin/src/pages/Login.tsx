import { useState } from "react";
import { api } from "@/lib/api";
import { Trophy } from "lucide-react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await api.login(email, password);
      localStorage.setItem("ikkl_token", token);
      onLogin();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--primary-dim)", border: "1px solid rgba(255,195,0,0.3)" }}>
            <Trophy className="w-7 h-7" style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-widest" style={{ color: "var(--primary)" }}>IKKL</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Admin Panel</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Email</label>
            <input
              className="input"
              type="email"
              placeholder="admin@ikkl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

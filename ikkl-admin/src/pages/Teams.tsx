import { useEffect, useRef, useState } from "react";
import type { Team } from "@/lib/types";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { api } from "@/lib/api";

const EMPTY = { name: "", shortName: "", color: "#3b82f6", logo: "" };

export default function Teams() {
  const [teams, setTeams] = useState<(Team & { logo?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<(Team & { logo?: string }) | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.getTeams().then(d => setTeams(d as (Team & { logo?: string })[])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setPreview(""); setShowModal(true); };
  const openEdit = (t: Team & { logo?: string }) => {
    setEditing(t);
    setForm({ name: t.name, shortName: t.shortName, color: t.color, logo: t.logo || "" });
    setPreview(t.logo || "");
    setShowModal(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      setForm(f => ({ ...f, logo: url }));
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
      setPreview(form.logo);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.shortName) return;
    try {
      if (editing) await api.updateTeam(editing.id, form);
      else await api.createTeam(form);
      setShowModal(false);
      load();
    } catch (e) { alert("Failed: " + (e as Error).message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    try { await api.deleteTeam(id); load(); }
    catch (e) { alert("Failed: " + (e as Error).message); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: "var(--text)" }}>Teams</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{teams.length} teams registered</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add Team</button>
      </div>

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : teams.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display font-bold text-xl mb-2" style={{ color: "var(--text)" }}>No Teams Yet</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Click "+ Add Team" to register the first team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teams.map(t => (
            <div key={t.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg text-white overflow-hidden shrink-0"
                  style={{ background: t.logo ? "transparent" : t.color }}>
                  {t.logo
                    ? <img src={t.logo} alt={t.name} className="w-full h-full object-contain" />
                    : t.shortName}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(t.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div>
                <p className="font-display font-bold text-lg leading-tight" style={{ color: "var(--text)" }}>{t.name}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>{t.shortName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold" style={{ color: "var(--text)" }}>{editing ? "Edit Team" : "Add Team"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-white/10" style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Thunderbolts" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Short Name (3–4 letters)</label>
                <input className="input" value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value.toUpperCase() }))} placeholder="THU" maxLength={4} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Team Logo</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                    {preview
                      ? <img src={preview} alt="logo" className="w-full h-full object-contain" />
                      : <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{form.shortName || "LOGO"}</span>}
                  </div>
                  <div className="flex-1">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="btn-ghost flex items-center gap-2 w-full justify-center text-sm"
                      disabled={uploading}>
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading…" : preview ? "Change Logo" : "Upload Logo"}
                    </button>
                    <p className="text-[10px] mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>PNG, JPG, SVG · max 5MB</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>{editing ? "Save Changes" : "Create Team"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

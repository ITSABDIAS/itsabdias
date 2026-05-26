import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User as UserIcon, Save, Shield } from "lucide-react";
import { RankBadge, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { RankGuide } from "@/components/RankGuide";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil — ItsaBDias" },
      { name: "description", content: "Edita tu perfil de la comunidad ItsaBDias." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [roles, setRoles] = useState<RankSlug[]>([]);
  const isStaff = roles.includes("admin") || roles.includes("founder");
  const sortedRoles = [...roles].sort((a, b) => RANK_PRIORITY.indexOf(a) - RANK_PRIORITY.indexOf(b));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activitySec, setActivitySec] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [aiProjectCount, setAiProjectCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const [{ data: profile }, { data: roles }, { data: activity }, { count: pCount }, { count: aiCount }] = await Promise.all([
        supabase.from("profiles").select("username, bio, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("user_activity").select("total_seconds").eq("user_id", user.id).maybeSingle(),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("category", "IA"),
      ]);
      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }
      setRoles((roles ?? []).map((r: any) => r.role));
      setActivitySec((activity as any)?.total_seconds ?? 0);
      setProjectCount(pCount ?? 0);
      setAiProjectCount(aiCount ?? 0);
      setLoading(false);
    })();
  }, [user, authLoading, nav]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username.trim()) return toast.error("El nombre de usuario es obligatorio");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), bio: bio.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil actualizado");
  };

  if (loading) {
    return (
      <PageShell>
        <section className="py-32 px-6 text-center text-muted-foreground">Cargando perfil...</section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// user.profile" title="Mi perfil" subtitle="Actualiza cómo te ve la comunidad." />

        <div className="mx-auto max-w-2xl glass rounded-2xl p-8 neon-border">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-20 w-20 rounded-full bg-gradient-neon flex items-center justify-center overflow-hidden shadow-neon-purple">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl font-bold truncate">{username || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              {sortedRoles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sortedRoles.map((r) => (
                    <RankBadge key={r} slug={r} size="sm" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Nombre de usuario</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={40}
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">URL del avatar (opcional)</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Biografía</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={300}
                placeholder="Cuéntale a la comunidad sobre ti..."
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple hover:shadow-neon-blue transition-all disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              {isStaff && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 font-semibold text-sm"
                >
                  <Shield className="h-4 w-4" /> Panel admin
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Rank progression panel */}
        <div className="mx-auto max-w-2xl mt-8 glass rounded-2xl p-6 border border-neon-cyan/30 shadow-neon-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold tracking-wide">
              <span className="text-neon-cyan">//</span> progreso de rangos
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">auto-unlock</span>
          </div>

          {(() => {
            const memberUnlocked = roles.includes("member");
            const devUnlocked = roles.includes("developer");
            const aiUnlocked = roles.includes("ai_expert");
            const actPct = Math.min(100, Math.round((activitySec / 1800) * 100));
            const devPct = Math.min(100, Math.round((projectCount / 5) * 100));
            const aiPct = Math.min(100, Math.round((aiProjectCount / 3) * 100));
            const mins = Math.floor(activitySec / 60);
            const secs = activitySec % 60;
            return (
              <div className="space-y-5">
                {/* Member */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <RankBadge slug="member" size="xs" />
                      <span className="text-muted-foreground">30 min de actividad</span>
                    </div>
                    <span className={`font-mono ${memberUnlocked ? "text-neon-green" : "text-neon-cyan"}`}>
                      {memberUnlocked ? "DESBLOQUEADO" : `${mins}m ${secs}s / 30m`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-input/40 overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a855f7] transition-all"
                      style={{ width: `${memberUnlocked ? 100 : actPct}%`, boxShadow: "0 0 12px #22d3ee88" }}
                    />
                  </div>
                </div>

                {/* Developer */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <RankBadge slug="developer" size="xs" />
                      <span className="text-muted-foreground">5 proyectos creados</span>
                    </div>
                    <span className={`font-mono ${devUnlocked ? "text-neon-green" : "text-neon-cyan"}`}>
                      {devUnlocked ? "DESBLOQUEADO" : `${projectCount} / 5`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-input/40 overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] transition-all"
                      style={{ width: `${devUnlocked ? 100 : devPct}%`, boxShadow: "0 0 12px #22d3ee88" }}
                    />
                  </div>
                </div>

                {/* Experto IA */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <RankBadge slug="ai_expert" size="xs" />
                      <span className="text-muted-foreground">3 proyectos de categoría IA</span>
                    </div>
                    <span className={`font-mono ${aiUnlocked ? "text-neon-green" : "text-neon-cyan"}`}>
                      {aiUnlocked ? "DESBLOQUEADO" : `${aiProjectCount} / 3`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-input/40 overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-[#10b981] to-[#22d3ee] transition-all"
                      style={{ width: `${aiUnlocked ? 100 : aiPct}%`, boxShadow: "0 0 12px #10b98188" }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Rank guide / how to unlock */}
        <div className="mx-auto max-w-4xl mt-8">
          <div className="flex items-end justify-between mb-4 px-1">
            <h3 className="font-display text-lg font-bold tracking-wide">
              <span className="text-neon-cyan">//</span> guía de rangos
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              cómo se desbloquea cada rango
            </span>
          </div>
          <RankGuide userRoles={roles} />
        </div>
      </section>
    </PageShell>
  );
}

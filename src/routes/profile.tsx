import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User as UserIcon, Save, Shield, Crown, Sparkles } from "lucide-react";

const RANK_META: Record<string, { label: string; color: string; Icon: any }> = {
  founder:   { label: "Founder",       color: "text-[#ff00aa] border-[#ff00aa]/50 bg-[#ff00aa]/10", Icon: Crown },
  admin:     { label: "Administrador", color: "text-neon-purple border-neon-purple/50 bg-neon-purple/10", Icon: Shield },
  moderator: { label: "Moderador",     color: "text-neon-blue border-neon-blue/50 bg-neon-blue/10", Icon: Shield },
  premium:   { label: "Premium",       color: "text-yellow-400 border-yellow-400/50 bg-yellow-400/10", Icon: Sparkles },
};
const RANK_PRIORITY = ["founder", "admin", "moderator", "premium"];

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
  const [roles, setRoles] = useState<string[]>([]);
  const isStaff = roles.includes("admin") || roles.includes("founder");
  const topRank = RANK_PRIORITY.find((r) => roles.includes(r));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("username, bio, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }
      setRoles((roles ?? []).map((r: any) => r.role));
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
            <div>
              <p className="font-display text-xl font-bold">{username || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {topRank && (() => {
                const meta = RANK_META[topRank];
                const Icon = meta.Icon;
                return (
                  <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${meta.color}`}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                );
              })()}
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
      </section>
    </PageShell>
  );
}

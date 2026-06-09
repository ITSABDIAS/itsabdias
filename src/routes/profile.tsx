import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User as UserIcon, Save, Shield, Pencil, X, ExternalLink, Upload, Loader2 } from "lucide-react";
import { RankBadge, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { RankGuide } from "@/components/RankGuide";
import { FollowersDialog } from "@/components/FollowersDialog";

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
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [roles, setRoles] = useState<RankSlug[]>([]);
  const isStaff = roles.includes("admin") || roles.includes("founder");
  const sortedRoles = [...roles].sort((a, b) => RANK_PRIORITY.indexOf(a) - RANK_PRIORITY.indexOf(b));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | "avatar" | "banner">(null);
  const [activitySec, setActivitySec] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [aiProjectCount, setAiProjectCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [dialog, setDialog] = useState<null | "followers" | "following">(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const [{ data: profile }, { data: rs }, { data: activity }, { count: pCount }, { count: aiCount }, projIds, { count: fwers }, { count: fwing }] = await Promise.all([
        supabase.from("profiles").select("username, bio, avatar_url, banner_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("user_activity").select("total_seconds").eq("user_id", user.id).maybeSingle(),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("category", "IA"),
        supabase.from("projects").select("id").eq("user_id", user.id),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setBannerUrl((profile as any).banner_url ?? "");
      }
      setRoles((rs ?? []).map((r: any) => r.role));
      setActivitySec((activity as any)?.total_seconds ?? 0);
      setProjectCount(pCount ?? 0);
      setAiProjectCount(aiCount ?? 0);
      setFollowers(fwers ?? 0);
      setFollowing(fwing ?? 0);
      const ids = (projIds.data ?? []).map((r: any) => r.id);
      if (ids.length) {
        const { count: lc } = await supabase
          .from("project_likes")
          .select("project_id", { count: "exact", head: true })
          .in("project_id", ids);
        setLikesCount(lc ?? 0);
      }
      setLoading(false);
    })();
  }, [user, authLoading, nav]);

  const handleUpload = async (file: File, kind: "avatar" | "banner") => {
    if (!user) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("Máximo 4 MB");
    setUploading(kind);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `profile/${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("project-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setUploading(null);
      return toast.error(error.message);
    }
    const { data: pub } = supabase.storage.from("project-images").getPublicUrl(path);
    if (kind === "avatar") setAvatarUrl(pub.publicUrl);
    else setBannerUrl(pub.publicUrl);
    setUploading(null);
    toast.success("Imagen cargada — recuerda guardar");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username.trim()) return toast.error("El nombre de usuario es obligatorio");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil actualizado");
    setEditing(false);
  };

  if (loading) {
    return (
      <PageShell>
        <section className="py-32 px-6 text-center text-muted-foreground">
          <Loader2 className="inline animate-spin" />
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Banner */}
      <div
        className="h-48 sm:h-64 w-full bg-gradient-to-br from-neon-purple/40 via-neon-blue/30 to-neon-cyan/40 relative overflow-hidden"
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <section className="pb-20 px-6">
        <div className="mx-auto max-w-3xl -mt-16 relative z-10">
          <div className="glass rounded-2xl p-6 sm:p-8 neon-border">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative -mt-20 shrink-0">
                <div className="h-28 w-28 rounded-full bg-gradient-neon flex items-center justify-center overflow-hidden shadow-neon-purple ring-4 ring-background">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-14 w-14 text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-gradient-neon">{username || "Sin nombre"}</h1>
                  {sortedRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sortedRoles.map((r) => <RankBadge key={r} slug={r} size="sm" />)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                {!editing && bio && <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{bio}</p>}
              </div>

              {!editing && (
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-semibold text-sm shadow-neon-purple"
                  >
                    <Pencil className="h-4 w-4" /> Editar perfil
                  </button>
                  {username && (
                    <Link
                      to="/u/$username"
                      params={{ username }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 text-sm"
                      title="Ver perfil público"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Proyectos" value={projectCount} />
              <Stat label="Likes" value={likesCount} />
              <Stat label="Seguidores" value={followers} onClick={() => setDialog("followers")} />
              <Stat label="Siguiendo" value={following} onClick={() => setDialog("following")} />
            </div>

            {/* Edit mode */}
            {editing && (
              <form onSubmit={save} className="mt-8 space-y-5 border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg">
                    <span className="text-neon-cyan">//</span> editar perfil
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="p-2 rounded-md hover:bg-secondary/60 text-muted-foreground"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Banner upload */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Banner</label>
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="h-20 w-40 rounded-md bg-input/40 border border-border bg-cover bg-center"
                      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
                    />
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neon-cyan/40 text-neon-cyan text-xs hover:bg-neon-cyan/10">
                      {uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "banner")}
                      />
                    </label>
                    {bannerUrl && (
                      <button type="button" onClick={() => setBannerUrl("")} className="text-xs text-muted-foreground hover:text-destructive">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>

                {/* Avatar upload */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Foto de perfil</label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-input/40 border border-border overflow-hidden flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neon-cyan/40 text-neon-cyan text-xs hover:bg-neon-cyan/10">
                      {uploading === "avatar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "avatar")}
                      />
                    </label>
                  </div>
                </div>

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
            )}
          </div>
        </div>

        {/* Rank progression */}
        <div className="mx-auto max-w-3xl mt-8 glass rounded-2xl p-6 border border-neon-cyan/30 shadow-neon-blue">
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
                <Bar label="30 min de actividad" badge="member" unlocked={memberUnlocked} value={`${mins}m ${secs}s / 30m`} pct={actPct} />
                <Bar label="5 proyectos creados" badge="developer" unlocked={devUnlocked} value={`${projectCount} / 5`} pct={devPct} />
                <Bar label="3 proyectos de categoría IA" badge="ai_expert" unlocked={aiUnlocked} value={`${aiProjectCount} / 3`} pct={aiPct} />
              </div>
            );
          })()}
        </div>

        <div className="mx-auto max-w-4xl mt-8">
          <div className="flex items-end justify-between mb-4 px-1">
            <h3 className="font-display text-lg font-bold tracking-wide">
              <span className="text-neon-cyan">//</span> guía de rangos
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">cómo se desbloquea cada rango</span>
          </div>
          <RankGuide userRoles={roles} />
        </div>
      </section>

      {user && (
        <FollowersDialog
          open={dialog !== null}
          onOpenChange={(o) => !o && setDialog(null)}
          userId={user.id}
          mode={dialog ?? "followers"}
        />
      )}
    </PageShell>
  );
}

function Stat({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const inner = (
    <>
      <div className="text-2xl font-display font-bold text-gradient-neon">{value}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    </>
  );
  return onClick ? (
    <button onClick={onClick} className="glass rounded-xl p-4 text-center border border-border hover:border-neon-cyan/60 hover:shadow-neon-blue transition-all">
      {inner}
    </button>
  ) : (
    <div className="glass rounded-xl p-4 text-center border border-border">{inner}</div>
  );
}

function Bar({ label, badge, unlocked, value, pct }: { label: string; badge: RankSlug; unlocked: boolean; value: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <div className="flex items-center gap-2">
          <RankBadge slug={badge} size="xs" />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={`font-mono ${unlocked ? "text-neon-green" : "text-neon-cyan"}`}>
          {unlocked ? "DESBLOQUEADO" : value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-input/40 overflow-hidden border border-border">
        <div
          className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a855f7] transition-all"
          style={{ width: `${unlocked ? 100 : pct}%`, boxShadow: "0 0 12px #22d3ee88" }}
        />
      </div>
    </div>
  );
}

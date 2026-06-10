import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User as UserIcon, UserPlus, UserCheck, MessageSquare, Loader2 } from "lucide-react";
import { RankBadge, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { FollowersDialog } from "@/components/FollowersDialog";
import { PremiumName, PremiumAvatarRing } from "@/components/PremiumName";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — ItsaBDias` },
      { name: "description", content: `Perfil público de ${params.username} en ItsaBDias.` },
    ],
  }),
  component: PublicProfilePage,
});

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<RankSlug[]>([]);
  const [stats, setStats] = useState({ projects: 0, likes: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<null | "followers" | "following">(null);

  const isOwn = user?.id === profile?.id;

  const load = async () => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, banner_url")
      .ilike("username", username)
      .maybeSingle();
    if (!prof) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(prof as Profile);

    const [{ data: rs }, { count: pCount }, { count: fwers }, { count: fwing }, projIds] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", prof.id),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", prof.id),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", prof.id),
      supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", prof.id),
      supabase.from("projects").select("id").eq("user_id", prof.id),
    ]);
    setRoles((rs ?? []).map((r: any) => r.role));

    let likes = 0;
    const ids = (projIds.data ?? []).map((r: any) => r.id);
    if (ids.length) {
      const { count: lc } = await supabase
        .from("project_likes")
        .select("project_id", { count: "exact", head: true })
        .in("project_id", ids);
      likes = lc ?? 0;
    }
    setStats({
      projects: pCount ?? 0,
      likes,
      followers: fwers ?? 0,
      following: fwing ?? 0,
    });

    if (user && user.id !== prof.id) {
      const { data: f } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", prof.id)
        .maybeSingle();
      setIsFollowing(!!f);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user?.id]);

  // Realtime follower count
  useEffect(() => {
    if (!profile) return;
    const ch = supabase
      .channel(`u-follows:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `following_id=eq.${profile.id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const toggleFollow = async () => {
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (!profile) return;
    setFollowBusy(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
      if (error) toast.error(error.message);
      else {
        setIsFollowing(false);
        setStats((s) => ({ ...s, followers: Math.max(0, s.followers - 1) }));
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: profile.id });
      if (error) toast.error(error.message);
      else {
        setIsFollowing(true);
        setStats((s) => ({ ...s, followers: s.followers + 1 }));
        toast.success(`Ahora sigues a ${profile.username}`);
      }
    }
    setFollowBusy(false);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="py-32 text-center text-muted-foreground">
          <Loader2 className="inline animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell>
        <section className="py-32 px-6 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Usuario no encontrado</h1>
          <p className="text-muted-foreground mb-6">No existe ningún perfil con ese nombre.</p>
          <Link to="/community" className="inline-flex px-5 py-2.5 rounded-md border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
            Volver a la comunidad
          </Link>
        </section>
      </PageShell>
    );
  }

  const sortedRoles = [...roles].sort((a, b) => RANK_PRIORITY.indexOf(a) - RANK_PRIORITY.indexOf(b));

  return (
    <PageShell>
      <section className="pb-20">
        {/* Banner */}
        <div className="relative">
          <div
            className="h-48 sm:h-64 w-full bg-gradient-to-br from-neon-purple/40 via-neon-blue/30 to-neon-cyan/40 relative overflow-hidden"
            style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-6 -mt-16 relative z-10">
          {(() => { const isPrem = roles.includes("premium") || roles.includes("founder"); return (
          <div className={`glass rounded-2xl p-6 sm:p-8 ${isPrem ? "border-2 border-[#fbbf24]/60 shadow-[0_0_28px_rgba(251,191,36,0.25)]" : "neon-border"}`}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="-mt-20 shrink-0">
                <PremiumAvatarRing premium={isPrem}>
                  <div className="h-28 w-28 rounded-full bg-gradient-neon flex items-center justify-center overflow-hidden shadow-neon-purple ring-4 ring-background">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-14 w-14 text-primary-foreground" />
                    )}
                  </div>
                </PremiumAvatarRing>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">
                    {isPrem ? (
                      <PremiumName premium>{profile.username}</PremiumName>
                    ) : (
                      <span className="text-gradient-neon">{profile.username}</span>
                    )}
                  </h1>
                  {sortedRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sortedRoles.map((r) => <RankBadge key={r} slug={r} size="sm" />)}
                    </div>
                  )}
                </div>
                {profile.bio && <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>}
              </div>

              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                {isOwn ? (
                  <Link
                    to="/profile"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 font-semibold text-sm"
                  >
                    Editar perfil
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={toggleFollow}
                      disabled={followBusy}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all disabled:opacity-60 ${
                        isFollowing
                          ? "border border-neon-cyan/50 text-neon-cyan hover:bg-destructive/20 hover:border-destructive/60 hover:text-destructive"
                          : "bg-gradient-neon text-primary-foreground shadow-neon-purple hover:shadow-neon-blue"
                      }`}
                    >
                      {isFollowing ? <><UserCheck className="h-4 w-4" /> Siguiendo</> : <><UserPlus className="h-4 w-4" /> Seguir</>}
                    </button>
                    <Link
                      to="/messages"
                      search={{ to: profile.id }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 font-semibold text-sm"
                      title="Enviar mensaje"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Mensaje</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Proyectos" value={stats.projects} />
              <StatCard label="Likes" value={stats.likes} />
              <StatCard label="Seguidores" value={stats.followers} onClick={() => setDialog("followers")} />
              <StatCard label="Siguiendo" value={stats.following} onClick={() => setDialog("following")} />
            </div>
          </div>
          ); })()}
        </div>

        <FollowersDialog
          open={dialog !== null}
          onOpenChange={(o) => !o && setDialog(null)}
          userId={profile.id}
          mode={dialog ?? "followers"}
        />
      </section>
    </PageShell>
  );
}

function StatCard({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
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

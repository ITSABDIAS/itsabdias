import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { RankBadge, RANK_META, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { useMyRoles } from "@/hooks/useMyRoles";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Shield } from "lucide-react";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Comunidad — ItsaBDias" },
      { name: "description", content: "Conoce al equipo, administradores y miembros destacados de la comunidad ItsaBDias." },
    ],
  }),
  component: StaffPage,
});

type Member = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  roles: RankSlug[];
  joined_staff_at: string | null;
  last_seen_at: string | null;
};

const PUBLIC_RANKS: RankSlug[] = ["founder", "admin", "moderator", "developer", "ai_expert", "verified"];

function StaffPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", PUBLIC_RANKS as any);

      const byUser = new Map<string, RankSlug[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role as RankSlug);
        byUser.set(r.user_id, arr);
      });
      const ids = Array.from(byUser.keys());
      if (!ids.length) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, joined_staff_at, last_seen_at")
        .in("id", ids);

      const list: Member[] = (profiles ?? []).map((p: any) => ({
        user_id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        bio: p.bio,
        roles: byUser.get(p.id) ?? [],
        joined_staff_at: p.joined_staff_at ?? null,
        last_seen_at: p.last_seen_at ?? null,
      }));

      list.sort((a, b) => {
        const ai = RANK_PRIORITY.findIndex((r) => a.roles.includes(r));
        const bi = RANK_PRIORITY.findIndex((r) => b.roles.includes(r));
        return ai - bi;
      });

      setMembers(list);
      setLoading(false);
    })();
  }, []);

  const grouped = PUBLIC_RANKS.map((slug) => ({
    slug,
    meta: RANK_META[slug],
    members: members.filter((m) => {
      const top = RANK_PRIORITY.find((r) => m.roles.includes(r) && PUBLIC_RANKS.includes(r));
      return top === slug;
    }),
  })).filter((g) => g.members.length > 0);

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle
          eyebrow="// crew.directory"
          title="Staff & Comunidad"
          subtitle="El equipo que mantiene viva la comunidad ItsaBDias."
        />

        {loading && <p className="text-center text-muted-foreground">Cargando equipo...</p>}
        {!loading && members.length === 0 && (
          <p className="text-center text-muted-foreground">Aún no hay miembros con rango público.</p>
        )}

        <div className="mx-auto max-w-6xl space-y-12">
          {grouped.map((group) => {
            const Icon = group.meta.Icon;
            return (
              <div key={group.slug}>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${group.meta.color}22`, color: group.meta.color, boxShadow: `0 0 18px ${group.meta.color}55` }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl font-bold" style={{ color: group.meta.color }}>
                    {group.meta.label}
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground">· {group.members.length}</span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.members.map((m) => {
                    const top = RANK_PRIORITY.find((r) => m.roles.includes(r)) as RankSlug | undefined;
                    const accent = top ? RANK_META[top].color : "#22d3ee";
                    return (
                      <div
                        key={m.user_id}
                        className="glass rounded-2xl p-5 border transition-all hover:-translate-y-0.5"
                        style={{ borderColor: `${accent}55`, boxShadow: `0 0 24px ${accent}22` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-primary-foreground font-bold text-lg"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}66)`, boxShadow: `0 0 14px ${accent}88` }}
                          >
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt={m.username ?? ""} className="h-full w-full object-cover" />
                            ) : m.username ? (
                              m.username[0].toUpperCase()
                            ) : (
                              <UserIcon className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold truncate">{m.username ?? "anónimo"}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {m.roles
                                .filter((r) => PUBLIC_RANKS.includes(r))
                                .sort((a, b) => RANK_PRIORITY.indexOf(a) - RANK_PRIORITY.indexOf(b))
                                .map((r) => (
                                  <RankBadge key={r} slug={r} size="xs" />
                                ))}
                            </div>
                          </div>
                        </div>
                        {m.bio && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{m.bio}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

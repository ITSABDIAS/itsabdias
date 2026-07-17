import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { RankBadge, RANK_META, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { useMyRoles } from "@/hooks/useMyRoles";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Shield, Search, Crown, Users, ArrowRight } from "lucide-react";

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
  const [q, setQ] = useState("");
  const [rankFilter, setRankFilter] = useState<RankSlug | "all">("all");

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

  const filteredMembers = useMemo(() => {
    let list = members;
    if (rankFilter !== "all") list = list.filter((m) => m.roles.includes(rankFilter));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((m) => (m.username ?? "").toLowerCase().includes(s) || (m.bio ?? "").toLowerCase().includes(s));
    }
    return list;
  }, [members, q, rankFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    PUBLIC_RANKS.forEach((r) => { c[r] = members.filter((m) => m.roles.includes(r)).length; });
    return c;
  }, [members]);

  const grouped = PUBLIC_RANKS.map((slug) => ({
    slug,
    meta: RANK_META[slug],
    members: filteredMembers.filter((m) => {
      const top = RANK_PRIORITY.find((r) => m.roles.includes(r) && PUBLIC_RANKS.includes(r));
      return top === slug;
    }),
  })).filter((g) => g.members.length > 0);

  return (
    <PageShell>
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <SectionTitle
          eyebrow="// crew.directory"
          title="Staff & Comunidad"
          subtitle="El equipo que mantiene viva la comunidad ItsaBDias."
        />

        <StaffToolsBar />

        {/* Stats por rango */}
        <div className="mx-auto max-w-6xl mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PUBLIC_RANKS.map((r) => {
            const meta = RANK_META[r];
            const Icon = meta.Icon;
            return (
              <Link
                key={r}
                to="/rango/$slug"
                params={{ slug: r }}
                className="glass rounded-xl p-3 flex items-center gap-2 border border-border hover:-translate-y-0.5 transition"
                style={{ borderColor: `${meta.color}44`, boxShadow: `0 0 14px ${meta.color}18` }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                     style={{ background: `${meta.color}22`, color: meta.color }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: meta.color }}>{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{counts[r] ?? 0} miembros</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Buscador + filtros */}
        <div className="mx-auto max-w-6xl mb-8 glass rounded-xl p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por username o bio…"
              className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border rounded-md text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setRankFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs border ${rankFilter === "all" ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground"}`}
            >Todos</button>
            {PUBLIC_RANKS.map((r) => (
              <button
                key={r}
                onClick={() => setRankFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs border ${rankFilter === r ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground"}`}
              >
                {RANK_META[r].label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-center text-muted-foreground">Cargando equipo...</p>}
        {!loading && members.length === 0 && (
          <p className="text-center text-muted-foreground">Aún no hay miembros con rango público.</p>
        )}
        {!loading && members.length > 0 && grouped.length === 0 && (
          <p className="text-center text-muted-foreground">Sin resultados para tu búsqueda.</p>
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
                  <Link
                    to="/rango/$slug"
                    params={{ slug: group.slug }}
                    className="ml-auto inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:border-neon-cyan/60 text-muted-foreground hover:text-neon-cyan"
                  >
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Link>
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
                            <Link to="/u/$username" params={{ username: m.username ?? "" }} className="font-display font-bold truncate hover:text-neon-cyan block">{m.username ?? "anónimo"}</Link>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {m.roles
                                .filter((r) => PUBLIC_RANKS.includes(r))
                                .sort((a, b) => RANK_PRIORITY.indexOf(a) - RANK_PRIORITY.indexOf(b))
                                .map((r) => (
                                  <RankBadge key={r} slug={r} size="xs" />
                                ))}
                            </div>
                            <ActivityLine lastSeen={m.last_seen_at} joined={m.joined_staff_at} />
                          </div>
                        </div>
                        {m.bio && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{m.bio}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <Link
                            to="/u/$username"
                            params={{ username: m.username ?? "" }}
                            className="text-[11px] px-2 py-1 rounded-md border border-border hover:border-neon-cyan/60 text-muted-foreground hover:text-neon-cyan"
                          >Ver perfil</Link>
                          <Link
                            to="/messages"
                            className="text-[11px] px-2 py-1 rounded-md border border-border hover:border-neon-cyan/60 text-muted-foreground hover:text-neon-cyan"
                          >Mensaje</Link>
                        </div>
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

function StaffToolsBar() {
  const { isModerator, isAdmin, isFounder } = useMyRoles();
  if (!isModerator) return null;
  return (
    <div className="mx-auto max-w-6xl mb-6 space-y-3">
      {isFounder && (
        <div className="glass rounded-xl p-4 border border-yellow-400/40 bg-yellow-400/5 flex flex-wrap items-center gap-3"
             style={{ boxShadow: "0 0 24px rgba(250,204,21,0.15)" }}>
          <Crown className="h-6 w-6 text-yellow-300" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-yellow-200">Panel Founder</p>
            <p className="text-xs text-muted-foreground">Asigna y retira cualquier rango desde <span className="font-mono text-yellow-200">/admin/usuarios</span>.</p>
          </div>
          <Link to="/admin/usuarios" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-yellow-400/20 border border-yellow-400/60 text-yellow-200 font-bold hover:bg-yellow-400/30">
            <Users className="h-3.5 w-3.5" /> Gestionar rangos
          </Link>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/admin" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-gradient-neon text-primary-foreground font-bold">
          <Shield className="h-3.5 w-3.5" /> Panel de moderación
        </Link>
        {isModerator && <Link to="/admin/usuarios" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">Usuarios</Link>}
        {isAdmin && <Link to="/admin/anuncios" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">Anuncios</Link>}
        {isModerator && <Link to="/admin/historial" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">Historial</Link>}
        {isFounder && <span className="px-2 py-1 rounded-md text-[10px] font-mono uppercase border border-yellow-400/50 text-yellow-300">Founder</span>}
      </div>
    </div>
  );
}

function ActivityLine({ lastSeen, joined }: { lastSeen: string | null; joined: string | null }) {
  const now = Date.now();
  const active = lastSeen ? (now - new Date(lastSeen).getTime() < 5 * 60 * 1000) : false;
  return (
    <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" : "bg-muted-foreground/50"}`} />
      <span>{active ? "activo" : lastSeen ? `visto ${new Date(lastSeen).toLocaleDateString()}` : "inactivo"}</span>
      {joined && <span>· desde {new Date(joined).toLocaleDateString()}</span>}
    </div>
  );
}

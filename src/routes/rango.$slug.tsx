import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { RankBadge, RANK_META, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { Users } from "lucide-react";

export const Route = createFileRoute("/rango/$slug")({
  head: ({ params }) => {
    const meta = (RANK_META as any)[params.slug];
    const label = meta?.label ?? "Rango";
    return { meta: [
      { title: `${label} — ItsaBDias` },
      { name: "description", content: `Miembros con el rango ${label} en ItsaBDias.` },
    ] };
  },
  beforeLoad: ({ params }) => {
    if (!(RANK_PRIORITY as string[]).includes(params.slug) && params.slug !== "founder") throw notFound();
  },
  component: RankPage,
});

type Row = { id: string; username: string; avatar_url: string | null; last_seen_at: string | null };

function RankPage() {
  const { slug } = Route.useParams();
  const rank = slug as RankSlug;
  const meta = RANK_META[rank];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", rank as any);
      const ids = Array.from(new Set((roleRows ?? []).map((r: any) => r.user_id)));
      if (ids.length === 0) { setRows([]); setLoading(false); return; }
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url, last_seen_at").in("id", ids);
      setRows((profs ?? []) as Row[]);
      setLoading(false);
    })();
  }, [rank]);

  const Icon = meta.Icon;

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle
          eyebrow="// rango"
          title={meta.label}
          subtitle={`Miembros de la comunidad con el rango ${meta.label}.`}
        />

        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {RANK_PRIORITY.map((r) => (
              <Link
                key={r}
                to="/rango/$slug"
                params={{ slug: r }}
                className={`px-3 py-1.5 rounded-md border transition ${r === rank ? "bg-white/5" : ""}`}
                style={{ borderColor: `${RANK_META[r].color}55`, color: RANK_META[r].color }}
              >
                {RANK_META[r].label}
              </Link>
            ))}
          </div>

          <div className="glass rounded-xl p-5 mb-4 flex items-center gap-4"
               style={{ boxShadow: `0 0 24px ${meta.color}22`, borderLeft: `3px solid ${meta.color}` }}>
            <Icon className="h-8 w-8" style={{ color: meta.color }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <RankBadge slug={rank} size="md" />
                <span className="text-xs text-muted-foreground font-mono">{rows.length} {rows.length === 1 ? "miembro" : "miembros"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{describe(rank)}</p>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          ) : rows.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Aún no hay miembros con este rango.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {rows.map((u) => (
                <Link
                  key={u.id}
                  to="/u/$username"
                  params={{ username: u.username }}
                  className="glass rounded-xl p-3 flex items-center gap-3 hover:border-neon-cyan/60 border border-border transition"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-secondary/60 flex items-center justify-center text-sm font-bold">
                      {u.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold truncate">{u.username}</span>
                      <RankBadge slug={rank} size="xs" />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {u.last_seen_at ? `Últ. actividad ${new Date(u.last_seen_at).toLocaleDateString()}` : "Sin actividad"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function describe(r: RankSlug): string {
  switch (r) {
    case "founder": return "Creador y líder de la plataforma.";
    case "admin": return "Administradores designados por el Founder.";
    case "moderator": return "Moderadores que vigilan la comunidad.";
    case "developer": return "Miembros con al menos 5 proyectos publicados.";
    case "ai_expert": return "Miembros con proyectos destacados de IA.";
    case "premium": return "Suscriptores Premium de la plataforma.";
    case "verified": return "Cuentas verificadas oficialmente.";
    case "member": return "Miembros activos de la comunidad.";
  }
}

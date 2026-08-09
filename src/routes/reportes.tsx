import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Clock } from "lucide-react";
import { PRIORITY_META, STATUS_META, TARGET_LABEL, reportCode, type Report } from "@/lib/reports";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Mis reportes — ItsaBDias" },
      { name: "description", content: "Consulta el estado de los reportes que has enviado al staff de ItsaBDias." },
      { property: "og:title", content: "Mis reportes — ItsaBDias" },
      { property: "og:description", content: "Sigue el estado de tus reportes: recibido, en revisión o resuelto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyReportsPage,
});

function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("reports" as any)
        .select("*")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as unknown as Report[]);
      setLoading(false);
    })();
  }, [user?.id, authLoading]);

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle
          as="h1"
          eyebrow="// my.reports"
          title="Mis reportes"
          subtitle="Aquí puedes seguir el estado de cada reporte que has enviado."
        />
        <div className="mx-auto max-w-3xl space-y-3">
          {loading && <p className="text-muted-foreground text-sm text-center">Cargando…</p>}
          {!loading && rows.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center border border-border">
              <ShieldAlert className="h-10 w-10 mx-auto text-neon-purple mb-3" />
              <p className="text-muted-foreground text-sm">
                No has enviado ningún reporte. Usa el menú ⋮ en perfiles, publicaciones o comentarios.
              </p>
              <Link to="/community" className="mt-4 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">
                Ir a la comunidad
              </Link>
            </div>
          )}
          {rows.map((r) => {
            const st = STATUS_META[r.status];
            const pr = PRIORITY_META[r.priority];
            return (
              <div key={r.id} className="glass rounded-xl p-4 border border-border hover:border-neon-cyan/40 transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">Reporte {reportCode(r.number)}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded border font-mono uppercase"
                    style={{ color: st.color, borderColor: `${st.color}80`, background: `${st.color}18` }}
                  >
                    {st.dot} {st.label}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded border font-mono uppercase"
                    style={{ color: pr.color, borderColor: `${pr.color}80`, background: `${pr.color}18` }}
                  >
                    {pr.dot} {pr.label}
                  </span>
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">{TARGET_LABEL[r.target_type]} · </span>
                  <span className="font-bold">{r.reason}</span>
                </p>
                {r.description && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{r.description}</p>}
                {r.resolution && (
                  <p className="mt-2 text-xs text-emerald-300 border-l-2 border-emerald-500/50 pl-2">Resolución: {r.resolution}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

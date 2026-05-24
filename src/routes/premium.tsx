import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Crown, Check, Zap } from "lucide-react";
import { RankBadge, type RankSlug } from "@/components/RankBadge";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — ItsaBDias" },
      { name: "description", content: "Hazte miembro Premium de la comunidad ItsaBDias y desbloquea beneficios exclusivos." },
    ],
  }),
  component: PremiumPage,
});

type Rank = { slug: string; name: string; description: string | null; color: string; priority: number };
type Sub = { plan: string; status: string; expires_at: string | null };

function PremiumPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: r } = await supabase.from("ranks").select("slug, name, description, color, priority").order("priority", { ascending: false });
    setRanks((r ?? []) as Rank[]);
    if (user) {
      const { data: s } = await supabase.from("subscriptions").select("plan, status, expires_at").eq("user_id", user.id).maybeSingle();
      setSub((s as Sub) ?? null);
    }
  };

  useEffect(() => { load(); }, [user]);

  const subscribe = async () => {
    if (!user) return nav({ to: "/auth" });
    setBusy(true);
    const { error } = await supabase
      .from("subscriptions")
      .upsert({ user_id: user.id, plan: "premium", status: "pending", started_at: new Date().toISOString() }, { onConflict: "user_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitud Premium enviada. Te activaremos pronto.");
    load();
  };

  const benefits = [
    "Insignia Premium dorada en tu perfil",
    "Prioridad en tickets de soporte",
    "Acceso anticipado a nuevas funciones",
    "Color de nombre exclusivo en la comunidad",
    "Soporte directo con el equipo",
  ];

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// premium.terminal" title="Hazte Premium" subtitle="Desbloquea beneficios exclusivos y apoya el proyecto." />

        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-8 neon-border">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h3 className="font-display text-2xl font-bold text-gradient-neon">Plan Premium</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Únete al círculo interno de la comunidad ItsaBDias.</p>
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-neon-cyan shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>

            {sub?.plan === "premium" && sub.status === "active" ? (
              <div className="rounded-md border border-yellow-400/40 bg-yellow-400/10 text-yellow-300 text-sm px-4 py-3 text-center font-semibold">
                ✨ Ya eres Premium
              </div>
            ) : sub?.status === "pending" ? (
              <div className="rounded-md border border-neon-blue/40 bg-neon-blue/10 text-neon-blue text-sm px-4 py-3 text-center font-semibold">
                Solicitud en revisión
              </div>
            ) : (
              <button
                onClick={subscribe}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple hover:shadow-neon-blue transition-all disabled:opacity-60"
              >
                <Zap className="h-4 w-4" /> {busy ? "Procesando..." : "Solicitar Premium"}
              </button>
            )}
          </div>

          <div className="glass rounded-2xl p-8 neon-border">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-[#ff00aa]" />
              <h3 className="font-display text-2xl font-bold">Rangos</h3>
            </div>
            <div className="space-y-3">
              {ranks.map((r) => (
                <div
                  key={r.slug}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/30 px-4 py-3"
                  style={{ borderColor: `${r.color}55` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RankBadge slug={r.slug as RankSlug} size="sm" />
                    </div>
                    {r.description && <p className="mt-1.5 text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">#{r.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

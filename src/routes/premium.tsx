import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Sparkles,
  Crown,
  Check,
  Zap,
  Shield,
  Headphones,
  Rocket,
  Star,
  Palette,
  Lock,
} from "lucide-react";
import { RankBadge, type RankSlug } from "@/components/RankBadge";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — ItsaBDias" },
      {
        name: "description",
        content:
          "Hazte Premium en ItsaBDias por $3.99/mes y desbloquea insignia dorada, color exclusivo, publicaciones destacadas y más.",
      },
      { property: "og:title", content: "Premium — ItsaBDias" },
      {
        property: "og:description",
        content: "Únete al círculo Premium de ItsaBDias por $3.99/mes.",
      },
    ],
  }),
  component: PremiumPage,
});

type Rank = {
  slug: string;
  name: string;
  description: string | null;
  color: string;
  priority: number;
};
type Sub = { plan: string; status: string; expires_at: string | null };

const BENEFITS = [
  { Icon: Crown,      title: "Insignia Premium dorada",   desc: "Distintivo brillante visible en toda la plataforma." },
  { Icon: Palette,    title: "Nombre con color exclusivo", desc: "Tu nombre brilla en publicaciones y comentarios." },
  { Icon: Sparkles,   title: "Perfil premium futurista",   desc: "Diseño exclusivo con efectos neón en tu perfil." },
  { Icon: Headphones, title: "Prioridad en soporte",       desc: "Tus tickets se atienden antes que los demás." },
  { Icon: Star,       title: "Publicaciones destacadas",   desc: "Tus posts aparecen primero en la comunidad." },
  { Icon: Rocket,     title: "Acceso anticipado",          desc: "Prueba nuevas funciones antes que nadie." },
];

function PremiumPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: r } = await supabase
      .from("ranks")
      .select("slug, name, description, color, priority")
      .order("priority", { ascending: false });
    setRanks((r ?? []) as Rank[]);
    if (user) {
      const { data: s } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      setSub((s as Sub) ?? null);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const subscribe = async () => {
    if (!user) return nav({ to: "/auth" });
    setBusy(true);
    // TODO: Integración Stripe — crear checkout session aquí y redirigir.
    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan: "premium",
          status: "pending",
          started_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitud Premium enviada. Pronto se habilitará el pago seguro con Stripe.");
    load();
  };

  const isPremium = sub?.plan === "premium" && sub.status === "active";
  const isPending = sub?.status === "pending";

  return (
    <PageShell>
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        {/* Background FX */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-[#fbbf24]/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#ff00aa]/10 blur-[100px]" />
          <div className="absolute top-1/3 left-0 h-[300px] w-[300px] rounded-full bg-[#22d3ee]/10 blur-[100px]" />
        </div>

        <SectionTitle
          eyebrow="// premium.access"
          title="Hazte Premium"
          subtitle="Desbloquea el círculo dorado de ItsaBDias y lleva tu experiencia al siguiente nivel."
        />

        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-8">
          {/* ===== Pricing Card ===== */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#fbbf24] via-[#ff00aa] to-[#22d3ee] rounded-2xl opacity-60 group-hover:opacity-100 blur-md transition-opacity animate-glow-pulse" />
            <div className="relative glass rounded-2xl p-6 sm:p-8 border border-[#fbbf24]/30 overflow-hidden">
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(#fbbf24 1px, transparent 1px), linear-gradient(90deg, #fbbf24 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <RankBadge slug="premium" size="md" />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      plan.mensual
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/40 text-[#fbbf24] text-[10px] font-mono uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" /> Recomendado
                  </span>
                </div>

                <h3 className="font-display text-3xl sm:text-4xl font-bold text-gradient-neon mb-2">
                  ItsaBDias Premium
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Apoya el proyecto y desbloquea ventajas exclusivas dentro de la comunidad.
                </p>

                <div className="flex items-end gap-2 mb-1">
                  <span className="font-display text-6xl sm:text-7xl font-extrabold bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent leading-none">
                    $3.99
                  </span>
                  <span className="text-muted-foreground text-sm mb-2">USD / mes</span>
                </div>
                <p className="text-xs text-muted-foreground mb-8">
                  Cancela cuando quieras. Renovación mensual automática.
                </p>

                {isPremium ? (
                  <div className="rounded-md border border-[#fbbf24]/50 bg-[#fbbf24]/10 text-[#fbbf24] text-sm px-4 py-3 text-center font-semibold flex items-center justify-center gap-2">
                    <Crown className="h-4 w-4" /> Ya eres Premium ✨
                  </div>
                ) : isPending ? (
                  <div className="rounded-md border border-neon-blue/40 bg-neon-blue/10 text-neon-blue text-sm px-4 py-3 text-center font-semibold">
                    Solicitud en revisión — pronto activaremos tu acceso
                  </div>
                ) : (
                  <button
                    onClick={subscribe}
                    disabled={busy}
                    className="w-full group/btn relative inline-flex items-center justify-center gap-2 py-4 rounded-md bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] text-black font-bold text-base shadow-[0_0_24px_rgba(251,191,36,0.4)] hover:shadow-[0_0_32px_rgba(251,191,36,0.7)] transition-all disabled:opacity-60 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    <Zap className="h-5 w-5 relative" />
                    <span className="relative">
                      {busy ? "Procesando..." : "Suscribirme por $3.99/mes"}
                    </span>
                  </button>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Pago seguro próximamente con Stripe
                </div>
              </div>
            </div>
          </div>

          {/* ===== Benefits ===== */}
          <div className="grid sm:grid-cols-2 gap-4 content-start">
            {BENEFITS.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group relative glass rounded-xl p-5 border border-border hover:border-[#fbbf24]/50 transition-all hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-[#fbbf24]/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#fbbf24]/20 to-[#ff00aa]/10 border border-[#fbbf24]/30 flex items-center justify-center mb-3 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                    <Icon className="h-5 w-5 text-[#fbbf24]" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 rounded-xl p-4 border border-neon-cyan/30 bg-neon-cyan/5 flex items-start gap-3">
              <Shield className="h-5 w-5 text-neon-cyan shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                Tu rol y permisos existentes se mantienen intactos. Premium se suma como un rango
                adicional con beneficios visuales y de prioridad.
              </div>
            </div>
          </div>
        </div>

        {/* ===== Comparison strip ===== */}
        <div className="mx-auto max-w-6xl mt-10 grid sm:grid-cols-3 gap-3">
          {[
            { label: "Miembro", price: "Gratis", features: ["Acceso a la comunidad", "Tickets estándar"] },
            { label: "Premium", price: "$3.99/mes", features: ["Todo lo de Miembro", "Insignia dorada + color", "Soporte prioritario", "Acceso anticipado"], highlight: true },
            { label: "Founder", price: "Invitación", features: ["Control total", "Gestión del proyecto"] },
          ].map((tier) => (
            <div
              key={tier.label}
              className={`glass rounded-xl p-5 border ${
                tier.highlight ? "border-[#fbbf24]/60 shadow-[0_0_24px_rgba(251,191,36,0.15)]" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
                  {tier.label}
                </span>
                <span className={`text-sm font-bold ${tier.highlight ? "text-[#fbbf24]" : ""}`}>
                  {tier.price}
                </span>
              </div>
              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-neon-cyan shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== Ranks catalog ===== */}
        {ranks.length > 0 && (
          <div className="mx-auto max-w-6xl mt-12">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/5">
                // ranks.directory
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold">Todos los rangos</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ranks.map((r) => (
                <div
                  key={r.slug}
                  className="flex items-center justify-between gap-3 rounded-md border bg-secondary/30 px-4 py-3"
                  style={{ borderColor: `${r.color}44` }}
                >
                  <div className="min-w-0 flex-1">
                    <RankBadge slug={r.slug as RankSlug} size="sm" />
                    {r.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    #{r.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

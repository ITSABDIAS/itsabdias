import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Zap, CircuitBoard, Activity, Cpu, Sparkles, ArrowRight, Lightbulb, Plug } from "lucide-react";

export const Route = createFileRoute("/electricidad")({
  head: () => ({
    meta: [
      { title: "Electricidad Básica — ItsaBDias" },
      { name: "description", content: "Circuitos, voltaje, corriente, sensores, Arduino, electrónica básica y proyectos DIY." },
      { property: "og:title", content: "Electricidad Básica — ItsaBDias" },
      { property: "og:description", content: "Aprende electrónica desde cero y construye proyectos reales." },
    ],
  }),
  component: Electricidad,
});

const fundamentals = [
  { icon: CircuitBoard, name: "Circuitos", slug: "circuitos", desc: "Serie, paralelo, ley de Ohm y Kirchhoff.", color: "text-neon-cyan" },
  { icon: Activity, name: "Voltaje", slug: "voltaje", desc: "Diferencia de potencial, AC y DC.", color: "text-neon-purple" },
  { icon: Zap, name: "Corriente", slug: "corriente", desc: "Amperios, resistencia y potencia.", color: "text-neon-blue" },
  { icon: Plug, name: "Sensores", slug: "sensores", desc: "Temperatura, luz, movimiento y más.", color: "text-neon-cyan" },
];

const tools = [
  { icon: Cpu, title: "Arduino", slug: "arduino", desc: "Microcontroladores, sketches y librerías." },
  { icon: Lightbulb, title: "Electrónica básica", slug: "circuitos", desc: "Resistencias, diodos, transistores y LEDs." },
  { icon: Sparkles, title: "Proyectos DIY", slug: "diy", desc: "Robots, sensores caseros y domótica." },
];

function Electricidad() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle eyebrow="// volt.core" title="Electricidad Básica" subtitle="Del electrón al proyecto: aprende los fundamentos del hardware." />
        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-cyan/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-neon-cyan animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Domina la electrónica</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">Aprende cómo funciona un circuito, controla sensores y construye proyectos reales con Arduino.</p>
              <Link to="/ai" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple">
                <Sparkles className="h-4 w-4" /> Preguntar a NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <CircuitBoard className="h-5 w-5 text-neon-cyan" /> Fundamentos
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fundamentals.map((f) => (
              <Link key={f.name} to="/tema/$category/$slug" params={{ category: "electricidad", slug: f.slug }} className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-cyan/60 hover:-translate-y-1 transition-all block">
                <div className="flex items-start justify-between">
                  <f.icon className={`h-7 w-7 ${f.color}`} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                </div>
                <h4 className="mt-3 font-bold text-lg">{f.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Herramientas & Proyectos
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {tools.map((t) => (
              <div key={t.title} className="glass rounded-xl p-6 neon-border hover:-translate-y-1 transition-all">
                <t.icon className="h-7 w-7 text-neon-cyan" />
                <h4 className="mt-3 font-bold text-lg">{t.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass rounded-2xl p-8 text-center neon-border">
          <h3 className="text-2xl font-bold">¿Quieres tu primer proyecto con Arduino?</h3>
          <p className="mt-2 text-muted-foreground">NEXUS te guía con el circuito, el código y los componentes.</p>
          <Link to="/ai" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

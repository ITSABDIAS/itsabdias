import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Cpu, MemoryStick, HardDrive, Monitor, Sparkles, ArrowRight, Wrench, Gauge, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/hardware")({
  head: () => ({
    meta: [
      { title: "Hardware & PCs — ItsaBDias" },
      { name: "description", content: "CPUs, GPUs, RAM, SSD, guías de compra, builds gamer y optimización de rendimiento." },
      { property: "og:title", content: "Hardware & PCs — ItsaBDias" },
      { property: "og:description", content: "Todo sobre componentes, builds y rendimiento." },
    ],
  }),
  component: Hardware,
});

const components = [
  { icon: Cpu, name: "CPUs", desc: "Intel, AMD, núcleos, hilos y arquitecturas modernas.", color: "text-neon-cyan" },
  { icon: Monitor, name: "GPUs", desc: "NVIDIA, AMD, ray tracing, DLSS y FSR.", color: "text-neon-purple" },
  { icon: MemoryStick, name: "RAM", desc: "DDR4, DDR5, latencias y dual channel.", color: "text-neon-blue" },
  { icon: HardDrive, name: "SSD & Almacenamiento", desc: "NVMe Gen4/Gen5, SATA y HDDs.", color: "text-neon-cyan" },
];

const blocks = [
  { icon: ShoppingCart, title: "Guías de compra", desc: "Qué priorizar según tu presupuesto y uso." },
  { icon: Wrench, title: "Builds recomendadas", desc: "Setups gamer, workstation y entry-level." },
  { icon: Gauge, title: "Optimización", desc: "BIOS, undervolt, XMP y mejoras de FPS." },
];

function Hardware() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle eyebrow="// hardware.core" title="Hardware & PCs" subtitle="Componentes, builds y trucos para exprimir tu máquina." />
        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-blue/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Cpu className="h-12 w-12 sm:h-16 sm:w-16 text-neon-blue animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Construye tu PC ideal</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">Desde tu primera build hasta workstations de gama alta. NEXUS te ayuda a elegir cada pieza.</p>
              <Link to="/ai" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple">
                <Sparkles className="h-4 w-4" /> Asesoría con NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-neon-cyan" /> Componentes
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {components.map((c) => (
              <article key={c.name} className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-blue/60 hover:-translate-y-1 transition-all">
                <c.icon className={`h-7 w-7 ${c.color}`} />
                <h4 className="mt-3 font-bold text-lg">{c.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Recursos
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {blocks.map((b) => (
              <div key={b.title} className="glass rounded-xl p-6 neon-border hover:-translate-y-1 transition-all">
                <b.icon className="h-7 w-7 text-neon-cyan" />
                <h4 className="mt-3 font-bold text-lg">{b.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass rounded-2xl p-8 text-center neon-border">
          <h3 className="text-2xl font-bold">¿Qué PC armar con tu presupuesto?</h3>
          <p className="mt-2 text-muted-foreground">Cuéntale a NEXUS tu uso y presupuesto y te arma la build ideal.</p>
          <Link to="/ai" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

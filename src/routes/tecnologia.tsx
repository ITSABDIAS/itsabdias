import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Cpu, Newspaper, BrainCircuit, Gamepad2, Smartphone, Rocket, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tecnologia")({
  head: () => ({
    meta: [
      { title: "Tecnología — ItsaBDias" },
      { name: "description", content: "Noticias, IA, hardware, gaming, gadgets y tendencias del futuro." },
      { property: "og:title", content: "Tecnología — ItsaBDias" },
      { property: "og:description", content: "El pulso del mundo tecnológico." },
    ],
  }),
  component: Tecnologia,
});

const categories = [
  { icon: Newspaper, name: "Noticias", slug: "noticias", desc: "Lo último de la industria tech.", color: "text-neon-cyan" },
  { icon: BrainCircuit, name: "IA", slug: "ia", desc: "Modelos, agentes y avances de IA.", color: "text-neon-purple" },
  { icon: Cpu, name: "Hardware", slug: "hardware", desc: "Chips, GPUs y nuevos componentes.", color: "text-neon-blue" },
  { icon: Gamepad2, name: "Gaming", slug: "gaming", desc: "Consolas, lanzamientos y esports.", color: "text-neon-cyan" },
  { icon: Smartphone, name: "Gadgets", slug: "gadgets", desc: "Móviles, wearables y dispositivos.", color: "text-neon-purple" },
  { icon: Rocket, name: "Futuro", slug: "futuro", desc: "Robótica, espacio y biotecnología.", color: "text-neon-blue" },
];

const news = [
  { tag: "IA", title: "GPT-5.5 redefine el razonamiento", desc: "Nuevo benchmark en lógica compleja y código multi-archivo." },
  { tag: "Robótica", title: "Humanoides aprenden en tiempo real", desc: "Modelos fundacionales encarnados aceleran la robótica general." },
  { tag: "Gaming", title: "NPCs con LLMs en Roblox", desc: "Mundos persistentes con personajes que recuerdan tus acciones." },
  { tag: "Hardware", title: "GPUs de nueva generación", desc: "Trazado de rayos en tiempo real para todos." },
];

function Tecnologia() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle eyebrow="// tech.pulse" title="Tecnología" subtitle="El pulso del mundo digital: lo que pasa hoy y lo que viene mañana." />
        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-purple/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Rocket className="h-12 w-12 sm:h-16 sm:w-16 text-neon-purple animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Mantente a la vanguardia</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">Noticias, análisis y tendencias del ecosistema tech, curadas para creadores.</p>
              <Link to="/ai" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple">
                <Sparkles className="h-4 w-4" /> Hablar con NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-neon-cyan" /> Categorías
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link key={c.name} to="/tema/$category/$slug" params={{ category: "tecnologia", slug: c.slug }} className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all block">
                <div className="flex items-start justify-between">
                  <c.icon className={`h-7 w-7 ${c.color}`} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                </div>
                <h4 className="mt-3 font-bold text-lg">{c.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Noticias del futuro
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {news.map((n) => (
              <div key={n.title} className="glass rounded-xl p-6 neon-border hover:-translate-y-1 transition-all">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/5">
                  {n.tag}
                </span>
                <h4 className="mt-3 font-bold text-lg">{n.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass rounded-2xl p-8 text-center neon-border">
          <h3 className="text-2xl font-bold">¿Quieres entender una tendencia tech?</h3>
          <p className="mt-2 text-muted-foreground">NEXUS te lo explica en segundos, sin tecnicismos innecesarios.</p>
          <Link to="/ai" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

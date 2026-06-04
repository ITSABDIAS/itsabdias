import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Gamepad2, Box, Sparkles, ArrowRight, Boxes, Brain, Palette, Upload, Map } from "lucide-react";

export const Route = createFileRoute("/gamedev")({
  head: () => ({
    meta: [
      { title: "Desarrollo de Juegos — ItsaBDias" },
      { name: "description", content: "Unity, Unreal, Godot, diseño de niveles, IA para juegos, arte 2D/3D y publicación." },
      { property: "og:title", content: "Desarrollo de Juegos — ItsaBDias" },
      { property: "og:description", content: "Crea videojuegos desde cero hasta la publicación." },
    ],
  }),
  component: GameDev,
});

const engines = [
  { icon: Box, name: "Unity", slug: "unity", desc: "C#, 2D/3D, móvil, PC y consolas.", color: "text-neon-cyan" },
  { icon: Boxes, name: "Unreal Engine", slug: "unreal", desc: "Blueprints, C++, gráficos AAA.", color: "text-neon-purple" },
  { icon: Gamepad2, name: "Godot", slug: "godot", desc: "GDScript, ligero y open-source.", color: "text-neon-blue" },
];

const topics = [
  { icon: Map, title: "Diseño de niveles", slug: "niveles", desc: "Pacing, flow, retos y progresión." },
  { icon: Brain, title: "IA para videojuegos", slug: "ia", desc: "Pathfinding, FSM, behavior trees, LLM NPCs." },
  { icon: Palette, title: "Arte 2D & 3D", slug: "arte", desc: "Pixel art, sprites, modelado y texturas." },
  { icon: Upload, title: "Publicación", slug: "niveles", desc: "Steam, itch.io, Google Play y App Store." },
];

function GameDev() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle eyebrow="// gamedev.core" title="Desarrollo de Juegos" subtitle="De la idea al lanzamiento. Motores, arte y publicación." />
        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-neon-purple/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 text-neon-purple animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Crea mundos jugables</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">Elige tu motor, aprende los fundamentos y publica tu juego. NEXUS te guía en cada paso.</p>
              <Link to="/ai" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple">
                <Sparkles className="h-4 w-4" /> Empezar con NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Box className="h-5 w-5 text-neon-cyan" /> Motores
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {engines.map((e) => (
              <article key={e.name} className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all">
                <e.icon className={`h-7 w-7 ${e.color}`} />
                <h4 className="mt-3 font-bold text-lg">{e.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Áreas clave
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((t) => (
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
          <h3 className="text-2xl font-bold">¿Listo para hacer tu primer juego?</h3>
          <p className="mt-2 text-muted-foreground">NEXUS te ayuda con scripts, mecánicas y diseño.</p>
          <Link to="/ai" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

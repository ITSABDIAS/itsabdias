import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { ExternalLink, Gamepad2, Code2, BrainCircuit, Cpu } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Proyectos — ItsaBDias" },
      { name: "description", content: "Juegos, creaciones y experimentos tech de ItsaBDias." },
    ],
  }),
  component: Projects,
});

const projects = [
  { icon: Gamepad2, title: "Neon Tower Defense", tag: "Roblox", desc: "Tower defense competitivo con sistema de skins NFT-style." },
  { icon: BrainCircuit, title: "ItsaBot AI", tag: "IA", desc: "Asistente entrenado con mi base de tutoriales." },
  { icon: Code2, title: "Pixel Engine", tag: "Game Dev", desc: "Motor 2D ligero hecho desde cero en TypeScript." },
  { icon: Cpu, title: "RGB Build 2025", tag: "Hardware", desc: "Setup gamer con loop custom y water cooling." },
  { icon: Gamepad2, title: "Minecraft Cyber City", tag: "Minecraft", desc: "Ciudad cyberpunk con redstone avanzado." },
  { icon: Code2, title: "DevDojo", tag: "Web", desc: "Plataforma para retos de programación diarios." },
];

function Projects() {
  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// builds" title="Proyectos y creaciones" subtitle="Donde las ideas se compilan en realidad." />
        <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <article
              key={p.title}
              className="group relative rounded-2xl p-6 bg-gradient-card border border-border hover:border-neon-blue/60 hover:-translate-y-2 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-neon-blue/15 via-transparent to-neon-purple/15" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-purple/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p.icon className="h-10 w-10 text-neon-cyan group-hover:scale-110 transition-transform" />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neon-blue/15 text-neon-blue border border-neon-blue/40">
                    {p.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neon-cyan hover:text-neon-purple transition-colors">
                  Ver proyecto <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

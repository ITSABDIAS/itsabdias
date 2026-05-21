import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Gamepad2, BrainCircuit, Code2, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Sobre mí — ItsaBDias" },
      { name: "description", content: "Creador gamer y tecnológico apasionado por Roblox, Minecraft, IA y desarrollo de juegos." },
    ],
  }),
  component: About,
});

const interests = [
  { icon: Gamepad2, label: "Roblox Studio", color: "text-neon-cyan" },
  { icon: Gamepad2, label: "Minecraft", color: "text-neon-blue" },
  { icon: BrainCircuit, label: "Inteligencia Artificial", color: "text-neon-purple" },
  { icon: Code2, label: "Game Dev", color: "text-neon-cyan" },
];

function About() {
  return (
    <PageShell>
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-neon blur-3xl opacity-40 rounded-full" />
            <img src={logo} alt="ItsaBDias" className="relative w-full max-w-sm mx-auto animate-float" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-neon-cyan border border-neon-cyan/40">
              // identity.profile
            </span>
            <h1 className="mt-4 text-4xl sm:text-6xl font-black leading-tight">
              Soy <span className="text-gradient-neon">ItsaBDias</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Creador de contenido gamer y tecnológico. Construyo mundos en Roblox,
              experimento con IA y comparto cada paso del proceso. Mi misión: enseñar
              a la próxima generación a <span className="text-foreground font-semibold">crear, no solo consumir</span>.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {interests.map((i) => (
                <div key={i.label} className="glass rounded-lg p-4 flex items-center gap-3 neon-border">
                  <i.icon className={`h-5 w-5 ${i.color}`} />
                  <span className="font-semibold">{i.label}</span>
                </div>
              ))}
            </div>
            <a
              href="https://youtube.com/@ItsaBDias"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple"
            >
              <Youtube className="h-5 w-5" /> Sígueme en YouTube
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <SectionTitle eyebrow="// timeline" title="Mi viaje" />
          <div className="space-y-4">
            {[
              ["2019", "Primer mundo en Roblox Studio."],
              ["2021", "Comencé a programar en serio."],
              ["2023", "Lancé el canal ItsaBDias en YouTube."],
              ["2025", "Construyendo la comunidad tech del futuro."],
            ].map(([year, text]) => (
              <div key={year} className="glass rounded-lg p-5 flex gap-6 items-center neon-border">
                <div className="text-3xl font-display font-black text-gradient-neon w-24">{year}</div>
                <p className="text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Cpu, Gamepad2, Sparkles, Youtube, Zap, BrainCircuit, Wrench } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ItsaBDias — Aprende tecnología, crea el futuro" },
      { name: "description", content: "Comunidad gamer y tecnológica: programación, IA, hardware, Roblox y desarrollo de videojuegos." },
      { property: "og:title", content: "ItsaBDias — Comunidad Tech & Gamer" },
      { property: "og:description", content: "Aprende tecnología, crea el futuro." },
    ],
  }),
  component: Home,
});

const categories: { icon: typeof Code2; title: string; desc: string; to?: string }[] = [
  { icon: Code2, title: "Programación", desc: "Lenguajes, frameworks y buenas prácticas.", to: "/programacion" },
  { icon: BrainCircuit, title: "Inteligencia Artificial", desc: "IA, ML y herramientas del futuro.", to: "/ai" },
  { icon: Cpu, title: "Hardware & PCs", desc: "Builds, componentes y overclocking.", to: "/hardware" },
  { icon: Gamepad2, title: "Roblox Studio", desc: "Scripts, mundos y monetización.", to: "/roblox" },
  { icon: Sparkles, title: "Desarrollo de Juegos", desc: "Unity, Unreal y motores 2D/3D.", to: "/gamedev" },
  { icon: Zap, title: "Electricidad Básica", desc: "Circuitos, sensores y proyectos DIY.", to: "/electricidad" },
  { icon: Wrench, title: "Software & Ingeniería", desc: "DevOps, arquitectura y sistemas.", to: "/software" },
  { icon: Cpu, title: "Tecnología", desc: "Noticias, gadgets y tendencias.", to: "/tecnologia" },
];

function Home() {
  return (
    <PageShell>
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />

        <div className="text-center px-6 max-w-5xl">
          <img
            src={logo}
            alt="ItsaBDias"
            width={1024}
            height={1024}
            className="mx-auto h-40 w-40 sm:h-56 sm:w-56 object-contain animate-float animate-glow-pulse"
          />
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-mono uppercase tracking-[0.3em] text-neon-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
            Online · Tech Community
          </div>
          <h1 className="mt-6 text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95]">
            <span className="text-gradient-neon">Aprende tecnología,</span>
            <br />
            <span className="text-foreground">crea el futuro.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Bienvenido al universo de <span className="text-neon-cyan font-semibold">ItsaBDias</span>.
            Tutoriales, soporte tech, IA, Roblox y desarrollo de videojuegos para la próxima generación de creadores.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/help"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-blue hover:shadow-neon-purple transition-all"
            >
              Pedir Ayuda Tech
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://youtube.com/@ITSABDIAS"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md glass border border-neon-purple/40 hover:border-neon-purple font-semibold transition-all hover:shadow-neon-purple"
            >
              <Youtube className="h-5 w-5" /> Suscríbete al Canal
            </a>
          </div>

          {/* stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["10+", "Categorías"],
              ["∞", "Tutoriales"],
              ["24/7", "Comunidad"],
              ["AI", "Powered"],
            ].map(([k, v]) => (
              <div key={v} className="glass rounded-lg p-4 neon-border">
                <div className="text-2xl font-bold text-gradient-neon">{k}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="// areas"
            title="Explora el universo tech"
            subtitle="Cada nodo es una puerta a nuevo conocimiento. Elige tu ruta."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c) => {
              const inner = (
                <>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-neon-blue/10 to-neon-purple/10" />
                  <c.icon className="h-8 w-8 text-neon-cyan relative" />
                  <h3 className="mt-4 font-bold text-lg relative">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground relative">{c.desc}</p>
                </>
              );
              const cls =
                "group relative rounded-xl p-6 bg-gradient-card border border-border hover:border-neon-blue/60 hover:-translate-y-1 transition-all overflow-hidden block";
              return c.to ? (
                <Link key={c.title} to={c.to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div key={c.title} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative py-20 px-6">
        <div className="mx-auto max-w-5xl glass rounded-2xl p-10 sm:p-16 text-center neon-border overflow-hidden relative">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold">
              Únete a la <span className="text-gradient-neon">comunidad</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Comparte proyectos, resuelve dudas y conecta con creadores que están construyendo lo siguiente.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/community" className="px-6 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
                Entrar a la comunidad
              </Link>
              <Link to="/projects" className="px-6 py-3 rounded-md glass border border-neon-blue/40 hover:border-neon-blue font-semibold">
                Ver proyectos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

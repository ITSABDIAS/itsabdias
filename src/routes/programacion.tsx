import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import {
  Code2,
  FileCode,
  Palette,
  Braces,
  Atom,
  Sparkles,
  ArrowRight,
  Terminal,
  BookOpen,
  Scissors,
  LifeBuoy,
} from "lucide-react";

export const Route = createFileRoute("/programacion")({
  head: () => ({
    meta: [
      { title: "Programación — ItsaBDias" },
      {
        name: "description",
        content:
          "Aprende HTML, CSS, JavaScript, Python, Lua y React. Tutoriales, snippets y ayuda de código con IA.",
      },
      { property: "og:title", content: "Programación — ItsaBDias" },
      {
        property: "og:description",
        content: "Tutoriales y snippets de los lenguajes que mueven el mundo.",
      },
    ],
  }),
  component: Programacion,
});

const langs = [
  {
    icon: FileCode,
    name: "HTML",
    desc: "La estructura semántica de la web moderna.",
    snippet: `<section>\n  <h1>Hola mundo</h1>\n</section>`,
    color: "text-neon-cyan",
  },
  {
    icon: Palette,
    name: "CSS",
    desc: "Diseño, animaciones, grid, flex y variables.",
    snippet: `.btn {\n  background: linear-gradient(90deg,#0ff,#a0f);\n}`,
    color: "text-neon-purple",
  },
  {
    icon: Braces,
    name: "JavaScript",
    desc: "El lenguaje del navegador, async, ES2025.",
    snippet: `const sum = (a, b) => a + b;\nconsole.log(sum(2, 3));`,
    color: "text-neon-cyan",
  },
  {
    icon: Terminal,
    name: "Python",
    desc: "IA, scripts, automatización y data science.",
    snippet: `def saludo(n):\n  return f"Hola, {n}"\nprint(saludo("Dev"))`,
    color: "text-neon-blue",
  },
  {
    icon: Code2,
    name: "Lua",
    desc: "Ligero y poderoso. Roblox, Love2D y embebidos.",
    snippet: `local function hello(n)\n  print("Hola, "..n)\nend\nhello("Dev")`,
    color: "text-neon-purple",
  },
  {
    icon: Atom,
    name: "React",
    desc: "Componentes, hooks y UI declarativa.",
    snippet: `function App() {\n  return <h1>Hola Mundo</h1>;\n}`,
    color: "text-neon-cyan",
  },
];

const blocks = [
  {
    icon: BookOpen,
    title: "Tutoriales",
    desc: "Guías paso a paso desde cero hasta nivel avanzado.",
  },
  {
    icon: Scissors,
    title: "Snippets",
    desc: "Fragmentos listos para copiar y pegar en tus proyectos.",
  },
  {
    icon: LifeBuoy,
    title: "Ayuda de código",
    desc: "Pega tu error y NEXUS te ayuda a resolverlo al instante.",
  },
];

function Programacion() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle
          eyebrow="// dev.core"
          title="Programación"
          subtitle="Los lenguajes y herramientas que construyen el futuro."
        />

        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-neon-purple/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Code2 className="h-12 w-12 sm:h-16 sm:w-16 text-neon-purple animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Aprende. Crea. Despliega.
              </h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Desde tu primer <span className="text-neon-cyan">Hola Mundo</span>{" "}
                hasta apps reales en producción. Tutoriales prácticos y mentoría con
                IA.
              </p>
              <Link
                to="/ai"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple"
              >
                <Sparkles className="h-4 w-4" /> Pedirle ayuda a NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Braces className="h-5 w-5 text-neon-cyan" /> Lenguajes
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {langs.map((l) => (
              <article
                key={l.name}
                className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-2">
                  <l.icon className={`h-6 w-6 ${l.color}`} />
                  <h4 className="font-bold text-lg">{l.name}</h4>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{l.desc}</p>
                <pre className="mt-3 text-[11px] sm:text-xs font-mono bg-black/60 border border-neon-purple/20 rounded-md p-3 overflow-x-auto text-neon-cyan/90 whitespace-pre">
                  {l.snippet}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Recursos
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {blocks.map((b) => (
              <div
                key={b.title}
                className="glass rounded-xl p-6 neon-border hover:-translate-y-1 transition-all"
              >
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
          <h3 className="text-2xl font-bold">¿Tu código no funciona?</h3>
          <p className="mt-2 text-muted-foreground">
            Pégalo en NEXUS y obtén una explicación clara con la solución.
          </p>
          <Link
            to="/ai"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple"
          >
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Wrench, Database, Server, Network, Cloud, Layout, Sparkles, ArrowRight, GitBranch } from "lucide-react";
import { TutorialsSection } from "@/components/TutorialsSection";

export const Route = createFileRoute("/software")({
  head: () => ({
    meta: [
      { title: "Software & Ingeniería — ItsaBDias" },
      { name: "description", content: "APIs, bases de datos, DevOps, arquitectura, backend, frontend y sistemas distribuidos." },
      { property: "og:title", content: "Software & Ingeniería — ItsaBDias" },
      { property: "og:description", content: "Construye sistemas que escalan." },
    ],
  }),
  component: Software,
});

const topics = [
  { icon: Network, name: "APIs", slug: "apis", desc: "REST, GraphQL, autenticación y rate limiting.", color: "text-neon-cyan" },
  { icon: Database, name: "Bases de datos", slug: "bases-de-datos", desc: "SQL, NoSQL, índices y optimización.", color: "text-neon-purple" },
  { icon: Cloud, name: "DevOps", slug: "devops", desc: "CI/CD, Docker, Kubernetes y observabilidad.", color: "text-neon-blue" },
  { icon: GitBranch, name: "Arquitectura", slug: "arquitectura", desc: "Patrones, DDD, microservicios y monolitos.", color: "text-neon-cyan" },
  { icon: Server, name: "Backend", slug: "backend", desc: "Node, Python, Go y servidores escalables.", color: "text-neon-purple" },
  { icon: Layout, name: "Frontend", slug: "frontend", desc: "React, SSR, performance y accesibilidad.", color: "text-neon-cyan" },
];

const extra = [
  { icon: Network, title: "Sistemas distribuidos", slug: "distribuidos", desc: "Colas, eventos, consistencia y tolerancia a fallos." },
  { icon: Wrench, title: "Buenas prácticas", slug: "arquitectura", desc: "Testing, code review, clean code y SOLID." },
];

function Software() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle eyebrow="// engineering.core" title="Software & Ingeniería" subtitle="Diseña, construye y escala software de nivel profesional." />
        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-neon-blue/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Wrench className="h-12 w-12 sm:h-16 sm:w-16 text-neon-blue animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Pensar como ingeniero</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">Más allá del código: arquitectura, escala, infraestructura y mantenimiento real.</p>
              <Link to="/ai" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple">
                <Sparkles className="h-4 w-4" /> Consultar a NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Server className="h-5 w-5 text-neon-cyan" /> Áreas
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <Link key={t.name} to="/tema/$category/$slug" params={{ category: "software", slug: t.slug }} className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-blue/60 hover:-translate-y-1 transition-all block">
                <div className="flex items-start justify-between">
                  <t.icon className={`h-7 w-7 ${t.color}`} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                </div>
                <h4 className="mt-3 font-bold text-lg">{t.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Avanzado
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {extra.map((b) => (
              <Link key={b.title} to="/tema/$category/$slug" params={{ category: "software", slug: b.slug }} className="glass rounded-xl p-6 neon-border hover:-translate-y-1 transition-all block group">
                <div className="flex items-start justify-between">
                  <b.icon className="h-7 w-7 text-neon-cyan" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                </div>
                <h4 className="mt-3 font-bold text-lg">{b.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass rounded-2xl p-8 text-center neon-border">
          <h3 className="text-2xl font-bold">¿Diseñando un sistema?</h3>
          <p className="mt-2 text-muted-foreground">Pregúntale a NEXUS sobre arquitectura, escalabilidad o decisiones técnicas.</p>
          <Link to="/ai" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
          <TutorialsSection category="software" />
    </PageShell>
  );
}

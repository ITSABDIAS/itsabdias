import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { ArrowLeft, Sparkles, BookOpen, Code2, Lightbulb } from "lucide-react";
import { findTopic, CATEGORY_META, type Topic, type TopicSection, type TopicExample } from "@/lib/topics";

export const Route = createFileRoute("/tema/$category/$slug")({
  loader: ({ params }) => {
    const topic = findTopic(params.category, params.slug);
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.topic.title} — ItsaBDias` },
          { name: "description", content: loaderData.topic.intro },
          { property: "og:title", content: loaderData.topic.title },
          { property: "og:description", content: loaderData.topic.intro },
        ]
      : [{ title: "Tema — ItsaBDias" }],
  }),
  component: TemaPage,
  notFoundComponent: () => (
    <PageShell>
      <section className="py-20 px-6 text-center">
        <h1 className="text-3xl font-bold">Tema no encontrado</h1>
        <p className="mt-3 text-muted-foreground">Este contenido aún no está disponible.</p>
        <Link to="/" className="mt-6 inline-block text-neon-cyan hover:underline">
          ← Volver al inicio
        </Link>
      </section>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <section className="py-20 px-6 text-center">
        <h1 className="text-2xl font-bold">Ups, algo falló</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
      </section>
    </PageShell>
  ),
});

function TemaPage() {
  const { topic } = Route.useLoaderData() as { topic: Topic };
  const meta = CATEGORY_META[topic.category] ?? { label: topic.category, parentPath: "/", accent: "neon-cyan" };
  const nexusHref = `/ai?q=${encodeURIComponent(topic.nexusPrompt)}#chat`;

  return (
    <PageShell>
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link
            to={meta.parentPath}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {meta.label}
          </Link>

          <SectionTitle eyebrow={topic.eyebrow} title={topic.title} subtitle={topic.intro} />

          <div className="mx-auto max-w-3xl flex justify-center">
            <a
              href={nexusHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple hover:shadow-neon-blue transition-all text-sm"
            >
              <Sparkles className="h-4 w-4" /> Preguntar a NEXUS sobre esto
            </a>
          </div>
        </div>
      </section>

      {topic.sections.length > 0 && (
        <section className="py-6 sm:py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neon-cyan" /> Explicación
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {topic.sections.map((s) => (
                <article key={s.heading} className="glass rounded-xl p-5 sm:p-6 neon-border">
                  <h3 className="font-bold text-base sm:text-lg text-neon-cyan">{s.heading}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {topic.examples && topic.examples.length > 0 && (
        <section className="py-6 sm:py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-neon-purple" /> Ejemplos
            </h2>
            <div className="space-y-4">
              {topic.examples.map((ex) => (
                <div key={ex.label} className="rounded-xl border border-border bg-gradient-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold">{ex.label}</span>
                    {ex.lang && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {ex.lang}
                      </span>
                    )}
                  </div>
                  <pre className="text-[11px] sm:text-xs font-mono bg-black/60 p-4 overflow-x-auto text-neon-cyan/90 whitespace-pre">
                    {ex.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-6 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-neon-cyan" /> Consejos clave
          </h2>
          <ul className="glass rounded-xl p-5 sm:p-6 neon-border space-y-2.5">
            {topic.tips.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-neon-purple flex-shrink-0">▸</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl glass rounded-2xl p-6 sm:p-8 text-center neon-border">
          <h3 className="text-xl sm:text-2xl font-bold">¿Necesitas profundizar?</h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            NEXUS puede explicarte este tema con tus propias palabras, darte ejemplos o resolver tus dudas.
          </p>
          <a
            href={nexusHref}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple"
          >
            <Sparkles className="h-4 w-4" /> Abrir NEXUS con este tema
          </a>
        </div>
      </section>
    </PageShell>
  );
}

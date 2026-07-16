import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias — ItsaBDias" },
      { name: "description", content: "Últimas noticias de tecnología, programación, IA y comunidad." },
      { property: "og:title", content: "Noticias — ItsaBDias" },
      { property: "og:description", content: "Últimas noticias de tecnología, programación, IA y comunidad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NoticiasList,
});

function NoticiasList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase.from("news")
        .select("id, slug, title, summary, cover_url, category, is_featured, published_at, views_count")
        .eq("is_hidden", false)
        .lte("published_at", nowIso)
        .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(60);
      setRows(data ?? []); setLoading(false);
    })();
  }, []);

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// noticias" title="Últimas noticias" subtitle="Actualidad, tecnología, IA y comunidad." />
        <div className="mx-auto max-w-6xl">
          {loading && <p className="text-muted-foreground text-sm">Cargando...</p>}
          {!loading && rows.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
              <p className="text-muted-foreground">Aún no hay noticias publicadas.</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(n => (
              <Link key={n.id} to="/noticia/$slug" params={{ slug: n.slug }} className="glass rounded-2xl overflow-hidden border border-border hover:border-neon-cyan/60 transition-all group">
                {n.cover_url && (
                  <div className="aspect-video overflow-hidden bg-secondary/40">
                    <img src={n.cover_url} alt={n.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan uppercase font-mono">{n.category}</span>
                    {n.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 inline-flex items-center gap-1"><Star className="h-3 w-3"/> Destacada</span>}
                  </div>
                  <h3 className="font-display font-bold group-hover:text-neon-cyan transition-colors line-clamp-2">{n.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{n.summary}</p>
                  <p className="text-[11px] text-muted-foreground mt-3 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3"/> {new Date(n.published_at).toLocaleDateString()} · {n.views_count} vistas
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

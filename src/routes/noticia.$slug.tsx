import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { TutorialContent } from "@/components/TutorialContent";
import { Newspaper, Clock, Eye, ArrowLeft, Star } from "lucide-react";

export const Route = createFileRoute("/noticia/$slug")({
  head: () => ({ meta: [{ title: "Noticia — ItsaBDias" }] }),
  component: NoticiaDetail,
});

function NoticiaDetail() {
  const { slug } = useParams({ from: "/noticia/$slug" });
  const [n, setN] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("news").select("*").eq("slug", slug).maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setN(data); setLoading(false);
      await supabase.rpc("increment_news_view", { _id: data.id }).then(() => {});
    })();
  }, [slug]);

  if (loading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (notFound || !n) return (
    <PageShell>
      <section className="py-32 px-6 text-center">
        <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
        <h2 className="font-display text-2xl font-bold mb-2">Noticia no encontrada</h2>
        <Link to="/noticias" className="text-neon-cyan hover:underline text-sm">← Volver a noticias</Link>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <article className="py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link to="/noticias" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-cyan mb-6">
            <ArrowLeft className="h-3.5 w-3.5"/> Todas las noticias
          </Link>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan uppercase font-mono">{n.category}</span>
            {n.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 inline-flex items-center gap-1"><Star className="h-3 w-3"/> Destacada</span>}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">{n.title}</h1>
          <p className="text-muted-foreground">{n.summary}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3"/> {new Date(n.published_at).toLocaleString()}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3"/> {n.views_count} vistas</span>
          </div>
          {n.cover_url && (
            <img src={n.cover_url} alt={n.title} className="w-full rounded-2xl mt-6 border border-border"/>
          )}
          <div className="mt-8">
            <TutorialContent content={n.content}/>
          </div>
        </div>
      </article>
    </PageShell>
  );
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { TutorialCard, type TutorialCardData } from "@/components/TutorialCard";
import { Sparkles, ArrowRight } from "lucide-react";

export function TutorialsSection({ category, title = "Tutoriales" }: { category: string; title?: string }) {
  const [items, setItems] = useState<TutorialCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("tutorials")
        .select("id, category, slug, title, description, level, read_minutes, tags, is_ai_generated, is_featured, views_count, likes_count, comments_count, saves_count")
        .eq("category", category).eq("is_hidden", false)
        .order("is_featured", { ascending: false }).order("views_count", { ascending: false })
        .limit(6);
      if (!cancel) { setItems((data ?? []) as any); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [category]);

  return (
    <section className="py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
          <div>
            <p className="text-xs font-mono text-neon-cyan uppercase">// tutorials</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{title}</h2>
          </div>
          <Link to="/tutoriales" className="text-xs text-neon-cyan hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowRight className="h-3 w-3"/>
          </Link>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-neon-purple mb-3"/>
            <p className="text-muted-foreground">Aún no hay tutoriales en esta categoría.</p>
            <Link to="/admin/tutoriales" className="mt-3 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Generar con NEXUS</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((t) => <TutorialCard key={t.id} t={t}/>)}
          </div>
        )}
      </div>
    </section>
  );
}

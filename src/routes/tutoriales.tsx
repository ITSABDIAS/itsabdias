import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { TutorialCard, type TutorialCardData } from "@/components/TutorialCard";
import { TUTORIAL_CATEGORIES, LEVELS } from "@/lib/tutorials";
import { Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/tutoriales")({
  head: () => ({
    meta: [
      { title: "Tutoriales — ItsaBDias" },
      { name: "description", content: "Todos los tutoriales de ItsaBDias: programación, IA, hardware, gamedev y más." },
      { property: "og:title", content: "Tutoriales — ItsaBDias" },
      { property: "og:description", content: "Aprende con tutoriales creados por la comunidad y NEXUS IA." },
    ],
  }),
  component: TutorialesPage,
});

function TutorialesPage() {
  const [items, setItems] = useState<TutorialCardData[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [lvl, setLvl] = useState<string>("all");
  const [sort, setSort] = useState<"recientes" | "populares" | "destacados">("recientes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tutorials")
        .select("id, category, slug, title, description, level, read_minutes, tags, is_ai_generated, is_featured, views_count, likes_count, comments_count, saves_count")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(300);
      setItems((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let x = items;
    if (cat !== "all") x = x.filter((t) => t.category === cat);
    if (lvl !== "all") x = x.filter((t) => t.level === lvl);
    if (q.trim()) {
      const s = q.toLowerCase();
      x = x.filter((t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s) || t.tags?.some((tg) => tg.toLowerCase().includes(s)));
    }
    if (sort === "populares") x = [...x].sort((a, b) => b.views_count - a.views_count);
    if (sort === "destacados") x = [...x].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return x;
  }, [items, q, cat, lvl, sort]);

  return (
    <PageShell>
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <SectionTitle eyebrow="// tutorials.hub" title="Tutoriales" subtitle="Aprende, guarda y comparte. Todo conectado y en tiempo real." />

        <div className="mx-auto max-w-6xl">
          <div className="glass rounded-2xl p-4 sm:p-5 neon-border flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar tutoriales..."
                className="w-full pl-9 pr-3 py-2.5 bg-input/40 border border-border rounded-md text-sm focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterBtn active={cat === "all"} onClick={() => setCat("all")}>Todas</FilterBtn>
              {TUTORIAL_CATEGORIES.map((c) => (
                <FilterBtn key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>{c.label}</FilterBtn>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterBtn active={lvl === "all"} onClick={() => setLvl("all")}>Todos los niveles</FilterBtn>
              {LEVELS.map((l) => (
                <FilterBtn key={l.slug} active={lvl === l.slug} onClick={() => setLvl(l.slug)}>{l.label}</FilterBtn>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterBtn active={sort === "recientes"} onClick={() => setSort("recientes")}>Recientes</FilterBtn>
              <FilterBtn active={sort === "populares"} onClick={() => setSort("populares")}>Populares</FilterBtn>
              <FilterBtn active={sort === "destacados"} onClick={() => setSort("destacados")}>Destacados</FilterBtn>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && <p className="text-muted-foreground text-sm col-span-full">Cargando...</p>}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full glass rounded-xl p-8 text-center">
                <Sparkles className="h-10 w-10 mx-auto text-neon-purple mb-3" />
                <p className="text-muted-foreground">Aún no hay tutoriales en esta selección.</p>
                <Link to="/admin" className="mt-3 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">
                  Generar con NEXUS
                </Link>
              </div>
            )}
            {filtered.map((t) => (<TutorialCard key={t.id} t={t} />))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs border transition-all ${active ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

import { Link } from "@tanstack/react-router";
import { Eye, Heart, MessageCircle, Bookmark, Clock, Sparkles, Star } from "lucide-react";
import { levelMeta } from "@/lib/tutorials";

export type TutorialCardData = {
  id: string;
  category: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  read_minutes: number;
  tags: string[];
  is_ai_generated: boolean;
  is_featured: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  saves_count: number;
};

export function TutorialCard({ t }: { t: TutorialCardData }) {
  const lv = levelMeta(t.level);
  return (
    <Link
      to="/tutorial/$category/$slug"
      params={{ category: t.category, slug: t.slug }}
      className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all block"
    >
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${lv.color}`}>{lv.label}</span>
        {t.is_featured && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan inline-flex items-center gap-1">
            <Star className="h-3 w-3" /> Destacado
          </span>
        )}
        {t.is_ai_generated && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-neon-purple inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> NEXUS IA
          </span>
        )}
      </div>
      <h4 className="font-bold text-base sm:text-lg group-hover:text-neon-cyan transition-colors line-clamp-2">
        {t.title}
      </h4>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-3">{t.description}</p>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.read_minutes} min</span>
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {t.views_count}</span>
        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {t.likes_count}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t.comments_count}</span>
        <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> {t.saves_count}</span>
      </div>
    </Link>
  );
}

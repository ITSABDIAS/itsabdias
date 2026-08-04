import { Link } from "@tanstack/react-router";
import { Clock, BookOpen, Users, Sparkles, Star } from "lucide-react";
import { levelMeta } from "@/lib/tutorials";
import { fmtMinutes, type AcademyCourse } from "@/lib/academy";

export function CourseCard({ c, progress }: { c: AcademyCourse; progress?: number }) {
  const lv = levelMeta(c.level);
  return (
    <Link
      to="/curso/$slug"
      params={{ slug: c.slug }}
      className="group rounded-xl overflow-hidden bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all block"
    >
      <div className="relative h-28 sm:h-32 bg-gradient-to-br from-neon-purple/25 to-neon-cyan/15 flex items-center justify-center overflow-hidden">
        {c.image_url ? (
          <img src={c.image_url} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <BookOpen className="h-9 w-9 text-neon-cyan/70" />
        )}
        {c.is_featured && (
          <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-black/70 text-neon-cyan inline-flex items-center gap-1">
            <Star className="h-3 w-3" /> Destacado
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${lv.color}`}>{lv.label}</span>
          {c.is_nexus && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-neon-purple inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Creado por NEXUS
            </span>
          )}
        </div>
        <h4 className="font-bold text-base group-hover:text-neon-cyan transition-colors line-clamp-2">{c.title}</h4>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {c.lessons_count} lecciones</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtMinutes(c.estimated_minutes)}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.students_count}</span>
        </div>
        {typeof progress === "number" && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
              <div className="h-full bg-gradient-neon transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-neon-cyan">{progress}% completado</p>
          </div>
        )}
      </div>
    </Link>
  );
}

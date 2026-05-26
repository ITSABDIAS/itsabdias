import { RankBadge, RANK_META, RANK_PRIORITY, type RankSlug } from "@/components/RankBadge";
import { Lock, Check } from "lucide-react";

type Unlock =
  | { kind: "auto"; label: string }
  | { kind: "manual"; label: string }
  | { kind: "exclusive"; label: string }
  | { kind: "subscription"; label: string };

export const RANK_INFO: Record<RankSlug, { description: string; unlock: Unlock }> = {
  founder: {
    description: "Creador original de ITSABDIAS. Rango máximo absoluto del sistema.",
    unlock: { kind: "exclusive", label: "Exclusivo — no asignable" },
  },
  admin: {
    description: "Acceso completo de administración. Gestiona la comunidad y al staff.",
    unlock: { kind: "manual", label: "Asignado por Founder" },
  },
  moderator: {
    description: "Modera publicaciones, comentarios y reportes en la comunidad.",
    unlock: { kind: "manual", label: "Asignado por administradores" },
  },
  developer: {
    description: "Constructor activo. Reconocimiento a quienes crean en la plataforma.",
    unlock: { kind: "auto", label: "Crea 5 proyectos" },
  },
  ai_expert: {
    description: "Especialista en inteligencia artificial dentro de la comunidad.",
    unlock: { kind: "auto", label: "3 proyectos de categoría IA · o aprobado por staff" },
  },
  premium: {
    description: "Suscriptor Premium. Acceso anticipado y beneficios exclusivos.",
    unlock: { kind: "subscription", label: "Suscripción Premium $3.99/mes" },
  },
  verified: {
    description: "Identidad verificada por el equipo. Cuenta de confianza.",
    unlock: { kind: "manual", label: "Asignado por administradores" },
  },
  member: {
    description: "Miembro activo de la comunidad. Primer hito de progresión.",
    unlock: { kind: "auto", label: "30 minutos de actividad" },
  },
};

const KIND_STYLE: Record<Unlock["kind"], { color: string; Icon: any; label: string }> = {
  auto:         { color: "#22d3ee", Icon: Check, label: "AUTO" },
  manual:       { color: "#a855f7", Icon: Lock,  label: "STAFF" },
  exclusive:    { color: "#ff00aa", Icon: Lock,  label: "ÚNICO" },
  subscription: { color: "#fbbf24", Icon: Lock,  label: "PREMIUM" },
};

export function RankGuide({ userRoles = [] }: { userRoles?: RankSlug[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {RANK_PRIORITY.map((slug) => {
        const meta = RANK_META[slug];
        const info = RANK_INFO[slug];
        const k = KIND_STYLE[info.unlock.kind];
        const owned = userRoles.includes(slug);
        const KindIcon = k.Icon;
        return (
          <div
            key={slug}
            className="relative rounded-xl p-4 border bg-card/40 backdrop-blur-sm transition-all hover:translate-y-[-2px]"
            style={{
              borderColor: owned ? `${meta.color}99` : `${meta.color}33`,
              boxShadow: owned ? `0 0 18px ${meta.color}44` : "none",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <RankBadge slug={slug} size="md" />
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest border"
                style={{ color: k.color, borderColor: `${k.color}55`, background: `${k.color}11` }}
              >
                <KindIcon className="h-3 w-3" />
                {k.label}
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-snug">{info.description}</p>
            <p className="mt-2 text-xs font-mono text-muted-foreground">
              <span className="text-neon-cyan">// </span>
              {info.unlock.label}
            </p>
            {owned && (
              <span className="absolute top-2 right-2 text-[9px] font-mono uppercase tracking-widest text-neon-green">
                ●
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

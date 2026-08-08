import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Clock, PauseCircle, ShieldAlert, VolumeX, LogOut } from "lucide-react";
import { SANCTION_META, remainingFrom, type Sanction } from "@/lib/sanctions";

const ICONS = { muted: VolumeX, suspended: PauseCircle, banned: Ban } as const;

function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
}

function Unit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex-1 min-w-[68px] rounded-xl border px-2 py-3 text-center backdrop-blur-xl"
      style={{ borderColor: `${color}55`, background: `${color}12`, boxShadow: `0 0 18px ${color}22` }}
    >
      <p className="font-display text-2xl sm:text-3xl font-black tabular-nums" style={{ color }}>
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">{label}</p>
    </div>
  );
}

export function SanctionCountdown({ sanction, compact = false }: { sanction: Sanction; compact?: boolean }) {
  useTick();
  const meta = SANCTION_META[sanction.status];
  if (sanction.is_permanent || !sanction.until) {
    return (
      <p className="text-sm font-mono" style={{ color: meta.color }}>
        Sanción permanente — sin fecha de finalización.
      </p>
    );
  }
  const r = remainingFrom(sanction.until);
  const start = sanction.started_at ? new Date(sanction.started_at).getTime() : Date.now();
  const end = new Date(sanction.until).getTime();
  const total = Math.max(1, end - start);
  const pct = Math.min(100, Math.max(0, ((total - r.totalMs) / total) * 100));

  if (compact) {
    return (
      <span className="font-mono tabular-nums" style={{ color: meta.color }}>
        {r.days}d {String(r.hours).padStart(2, "0")}h {String(r.minutes).padStart(2, "0")}m {String(r.seconds).padStart(2, "0")}s
      </span>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Unit value={r.days} label="días" color={meta.color} />
        <Unit value={r.hours} label="horas" color={meta.color} />
        <Unit value={r.minutes} label="min" color={meta.color} />
        <Unit value={r.seconds} label="seg" color={meta.color} />
      </div>
      <div className="mt-4 h-2 rounded-full bg-secondary/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}66)`, boxShadow: `0 0 12px ${meta.glow}` }}
        />
      </div>
      <p className="mt-2 text-[11px] font-mono text-muted-foreground text-right">{Math.round(pct)}% completado</p>
    </div>
  );
}

/** Full-screen block used for suspensions and bans. */
export function SanctionScreen({ sanction, onSignOut }: { sanction: Sanction; onSignOut?: () => void }) {
  const meta = SANCTION_META[sanction.status];
  const Icon = ICONS[sanction.status];
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 -z-10 bg-background" />
      <div className="fixed inset-0 -z-10 grid-bg opacity-30" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: `radial-gradient(60% 50% at 50% 0%, ${meta.color}22, transparent 70%)` }}
      />
      <div
        className="w-full max-w-xl rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl bg-white/5"
        style={{ borderColor: `${meta.color}55`, boxShadow: `0 0 60px ${meta.glow}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${meta.color}22`, color: meta.color, boxShadow: `0 0 24px ${meta.glow}` }}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">// account.status</p>
            <h1 className="font-display text-2xl sm:text-3xl font-black" style={{ color: meta.color }}>
              Cuenta {meta.label.toLowerCase()}
            </h1>
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm">
          <Row icon={<AlertTriangle className="h-4 w-4" />} label="Motivo" value={sanction.reason || "No especificado"} />
          <Row icon={<ShieldAlert className="h-4 w-4" />} label="Staff responsable" value={sanction.staff_username || "Equipo ItsaBDias"} />
          <Row
            icon={<Clock className="h-4 w-4" />}
            label="Fecha de inicio"
            value={sanction.started_at ? new Date(sanction.started_at).toLocaleString() : "—"}
          />
          <Row
            icon={<Clock className="h-4 w-4" />}
            label="Finaliza"
            value={sanction.is_permanent || !sanction.until ? "Permanente" : new Date(sanction.until).toLocaleString()}
          />
        </div>

        <div className="mt-6">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">🕒 Tiempo restante</p>
          <SanctionCountdown sanction={sanction} />
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {sanction.is_permanent
            ? "Esta sanción es permanente. Si crees que es un error, contacta al equipo por correo."
            : "Tu acceso se restaurará automáticamente cuando finalice el tiempo indicado."}
        </p>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm hover:bg-secondary/60"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/60 bg-white/5 px-3 py-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm break-words whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
}

/** Slim inline banner used for muted users (they can still browse). */
export function MuteBanner({ sanction }: { sanction: Sanction }) {
  const meta = SANCTION_META.muted;
  return (
    <div
      className="mx-auto max-w-6xl my-3 px-4 py-3 rounded-xl border backdrop-blur-xl flex flex-wrap items-center gap-x-3 gap-y-1"
      style={{ borderColor: `${meta.color}55`, background: `${meta.color}10`, boxShadow: `0 0 20px ${meta.color}22` }}
    >
      <VolumeX className="h-4 w-4" style={{ color: meta.color }} />
      <span className="text-sm font-bold" style={{ color: meta.color }}>Estás silenciado</span>
      <span className="text-xs text-muted-foreground">
        No puedes publicar, comentar ni enviar mensajes. {sanction.reason ? `Motivo: ${sanction.reason}` : ""}
      </span>
      <span className="ml-auto text-xs">
        <SanctionCountdown sanction={sanction} compact />
      </span>
    </div>
  );
}

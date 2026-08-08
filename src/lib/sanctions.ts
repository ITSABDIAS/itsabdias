export type SanctionType = "muted" | "suspended" | "banned";

export type Sanction = {
  status: SanctionType;
  reason: string | null;
  until: string | null;
  started_at: string | null;
  is_permanent: boolean;
  staff_username: string | null;
};

export const SANCTION_META: Record<SanctionType, { label: string; verb: string; color: string; glow: string }> = {
  muted: { label: "Silenciado", verb: "silenciar", color: "#facc15", glow: "rgba(250,204,21,0.45)" },
  suspended: { label: "Suspendido", verb: "suspender", color: "#fb923c", glow: "rgba(251,146,60,0.45)" },
  banned: { label: "Baneado", verb: "banear", color: "#ef4444", glow: "rgba(239,68,68,0.45)" },
};

export type DurationOption = { label: string; minutes: number | null };

export const MUTE_DURATIONS: DurationOption[] = [
  { label: "1 hora", minutes: 60 },
  { label: "6 horas", minutes: 360 },
  { label: "12 horas", minutes: 720 },
  { label: "24 horas", minutes: 1440 },
  { label: "3 días", minutes: 4320 },
  { label: "7 días", minutes: 10080 },
  { label: "15 días", minutes: 21600 },
  { label: "30 días", minutes: 43200 },
  { label: "Personalizado", minutes: null },
];

export const SUSPEND_DURATIONS: DurationOption[] = [
  { label: "1 día", minutes: 1440 },
  { label: "3 días", minutes: 4320 },
  { label: "7 días", minutes: 10080 },
  { label: "15 días", minutes: 21600 },
  { label: "30 días", minutes: 43200 },
  { label: "Personalizado", minutes: null },
];

export const BAN_DURATIONS: DurationOption[] = [
  { label: "7 días", minutes: 10080 },
  { label: "15 días", minutes: 21600 },
  { label: "30 días", minutes: 43200 },
  { label: "60 días", minutes: 86400 },
  { label: "90 días", minutes: 129600 },
  { label: "Personalizado", minutes: null },
];

export function untilFromMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function formatDuration(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} día(s)`;
  if (minutes % 60 === 0) return `${minutes / 60} hora(s)`;
  return `${minutes} minuto(s)`;
}

export type Remaining = { days: number; hours: number; minutes: number; seconds: number; totalMs: number };

export function remainingFrom(untilIso: string): Remaining {
  const totalMs = Math.max(0, new Date(untilIso).getTime() - Date.now());
  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  };
}

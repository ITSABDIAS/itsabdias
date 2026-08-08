import { useState } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";
import {
  SANCTION_META,
  MUTE_DURATIONS,
  SUSPEND_DURATIONS,
  BAN_DURATIONS,
  untilFromMinutes,
  type DurationOption,
  type SanctionType,
} from "@/lib/sanctions";

const DURATIONS: Record<SanctionType, DurationOption[]> = {
  muted: MUTE_DURATIONS,
  suspended: SUSPEND_DURATIONS,
  banned: BAN_DURATIONS,
};

export function SanctionDialog({
  type,
  username,
  onCancel,
  onConfirm,
}: {
  type: SanctionType;
  username: string;
  onCancel: () => void;
  onConfirm: (args: { reason: string; until: string }) => Promise<void> | void;
}) {
  const meta = SANCTION_META[type];
  const options = DURATIONS[type];
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<number>(0);
  const [customValue, setCustomValue] = useState(1);
  const [customUnit, setCustomUnit] = useState<"hours" | "days">("days");
  const [busy, setBusy] = useState(false);

  const isCustom = options[selected]?.minutes === null;
  const minutes = isCustom
    ? Math.max(1, Math.round(customValue)) * (customUnit === "hours" ? 60 : 1440)
    : (options[selected]?.minutes ?? 60);
  const endsAt = new Date(Date.now() + minutes * 60_000);

  const submit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    await onConfirm({ reason: reason.trim(), until: untilFromMinutes(minutes) });
    setBusy(false);
  };

  return (
    <Overlay onCancel={onCancel}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">// moderation.action</p>
          <h3 className="font-display text-xl font-black" style={{ color: meta.color }}>
            {meta.label}: {username}
          </h3>
        </div>
        <button onClick={onCancel} className="p-1 rounded-md hover:bg-secondary/60"><X className="h-4 w-4" /></button>
      </div>

      <label className="block mt-5 text-xs font-mono uppercase tracking-widest text-muted-foreground">Motivo *</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Describe el motivo de la sanción…"
        className="mt-1 w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
      />

      <label className="block mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">Duración</label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <button
            key={o.label}
            onClick={() => setSelected(i)}
            className="px-3 py-1.5 rounded-md text-xs border transition"
            style={
              selected === i
                ? { borderColor: meta.color, background: `${meta.color}22`, color: meta.color }
                : { borderColor: "hsl(var(--border))" }
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={customValue}
            onChange={(e) => setCustomValue(Number(e.target.value))}
            className="w-24 px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value as any)}
            className="px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
          >
            <option value="hours">horas</option>
            <option value="days">días</option>
          </select>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" /> Finaliza el <span className="font-mono text-foreground">{endsAt.toLocaleString()}</span>
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-secondary/60">Cancelar</button>
        <button
          onClick={submit}
          disabled={!reason.trim() || busy}
          className="px-4 py-2 rounded-md text-sm font-bold disabled:opacity-40"
          style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}`, color: meta.color }}
        >
          {busy ? "Aplicando…" : `Confirmar ${meta.label.toLowerCase()}`}
        </button>
      </div>
    </Overlay>
  );
}

export function PermanentBanDialog({
  username,
  staffName,
  onCancel,
  onConfirm,
}: {
  username: string;
  staffName: string;
  onCancel: () => void;
  onConfirm: (args: { reason: string; evidence: string }) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (reason.trim().length < 10) return;
    setBusy(true);
    await onConfirm({ reason: reason.trim(), evidence: evidence.trim() });
    setBusy(false);
  };

  return (
    <Overlay onCancel={onCancel}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">// permanent.ban.request</p>
          <h3 className="font-display text-xl font-black text-red-400">Solicitud de ban permanente</h3>
        </div>
        <button onClick={onCancel} className="p-1 rounded-md hover:bg-secondary/60"><X className="h-4 w-4" /></button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground inline-flex items-start gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5" />
        Esta acción NO se ejecuta al instante: la solicitud se envía al Founder para aprobación.
      </p>

      <Field label="Usuario"><input readOnly value={username} className="w-full px-3 py-2 rounded-md bg-input/30 border border-border text-sm text-muted-foreground" /></Field>
      <Field label="Staff solicitante"><input readOnly value={staffName} className="w-full px-3 py-2 rounded-md bg-input/30 border border-border text-sm text-muted-foreground" /></Field>
      <Field label="Motivo detallado *">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={1000}
          placeholder="Explica con detalle la infracción (mín. 10 caracteres)…"
          className="w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm" />
      </Field>
      <Field label="Evidencias">
        <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3} maxLength={1000}
          placeholder="Enlaces, capturas, IDs de publicaciones…"
          className="w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm" />
      </Field>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-secondary/60">Cancelar</button>
        <button onClick={submit} disabled={reason.trim().length < 10 || busy}
          className="px-4 py-2 rounded-md text-sm font-bold border border-red-500 text-red-300 bg-red-500/15 disabled:opacity-40">
          {busy ? "Enviando…" : "Enviar al Founder"}
        </button>
      </div>
    </Overlay>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function Overlay({ children, onCancel }: { children: React.ReactNode; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card/90 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

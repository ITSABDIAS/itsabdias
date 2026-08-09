import { useState } from "react";
import { X, ShieldAlert, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { createReport, reasonsFor, TARGET_LABEL, type ReportTargetType } from "@/lib/reports";

export function ReportDialog({
  targetType,
  targetUserId,
  targetContentId,
  targetLabel,
  onClose,
}: {
  targetType: ReportTargetType;
  targetUserId?: string | null;
  targetContentId?: string | null;
  targetLabel?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const reasons = reasonsFor(targetType);
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("La imagen supera 5 MB");
    setUploading(true);
    const path = `reports/${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("project-images").upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
    } else {
      const { data } = supabase.storage.from("project-images").getPublicUrl(path);
      setShotUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!user) return toast.error("Inicia sesión para reportar");
    setBusy(true);
    const ok = await createReport({
      targetType,
      reason,
      targetUserId,
      targetContentId,
      description: description.trim() || undefined,
      evidence: evidence.trim() || undefined,
      screenshotUrl: shotUrl,
    });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-red-500/30 bg-card/90 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">// report.create</p>
            <h3 className="font-display text-xl font-black text-red-400 inline-flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Reportar {TARGET_LABEL[targetType].toLowerCase()}
            </h3>
            {targetLabel && <p className="text-xs text-muted-foreground mt-1 break-words">{targetLabel}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block mt-5 text-xs font-mono uppercase tracking-widest text-muted-foreground">Motivo *</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`px-3 py-1.5 rounded-md text-xs border transition ${
                reason === r
                  ? "border-red-500 bg-red-500/15 text-red-300"
                  : "border-border text-muted-foreground hover:border-red-500/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <label className="block mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Explica qué ocurrió…"
          className="mt-1 w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm focus:outline-none focus:border-red-500/60"
        />

        <label className="block mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">Evidencia</label>
        <textarea
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Enlaces, nombres, fechas…"
          className="mt-1 w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm focus:outline-none focus:border-red-500/60"
        />

        <label className="block mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">Captura (opcional)</label>
        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-xs cursor-pointer hover:border-neon-cyan/60">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Subiendo…" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          {shotUrl && <img src={shotUrl} alt="Captura adjunta al reporte" className="h-12 w-12 rounded-md object-cover border border-border" />}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-secondary/60">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={busy || uploading}
            className="px-4 py-2 rounded-md text-sm font-bold border border-red-500 text-red-300 bg-red-500/15 disabled:opacity-40"
          >
            {busy ? "Enviando…" : "Enviar reporte"}
          </button>
        </div>
      </div>
    </div>
  );
}

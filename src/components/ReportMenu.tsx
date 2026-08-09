import { useEffect, useRef, useState } from "react";
import { MoreVertical, Flag } from "lucide-react";
import { ReportDialog } from "./ReportDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ReportTargetType } from "@/lib/reports";

/** ⋮ menu with a real "Reportar" action. Hidden for your own content. */
export function ReportMenu({
  targetType,
  targetUserId,
  targetContentId,
  targetLabel,
  label = "Reportar",
  className = "",
}: {
  targetType: ReportTargetType;
  targetUserId?: string | null;
  targetContentId?: string | null;
  targetLabel?: string;
  label?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (user && targetUserId && user.id === targetUserId) return null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        aria-label="Opciones"
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[13rem] rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in">
          <button
            onClick={() => {
              setOpen(false);
              if (!user) return toast.error("Inicia sesión para reportar");
              setDialog(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Flag className="h-4 w-4" /> 🚨 {label}
          </button>
        </div>
      )}

      {dialog && (
        <ReportDialog
          targetType={targetType}
          targetUserId={targetUserId}
          targetContentId={targetContentId}
          targetLabel={targetLabel}
          onClose={() => setDialog(false)}
        />
      )}
    </div>
  );
}

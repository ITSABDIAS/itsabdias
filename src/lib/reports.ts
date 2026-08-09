import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReportTargetType = "user" | "post" | "comment" | "tutorial" | "project";
export type ReportStatus = "new" | "reviewing" | "action_required" | "escalated" | "resolved" | "closed";
export type ReportPriority = "low" | "normal" | "high" | "critical";

export type Report = {
  id: string;
  number: number;
  reporter_id: string;
  target_type: ReportTargetType;
  target_user_id: string | null;
  target_content_id: string | null;
  reason: string;
  description: string | null;
  evidence: string | null;
  screenshot_url: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  assigned_to: string | null;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  is_false_report: boolean;
  duplicate_of: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportAction = {
  id: string;
  report_id: string;
  staff_id: string | null;
  action: string;
  reason: string | null;
  result: string | null;
  created_at: string;
};

export const USER_REASONS = [
  "Acoso",
  "Insultos",
  "Spam",
  "Contenido inapropiado",
  "Suplantación",
  "Fraude o engaño",
  "Abuso de la plataforma",
  "Cuenta sospechosa",
  "Otro",
];

export const CONTENT_REASONS = [
  "Spam",
  "Contenido inapropiado",
  "Acoso",
  "Insultos",
  "Información falsa",
  "Fraude o engaño",
  "Otro",
];

export const TUTORIAL_REASONS = [
  "Información incorrecta",
  "Spam",
  "Contenido inapropiado",
  "Tutorial duplicado",
  "Código problemático",
  "Otro",
];

export function reasonsFor(t: ReportTargetType) {
  if (t === "user") return USER_REASONS;
  if (t === "tutorial") return TUTORIAL_REASONS;
  return CONTENT_REASONS;
}

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  user: "Usuario",
  post: "Publicación",
  comment: "Comentario",
  tutorial: "Tutorial",
  project: "Proyecto",
};

export const STATUS_META: Record<ReportStatus, { label: string; color: string; dot: string }> = {
  new: { label: "Nuevo", color: "#38bdf8", dot: "🔵" },
  reviewing: { label: "En revisión", color: "#facc15", dot: "🟡" },
  action_required: { label: "Acción requerida", color: "#fb923c", dot: "🟠" },
  escalated: { label: "Escalado", color: "#ef4444", dot: "🔴" },
  resolved: { label: "Resuelto", color: "#22c55e", dot: "🟢" },
  closed: { label: "Cerrado", color: "#94a3b8", dot: "⚫" },
};

export const PRIORITY_META: Record<ReportPriority, { label: string; color: string; dot: string; weight: number }> = {
  low: { label: "Baja", color: "#22c55e", dot: "🟢", weight: 0 },
  normal: { label: "Normal", color: "#facc15", dot: "🟡", weight: 1 },
  high: { label: "Alta", color: "#fb923c", dot: "🟠", weight: 2 },
  critical: { label: "Crítica", color: "#ef4444", dot: "🔴", weight: 3 },
};

export function reportCode(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

export async function createReport(input: {
  targetType: ReportTargetType;
  reason: string;
  targetUserId?: string | null;
  targetContentId?: string | null;
  description?: string;
  evidence?: string;
  screenshotUrl?: string | null;
}) {
  const { error } = await supabase.rpc("create_report" as any, {
    _target_type: input.targetType,
    _reason: input.reason,
    _target_user_id: input.targetUserId ?? null,
    _target_content_id: input.targetContentId ?? null,
    _description: input.description ?? null,
    _evidence: input.evidence ?? null,
    _screenshot_url: input.screenshotUrl ?? null,
  });
  if (error) {
    toast.error(error.message);
    return false;
  }
  toast.success("Reporte enviado correctamente");
  return true;
}

export async function updateReport(
  id: string,
  patch: {
    status?: ReportStatus;
    priority?: ReportPriority;
    assignTo?: string | null;
    resolution?: string | null;
    falseReport?: boolean;
    duplicateOf?: string | null;
  },
) {
  const { error } = await supabase.rpc("staff_update_report" as any, {
    _id: id,
    _status: patch.status ?? null,
    _priority: patch.priority ?? null,
    _assign_to: patch.assignTo ?? null,
    _resolution: patch.resolution ?? null,
    _false_report: patch.falseReport ?? null,
    _duplicate_of: patch.duplicateOf ?? null,
  });
  if (error) {
    toast.error(error.message);
    return false;
  }
  toast.success("Reporte actualizado");
  return true;
}

export async function warnUser(target: string, reason: string, reportId?: string) {
  const { error } = await supabase.rpc("staff_warn_user" as any, {
    _target: target,
    _reason: reason,
    _report_id: reportId ?? null,
  });
  if (error) {
    toast.error(error.message);
    return false;
  }
  toast.success("Advertencia enviada");
  return true;
}

export async function removePermanentBan(target: string, reason?: string) {
  const { error } = await supabase.rpc("founder_remove_permanent_ban" as any, {
    _target: target,
    _reason: reason ?? null,
  });
  if (error) {
    toast.error(error.message);
    return false;
  }
  toast.success("Ban permanente retirado");
  return true;
}

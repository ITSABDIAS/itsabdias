import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppStatus = "pending" | "reviewing" | "accepted" | "rejected" | "closed";
export type AppPhase = "application" | "training" | "pending_evaluation" | "extra_training" | "approved" | "rejected";

export type StaffApplication = {
  id: string;
  user_id: string;
  motivation: string;
  contribution: string;
  experience: string;
  tech_knowledge: string;
  conflict_answer: string;
  trust_answer: string;
  status: AppStatus;
  phase: AppPhase;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffModule = {
  id: string; slug: string; position: number; title: string; description: string; icon: string;
};
export type StaffLesson = {
  id: string; module_id: string; position: number; title: string; description: string;
  content: string; examples: string | null; key_points: string | null; min_seconds: number; is_required: boolean;
};
export type StaffExam = {
  id: string; module_id: string; slug: string; title: string; description: string;
  pass_score: number; max_attempts: number; position: number;
};
export type ExamQuestion = { id: string; kind: "multiple" | "boolean" | "case"; prompt: string; options: string[] };
export type ExamAttempt = {
  id: string; exam_id: string; attempt_number: number; score: number; passed: boolean;
  detail: any; created_at: string;
};
export type Progress = {
  lessons_total: number; lessons_done: number; exams_total: number; exams_passed: number;
  percent: number; training_complete: boolean;
};
export type Evaluation = {
  id: string; application_id: string; evaluator_id: string | null;
  knowledge: number; responsibility: number; moderation: number;
  communication: number; security: number; ethics: number;
  overall_note: string | null; recommendation: "approve" | "reject" | "extra_training"; created_at: string;
};
export type HistoryEntry = {
  id: string; application_id: string | null; user_id: string; actor_id: string | null;
  actor_role: string | null; action: string; result: string | null; detail: string | null; created_at: string;
};

export const STATUS_META: Record<AppStatus, { label: string; dot: string; color: string }> = {
  pending:   { label: "Pendiente",  dot: "🟡", color: "#fbbf24" },
  reviewing: { label: "En revisión", dot: "🔵", color: "#3b82f6" },
  accepted:  { label: "Aceptado",   dot: "🟢", color: "#10b981" },
  rejected:  { label: "Rechazado",  dot: "🔴", color: "#ef4444" },
  closed:    { label: "Cerrado",    dot: "⚫", color: "#94a3b8" },
};

export const PHASE_LABEL: Record<AppPhase, string> = {
  application: "Solicitud enviada",
  training: "En formación",
  pending_evaluation: "Pendiente de evaluación",
  extra_training: "Formación adicional requerida",
  approved: "Aprobado como Moderador",
  rejected: "Candidatura rechazada",
};

export const ACTION_LABEL: Record<string, string> = {
  application_created: "Solicitud creada",
  application_reviewing: "Solicitud en revisión",
  application_accepted: "Solicitud aceptada",
  application_rejected: "Solicitud rechazada",
  application_closed: "Solicitud cerrada",
  lesson_completed: "Clase completada",
  exam_passed: "Examen aprobado",
  exam_failed: "Examen no aprobado",
  training_completed: "Formación completada",
  evaluation_created: "Evaluación registrada",
  candidate_approved: "Candidato aprobado",
  candidate_rejected: "Candidato rechazado",
  extra_training_required: "Formación adicional requerida",
};

const rpc = (name: string, args: Record<string, unknown>) => supabase.rpc(name as any, args as any);

export async function getMyApplication(userId: string): Promise<StaffApplication | null> {
  const { data } = await supabase
    .from("staff_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function applyToProgram(input: {
  motivation: string; contribution: string; experience: string;
  tech: string; conflict: string; trust: string;
}) {
  const { data, error } = await rpc("staff_program_apply", {
    _motivation: input.motivation, _contribution: input.contribution, _experience: input.experience,
    _tech: input.tech, _conflict: input.conflict, _trust: input.trust,
  });
  if (error) { toast.error(error.message); return null; }
  toast.success("Solicitud enviada al Staff");
  return data as string;
}

export async function getProgress(userId: string): Promise<Progress | null> {
  const { data, error } = await rpc("staff_program_check_training", { _user: userId });
  if (error) return null;
  return data as unknown as Progress;
}

export async function getCurriculum() {
  const [{ data: modules }, { data: lessons }, { data: exams }] = await Promise.all([
    supabase.from("staff_modules").select("*").order("position"),
    supabase.from("staff_lessons").select("*").order("position"),
    supabase.from("staff_exams").select("*").order("position"),
  ]);
  return {
    modules: (modules ?? []) as unknown as StaffModule[],
    lessons: (lessons ?? []) as unknown as StaffLesson[],
    exams: (exams ?? []) as unknown as StaffExam[],
  };
}

export async function getMyLessonProgress(userId: string) {
  const { data } = await supabase.from("staff_lesson_progress").select("lesson_id").eq("user_id", userId);
  return new Set((data ?? []).map((r: any) => r.lesson_id as string));
}

export async function getMyAttempts(userId: string): Promise<ExamAttempt[]> {
  const { data } = await supabase
    .from("staff_exam_attempts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as unknown as ExamAttempt[];
}

export async function completeLesson(lessonId: string, seconds: number) {
  const { data, error } = await rpc("staff_complete_lesson", { _lesson_id: lessonId, _seconds: seconds });
  if (error) { toast.error(error.message); return null; }
  toast.success("Clase completada");
  return data as unknown as Progress;
}

export async function fetchExam(examId: string) {
  const { data, error } = await rpc("staff_get_exam", { _exam_id: examId });
  if (error) { toast.error(error.message); return null; }
  return data as unknown as { exam: StaffExam; questions: ExamQuestion[]; attempts_used: number };
}

export async function submitExam(examId: string, answers: Record<string, string>) {
  const { data, error } = await rpc("staff_submit_exam", { _exam_id: examId, _answers: answers });
  if (error) { toast.error(error.message); return null; }
  return data as unknown as { score: number; passed: boolean; detail: any[]; attempts_used: number };
}

/* ---- Staff side ---- */

export async function listApplications(status?: AppStatus | "all") {
  let q = supabase.from("staff_applications").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as unknown as StaffApplication[];
}

export async function reviewApplication(id: string, status: AppStatus, note?: string) {
  const { error } = await rpc("staff_program_review", { _id: id, _status: status, _note: note ?? null });
  if (error) { toast.error(error.message); return false; }
  toast.success(`Solicitud: ${STATUS_META[status].label}`);
  return true;
}

export async function evaluateCandidate(applicationId: string, scores: {
  knowledge: number; responsibility: number; moderation: number;
  communication: number; security: number; ethics: number;
}, note: string, recommendation: "approve" | "reject" | "extra_training") {
  const { error } = await rpc("staff_program_evaluate", {
    _application_id: applicationId,
    _knowledge: scores.knowledge, _responsibility: scores.responsibility, _moderation: scores.moderation,
    _communication: scores.communication, _security: scores.security, _ethics: scores.ethics,
    _note: note || null, _recommendation: recommendation,
  });
  if (error) { toast.error(error.message); return false; }
  toast.success("Evaluación registrada");
  return true;
}

export async function decideCandidate(applicationId: string, decision: "approve" | "reject" | "extra_training", note?: string) {
  const { error } = await rpc("staff_program_decide", {
    _application_id: applicationId, _decision: decision, _note: note ?? null,
  });
  if (error) { toast.error(error.message); return false; }
  toast.success(decision === "approve" ? "Candidato promovido a Moderador" : "Decisión registrada");
  return true;
}

export async function getHistory(userId?: string) {
  let q = supabase.from("staff_program_history").select("*").order("created_at", { ascending: false }).limit(200);
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q;
  return (data ?? []) as unknown as HistoryEntry[];
}

export async function getEvaluations(applicationId: string) {
  const { data } = await supabase
    .from("staff_evaluations").select("*").eq("application_id", applicationId).order("created_at", { ascending: false });
  return (data ?? []) as unknown as Evaluation[];
}

export async function getCandidateProgress(userId: string): Promise<Progress | null> {
  const { data, error } = await supabase.rpc("staff_program_progress" as any, { _user: userId } as any);
  if (error) return null;
  return data as unknown as Progress;
}

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "admin" | "moderator" | "verified";

export async function assignRole(target: string, role: Role, reason?: string) {
  const { error } = await supabase.rpc("staff_assign_role" as any, { _target: target, _role: role, _reason: reason ?? null });
  if (error) { toast.error(error.message); return false; }
  toast.success(`Rango ${role} asignado`);
  return true;
}

export async function revokeRole(target: string, role: Role, reason?: string) {
  const { error } = await supabase.rpc("staff_revoke_role" as any, { _target: target, _role: role, _reason: reason ?? null });
  if (error) { toast.error(error.message); return false; }
  toast.success(`Rango ${role} retirado`);
  return true;
}

export async function grantPremium(target: string, reason?: string) {
  const { error } = await supabase.rpc("staff_grant_premium" as any, { _target: target, _reason: reason ?? null });
  if (error) { toast.error(error.message); return false; }
  toast.success("Premium activado");
  return true;
}

export async function revokePremium(target: string, reason?: string) {
  const { error } = await supabase.rpc("staff_revoke_premium" as any, { _target: target, _reason: reason ?? null });
  if (error) { toast.error(error.message); return false; }
  toast.success("Premium retirado");
  return true;
}

export async function setUserStatus(
  target: string,
  status: "active" | "muted" | "suspended" | "banned",
  until?: string | null,
  reason?: string,
) {
  const { error } = await supabase.rpc("staff_set_user_status" as any, { _target: target, _status: status, _until: until ?? null, _reason: reason ?? null });
  if (error) { toast.error(error.message); return false; }
  toast.success(`Estado: ${status}`);
  return true;
}

export async function broadcastNotification(title: string, body: string, link: string, audience: "all" | "premium" | "staff" = "all") {
  const { data, error } = await supabase.rpc("staff_broadcast_notification" as any, { _title: title, _body: body, _link: link, _audience: audience });
  if (error) { toast.error(error.message); return 0; }
  toast.success(`${data ?? 0} notificaciones enviadas`);
  return data as number;
}

export async function createAnnouncement(title: string, body: string, level: "info" | "warn" | "critical", audience: "all" | "premium" | "staff", expiresAt?: string | null) {
  const { data, error } = await supabase.rpc("staff_create_announcement" as any, { _title: title, _body: body, _level: level, _audience: audience, _expires_at: expiresAt ?? null });
  if (error) { toast.error(error.message); return null; }
  toast.success("Anuncio creado");
  return data as string;
}

export async function deactivateAnnouncement(id: string) {
  const { error } = await supabase.rpc("staff_deactivate_announcement" as any, { _id: id });
  if (error) { toast.error(error.message); return false; }
  toast.success("Anuncio desactivado");
  return true;
}

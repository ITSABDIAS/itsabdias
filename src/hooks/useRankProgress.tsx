import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RANK_META, type RankSlug } from "@/components/RankBadge";

const HEARTBEAT_SECONDS = 60;

/**
 * Tracks user activity time and auto-unlocks ranks.
 * - Sends a heartbeat every 60s while the tab is visible.
 * - Calls check_rank_unlocks RPC and toasts newly granted ranks.
 */
export function useRankProgress() {
  const { user } = useAuth();
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      const now = Date.now();
      const elapsed = Math.min(Math.round((now - lastTickRef.current) / 1000), 120);
      lastTickRef.current = now;
      if (elapsed <= 0) return;

      const { error: actErr } = await supabase.rpc("record_activity", { _seconds: elapsed });
      // Update staff last_seen_at for online indicator (best-effort)
      supabase.rpc("touch_last_seen" as any).then(() => {}, () => {});
      if (actErr) return;

      const { data: granted, error: chkErr } = await supabase.rpc("check_rank_unlocks", {
        _user_id: user!.id,
      });
      if (chkErr || !granted) return;

      (granted as RankSlug[]).forEach((slug) => {
        const meta = RANK_META[slug];
        if (!meta) return;
        toast.success(`¡Rango desbloqueado: ${meta.label}!`, {
          description: "Visita tu perfil para verlo.",
          duration: 6000,
        });
      });
    }

    // initial heartbeat shortly after mount
    const initial = setTimeout(tick, 5000);
    const interval = setInterval(tick, HEARTBEAT_SECONDS * 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastTickRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);
}

/** Trigger an immediate rank check (e.g. after creating a project). */
export async function checkRankUnlocksNow(userId: string) {
  const { data } = await supabase.rpc("check_rank_unlocks", { _user_id: userId });
  (data as RankSlug[] | null)?.forEach((slug) => {
    const meta = RANK_META[slug];
    if (!meta) return;
    toast.success(`¡Rango desbloqueado: ${meta.label}!`, {
      description: "Visita tu perfil para verlo.",
      duration: 6000,
    });
  });
}

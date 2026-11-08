import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RankSlug } from "@/components/RankBadge";
import { activePlan, type MembershipPlan } from "@/lib/membership";

export function useMyRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RankSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<MembershipPlan>("free");

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) { setRoles([]); setPlan("free"); setLoading(false); return; }
      const [{ data }, { data: subscription }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("subscriptions").select("plan,status,expires_at").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancel) return;
      setRoles((data ?? []).map((r: any) => r.role as RankSlug));
      setPlan(activePlan(subscription));
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user?.id]);

  const isFounder = roles.includes("founder");
  const isAdmin = isFounder || roles.includes("admin");
  const isModerator = isAdmin || roles.includes("moderator");

  return {
    roles,
    loading,
    isFounder,
    isAdmin,
    isModerator,
    isPlus: plan === "plus",
    plan,
    isPremium: plan !== "free" || roles.includes("premium") || isAdmin,
    isStaff: isModerator,
  };
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RankSlug } from "@/components/RankBadge";

export function useMyRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RankSlug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) { setRoles([]); setLoading(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (cancel) return;
      setRoles((data ?? []).map((r: any) => r.role as RankSlug));
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
    isPremium: roles.includes("premium") || isFounder,
    isStaff: isModerator,
  };
}

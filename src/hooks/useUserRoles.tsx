import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RankSlug } from "@/components/RankBadge";

/** Fetches role lists for a set of user ids. Only public/staff roles will come back for unauthenticated viewers (per RLS). */
export function useUserRoles(userIds: string[]) {
  const [map, setMap] = useState<Map<string, RankSlug[]>>(new Map());
  const key = userIds.slice().sort().join(",");

  useEffect(() => {
    if (!userIds.length) {
      setMap(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (cancelled) return;
      const m = new Map<string, RankSlug[]>();
      (data ?? []).forEach((r: any) => {
        const arr = m.get(r.user_id) ?? [];
        arr.push(r.role as RankSlug);
        m.set(r.user_id, arr);
      });
      setMap(m);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
}

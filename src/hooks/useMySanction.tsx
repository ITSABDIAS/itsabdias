import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Sanction } from "@/lib/sanctions";

/** Reads the current user's active sanction (auto-expiring ones are filtered server-side). */
export function useMySanction() {
  const { user, loading: authLoading } = useAuth();
  const [sanction, setSanction] = useState<Sanction | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setSanction(null); setLoading(false); return; }
    const { data } = await supabase.rpc("my_sanction" as any);
    const row = Array.isArray(data) ? (data[0] as any) : null;
    setSanction(row ? (row as Sanction) : null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [authLoading, refresh]);

  return { sanction, loading: authLoading || loading, refresh };
}

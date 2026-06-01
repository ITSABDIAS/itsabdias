import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (!cancelled) setCount(c ?? 0);
    };
    load();

    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center justify-center p-2 rounded-md hover:bg-secondary/60 transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="h-5 w-5 text-neon-cyan" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-gradient-neon text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-neon-purple animate-glow-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

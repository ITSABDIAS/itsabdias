import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { Megaphone, X, AlertTriangle, Info, Zap } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  level: string;
  audience: string;
  expires_at: string | null;
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const { isPremium, isStaff } = useMyRoles();
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ann_dismissed") || "[]")); }
    catch { return new Set(); }
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,body,level,audience,expires_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      const now = new Date();
      const filtered = (data ?? []).filter((a: any) => {
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        if (a.audience === "premium" && !isPremium) return false;
        if (a.audience === "staff" && !isStaff) return false;
        return true;
      });
      setItems(filtered as any);
    })();
  }, [user?.id, isPremium, isStaff]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id);
    setDismissed(next);
    localStorage.setItem("ann_dismissed", JSON.stringify(Array.from(next)));
  };

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="fixed top-16 inset-x-0 z-40 flex flex-col gap-1 px-2 pt-2 pointer-events-none">
      {visible.slice(0, 2).map((a) => {
        const Icon = a.level === "critical" ? AlertTriangle : a.level === "warn" ? Zap : Info;
        const color =
          a.level === "critical" ? "border-red-500/50 bg-red-950/60 text-red-100" :
          a.level === "warn" ? "border-yellow-500/50 bg-yellow-950/60 text-yellow-100" :
          "border-neon-cyan/40 bg-neon-cyan/10 text-cyan-100";
        return (
          <div key={a.id} className={`pointer-events-auto mx-auto max-w-4xl w-full rounded-lg border ${color} backdrop-blur-md px-3 py-2 flex items-start gap-2 shadow-lg`}>
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold">{a.title}</p>
              {a.body && <p className="opacity-80 mt-0.5">{a.body}</p>}
            </div>
            <button onClick={() => dismiss(a.id)} className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

export { Megaphone };

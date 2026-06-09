import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Loader2 } from "lucide-react";

type Mode = "followers" | "following";

type Row = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export function FollowersDialog({
  open,
  onOpenChange,
  userId,
  mode,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  mode: Mode;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const col = mode === "followers" ? "following_id" : "follower_id";
      const other = mode === "followers" ? "follower_id" : "following_id";
      const { data } = await supabase
        .from("follows")
        .select(`${other}`)
        .eq(col, userId);
      const ids = (data ?? []).map((r: any) => r[other]).filter(Boolean);
      if (!ids.length) {
        if (!cancelled) { setRows([]); setLoading(false); }
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);
      if (!cancelled) {
        setRows((profs ?? []) as Row[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId, mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-neon-purple/40 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">
            <span className="text-neon-cyan">//</span>{" "}
            {mode === "followers" ? "Seguidores" : "Siguiendo"}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">
            <Loader2 className="inline animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {mode === "followers" ? "Aún no hay seguidores." : "Aún no sigue a nadie."}
          </div>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  to="/u/$username"
                  params={{ username: r.username }}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-neon flex items-center justify-center overflow-hidden">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.username} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>
                  <span className="font-medium">{r.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

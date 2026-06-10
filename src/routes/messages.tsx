import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, MessageSquare, Loader2, User as UserIcon, ArrowLeft } from "lucide-react";
import { RankBadge, topRank, type RankSlug } from "@/components/RankBadge";
import { useUserRoles } from "@/hooks/useUserRoles";
import { PremiumName, PremiumAvatarRing } from "@/components/PremiumName";

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    to: typeof s.to === "string" ? s.to : undefined,
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mensajes — ItsaBDias" },
      { name: "description", content: "Chats privados con la comunidad ItsaBDias." },
    ],
  }),
  component: MessagesPage,
});

type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  last_message_preview: string | null;
};
type Profile = { id: string; username: string; avatar_url: string | null };
type DM = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [unreadByConv, setUnreadByConv] = useState<Map<string, number>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect when not authed
  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/auth" });
  }, [user, authLoading, nav]);

  // Auto-start convo from ?to=<userId>
  useEffect(() => {
    if (!user || !search.to) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_or_create_conversation", { _other: search.to });
      if (error) return toast.error(error.message);
      if (data) {
        setActiveId(data as string);
        nav({ to: "/messages", search: { c: data as string }, replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, search.to]);

  useEffect(() => {
    if (search.c) setActiveId(search.c);
  }, [search.c]);

  const loadConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .select("id, user1_id, user2_id, last_message_at, last_message_preview")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setConvs((data ?? []) as Conversation[]);

    // Profiles of the "other" users
    const otherIds = Array.from(new Set(
      (data ?? []).map((c) => (c.user1_id === user.id ? c.user2_id : c.user1_id))
    ));
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, username, avatar_url").in("id", otherIds);
      const m = new Map<string, Profile>();
      (profs ?? []).forEach((p: any) => m.set(p.id, p));
      setProfiles(m);
    }

    // Unread counts per conversation (where I'm recipient and unread)
    const { data: unreadRows } = await supabase
      .from("direct_messages")
      .select("conversation_id")
      .eq("recipient_id", user.id)
      .is("read_at", null);
    const cnt = new Map<string, number>();
    (unreadRows ?? []).forEach((r: any) => cnt.set(r.conversation_id, (cnt.get(r.conversation_id) ?? 0) + 1));
    setUnreadByConv(cnt);

    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const ch = supabase
      .channel(`dm-list:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, loadConversations)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` }, loadConversations)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Messages for active conversation
  useEffect(() => {
    if (!user || !activeId) { setMessages([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (cancelled) return;
      setMessages((data ?? []) as DM[]);
      // Mark mine-as-recipient as read
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", activeId)
        .eq("recipient_id", user.id)
        .is("read_at", null);
    })();
    const ch = supabase
      .channel(`dm-thread:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${activeId}` }, async (payload) => {
        const m = payload.new as DM;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (m.recipient_id === user.id) {
          await supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [activeId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const activeConv = useMemo(() => convs.find((c) => c.id === activeId), [convs, activeId]);
  const other = activeConv && user
    ? profiles.get(activeConv.user1_id === user.id ? activeConv.user2_id : activeConv.user1_id)
    : null;

  const allOtherIds = Array.from(profiles.keys());
  const rolesMap = useUserRoles(allOtherIds);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConv) return;
    const txt = draft.trim();
    if (!txt) return;
    setSending(true);
    const recipient = activeConv.user1_id === user.id ? activeConv.user2_id : activeConv.user1_id;
    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      recipient_id: recipient,
      content: txt,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setDraft("");
  };

  if (authLoading || !user) {
    return <PageShell><div className="py-32 text-center text-muted-foreground"><Loader2 className="inline animate-spin" /></div></PageShell>;
  }

  return (
    <PageShell>
      <section className="py-12 px-4 sm:px-6">
        <SectionTitle eyebrow="// direct.messages" title="Mensajes privados" subtitle="Conecta en tiempo real con la comunidad." />

        <div className="mx-auto max-w-6xl mt-6 glass rounded-2xl neon-border overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[70vh]">
          {/* Sidebar */}
          <aside className={`border-r border-border/60 ${activeId ? "hidden md:flex" : "flex"} flex-col`}>
            <div className="p-4 border-b border-border/60">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-neon-cyan">// chats</h3>
            </div>
            {loading ? (
              <div className="p-6 text-center text-muted-foreground"><Loader2 className="inline animate-spin" /></div>
            ) : convs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aún no tienes chats.<br/>
                Visita un perfil y pulsa <strong>Enviar mensaje</strong>.
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {convs.map((c) => {
                  const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
                  const prof = profiles.get(otherId);
                  const unread = unreadByConv.get(c.id) ?? 0;
                  const roles = rolesMap.get(otherId);
                  const isPrem = roles?.includes("premium") || roles?.includes("founder");
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => { setActiveId(c.id); nav({ to: "/messages", search: { c: c.id }, replace: true }); }}
                        className={`w-full text-left flex items-start gap-3 p-3 hover:bg-secondary/60 transition-colors border-l-2 ${
                          activeId === c.id ? "border-neon-cyan bg-secondary/40" : "border-transparent"
                        }`}
                      >
                        <PremiumAvatarRing premium={isPrem}>
                          <div className="h-10 w-10 rounded-full bg-gradient-neon flex items-center justify-center overflow-hidden">
                            {prof?.avatar_url ? (
                              <img src={prof.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : <UserIcon className="h-5 w-5 text-primary-foreground" />}
                          </div>
                        </PremiumAvatarRing>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <PremiumName premium={isPrem} className="text-sm truncate">
                              {prof?.username ?? "Usuario"}
                            </PremiumName>
                            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.last_message_at)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{c.last_message_preview ?? "—"}</div>
                        </div>
                        {unread > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-neon-purple text-primary-foreground text-[10px] font-bold">
                            {unread}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Thread */}
          <div className={`${activeId ? "flex" : "hidden md:flex"} flex-col min-h-[70vh]`}>
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-3 text-neon-cyan/60" />
                <p>Selecciona un chat para empezar.</p>
              </div>
            ) : (
              <>
                <header className="p-3 sm:p-4 border-b border-border/60 flex items-center gap-3">
                  <button onClick={() => { setActiveId(null); nav({ to: "/messages", search: {}, replace: true }); }} className="md:hidden p-1.5 rounded-md hover:bg-secondary/60">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  {other && (
                    <Link to="/u/$username" params={{ username: other.username }} className="flex items-center gap-3 min-w-0 flex-1">
                      <PremiumAvatarRing premium={rolesMap.get(other.id)?.includes("premium") || rolesMap.get(other.id)?.includes("founder")}>
                        <div className="h-9 w-9 rounded-full bg-gradient-neon flex items-center justify-center overflow-hidden">
                          {other.avatar_url ? <img src={other.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserIcon className="h-4 w-4 text-primary-foreground" />}
                        </div>
                      </PremiumAvatarRing>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <PremiumName premium={rolesMap.get(other.id)?.includes("premium") || rolesMap.get(other.id)?.includes("founder")} className="font-bold truncate">
                            {other.username}
                          </PremiumName>
                          {(() => { const t = topRank(rolesMap.get(other.id)); return t ? <RankBadge slug={t} size="xs" /> : null; })()}
                        </div>
                      </div>
                    </Link>
                  )}
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background/30">
                  {messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                          mine
                            ? "bg-gradient-to-br from-neon-purple to-neon-blue text-primary-foreground rounded-br-sm shadow-neon-purple"
                            : "glass border border-border rounded-bl-sm"
                        }`}>
                          {m.content}
                          <div className={`mt-1 text-[10px] opacity-70 ${mine ? "text-right" : ""}`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="p-3 border-t border-border/60 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={4000}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-secondary/40 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan/40"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-neon text-primary-foreground shadow-neon-purple disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

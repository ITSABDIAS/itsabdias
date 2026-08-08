import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { RankBadge, RANK_META, RANK_PRIORITY, topRank, type RankSlug } from "@/components/RankBadge";
import { assignRole, revokeRole, grantPremium, revokePremium, setUserStatus, requestPermanentBan, type Role } from "@/lib/staffActions";
import { SanctionDialog, PermanentBanDialog } from "@/components/SanctionDialog";
import { SanctionCountdown } from "@/components/SanctionScreen";
import { SANCTION_META, type SanctionType } from "@/lib/sanctions";
import { Search, Shield, Crown, Sparkles, Volume2, VolumeX, Ban, PauseCircle, UserCheck, UserX, Plus, Minus, Gavel } from "lucide-react";


export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Admin · Usuarios — ItsaBDias" }] }),
  component: AdminUsuariosPage,
});

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  joined_staff_at: string | null;
  last_seen_at: string | null;
  roles: string[];
  status: string;
  until: string | null;
  started_at: string | null;
  is_permanent: boolean;
  reason: string | null;
};

type DialogState =
  | { kind: "sanction"; type: SanctionType; target: UserRow }
  | { kind: "permaban"; target: UserRow }
  | null;

function AdminUsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isFounder, isAdmin, isModerator, loading: rolesLoading } = useMyRoles();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "staff" | "premium" | "flagged">("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [myName, setMyName] = useState("");

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (!isModerator) return;
    load();
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMyName(data?.username ?? ""));
  }, [user, authLoading, rolesLoading, isModerator]);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: status }] = await Promise.all([
      supabase.from("profiles").select("id, username, avatar_url, joined_staff_at, last_seen_at").limit(500),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_status").select("user_id, status, until, reason, is_permanent, started_at"),
    ]);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? []; arr.push(r.role); roleMap.set(r.user_id, arr);
    });
    const statusMap = new Map<string, any>();
    (status ?? []).forEach((s: any) => statusMap.set(s.user_id, s));
    setUsers((profiles ?? []).map((p: any) => {
      const st = statusMap.get(p.id);
      const expired = st?.until && !st.is_permanent && new Date(st.until).getTime() <= Date.now();
      return {
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        joined_staff_at: p.joined_staff_at,
        last_seen_at: p.last_seen_at,
        roles: roleMap.get(p.id) ?? [],
        status: !st || expired ? "active" : st.status,
        until: st?.until ?? null,
        started_at: st?.started_at ?? null,
        is_permanent: !!st?.is_permanent,
        reason: st?.reason ?? null,
      };
    }));
    setLoading(false);
  };


  const filtered = useMemo(() => {
    let x = users;
    if (filter === "staff") x = x.filter((u) => u.roles.some((r) => ["founder","admin","moderator"].includes(r)));
    if (filter === "premium") x = x.filter((u) => u.roles.includes("premium"));
    if (filter === "flagged") x = x.filter((u) => u.status !== "active");
    if (q.trim()) {
      const s = q.toLowerCase();
      x = x.filter((u) => u.username.toLowerCase().includes(s));
    }
    return x.slice(0, 200);
  }, [users, q, filter]);

  const promptReason = (label: string) => {
    const r = prompt(`${label}\n\nMotivo (opcional):`);
    return r === null ? null : r.trim();
  };

  const actAssign = async (target: string, role: Role) => {
    const reason = promptReason(`Asignar rango ${role}`);
    if (reason === null) return;
    if (await assignRole(target, role, reason || undefined)) load();
  };
  const actRevoke = async (target: string, role: Role) => {
    const reason = promptReason(`Retirar rango ${role}`);
    if (reason === null) return;
    if (await revokeRole(target, role, reason || undefined)) load();
  };
  const actGrantPrem = async (target: string) => {
    const reason = promptReason("Otorgar Premium");
    if (reason === null) return;
    if (await grantPremium(target, reason || undefined)) load();
  };
  const actRevokePrem = async (target: string) => {
    const reason = promptReason("Retirar Premium");
    if (reason === null) return;
    if (await revokePremium(target, reason || undefined)) load();
  };
  const actRestore = async (target: string) => {
    const reason = promptReason("Restaurar cuenta");
    if (reason === null) return;
    if (await setUserStatus(target, "active", null, reason || undefined)) load();
  };
  const applySanction = async (type: SanctionType, target: string, reason: string, until: string) => {
    if (await setUserStatus(target, type, until, reason)) { setDialog(null); load(); }
  };
  const sendPermaBan = async (target: string, reason: string, evidence: string) => {
    if (await requestPermanentBan(target, reason, evidence || undefined)) setDialog(null);
  };


  if (authLoading || rolesLoading || (isModerator && loading)) {
    return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  }
  if (!isModerator) {
    return (
      <PageShell>
        <section className="py-32 px-6 text-center">
          <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Acceso restringido</h2>
          <p className="text-muted-foreground">Solo staff.</p>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.usuarios" title="Gestión de usuarios" subtitle="Asigna rangos, gestiona estados y modera la comunidad." />

        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/admin/tutoriales" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Tutoriales</Link>
            <Link to="/admin/anuncios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Anuncios</Link>
            <Link to="/admin/historial" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Historial</Link>
          </div>

          <div className="glass rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por username..." className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border rounded-md text-sm" />
            </div>
            <div className="flex gap-1.5">
              {[
                { v: "all", l: "Todos" },
                { v: "staff", l: "Staff" },
                { v: "premium", l: "Premium" },
                { v: "flagged", l: "Sancionados" },
              ].map((f) => (
                <button key={f.v} onClick={() => setFilter(f.v as any)}
                  className={`px-3 py-1.5 rounded-md text-xs border ${filter === f.v ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground"}`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((u) => {
              const top = topRank(u.roles) ?? "member";
              const isPremiumUser = u.roles.includes("premium");
              const targetIsFounder = u.roles.includes("founder");
              const targetIsAdmin = u.roles.includes("admin");
              const targetIsMod = u.roles.includes("moderator");
              const targetIsVerified = u.roles.includes("verified");
              return (
                <div key={u.id} className="glass rounded-xl p-4">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary/60 flex items-center justify-center text-sm font-bold">{u.username?.[0]?.toUpperCase() ?? "?"}</div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link to="/u/$username" params={{ username: u.username }} className="font-bold hover:text-neon-cyan truncate">{u.username}</Link>
                          <RankBadge slug={top as RankSlug} size="xs" />
                          {isPremiumUser && top !== "premium" && <RankBadge slug="premium" size="xs" />}
                          {u.status !== "active" && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono"
                              style={{
                                color: SANCTION_META[u.status as SanctionType].color,
                                borderColor: `${SANCTION_META[u.status as SanctionType].color}88`,
                                background: `${SANCTION_META[u.status as SanctionType].color}1a`,
                                borderWidth: 1,
                              }}
                            >
                              {SANCTION_META[u.status as SanctionType].label}{u.is_permanent ? " · permanente" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {u.last_seen_at ? `Últ. actividad ${new Date(u.last_seen_at).toLocaleDateString()}` : "Sin actividad"}
                          {u.joined_staff_at ? ` · Staff desde ${new Date(u.joined_staff_at).toLocaleDateString()}` : ""}
                        </p>
                        {u.status !== "active" && (
                          <p className="text-[11px] mt-0.5">
                            <span className="text-muted-foreground">{u.reason ? `${u.reason} · ` : ""}</span>
                            <SanctionCountdown
                              compact
                              sanction={{
                                status: u.status as SanctionType,
                                reason: u.reason,
                                until: u.until,
                                started_at: u.started_at,
                                is_permanent: u.is_permanent,
                                staff_username: null,
                              }}
                            />
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {isFounder && !targetIsFounder && (
                        targetIsAdmin
                          ? <BtnDanger onClick={() => actRevoke(u.id, "admin")} icon={<Shield className="h-3 w-3" />}>Quitar Admin</BtnDanger>
                          : <BtnPrimary onClick={() => actAssign(u.id, "admin")} icon={<Shield className="h-3 w-3" />}>Dar Admin</BtnPrimary>
                      )}
                      {isAdmin && !targetIsFounder && !targetIsAdmin && (
                        targetIsMod
                          ? <BtnDanger onClick={() => actRevoke(u.id, "moderator")} icon={<Shield className="h-3 w-3" />}>Quitar Mod</BtnDanger>
                          : <BtnPrimary onClick={() => actAssign(u.id, "moderator")} icon={<Shield className="h-3 w-3" />}>Dar Mod</BtnPrimary>
                      )}
                      {isAdmin && !targetIsFounder && (
                        targetIsVerified
                          ? <BtnDanger onClick={() => actRevoke(u.id, "verified")} icon={<UserX className="h-3 w-3" />}>Sin verif.</BtnDanger>
                          : <BtnPrimary onClick={() => actAssign(u.id, "verified")} icon={<UserCheck className="h-3 w-3" />}>Verificar</BtnPrimary>
                      )}
                      {isFounder && !targetIsFounder && (
                        isPremiumUser
                          ? <BtnDanger onClick={() => actRevokePrem(u.id)} icon={<Crown className="h-3 w-3" />}>Quitar Premium</BtnDanger>
                          : <BtnGold onClick={() => actGrantPrem(u.id)} icon={<Crown className="h-3 w-3" />}>Dar Premium</BtnGold>
                      )}
                      {isModerator && !targetIsFounder && u.status !== "muted" && (
                        <BtnMuted onClick={() => setDialog({ kind: "sanction", type: "muted", target: u })} icon={<VolumeX className="h-3 w-3" />}>Silenciar</BtnMuted>
                      )}
                      {isAdmin && !targetIsFounder && u.status !== "suspended" && (
                        <BtnOrange onClick={() => setDialog({ kind: "sanction", type: "suspended", target: u })} icon={<PauseCircle className="h-3 w-3" />}>Suspender</BtnOrange>
                      )}
                      {isAdmin && !targetIsFounder && u.status !== "banned" && (
                        <BtnDanger onClick={() => setDialog({ kind: "sanction", type: "banned", target: u })} icon={<Ban className="h-3 w-3" />}>Banear</BtnDanger>
                      )}
                      {isModerator && !targetIsFounder && !u.is_permanent && (
                        <BtnDanger onClick={() => setDialog({ kind: "permaban", target: u })} icon={<Gavel className="h-3 w-3" />}>Ban Permanente</BtnDanger>
                      )}
                      {isModerator && u.status !== "active" && (
                        <BtnPrimary onClick={() => actRestore(u.id)} icon={<Volume2 className="h-3 w-3" />}>Restaurar</BtnPrimary>
                      )}
                    </div>

                  </div>
                  {isFounder && !targetIsFounder && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[10px] uppercase font-mono text-muted-foreground mb-1.5 flex items-center gap-1"><Crown className="h-3 w-3 text-yellow-300" /> Founder · gestionar cualquier rango</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(["admin","moderator","verified","developer","ai_expert","member"] as Role[]).map((r) => {
                          const has = u.roles.includes(r);
                          const meta = RANK_META[r as RankSlug];
                          return (
                            <button
                              key={r}
                              onClick={() => has ? actRevoke(u.id, r) : actAssign(u.id, r)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition"
                              style={{
                                color: meta.color,
                                borderColor: `${meta.color}66`,
                                background: has ? `${meta.color}22` : "transparent",
                              }}
                              title={has ? `Quitar ${meta.label}` : `Asignar ${meta.label}`}
                            >
                              {has ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-muted-foreground text-sm">Sin usuarios.</p>}
          </div>
        </div>
      </section>

      {dialog?.kind === "sanction" && (
        <SanctionDialog
          type={dialog.type}
          username={dialog.target.username}
          onCancel={() => setDialog(null)}
          onConfirm={({ reason, until }) => applySanction(dialog.type, dialog.target.id, reason, until)}
        />
      )}
      {dialog?.kind === "permaban" && (
        <PermanentBanDialog
          username={dialog.target.username}
          staffName={myName || "staff"}
          onCancel={() => setDialog(null)}
          onConfirm={({ reason, evidence }) => sendPermaBan(dialog.target.id, reason, evidence)}
        />
      )}
    </PageShell>
  );
}

function BtnPrimary({ onClick, icon, children }: any) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10">{icon}{children}</button>;
}
function BtnOrange({ onClick, icon, children }: any) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-orange-500/50 text-orange-300 hover:bg-orange-500/10">{icon}{children}</button>;
}

function BtnDanger({ onClick, icon, children }: any) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-red-500/40 text-red-400 hover:bg-red-500/10">{icon}{children}</button>;
}
function BtnGold({ onClick, icon, children }: any) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/10">{icon}{children}</button>;
}
function BtnMuted({ onClick, icon, children }: any) {
  return <button onClick={onClick} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10">{icon}{children}</button>;
}

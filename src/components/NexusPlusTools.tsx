import { useEffect, useState } from "react";
import { Download, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PLUS_PROMPTS } from "@/lib/membership";
import { toast } from "sonner";

export function NexusPlusTools({ userId, messages, onPrompt, disabled }: { userId: string; messages: { role: string; content: string }[]; onPrompt: (prompt: string) => void; disabled: boolean }) {
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { let cancelled = false; supabase.from("nexus_preferences").select("instructions").eq("user_id", userId).maybeSingle().then(({ data, error }) => { if (!cancelled) { if (error) toast.error("No se pudieron cargar tus preferencias"); else setInstructions(data?.instructions ?? ""); } }); return () => { cancelled = true; }; }, [userId]);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("nexus_preferences").upsert({ user_id: userId, instructions, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Preferencias de NEXUS guardadas");
  };
  const exportChat = () => {
    const text = messages.map((m) => `## ${m.role === "user" ? "Tú" : "NEXUS"}\n\n${m.content}`).join("\n\n---\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "nexus-conversacion.md"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="mb-4 border-y border-plus/25 py-4">
    <div className="flex flex-wrap items-center gap-2"><Sparkles className="h-4 w-4 text-plus" /><span className="font-semibold text-plus">NEXUS Plus</span><Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>Preferencias</Button><Button size="sm" variant="outline" onClick={exportChat} disabled={messages.length < 2}><Download />Exportar chat</Button></div>
    {open && <div className="mt-3"><label htmlFor="nexus-instructions" className="text-sm">Cómo prefieres que NEXUS te responda</label><textarea id="nexus-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} rows={3} placeholder="Mi nivel es intermedio. Uso Roblox Studio. Prefiero ejemplos en Lua y explicaciones paso a paso." className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm" /><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{instructions.length}/2000</span><Button size="sm" onClick={save} disabled={saving}><Save />{saving ? "Guardando…" : "Guardar"}</Button></div></div>}
    <div className="mt-3 flex flex-wrap gap-2">{PLUS_PROMPTS.map((p) => <Button key={p.label} size="sm" variant="outline" disabled={disabled} onClick={() => onPrompt(p.prompt)}>{p.label}</Button>)}</div>
  </div>;
}
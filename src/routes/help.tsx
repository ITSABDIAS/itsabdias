import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Send, LifeBuoy, MessageSquare, Code2, BrainCircuit, Cpu, Gamepad2, Wrench } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Centro de Ayuda Tech — ItsaBDias" },
      { name: "description", content: "Pide ayuda sobre programación, IA, PCs, Roblox, software, ingeniería y tecnología." },
    ],
  }),
  component: Help,
});

const cats = [
  { icon: Code2, label: "Programación" },
  { icon: BrainCircuit, label: "IA" },
  { icon: Cpu, label: "PCs" },
  { icon: Gamepad2, label: "Roblox" },
  { icon: Wrench, label: "Software" },
  { icon: LifeBuoy, label: "Ingeniería" },
  { icon: MessageSquare, label: "Tecnología" },
];

type Ticket = { id: number; cat: string; title: string; body: string; date: string };

function Help() {
  const [cat, setCat] = useState("Programación");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 1, cat: "IA", title: "¿Cómo entrenar mi propio modelo?", body: "Quiero crear un asistente personal con datos propios.", date: "hace 2h" },
    { id: 2, cat: "Roblox", title: "Script de teletransporte no funciona", body: "El RemoteEvent no se dispara en el cliente.", date: "hace 5h" },
  ]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setTickets([{ id: Date.now(), cat, title, body, date: "ahora" }, ...tickets]);
    setTitle("");
    setBody("");
  };

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle
          eyebrow="// support.center"
          title="Centro de Ayuda Tech"
          subtitle="Describe tu problema. Nuestra comunidad de creadores te responderá."
        />

        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_1.3fr] gap-8">
          {/* Form */}
          <form onSubmit={submit} className="glass rounded-2xl p-6 neon-border space-y-5 h-fit">
            <h3 className="font-display text-xl font-bold">Nuevo ticket</h3>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Categoría</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button
                    type="button"
                    key={c.label}
                    onClick={() => setCat(c.label)}
                    className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border transition-all ${
                      cat === c.label
                        ? "bg-gradient-neon text-primary-foreground border-transparent shadow-neon-blue"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-neon-blue/60"
                    }`}
                  >
                    <c.icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Mi PC se reinicia al jugar..."
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Detalles</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Describe qué pasa, qué intentaste, mensajes de error..."
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple hover:shadow-neon-blue transition-all"
            >
              <Send className="h-4 w-4" /> Enviar Ticket
            </button>
          </form>

          {/* Tickets list */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold">Tickets recientes</h3>
            {tickets.map((t) => (
              <div key={t.id} className="glass rounded-xl p-5 hover:border-neon-purple/60 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                      {t.cat}
                    </span>
                    <h4 className="mt-2 font-bold text-lg">{t.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

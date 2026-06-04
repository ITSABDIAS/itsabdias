import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import {
  Gamepad2,
  Code2,
  Boxes,
  DollarSign,
  Database,
  LayoutDashboard,
  Radio,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/roblox")({
  head: () => ({
    meta: [
      { title: "Roblox Studio — ItsaBDias" },
      {
        name: "description",
        content:
          "Aprende Roblox Studio: Lua, scripts útiles, sistemas completos, monetización, DataStore, UI y RemoteEvents.",
      },
      { property: "og:title", content: "Roblox Studio — ItsaBDias" },
      {
        property: "og:description",
        content: "Domina Lua y construye experiencias profesionales en Roblox.",
      },
    ],
  }),
  component: Roblox,
});

const sections = [
  { icon: BookOpen, title: "Variables", slug: "variables", desc: "Tipos, locales vs globales y manejo de servicios.", snippet: `local Players = game:GetService("Players")\nlocal maxHP = 100` },
  { icon: Code2, title: "Leaderstats", slug: "leaderstats", desc: "Crea el ranking de jugadores con monedas y nivel.", snippet: `local stats = Instance.new("Folder")\nstats.Name = "leaderstats"` },
  { icon: Database, title: "DataStore", slug: "datastore", desc: "Guardado seguro con retries y UpdateAsync.", snippet: `DS:UpdateAsync(player.UserId, function() return data end)` },
  { icon: Radio, title: "RemoteEvents", slug: "remoteevents", desc: "Comunicación client/server con validación anti-exploit.", snippet: `RemoteEvent.OnServerEvent:Connect(function(player, action)\n  -- validar\nend)` },
  { icon: LayoutDashboard, title: "Interfaces UI", slug: "ui", desc: "ScreenGui, TweenService y diseño responsive.", snippet: `TweenService:Create(frame, TweenInfo.new(0.4), {Position = goal}):Play()` },
  { icon: DollarSign, title: "Gamepasses", slug: "gamepasses", desc: "Monetización con Gamepasses y Developer Products.", snippet: `MarketplaceService:UserOwnsGamePassAsync(uid, passId)` },
  { icon: Boxes, title: "Sistemas completos", slug: "sistemas", desc: "Inventarios, combate, misiones y economía.", snippet: `local Inventory = {}\nInventory.__index = Inventory` },
  { icon: Lightbulb, title: "Consejos para devs", slug: "sistemas", desc: "Optimización, performance y publicación.", snippet: `-- Usa :GetService en lugar de game.Workspace\nlocal Players = game:GetService("Players")` },
];

function Roblox() {
  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle
          eyebrow="// roblox.studio"
          title="Roblox Studio"
          subtitle="Aprende Lua, crea sistemas y publica experiencias profesionales."
        />

        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-cyan/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 text-neon-cyan animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Construye mundos · monetiza · escala
              </h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Una guía completa para llevar tu juego de Roblox desde una idea hasta
                el <span className="text-neon-cyan">trending mundial</span>.
              </p>
              <Link
                to="/ai"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple"
              >
                <Sparkles className="h-4 w-4" /> Pídele un script a NEXUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <article
              key={s.title}
              className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-cyan/60 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-2">
                <s.icon className="h-6 w-6 text-neon-cyan" />
                <h3 className="font-bold text-lg">{s.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <pre className="mt-3 text-[11px] sm:text-xs font-mono bg-black/60 border border-neon-cyan/20 rounded-md p-3 overflow-x-auto text-neon-cyan/90 whitespace-pre">
                {s.snippet}
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass rounded-2xl p-8 text-center neon-border">
          <h3 className="text-2xl font-bold">¿Atascado con tu script?</h3>
          <p className="mt-2 text-muted-foreground">
            NEXUS conoce Lua, Roblox Studio y best practices. Pregúntale lo que
            quieras.
          </p>
          <Link
            to="/ai"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple"
          >
            Abrir NEXUS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

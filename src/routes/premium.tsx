import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/RankBadge";
import { useMyRoles } from "@/hooks/useMyRoles";
import { MEMBERSHIPS } from "@/lib/membership";
import { Crown, Sparkles, BrainCircuit, ImagePlus, Wand2, History, Download, Settings2, Search, Code2, ShieldCheck, Check, ArrowRight, Gift } from "lucide-react";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [
    { title: "Premium y Plus — ItsaBDias" },
    { name: "description", content: "Premium por US$3.99/mes y Plus por US$9.99/mes: identidad exclusiva y herramientas avanzadas de NEXUS." },
    { property: "og:title", content: "Premium y Plus — ItsaBDias" },
    { property: "og:description", content: "Compara Premium y Plus: personalización, imágenes y herramientas de NEXUS." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: MembershipPage,
});

const premiumFeatures = ["Insignia Premium dorada", "Nombre y aro de avatar Premium", "Enviar fotos a NEXUS", "Generar imágenes con NEXUS", "Historial de conversaciones", "Se suma a tus rangos actuales"];
const plusFeatures = ["Todos los beneficios de Premium", "Insignia Plus neón exclusiva", "Nombre y aro de avatar Plus", "El doble de contexto: 80 mensajes", "Historial ampliado: 200 conversaciones", "Buscar chats por su título", "Exportar el chat abierto a Markdown", "Preferencias personales para NEXUS", "6 plantillas de trabajo para NEXUS", "Sin perder tus rangos ni tu progreso"];
const details = [
  { Icon: BrainCircuit, title: "Más contexto, menos repetir", text: "NEXUS recibe hasta 80 mensajes recientes del chat, frente a 40 con Premium. Retoma proyectos y explicaciones más largas." },
  { Icon: Settings2, title: "NEXUS a tu manera", text: "Guarda tu nivel, lenguajes favoritos y estilo de respuesta. NEXUS los tendrá en cuenta en cada nueva consulta." },
  { Icon: History, title: "Historial ampliado", text: "Accede a las 200 conversaciones más recientes desde el historial de NEXUS, en lugar de 60." },
  { Icon: Search, title: "Encuentra tus conversaciones", text: "Busca por título entre tus conversaciones cargadas y vuelve a la que necesitas." },
  { Icon: Download, title: "Tus ideas, fuera del chat", text: "Descarga los mensajes cargados del chat abierto como un archivo Markdown para conservar código, apuntes y guías." },
  { Icon: Code2, title: "6 puntos de partida profesionales", text: "Revisión de código, planificación, tutoría, depuración de Roblox, comparativas y documentación: plantillas listas para preparar tu consulta." },
  { Icon: ImagePlus, title: "Análisis de fotos incluido", text: "Adjunta imágenes de errores, código o hardware y consulta a NEXUS sobre lo que muestran." },
  { Icon: Wand2, title: "Generación de imágenes incluida", text: "Crea imágenes desde NEXUS con una descripción. Disponible también en Premium; no se promete uso ilimitado." },
];
const comparison = [
  ["Chat de NEXUS y comunidad", "Sí", "Sí"], ["Fotos y generación de imágenes", "Sí", "Sí"],
  ["Identidad", "Dorada", "Neón Plus"], ["Contexto reciente de NEXUS", "40 mensajes", "80 mensajes"],
  ["Conversaciones en el historial", "60", "200"], ["Búsqueda por título", "—", "Sí"],
  ["Exportación a Markdown", "—", "Sí"], ["Preferencias de respuesta guardadas", "—", "Sí"],
  ["Plantillas de trabajo", "—", "6"], ["Rangos, niveles y misiones", "Se conservan", "Se conservan"],
];

function MembershipPage() {
  const { isPlus, isPremium, isFounder } = useMyRoles();
  return <PageShell><section className="px-4 py-12 sm:px-6 sm:py-16">
    <div className="mx-auto max-w-6xl">
      <div className="mb-9 border-b border-border pb-8">
        <div className="mb-4 flex items-center gap-2 text-sm font-mono text-plus"><Sparkles className="h-4 w-4" /> ITSABDIAS · MEMBRESÍAS</div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Premium <span className="text-muted-foreground">+</span> <span className="text-plus">Plus</span></h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Tu identidad. Tus proyectos. Tu NEXUS.<br />Elige la experiencia que va contigo, sin cambiar tus rangos ni tu progreso.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {([{ plan: "premium" as const, features: premiumFeatures, Icon: Crown }, { plan: "plus" as const, features: plusFeatures, Icon: Sparkles }]).map(({ plan, features, Icon }) => {
          const plus = plan === "plus";
          const active = plus ? isPlus : isPremium && !isPlus;
          return <article key={plan} className={`relative rounded-lg border p-6 sm:p-8 bg-card ${plus ? "plus-frame" : "border-premium/40"}`}>
            <div className="flex items-center justify-between gap-3"><RankBadge slug={plan} size="md" /><Icon className={`h-7 w-7 ${plus ? "text-plus" : "text-premium"}`} /></div>
            <h2 className="mt-6 text-2xl font-bold">ItsaBDias {plus ? "Plus" : "Premium"}</h2>
            <p className="mt-2 text-muted-foreground">{plus ? "Más herramientas para crear y aprender con NEXUS." : "Identidad dorada y acceso a imágenes de NEXUS."}</p>
            <div className="mt-6 flex flex-wrap items-baseline gap-2"><strong className={`text-5xl font-display ${plus ? "text-plus" : "text-premium"}`}>${MEMBERSHIPS[plan].price.toFixed(2)}</strong><span className="text-muted-foreground">USD / mes</span></div>
            <p className="mt-2 text-xs text-muted-foreground">Precio mensual previsto · cobros todavía no disponibles</p>
            <ul className="my-6 space-y-3">{features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${plus ? "text-plus" : "text-premium"}`} />{f}</li>)}</ul>
            <div className="border-t border-border pt-5">
              {active ? <Button asChild className="w-full" variant="outline"><Link to="/ai"><BrainCircuit />Abrir NEXUS {plus ? "Plus" : "Premium"}<ArrowRight /></Link></Button> : <Button disabled className="w-full" variant="outline">{isPlus && !plus ? "Incluido en tu Plus" : "Pagos próximamente"}</Button>}
              <p className="mt-3 text-xs text-muted-foreground">El Founder también puede conceder el acceso sin cobro.</p>
            </div>
          </article>;
        })}
      </div>
      {isFounder && <div className="mt-6 flex flex-col gap-3 border-y border-plus/25 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Gift className="mt-1 h-5 w-5 text-plus shrink-0" /><div><h3 className="font-semibold">Tu control de Founder</h3><p className="text-sm text-muted-foreground">Concede Plus a cualquier usuario desde Usuarios. Al retirarlo, conserva Premium.</p></div></div><Button asChild variant="outline"><Link to="/admin/usuarios"><Gift />Gestionar Plus<ArrowRight /></Link></Button></div>}
      <section className="mt-14"><h2 className="text-2xl font-bold">Lo que suma <span className="text-plus">Plus</span></h2><div className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">{details.map(({ Icon, title, text }) => <div key={title}><Icon className="mb-3 h-6 w-6 text-plus" /><h3 className="text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</div></section>
      <section className="mt-14"><h2 className="mb-6 text-2xl font-bold">Compara tu acceso</h2><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead><tr className="border-b border-border"><th className="p-3 text-left font-semibold">Beneficio</th><th className="p-3 text-center text-premium">Premium</th><th className="p-3 text-center text-plus">Plus</th></tr></thead><tbody>{comparison.map(([label, premium, plus]) => <tr key={label} className="border-b border-border/50"><th className="p-3 text-left font-normal text-muted-foreground">{label}</th><td className="p-3 text-center">{premium}</td><td className="p-3 text-center font-semibold">{plus}</td></tr>)}</tbody></table></div></section>
      <div className="mt-8 flex items-start gap-3 border-y border-border py-5"><ShieldCheck className="h-5 w-5 shrink-0 text-neon-cyan" /><p className="text-sm text-muted-foreground">Las funciones de IA dependen de la disponibilidad del servicio y de los créditos del proyecto. Plus no incluye permisos de Staff, experiencia extra ni uso ilimitado. No se cobra ni se activa una suscripción de pago desde esta página todavía.</p></div>
    </div>
  </section></PageShell>;
}

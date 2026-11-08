export type MembershipPlan = "free" | "premium" | "plus";

export const MEMBERSHIPS = {
  free: { price: 0, contextMessages: 40, historyLimit: 60 },
  premium: { price: 3.99, contextMessages: 40, historyLimit: 60 },
  plus: { price: 9.99, contextMessages: 80, historyLimit: 200 },
} as const;

export function activePlan(subscription: { plan: string; status: string; expires_at: string | null } | null, now = Date.now()): MembershipPlan {
  if (!subscription || subscription.status !== "active" || (subscription.expires_at && Date.parse(subscription.expires_at) <= now)) return "free";
  return subscription.plan === "plus" ? "plus" : subscription.plan === "premium" ? "premium" : "free";
}

export const PLUS_PROMPTS = [
  { label: "Revisar código", prompt: "Actúa como revisor de código. Voy a compartir mi código: detecta errores, riesgos de seguridad y oportunidades de mejora, y proponme una versión corregida con pruebas. Primero pregúntame por el código." },
  { label: "Plan de proyecto", prompt: "Ayúdame a convertir mi idea en un proyecto. Pregúntame por la idea y crea un plan por etapas con alcance, arquitectura, tareas, riesgos y pruebas concretas." },
  { label: "Tutor personal", prompt: "Sé mi tutor de tecnología. Pregúntame qué quiero aprender y mi nivel; prepara una explicación, ejemplos, ejercicios y una revisión de mis respuestas." },
  { label: "Depurar Roblox", prompt: "Ayúdame a depurar un proyecto de Roblox Studio. Pídeme el script, el mensaje de error y qué debería ocurrir; analiza cliente, servidor, RemoteEvents y seguridad." },
  { label: "Comparar opciones", prompt: "Ayúdame a tomar una decisión tecnológica. Pregúntame qué opciones tengo, mi presupuesto y mis requisitos; compara ventajas, riesgos y costes sin inventar precios actuales." },
  { label: "Documentar", prompt: "Ayúdame a documentar mi proyecto. Pídeme el código o una descripción y prepara un README con instalación, uso, ejemplos, limitaciones y cómo probarlo." },
];
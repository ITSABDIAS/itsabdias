import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORIES = [
  "programacion",
  "roblox",
  "ai",
  "hardware",
  "gamedev",
  "electricidad",
  "software",
  "tecnologia",
] as const;

const InputSchema = z.object({
  category: z.enum(CATEGORIES),
  topic: z.string().min(2).max(200).optional(),
  level: z.enum(["principiante", "intermedio", "avanzado"]).optional(),
  count: z.number().int().min(1).max(10).default(1),
});

const CATEGORY_HINTS: Record<string, string> = {
  programacion: "programación (HTML, CSS, JavaScript, Python, Lua, React, TypeScript, etc.)",
  roblox: "Roblox Studio y Lua (DataStore, RemoteEvents, UI, gamepasses, sistemas)",
  ai: "inteligencia artificial (LLMs, prompt engineering, agentes, vision, ML básico)",
  hardware: "hardware de PC (CPU, GPU, RAM, SSD, builds, overclocking, optimización)",
  gamedev: "desarrollo de videojuegos (Unity, Unreal, Godot, diseño de niveles, físicas)",
  electricidad: "electricidad y electrónica (Arduino, circuitos, sensores, potencia, seguridad)",
  software: "ingeniería de software (APIs, bases de datos, DevOps, arquitectura, sistemas distribuidos)",
  tecnologia: "tecnología y tendencias (IA, gadgets, gaming, futuro, ciberseguridad)",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function callAI(apiKey: string, prompt: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            'Eres NEXUS, el generador de tutoriales de ItsaBDias. Respondes SIEMPRE con un objeto json válido y NADA más. El json debe tener EXACTAMENTE estas claves: title (string), description (string, 1-2 frases), level ("principiante"|"intermedio"|"avanzado"), read_minutes (int 3-30), tags (array de 3-6 strings cortos), content (string en markdown, extenso, con secciones: ## Introducción, ## Explicación sencilla, ## Paso a paso, ## Ejemplos con código en bloques ```lang, ## Buenas prácticas, ## Errores comunes, ## Conclusión). Nunca envuelvas el json en ```. Nunca añadas texto antes o después.',
        },
        { role: "user", content: prompt + "\n\nResponde en formato json siguiendo el esquema indicado." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  const text = await res.text();
  if (res.status === 429) throw new Error("Demasiadas solicitudes a la IA. Intenta en unos segundos.");
  if (res.status === 402) throw new Error("Sin créditos de IA. Añade créditos al workspace.");
  if (!res.ok) throw new Error(`IA error ${res.status}: ${text.slice(0, 200)}`);
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Respuesta no es JSON"); }
  const raw: string = json?.choices?.[0]?.message?.content ?? "";
  if (!raw) throw new Error("IA devolvió respuesta vacía");
  // strip potential ``` wrapping
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // try to extract first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("IA no devolvió JSON parseable");
  }
}

export const generateTutorials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "founder"]);
    if (!roles || roles.length === 0) throw new Error("No autorizado");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created: { id: string; title: string; slug: string }[] = [];
    const errors: string[] = [];

    const { data: existing } = await supabaseAdmin
      .from("tutorials")
      .select("title, slug")
      .eq("category", data.category);
    const existingTitles = new Set((existing ?? []).map((t: any) => t.title.toLowerCase()));
    const existingSlugs = new Set((existing ?? []).map((t: any) => t.slug));

    for (let i = 0; i < data.count; i++) {
      try {
        const topicPart = data.topic
          ? `sobre "${data.topic}"`
          : `sobre un tema útil y NO repetido de ${CATEGORY_HINTS[data.category]}`;
        const avoid =
          existingTitles.size > 0
            ? ` Evita estos títulos ya existentes: ${Array.from(existingTitles).slice(0, 20).join("; ")}.`
            : "";
        const levelPart = data.level ? ` Nivel: ${data.level}.` : "";
        const prompt = `Genera un tutorial completo en español ${topicPart}.${levelPart}${avoid}`;

        const obj = await callAI(apiKey, prompt);
        const title: string = String(obj.title || "").trim().slice(0, 160);
        if (!title) throw new Error("Sin título");
        if (existingTitles.has(title.toLowerCase())) throw new Error(`Duplicado: ${title}`);

        let slug = slugify(title) || `tutorial-${Date.now()}`;
        let n = 1;
        while (existingSlugs.has(slug)) {
          slug = `${slugify(title)}-${++n}`;
        }

        const content = String(obj.content || "").trim();
        if (content.length < 100) throw new Error("Contenido demasiado corto");

        const row = {
          category: data.category,
          slug,
          title,
          description: String(obj.description || "").slice(0, 500) || title,
          content,
          level: ["principiante", "intermedio", "avanzado"].includes(obj.level)
            ? obj.level
            : data.level ?? "principiante",
          read_minutes: Math.max(1, Math.min(60, Number(obj.read_minutes) || 5)),
          tags: Array.isArray(obj.tags) ? obj.tags.slice(0, 8).map((t: any) => String(t).slice(0, 30)) : [],
          author_id: userId,
          is_ai_generated: true,
        };

        const { data: ins, error } = await supabaseAdmin
          .from("tutorials")
          .insert(row)
          .select("id, title, slug")
          .single();
        if (error) throw new Error(error.message);
        created.push(ins as any);
        existingTitles.add(title.toLowerCase());
        existingSlugs.add(slug);
      } catch (e: any) {
        errors.push(e?.message ?? "error desconocido");
      }
    }

    return { created, errors };
  });

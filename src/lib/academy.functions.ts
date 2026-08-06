import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LEVELS = ["principiante", "intermedio", "avanzado"] as const;

const CourseInput = z.object({
  pathId: z.string().uuid(),
  topic: z.string().min(2).max(200).optional(),
  level: z.enum(LEVELS).default("principiante"),
  lessons: z.number().int().min(3).max(12).default(6),
});

const LessonInput = z.object({
  courseId: z.string().uuid(),
  topic: z.string().min(2).max(200).optional(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function askJson(apiKey: string, system: string, user: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user + "\n\nResponde SOLO con json válido." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  const text = await res.text();
  if (res.status === 429) throw new Error("Demasiadas solicitudes a la IA. Intenta en unos segundos.");
  if (res.status === 402) throw new Error("Sin créditos de IA. Añade créditos al workspace.");
  if (!res.ok) throw new Error(`IA error ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  const raw: string = json?.choices?.[0]?.message?.content ?? "";
  if (!raw) throw new Error("La IA devolvió una respuesta vacía");
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("La IA no devolvió JSON parseable");
  }
}

async function assertStaff(
  supabase: { from: (t: string) => any },
  userId: string,
) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "founder"]);
  if (!data || data.length === 0) throw new Error("No autorizado");
}

const COURSE_SYSTEM = `Eres NEXUS, el profesor de IA de ITSABDIAS Academy. Diseñas el plan de cursos en español.
Devuelves SIEMPRE un objeto json con EXACTAMENTE estas claves:
title (string), description (string, 2 frases), tags (array 3-6 strings cortos),
estimated_minutes (int 30-600),
lessons (array de objetos con SOLO: title (string) y focus (string, 1 frase con lo que enseña la lección)).
El plan debe ser real, técnico y progresivo. Nunca uses texto fuera del json.`;

export const generateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CourseInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: path } = await supabaseAdmin
      .from("academy_paths")
      .select("id, title, description, category")
      .eq("id", data.pathId)
      .maybeSingle();
    if (!path) throw new Error("Ruta de aprendizaje no encontrada");

    const prompt = `Diseña el plan de un curso de nivel ${data.level} con exactamente ${data.lessons} lecciones para la ruta "${path.title}" (${path.description}). ${
      data.topic ? `Tema concreto: "${data.topic}".` : "Elige un tema útil y muy demandado dentro de esa ruta."
    }`;

    const out = await askJson(apiKey, COURSE_SYSTEM, prompt);
    const title: string = out?.title ?? data.topic ?? "Curso NEXUS";
    let slug = slugify(title);
    const { data: dup } = await supabaseAdmin.from("academy_courses").select("id").eq("slug", slug).maybeSingle();
    if (dup) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const plan: { title: string; focus: string }[] = (Array.isArray(out?.lessons) ? out.lessons : [])
      .slice(0, data.lessons)
      .map((l: any, i: number) => ({
        title: String(l?.title ?? `Lección ${i + 1}`),
        focus: String(l?.focus ?? ""),
      }));
    if (plan.length === 0) throw new Error("NEXUS no devolvió ninguna lección para este curso");

    const { data: course, error: cErr } = await supabaseAdmin
      .from("academy_courses")
      .insert({
        path_id: path.id,
        slug,
        title,
        description: out?.description ?? "",
        level: data.level,
        estimated_minutes: Math.min(600, Math.max(20, Number(out?.estimated_minutes) || 90)),
        author_id: context.userId,
        is_nexus: true,
        // Se publica sólo cuando las lecciones estén escritas.
        is_published: false,
        tags: Array.isArray(out?.tags) ? out.tags.slice(0, 6).map(String) : [],
      })
      .select("id, slug, title")
      .single();
    if (cErr) throw new Error(cErr.message);

    return { id: course.id, slug: course.slug, title: course.title, plan };
  });

/** Publica (o despublica) un curso una vez sus lecciones están escritas. */
export const setCoursePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ courseId: z.string().uuid(), published: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.published) {
      const { count } = await supabaseAdmin
        .from("academy_lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", data.courseId);
      if (!count) throw new Error("El curso no tiene lecciones todavía: no se puede publicar");
    }

    const { error } = await supabaseAdmin
      .from("academy_courses")
      .update({ is_published: data.published })
      .eq("id", data.courseId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const LESSON_SYSTEM = `Eres NEXUS, profesor de ITSABDIAS Academy. Devuelves SIEMPRE json con las claves:
title, content (markdown extenso con ejemplos de código), exercise, tips, common_mistakes, summary, duration_minutes (int).
Español, técnico y práctico. Nada de texto fuera del json.`;

export const generateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LessonInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id, title, description, level")
      .eq("id", data.courseId)
      .maybeSingle();
    if (!course) throw new Error("Curso no encontrado");

    const { data: existing } = await supabaseAdmin
      .from("academy_lessons")
      .select("title, position")
      .eq("course_id", course.id)
      .order("position", { ascending: true });

    const next = (existing?.length ?? 0) + 1;
    const out = await askJson(
      apiKey,
      LESSON_SYSTEM,
      `Crea la lección ${next} del curso "${course.title}" (${course.description}, nivel ${course.level}). ${
        data.topic ? `Tema: "${data.topic}".` : ""
      } Lecciones ya existentes: ${(existing ?? []).map((l: any) => l.title).join("; ") || "ninguna"}.`,
    );

    const { data: lesson, error } = await supabaseAdmin
      .from("academy_lessons")
      .insert({
        course_id: course.id,
        position: next,
        title: String(out?.title ?? `Lección ${next}`),
        content: String(out?.content ?? ""),
        exercise: out?.exercise ? String(out.exercise) : null,
        tips: out?.tips ? String(out.tips) : null,
        common_mistakes: out?.common_mistakes ? String(out.common_mistakes) : null,
        summary: out?.summary ? String(out.summary) : null,
        duration_minutes: Math.min(45, Math.max(3, Number(out?.duration_minutes) || 10)),
      })
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);

    return { id: lesson.id, title: lesson.title };
  });

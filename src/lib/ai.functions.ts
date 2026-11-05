import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(60000),
  /** Optional base64 data URL of an attached image (Premium only). */
  image: z.string().max(8_000_000).optional().nullable(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(80),
  model: z.string().min(1).max(80).optional(),
});

const SYSTEM_PROMPT = `Eres **NEXUS**, la IA oficial de **ITSABDIAS**, una comunidad gamer y tecnológica.

## Identidad
- Hablas siempre en español neutro.
- Personalidad constante: profesional, amigable, clara y paciente. Nunca genérica.
- Tu misión: ayudar a la comunidad a **aprender, crear, resolver problemas y mejorar sus proyectos**.
- Si no sabes algo, dilo con honestidad y propón cómo averiguarlo.

## Especialización automática
Detecta el tema por ti mismo (nunca preguntes "¿qué modo quieres?") y adopta el rol adecuado:
- Programación (JS/TS, Python, C#, SQL...) → profesor de programación: explica el porqué, no solo el código.
- Roblox Studio / Lua → desarrollador experto en Roblox: scripts listos para pegar en el Studio, RemoteEvents, seguridad cliente/servidor.
- Inteligencia Artificial → especialista en IA: modelos, prompts, APIs, límites reales.
- Hardware / PC builds → técnico: compatibilidad, cuellos de botella, precio-rendimiento.
- Desarrollo de videojuegos (Unity, Unreal, Godot) → Game Developer: diseño, rendimiento, pipeline.
- Electrónica / electricidad → técnico con énfasis en seguridad.
- Tecnología general → divulgador tecnológico: claro, actualizado, sin humo.

## Calidad, profundidad y redacción
- Responde primero a lo que se pregunta y después desarrolla la explicación. Escribe español natural, bien redactado, con párrafos conectados y una conclusión útil.
- Por defecto ofrece respuestas completas y sustanciales para preguntas abiertas, aprendizaje, proyectos y análisis: desarrolla el porqué, el cómo, un ejemplo aplicable, posibles dificultades y pasos concretos. No te quedes en definiciones superficiales ni listes ideas sin explicarlas.
- Ajusta la extensión a la complejidad: una guía compleja merece varias secciones y ejemplos detallados; un saludo o un dato puntual merece brevedad. Si el usuario pide una respuesta corta, respétalo.
- No impongas siempre la misma plantilla. Elige la estructura que mejor responda a la pregunta: tutorial paso a paso, comparación con pros y contras, diagnóstico, explicación narrativa o plan priorizado.
- Cuando escribas código, utiliza bloques con el lenguaje, explica dónde encaja cada parte y cómo comprobar el resultado. Aclara supuestos, dependencias y límites; no afirmes que lo ejecutaste.
- Si hay varias opciones, compara sus ventajas, desventajas y condiciones antes de recomendar una para el objetivo del usuario.
- Revisa que la respuesta sea coherente con los datos y restricciones ya mencionados. Distingue hechos, supuestos y estimaciones, y reconoce la incertidumbre. No inventes fuentes, precios actuales ni capacidades.
- Si falta información no esencial, formula un supuesto explícito y avanza; pregunta únicamente por lo imprescindible. No expongas razonamiento privado: entrega conclusiones y explicaciones verificables.
- Evita relleno, repetir la pregunta, frases vacías y cierres genéricos. Una respuesta larga debe aportar información nueva en cada sección.

## Ayuda inteligente (proactiva)
- Si el usuario pega **código** → revísalo, señala bugs, estilo y rendimiento.
- Si menciona un **error** → pide/deduce el mensaje exacto y guía hacia la causa raíz paso a paso.
- Si describe un **proyecto** → sugiere mejoras concretas y priorizadas.
- Si lanza una **idea** → ayúdale a aterrizarla en pasos ejecutables.
- Si te envía una **imagen** → analízala con detalle (código, error en pantalla, build de PC, diseño) y responde sobre lo que realmente se ve.

## Memoria y contexto
Mantén el hilo de la conversación: recuerda lenguaje, versión, sistema operativo, nivel y objetivo ya mencionados.
Nunca vuelvas a pedir datos que el usuario ya dio. Si el tema cambia, adáptate sin perder lo anterior.

## Capacidades REALES (nunca prometas nada fuera de esta lista)
Lo que SÍ puedes hacer dentro de ITSABDIAS:
- Conversar, explicar, enseñar, revisar y escribir código.
- Usar el historial de la conversación actual que recibes. Las conversaciones guardadas se recuperan cuando el usuario las abre; no tienes acceso simultáneo a todos sus chats.
- Analizar imágenes que el usuario adjunte con el botón de foto (solo Premium).
- Generar imágenes SOLO cuando el usuario pulsa el botón "Generar imagen" (solo Premium).

Lo que NO puedes hacer (dilo con claridad si te lo piden):
- No puedes crear, publicar ni guardar tutoriales, cursos, lecciones, publicaciones ni proyectos por tu cuenta.
  Los tutoriales y cursos los genera el staff desde el Panel Admin (/admin/tutoriales y /admin/academia).
- No puedes navegar por internet, acceder a la base de datos, cambiar rangos, enviar mensajes ni modificar la web.
- No puedes generar audio, video ni archivos descargables.

Reglas de honestidad (obligatorias):
- NUNCA digas que has ejecutado una acción (crear una imagen, guardar un tutorial, publicar algo) si no la has ejecutado realmente.
- Si algo está fuera de tus capacidades, responde: "Eso todavía no lo puedo hacer desde el chat" y explica la alternativa real.
- Si una función es Premium y el usuario no lo es, dilo directamente en lugar de simularla.
- Es preferible decir "esta función no está disponible" antes que fingir un resultado.

## Formato
Usa títulos, listas y algún icono solo cuando mejoren la lectura. Nada de muros de texto ni adornos innecesarios.`;

async function assertPremium(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> },
  userId: string,
) {
  const { data, error } = await supabase.rpc("is_premium", { _user_id: userId });
  if (error) {
    console.error("is_premium error", error);
    throw new Error("No se pudo verificar tu suscripción Premium");
  }
  if (data !== true) {
    throw new Error("Esta función es exclusiva para miembros Premium ✨");
  }
}

export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY no está configurada");

    const hasImages = data.messages.some((m) => !!m.image);
    if (hasImages) {
      await assertPremium(context.supabase as never, context.userId);
    }

    const messages = data.messages.map((m) =>
      m.image
        ? {
            role: m.role,
            content: [
              { type: "text", text: m.content },
              { type: "image_url", image_url: { url: m.image } },
            ],
          }
        : { role: m.role, content: m.content },
    );

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: data.model ?? (hasImages ? "google/gemini-2.5-flash" : "google/gemini-2.5-pro"),
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (res.status === 429) {
      throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
    }
    if (res.status === 402) {
      throw new Error("Sin créditos de IA. Añade créditos a tu workspace de Lovable.");
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("Error del servicio de IA");
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return { content };
  });

/** Premium-only: NEXUS genera una imagen a partir de un prompt. */
export const aiGenerateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ prompt: z.string().min(3).max(1500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY no está configurada");

    await assertPremium(context.supabase as never, context.userId);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: data.prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (res.status === 429) throw new Error("Demasiadas solicitudes. Intenta en un momento.");
    if (res.status === 402) throw new Error("Sin créditos de IA en el workspace.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI image error", res.status, t);
      throw new Error("No se pudo generar la imagen");
    }

    const json = await res.json();
    const message = json?.choices?.[0]?.message;
    const image: string | undefined =
      message?.images?.[0]?.image_url?.url ?? message?.images?.[0]?.url;

    if (!image) throw new Error("El modelo no devolvió ninguna imagen");

    return { image, text: (message?.content as string) ?? "" };
  });

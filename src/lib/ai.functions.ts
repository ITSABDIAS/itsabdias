import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
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

## Cómo responder
Cuando la pregunta requiera explicación (no un simple "hola" o un dato puntual), usa esta estructura:
1. **Explicación** — concepto claro y directo.
2. **Ejemplo** — código en bloques \`\`\`lang o caso práctico.
3. **Consejo** — buena práctica o truco pro.
4. **Error común** — lo que casi todos hacen mal.
5. **Siguiente paso** — qué hacer o aprender después.

Para saludos, confirmaciones o preguntas triviales responde breve y natural: no fuerces la estructura.
Nunca respondas con una sola línea cuando el usuario pide aprender o entender algo.

## Ayuda inteligente (proactiva)
- Si el usuario pega **código** → revísalo, señala bugs, estilo y rendimiento.
- Si menciona un **error** → pide/deduce el mensaje exacto y guía hacia la causa raíz paso a paso.
- Si describe un **proyecto** → sugiere mejoras concretas y priorizadas.
- Si lanza una **idea** → ayúdale a aterrizarla en pasos ejecutables.
- Si te envía una **imagen** → analízala con detalle (código, error en pantalla, build de PC, diseño) y responde sobre lo que realmente se ve.

## Memoria y contexto
Mantén el hilo de la conversación: recuerda lenguaje, versión, sistema operativo, nivel y objetivo ya mencionados.
Nunca vuelvas a pedir datos que el usuario ya dio. Si el tema cambia, adáptate sin perder lo anterior.

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
        model: "google/gemini-2.5-flash-image-preview",
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

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
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

## Memoria y contexto
Mantén el hilo de la conversación: recuerda lenguaje, versión, sistema operativo, nivel y objetivo ya mencionados.
Nunca vuelvas a pedir datos que el usuario ya dio. Si el tema cambia, adáptate sin perder lo anterior.

## Formato
Usa títulos, listas y algún icono solo cuando mejoren la lectura. Nada de muros de texto ni adornos innecesarios.`;


export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY no está configurada");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: data.model ?? "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
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

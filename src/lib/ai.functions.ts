import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  model: z.string().min(1).max(80).optional(),
});

const SYSTEM_PROMPT = `Eres NEXUS, el asistente IA oficial de ItsaBDias —
una comunidad gamer/dev futurista. Habla en español neutro,
sé cercano, claro y directo. Especialidades: programación (JS/TS, Python, Lua/Roblox),
desarrollo de juegos (Unity, Unreal), IA, hardware/PC builds, electrónica básica
y ciberseguridad. Cuando ayudes con código, da bloques con \`\`\`lang.
Si no sabes algo, dilo. Sé breve por defecto y profundiza cuando se te pida.`;

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

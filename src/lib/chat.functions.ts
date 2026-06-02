import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
});

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("getChatHistory error", error);
      throw new Error("No se pudo cargar el historial de chat");
    }

    return {
      messages: (data ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    };
  });

export const saveChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MessageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: userId,
      role: data.role,
      content: data.content,
    });

    if (error) {
      console.error("saveChatMessage error", error);
      throw new Error("No se pudo guardar el mensaje");
    }

    return { success: true };
  });

export const clearChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("clearChatHistory error", error);
      throw new Error("No se pudo borrar el historial");
    }

    return { success: true };
  });

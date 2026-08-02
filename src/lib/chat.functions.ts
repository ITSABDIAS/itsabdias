import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
  imageUrl: z.string().max(500).optional().nullable(),
});

const IdSchema = z.object({ conversationId: z.string().uuid() });

/** List all NEXUS conversations of the current user (newest first). */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("listConversations error", error);
      throw new Error("No se pudieron cargar las conversaciones");
    }
    return { conversations: data ?? [] };
  });

/** Create a new empty conversation. */
export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().min(1).max(80).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: userId, title: data.title ?? "Nueva conversación" })
      .select("id, title, created_at, updated_at")
      .single();

    if (error || !row) {
      console.error("createConversation error", error);
      throw new Error("No se pudo crear la conversación");
    }
    return { conversation: row };
  });

/** Messages of one conversation, in order. */
export const getConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("role, content, image_url, created_at")
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) {
      console.error("getConversationMessages error", error);
      throw new Error("No se pudo cargar la conversación");
    }

    return {
      messages: (rows ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        imageUrl: (m as { image_url: string | null }).image_url ?? null,
      })),
    };
  });

/** Persist a message inside a conversation and refresh its title/date. */
export const saveChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MessageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase.from("chat_messages").insert({
      user_id: userId,
      conversation_id: data.conversationId,
      role: data.role,
      content: data.content,
      image_url: data.imageUrl ?? null,
    });

    if (error) {
      console.error("saveChatMessage error", error);
      throw new Error("No se pudo guardar el mensaje");
    }

    const patch: { updated_at: string; title?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (data.role === "user") {
      const { data: convo } = await supabase
        .from("ai_conversations")
        .select("title")
        .eq("id", data.conversationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (convo && convo.title === "Nueva conversación") {
        patch.title = data.content.replace(/\s+/g, " ").trim().slice(0, 60);
      }
    }

    await supabase
      .from("ai_conversations")
      .update(patch)
      .eq("id", data.conversationId)
      .eq("user_id", userId);

    return { success: true };
  });

/** Rename a conversation. */
export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversationId: z.string().uuid(), title: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ai_conversations")
      .update({ title: data.title })
      .eq("id", data.conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("renameConversation error", error);
      throw new Error("No se pudo renombrar la conversación");
    }
    return { success: true };
  });

/** Delete one conversation and its messages. */
export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId);

    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", data.conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("deleteConversation error", error);
      throw new Error("No se pudo borrar la conversación");
    }
    return { success: true };
  });

/** Delete every conversation and message of the user. */
export const clearChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("chat_messages").delete().eq("user_id", userId);
    const { error } = await supabase.from("ai_conversations").delete().eq("user_id", userId);

    if (error) {
      console.error("clearChatHistory error", error);
      throw new Error("No se pudo borrar el historial");
    }
    return { success: true };
  });

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso — ItsaBDias" },
      { name: "description", content: "Inicia sesión o crea tu cuenta en la comunidad ItsaBDias." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenido de vuelta");
        nav({ to: "/community" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error de autenticación");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message ?? "Error con Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    nav({ to: "/community" });
  };

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// access.terminal" title={mode === "login" ? "Iniciar sesión" : "Crear cuenta"} subtitle="Únete a la comunidad gamer y tech." />

        <div className="mx-auto max-w-md glass rounded-2xl p-8 neon-border">
          <button
            onClick={google}
            disabled={busy}
            className="w-full mb-5 py-3 rounded-md border border-border hover:border-neon-blue/60 hover:shadow-neon-blue transition-all font-semibold"
          >
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-5 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> o con email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña (mín. 6)"
              className="w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple hover:shadow-neon-blue transition-all disabled:opacity-60"
            >
              {busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "¿Sin cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-neon-cyan hover:underline">
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Volver al inicio</Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}

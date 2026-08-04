import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Share2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/certificado/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Certificado ${params.code} — ITSABDIAS Academy` },
      { name: "description", content: `Verificación oficial del certificado ${params.code} emitido por ITSABDIAS Academy.` },
      { property: "og:title", content: "Certificado ITSABDIAS Academy" },
      { property: "og:description", content: "Certificado verificable emitido por ITSABDIAS Academy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { code } = Route.useParams();
  const [data, setData] = useState<{ username: string; course: string; issued: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: cert } = await supabase
        .from("academy_certificates")
        .select("user_id, course_id, issued_at")
        .eq("code", code)
        .maybeSingle();
      if (cancel) return;
      if (!cert) { setLoading(false); return; }
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", cert.user_id).maybeSingle(),
        supabase.from("academy_courses").select("title").eq("id", cert.course_id).maybeSingle(),
      ]);
      if (cancel) return;
      setData({ username: p?.username ?? "Estudiante", course: c?.title ?? "Curso ITSABDIAS", issued: cert.issued_at });
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [code]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "Mi certificado ITSABDIAS", url });
      else { await navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }
    } catch {}
  };

  if (loading) return <PageShell><section className="py-32 text-center text-muted-foreground">Verificando...</section></PageShell>;
  if (!data) return (
    <PageShell>
      <section className="py-32 text-center">
        <p className="text-muted-foreground">Certificado no encontrado o código inválido.</p>
        <Link to="/academy" className="mt-4 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Ir a la Academia</Link>
      </section>
    </PageShell>
  );

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=0b0b14&color=00f0ff&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : code)}`;

  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-2xl border-2 border-neon-gold/50 bg-gradient-card p-6 sm:p-10 text-center overflow-hidden">
            <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-neon-gold/10 blur-3xl" />
            <div className="relative">
              <Award className="h-12 w-12 mx-auto text-neon-gold" />
              <p className="mt-3 text-xs font-mono uppercase tracking-[0.3em] text-neon-gold">ITSABDIAS Academy</p>
              <h1 className="mt-4 font-display text-2xl sm:text-4xl font-bold text-gradient-neon">Certificado de finalización</h1>
              <p className="mt-6 text-sm text-muted-foreground">Se certifica que</p>
              <p className="font-display text-2xl sm:text-3xl font-bold">@{data.username}</p>
              <p className="mt-4 text-sm text-muted-foreground">ha completado con éxito el curso</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-neon-cyan">{data.course}</p>
              <p className="mt-6 text-xs text-muted-foreground">
                Emitido el {new Date(data.issued).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="mt-1 text-xs font-mono text-neon-purple">Código: {code}</p>

              <img src={qr} alt={`Código QR de verificación del certificado ${code}`} className="mt-6 mx-auto h-36 w-36 rounded-lg border border-neon-cyan/30" />
              <p className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1 justify-center">
                <ShieldCheck className="h-3 w-3 text-green-400" /> Certificado verificado en esta página
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button onClick={share} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">
                  <Share2 className="h-4 w-4" /> Compartir
                </button>
                <Link to="/academy" className="px-4 py-2 rounded-md border border-border text-sm hover:border-neon-cyan/60">Ir a la Academia</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

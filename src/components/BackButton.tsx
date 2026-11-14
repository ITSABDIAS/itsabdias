import { useLocation, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const { pathname } = useLocation();
  const router = useRouter();
  if (pathname === "/") return null;
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else router.navigate({ to: "/" });
  };
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
      <button
        type="button"
        onClick={goBack}
        aria-label="Volver atrás"
        className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-card/60 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur transition hover:border-primary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Atrás
      </button>
    </div>
  );
}

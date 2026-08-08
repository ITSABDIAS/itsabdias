import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { useMySanction } from "@/hooks/useMySanction";
import { useAuth } from "@/hooks/useAuth";
import { SanctionScreen, MuteBanner } from "./SanctionScreen";

export function PageShell({ children }: { children: ReactNode }) {
  const { sanction, loading } = useMySanction();
  const { signOut } = useAuth();

  const blocked = !loading && sanction && (sanction.status === "suspended" || sanction.status === "banned");

  if (blocked && sanction) {
    return <SanctionScreen sanction={sanction} onSignOut={() => signOut()} />;
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient layers */}
      <div className="fixed inset-0 -z-10 bg-background" />
      <div className="fixed inset-0 -z-10 grid-bg opacity-30" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="fixed top-1/3 -left-32 w-96 h-96 rounded-full bg-neon-blue/20 blur-[120px] -z-10" />
      <div className="fixed bottom-0 -right-32 w-[28rem] h-[28rem] rounded-full bg-neon-purple/20 blur-[140px] -z-10" />
      <Navbar />
      <AnnouncementBanner />
      <main className="pt-16">
        {!loading && sanction?.status === "muted" && (
          <div className="px-4 sm:px-6"><MuteBanner sanction={sanction} /></div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}

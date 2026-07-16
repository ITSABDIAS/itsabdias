import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu, X, Youtube, LogOut, User as UserIcon, Github,
  Home, Sparkles, Rocket, BookOpen, MessageSquare, Users, Crown, Shield, HelpCircle, Mail, Newspaper
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

type NavLink = { to: string; label: string; Icon: any };

const primaryLinks: NavLink[] = [
  { to: "/", label: "Inicio", Icon: Home },
  { to: "/ai", label: "NEXUS IA", Icon: Sparkles },
  { to: "/projects", label: "Proyectos", Icon: Rocket },
  { to: "/tutoriales", label: "Tutoriales", Icon: BookOpen },
  { to: "/noticias", label: "Noticias", Icon: Newspaper },
  { to: "/community", label: "Comunidad", Icon: MessageSquare },
];

const secondaryGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "Explora",
    links: [
      { to: "/programacion", label: "Programación", Icon: BookOpen },
      { to: "/hardware", label: "Hardware", Icon: BookOpen },
      { to: "/roblox", label: "Roblox", Icon: BookOpen },
      { to: "/gamedev", label: "GameDev", Icon: BookOpen },
      { to: "/electricidad", label: "Electricidad", Icon: BookOpen },
      { to: "/software", label: "Software", Icon: BookOpen },
      { to: "/tecnologia", label: "Tecnología", Icon: BookOpen },
    ],
  },
];

const accountLinks: NavLink[] = [
  { to: "/messages", label: "Mensajes", Icon: Mail },
  { to: "/staff", label: "Staff", Icon: Users },
  { to: "/help", label: "Ayuda", Icon: HelpCircle },
];

const GITHUB_URL = "https://github.com/ITSABDIAS";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [myUsername, setMyUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setMyUsername(null); return; }
    let cancelled = false;
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setMyUsername(data?.username ?? null);
    });
    return () => { cancelled = true; };
  }, [user]);

  const desktopLinks = [
    ...primaryLinks,
    { to: "/staff", label: "Staff", Icon: Shield },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 flex items-center justify-between h-16 gap-2">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img src={logo} alt="ItsaBDias" className="h-9 w-9 object-contain animate-glow-pulse" />
          <span className="font-display font-bold text-lg text-gradient-neon hidden xs:inline">ItsaBDias</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {desktopLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50 inline-flex items-center gap-1.5"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-foreground rounded-md bg-secondary/60 shadow-neon-blue inline-flex items-center gap-1.5" }}
            >
              <l.Icon className="h-3.5 w-3.5" /> {l.label}
            </Link>
          ))}
          <Link
            to="/premium"
            className="ml-1 px-3 py-2 text-sm font-bold rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:shadow-[0_0_18px_rgba(251,191,36,0.6)] transition-shadow inline-flex items-center gap-1.5"
          >
            <Crown className="h-3.5 w-3.5" /> Premium
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user && <NotificationBell />}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub de ITSABDIAS"
            className="hidden sm:inline-flex p-2 rounded-md border border-border hover:border-neon-cyan/60 hover:text-neon-cyan transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
          {user ? (
            <>
              {myUsername ? (
                <Link
                  to="/u/$username"
                  params={{ username: myUsername }}
                  className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-neon-cyan" />
                  {myUsername}
                </Link>
              ) : null}
              <button
                onClick={() => signOut()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:border-neon-purple/60 text-xs font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" /> Salir
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:border-neon-blue/60 text-xs font-semibold"
            >
              Entrar
            </Link>
          )}
          <a
            href="https://youtube.com/@ITSABDIAS"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-gradient-neon text-primary-foreground font-semibold text-xs hover:shadow-neon-purple transition-shadow"
          >
            <Youtube className="h-4 w-4" /> Suscribirse
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border glass max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-3 flex flex-col gap-3">
            {/* Premium destacado arriba */}
            <Link
              to="/premium"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold shadow-[0_0_20px_rgba(251,191,36,0.4)]"
            >
              <span className="inline-flex items-center gap-2"><Crown className="h-5 w-5" /> Hazte Premium</span>
              <span className="text-xs opacity-80">$3.99/mes →</span>
            </Link>

            <MobileGroup title="Principal" links={primaryLinks} onClick={() => setOpen(false)} />
            {secondaryGroups.map((g) => (
              <MobileGroup key={g.title} title={g.title} links={g.links} onClick={() => setOpen(false)} />
            ))}
            <MobileGroup title="Mi cuenta" links={accountLinks} onClick={() => setOpen(false)} />

            <div className="pt-2 mt-2 border-t border-border grid gap-2">
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover:bg-secondary/60 inline-flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-neon-cyan" /> Mi perfil {myUsername ? `(${myUsername})` : ""}
                  </Link>
                  <button onClick={() => { setOpen(false); signOut(); }} className="text-left px-3 py-2 rounded-md text-sm hover:bg-secondary/60 inline-flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Salir
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm bg-gradient-neon text-primary-foreground font-semibold text-center">
                  Entrar
                </Link>
              )}
              <div className="grid grid-cols-2 gap-2">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md text-sm border border-border inline-flex items-center gap-2 justify-center hover:border-neon-cyan/60 hover:text-neon-cyan">
                  <Github className="h-4 w-4" /> GitHub
                </a>
                <a href="https://youtube.com/@ITSABDIAS" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md text-sm bg-gradient-neon text-primary-foreground font-semibold inline-flex items-center gap-2 justify-center">
                  <Youtube className="h-4 w-4" /> YouTube
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

function MobileGroup({ title, links, onClick }: { title: string; links: NavLink[]; onClick: () => void }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 px-1">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={onClick}
            className="px-3 py-2 rounded-md text-sm hover:bg-secondary/60 border border-border/40 inline-flex items-center gap-2"
            activeProps={{ className: "px-3 py-2 rounded-md text-sm bg-secondary/60 border border-neon-blue/40 text-foreground inline-flex items-center gap-2" }}
          >
            <l.Icon className="h-3.5 w-3.5 text-neon-cyan" /> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

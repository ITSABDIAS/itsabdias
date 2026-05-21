import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/about", label: "Sobre mí" },
  { to: "/help", label: "Centro de Ayuda" },
  { to: "/ai", label: "IA" },
  { to: "/projects", label: "Proyectos" },
  { to: "/community", label: "Comunidad" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="ItsaBDias" className="h-9 w-9 object-contain animate-glow-pulse" />
          <span className="font-display font-bold text-lg text-gradient-neon">ItsaBDias</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-foreground rounded-md bg-secondary/60 shadow-neon-blue" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="https://youtube.com/@ItsaBDias"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground font-semibold text-sm hover:shadow-neon-purple transition-shadow"
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
        <nav className="lg:hidden border-t border-border px-4 py-3 flex flex-col gap-1 glass">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md text-sm hover:bg-secondary/60"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

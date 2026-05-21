import { Youtube, Github, Twitter, Twitch } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-bold text-gradient-neon">ItsaBDias</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Aprende tecnología, crea el futuro. Comunidad gamer y tecnológica.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Comunidad</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Programación · IA · Hardware</li>
            <li>Roblox · Gamedev · Ingeniería</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Síguenos</h4>
          <div className="flex gap-3">
            {[
              { Icon: Youtube, href: "https://youtube.com/@ITSABDIAS" },
              { Icon: Twitch, href: "#" },
              { Icon: Github, href: "#" },
              { Icon: Twitter, href: "#" },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="p-2 rounded-md glass hover:shadow-neon-blue hover:scale-110 transition-all"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ItsaBDias · Built for the future
      </div>
    </footer>
  );
}

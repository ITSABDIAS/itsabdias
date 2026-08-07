export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12">
      {eyebrow && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/5">
          {eyebrow}
        </span>
      )}
      <Heading className="mt-4 text-3xl sm:text-5xl font-bold">
        <span className="text-gradient-neon">{title}</span>
      </Heading>
      {subtitle && <p className="mt-4 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12">
      {eyebrow && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/5">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl sm:text-5xl font-bold">
        <span className="text-gradient-neon">{title}</span>
      </h2>
      {subtitle && <p className="mt-4 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

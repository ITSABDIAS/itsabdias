import type { ReactNode } from "react";

/** Renders a username with the gold premium gradient + soft glow when premium=true. */
export function PremiumName({
  children,
  premium,
  className = "",
}: {
  children: ReactNode;
  premium?: boolean;
  className?: string;
}) {
  if (!premium) return <span className={className}>{children}</span>;
  return (
    <span
      className={`bg-gradient-to-r from-[#fbbf24] via-[#fde68a] to-[#f59e0b] bg-clip-text text-transparent font-bold ${className}`}
      style={{ textShadow: "0 0 12px rgba(251,191,36,0.45)" }}
    >
      {children}
    </span>
  );
}

/** Wraps an avatar with a gold premium ring when premium=true. */
export function PremiumAvatarRing({
  premium,
  children,
  className = "",
}: {
  premium?: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!premium) return <div className={className}>{children}</div>;
  return (
    <div
      className={`relative rounded-full p-[2px] bg-gradient-to-br from-[#fbbf24] via-[#ff00aa] to-[#22d3ee] animate-glow-pulse ${className}`}
      style={{ boxShadow: "0 0 14px rgba(251,191,36,0.45)" }}
    >
      {children}
    </div>
  );
}

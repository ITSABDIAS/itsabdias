import type { ReactElement } from "react";
import { CopyButton } from "@/components/CopyButton";

// Simple markdown-lite renderer with code blocks + headings + lists.
// Kept dependency-free for reliability.
export function TutorialContent({ content }: { content: string }) {
  const parts = content.split(/```/);
  const nodes: ReactElement[] = [];
  parts.forEach((chunk, i) => {
    if (i % 2 === 1) {
      // code block
      const firstNl = chunk.indexOf("\n");
      const lang = firstNl > -1 ? chunk.slice(0, firstNl).trim() : "";
      const code = firstNl > -1 ? chunk.slice(firstNl + 1) : chunk;
      nodes.push(
        <div key={`c-${i}`} className="relative my-4 rounded-lg border border-neon-purple/30 bg-black/70 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-neon-purple/20 bg-black/60">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neon-cyan">{lang || "code"}</span>
            <CopyButton text={code} />
          </div>
          <pre className="p-3 overflow-x-auto text-xs sm:text-sm font-mono text-neon-cyan/90 whitespace-pre">{code}</pre>
        </div>,
      );
    } else {
      nodes.push(<TextBlock key={`t-${i}`} text={chunk} />);
    }
  });
  return <div className="prose-invert">{nodes}</div>;
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactElement[] = [];
  let listBuf: string[] = [];
  const flushList = (k: number) => {
    if (listBuf.length) {
      out.push(
        <ul key={`ul-${k}`} className="list-disc pl-5 my-3 space-y-1 text-sm text-muted-foreground">
          {listBuf.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      listBuf = [];
    }
  };
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^#{1,6}\s/.test(trimmed)) {
      flushList(idx);
      const level = trimmed.match(/^#+/)![0].length;
      const text = trimmed.replace(/^#+\s*/, "");
      const cls =
        level <= 2
          ? "font-display text-xl sm:text-2xl font-bold mt-6 mb-2 text-gradient-neon"
          : "font-display text-lg font-bold mt-5 mb-2 text-neon-cyan";
      out.push(
        <h3 key={idx} className={cls}>
          {text}
        </h3>,
      );
    } else if (/^[-*]\s/.test(trimmed)) {
      listBuf.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (trimmed === "") {
      flushList(idx);
    } else {
      flushList(idx);
      out.push(
        <p key={idx} className="text-sm sm:text-base text-muted-foreground my-2 leading-relaxed">
          {inline(trimmed)}
        </p>,
      );
    }
  });
  flushList(9999);
  return <>{out}</>;
}

function inline(s: string) {
  // bold **x** and inline `code`
  const parts: (string | ReactElement)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = regex.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={i++} className="text-foreground font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code key={i++} className="px-1.5 py-0.5 rounded bg-black/60 border border-neon-purple/30 text-neon-cyan text-[0.85em] font-mono">
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

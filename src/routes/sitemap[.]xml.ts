import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://itsabdias.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const SUPABASE_URL = "https://oaprhsjielllbzhizkrc.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcHJoc2ppZWxsbGJ6aGl6a3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTQ5ODMsImV4cCI6MjA5NDk5MDk4M30.kqrtqU0qpBXftTrIZplzhWpUlqKc4QR-ROV4cZp83Cc";

async function fetchRows(table: string, select: string, filter = ""): Promise<any[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filter}&limit=1000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/programacion", changefreq: "weekly", priority: "0.8" },
          { path: "/ai", changefreq: "weekly", priority: "0.8" },
          { path: "/hardware", changefreq: "weekly", priority: "0.8" },
          { path: "/roblox", changefreq: "weekly", priority: "0.8" },
          { path: "/gamedev", changefreq: "weekly", priority: "0.8" },
          { path: "/electricidad", changefreq: "weekly", priority: "0.8" },
          { path: "/software", changefreq: "weekly", priority: "0.8" },
          { path: "/tecnologia", changefreq: "weekly", priority: "0.8" },
          { path: "/tutoriales", changefreq: "daily", priority: "0.9" },
          { path: "/academy", changefreq: "daily", priority: "0.9" },
          { path: "/noticias", changefreq: "daily", priority: "0.9" },
          { path: "/projects", changefreq: "daily", priority: "0.8" },
          { path: "/community", changefreq: "daily", priority: "0.7" },
          { path: "/premium", changefreq: "monthly", priority: "0.7" },
          { path: "/staff", changefreq: "monthly", priority: "0.5" },
          { path: "/help", changefreq: "monthly", priority: "0.5" },
        ];

        const [tutorials, news, courses] = await Promise.all([
          fetchRows("tutorials", "category,slug", "&is_hidden=eq.false"),
          fetchRows("news", "slug"),
          fetchRows("academy_courses", "slug"),
        ]);

        for (const t of tutorials) {
          if (t?.category && t?.slug) entries.push({ path: `/tutorial/${t.category}/${t.slug}`, changefreq: "weekly", priority: "0.7" });
        }
        for (const n of news) {
          if (n?.slug) entries.push({ path: `/noticia/${n.slug}`, changefreq: "weekly", priority: "0.7" });
        }
        for (const c of courses) {
          if (c?.slug) entries.push({ path: `/curso/${c.slug}`, changefreq: "weekly", priority: "0.7" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});

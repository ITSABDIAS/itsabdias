import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/news")({
  beforeLoad: () => { throw redirect({ to: "/admin/noticias" }); },
});

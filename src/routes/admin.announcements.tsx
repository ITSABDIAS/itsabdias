import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/announcements")({
  beforeLoad: () => { throw redirect({ to: "/admin/anuncios" }); },
});

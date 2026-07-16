import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/posts")({
  beforeLoad: () => { throw redirect({ to: "/admin/publicaciones" }); },
});

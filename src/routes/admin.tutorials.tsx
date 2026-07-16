import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/tutorials")({
  beforeLoad: () => { throw redirect({ to: "/admin/tutoriales" }); },
});

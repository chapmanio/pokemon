import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  component: TeamLayout,
});

function TeamLayout() {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <Outlet />
    </div>
  );
}

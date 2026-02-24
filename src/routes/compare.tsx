import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/compare")({
  component: CompareLayout,
});

function CompareLayout() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Outlet />
    </div>
  );
}

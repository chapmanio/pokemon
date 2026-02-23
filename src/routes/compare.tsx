import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/compare")({
  component: CompareLayout,
});

function CompareLayout() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Head-to-Head</h2>
      <Outlet />
    </div>
  );
}

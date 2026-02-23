import { createRootRouteWithContext, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createRootRouteWithContext()({
  component: RootLayout,
});

const TOP_LEVEL_PATHS = ["/", "/compare", "/team"];

function RootLayout() {
  const { location } = useRouterState();
  const path = location.pathname;

  const isPokedex = path === "/" || (path.startsWith("/") && path.split("/").filter(Boolean).length === 1 && !["compare", "team"].includes(path.slice(1)));
  const isCompare = path.startsWith("/compare");
  const isTeam = path.startsWith("/team");

  const showBack = !TOP_LEVEL_PATHS.includes(path);

  const navLink =
    "flex-1 text-center py-3 font-medium min-h-[44px] flex items-center justify-center bg-white";
  const navActive = "text-red-600 font-semibold bg-red-100";
  const navInactive = "text-slate-600 hover:text-red-600 hover:bg-slate-100";

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <header className="fixed top-0 left-0 right-0 z-10 bg-red-600 text-white px-4 py-3 shadow-sm flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-1 -ml-1 rounded-md hover:bg-red-500/80 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-6" />
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight flex-1">PokéAssist</h1>
      </header>

      <main className="flex-1 overflow-y-auto pt-14 pb-16 bg-slate-50">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-slate-200 bg-white safe-area-pb">
        <Link
          to="/"
          className={`${navLink} ${isPokedex ? navActive : navInactive}`}
        >
          Pokédex
        </Link>
        <Link
          to="/compare"
          className={`${navLink} ${isCompare ? navActive : navInactive}`}
        >
          Compare
        </Link>
        <Link
          to="/team"
          className={`${navLink} ${isTeam ? navActive : navInactive}`}
        >
          Team
        </Link>
      </nav>
    </div>
  );
}

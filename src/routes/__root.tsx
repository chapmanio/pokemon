import {
  createRootRouteWithContext,
  Outlet,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { scrollMainToTop } from "@/shared/lib/scrollRestore";

export const Route = createRootRouteWithContext()({
  component: RootLayout,
});

const TOP_LEVEL_PATHS = ["/", "/compare", "/team"];
const BACK_TO_TOP_THRESHOLD = 300;

function RootLayout() {
  // Subscribe only to pathname so root doesn't re-render when location object reference changes
  // (which was causing <Outlet /> to remount the index route in a loop).
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () =>
      setShowBackToTop(el.scrollTop > BACK_TO_TOP_THRESHOLD);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const isPokedex =
    path === "/" ||
    (path.startsWith("/") &&
      path.split("/").filter(Boolean).length === 1 &&
      !["compare", "team"].includes(path.slice(1)));
  const isCompare = path.startsWith("/compare");
  const isTeam = path.startsWith("/team");

  const showBack = !TOP_LEVEL_PATHS.includes(path);

  const navLink =
    "flex-1 text-center py-3 font-medium min-h-[44px] flex items-center justify-center bg-white";
  const navActive = "text-red-600 font-semibold bg-red-100";
  const navInactive = "text-slate-600 hover:text-red-600 hover:bg-slate-100";

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-white">
      <header className="fixed top-0 left-0 right-0 z-20 bg-red-600 text-white px-4 py-3 shadow-sm flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="-ml-1 rounded-md hover:bg-red-500/80 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-6" />
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight flex-1">PokéAssist</h1>
        <span className="text-white/90 text-sm font-medium">
          {isPokedex && "Pokédex"}
          {isCompare && "Compare"}
          {isTeam && "Team"}
        </span>
      </header>

      <main
        ref={mainRef}
        id="main-scroll"
        className="flex-1 overflow-y-auto pt-14 pb-16 bg-slate-50"
      >
        <Outlet />
      </main>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => scrollMainToTop()}
          className="fixed right-4 bottom-16 z-30 rounded-full bg-red-600 text-white p-3 shadow-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-5" />
        </button>
      )}

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

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { usePokemonList } from "@/features/pokemon-list/usePokemonList";
import { PokemonListFilters } from "@/features/pokemon-list/PokemonListFilters";
import { PokemonCard } from "@/entities/pokemon/ui/PokemonCard";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { useQuery } from "@tanstack/react-query";
import { restoreScrollPosition, saveScrollPosition, useSaveScrollOnScroll } from "@/shared/lib/scrollRestore";

export const Route = createFileRoute("/")({
  component: PokedexHome,
});

function parseSearchFromWindow(): { q: string; region: string } {
  if (typeof window === "undefined") return { q: "", region: "" };
  const p = new URLSearchParams(window.location.search);
  return { q: p.get("q") ?? "", region: p.get("region") ?? "" };
}

/** Search params from URL without subscribing to router state (avoids remount loops). */
function useIndexSearchParams() {
  const navigate = useNavigate({ from: "/" });
  const [params, setParams] = useState(parseSearchFromWindow);

  useEffect(() => {
    const onPopState = () => setParams(parseSearchFromWindow());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setSearchFromUrl = useCallback(
    (value: string) => {
      if (value === params.q) return;
      navigate({ to: ".", search: { q: value, region: params.region } });
      setParams((prev) => ({ ...prev, q: value }));
    },
    [navigate, params.q, params.region]
  );
  const setRegionFromUrl = useCallback(
    (value: string) => {
      if (value === params.region) return;
      navigate({ to: ".", search: { q: params.q, region: value } });
      setParams((prev) => ({ ...prev, region: value }));
    },
    [navigate, params.q, params.region]
  );

  return { q: params.q, region: params.region, setSearchFromUrl, setRegionFromUrl };
}

const POKEDEX_LIST_PATH = "/";

function PokedexHome() {
  const { q, region, setSearchFromUrl, setRegionFromUrl } = useIndexSearchParams();

  useSaveScrollOnScroll(POKEDEX_LIST_PATH);

  useEffect(() => {
    restoreScrollPosition(POKEDEX_LIST_PATH);
    const t1 = setTimeout(() => restoreScrollPosition(POKEDEX_LIST_PATH), 100);
    const t2 = setTimeout(() => restoreScrollPosition(POKEDEX_LIST_PATH), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const {
    search,
    setSearch,
    regionValue,
    setRegionValue,
    visible,
    hasMore,
    lastItemRef,
    resetVisible,
    regionLoading,
    isLoading,
  } = usePokemonList({
    search: q,
    setSearch: setSearchFromUrl,
    regionValue: region,
    setRegionValue: setRegionFromUrl,
  });

  useEffect(() => {
    if (isLoading || visible.length === 0) return;
    const t = setTimeout(() => restoreScrollPosition(POKEDEX_LIST_PATH), 50);
    return () => clearTimeout(t);
  }, [isLoading, visible.length]);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Fixed bar so it stays visible below the red header; spacer reserves space in the scroll flow */}
      <div
        className="fixed left-0 right-0 top-13 z-10 border-b border-slate-200/80 bg-slate-50 py-2"
        style={{ height: "5.5rem" }}
      >
        <div className="mx-auto max-w-2xl px-4">
          <PokemonListFilters
            search={search}
            setSearch={setSearch}
            regionValue={regionValue}
            setRegionValue={setRegionValue}
            resetVisible={resetVisible}
          />
        </div>
      </div>
      <div className="h-19" aria-hidden />
      <div className="space-y-2 py-4">
        {regionLoading ? (
          <p className="text-slate-500 text-sm">Loading region…</p>
        ) : isLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          visible.map((entry) => (
            <PokedexSearchResult
              key={entry.name}
              name={entry.name}
              onBeforeNavigate={() => saveScrollPosition(POKEDEX_LIST_PATH)}
            />
          ))
        )}
        {hasMore && visible.length > 0 && (
          <div
            ref={lastItemRef}
            className="py-4 text-center text-slate-500 text-sm"
          >
            Loading more…
          </div>
        )}
      </div>
    </div>
  );
}

function PokedexSearchResult({ name, onBeforeNavigate }: { name: string; onBeforeNavigate?: () => void }) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  if (!pokemon) return null;
  return <PokemonCard pokemon={pokemon} size="sm" onBeforeNavigate={onBeforeNavigate} />;
}

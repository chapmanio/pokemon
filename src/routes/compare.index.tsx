import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { usePokemonList } from "@/features/pokemon-list/usePokemonList";
import { PokemonListFilters } from "@/features/pokemon-list/PokemonListFilters";
import { PokemonCard } from "@/entities/pokemon/ui/PokemonCard";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { useQuery } from "@tanstack/react-query";
import { restoreScrollPosition, useSaveScrollOnScroll } from "@/shared/lib/scrollRestore";

export const Route = createFileRoute("/compare/")({
  component: CompareIndexPage,
});

function parseCompareSearchFromWindow(): { q: string; region: string } {
  if (typeof window === "undefined") return { q: "", region: "" };
  const p = new URLSearchParams(window.location.search);
  return { q: p.get("q") ?? "", region: p.get("region") ?? "" };
}

/** Search params from URL without subscribing to router state (avoids remount loops). */
function useCompareSearchParams() {
  const navigate = useNavigate({ from: "/compare/" });
  const [params, setParams] = useState(parseCompareSearchFromWindow);

  useEffect(() => {
    const onPopState = () => setParams(parseCompareSearchFromWindow());
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

const COMPARE_INDEX_PATH = "/compare/";

function CompareIndexPage() {
  const { q, region, setSearchFromUrl, setRegionFromUrl } = useCompareSearchParams();

  useSaveScrollOnScroll(COMPARE_INDEX_PATH);

  useEffect(() => {
    restoreScrollPosition(COMPARE_INDEX_PATH);
    const t1 = setTimeout(() => restoreScrollPosition(COMPARE_INDEX_PATH), 100);
    const t2 = setTimeout(() => restoreScrollPosition(COMPARE_INDEX_PATH), 400);
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

  return (
    <div className="space-y-4">
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
      <div className="h-16.5" aria-hidden />
      <p className="text-muted-foreground text-sm">
        Select a Pokémon to compare head-to-head with another.
      </p>
      <div className="space-y-2">
        {regionLoading ? (
          <p className="text-slate-500 text-sm">Loading region…</p>
        ) : isLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          visible.map((entry) => (
            <CompareIndexResult key={entry.name} name={entry.name} />
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

function CompareIndexResult({ name }: { name: string }) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  if (!pokemon) return null;
  return (
    <PokemonCard
      pokemon={pokemon}
      size="sm"
      to="/compare/$pokemon"
      params={{ pokemon: pokemon.name }}
    />
  );
}

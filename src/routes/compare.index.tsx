import { createFileRoute } from "@tanstack/react-router";
import { usePokemonList } from "@/features/pokemon-list/usePokemonList";
import { PokemonListFilters } from "@/features/pokemon-list/PokemonListFilters";
import { PokemonCard } from "@/entities/pokemon/ui/PokemonCard";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/compare/")({
  component: CompareIndexPage,
});

function CompareIndexPage() {
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
  } = usePokemonList();

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

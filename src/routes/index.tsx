import { createFileRoute } from "@tanstack/react-router";
import { usePokemonList } from "@/features/pokemon-list/usePokemonList";
import { PokemonListFilters } from "@/features/pokemon-list/PokemonListFilters";
import { PokemonCard } from "@/entities/pokemon/ui/PokemonCard";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: PokedexHome,
});

function PokedexHome() {
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
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-3">Pokédex</h2>
      <PokemonListFilters
        search={search}
        setSearch={setSearch}
        regionValue={regionValue}
        setRegionValue={setRegionValue}
        resetVisible={resetVisible}
      />
      <div className="mt-4 space-y-2">
        {regionLoading ? (
          <p className="text-slate-500 text-sm">Loading region…</p>
        ) : isLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          visible.map((entry) => (
            <PokedexSearchResult key={entry.name} name={entry.name} />
          ))
        )}
        {hasMore && visible.length > 0 && (
          <div ref={lastItemRef} className="py-4 text-center text-slate-500 text-sm">
            Loading more…
          </div>
        )}
      </div>
    </div>
  );
}

function PokedexSearchResult({ name }: { name: string }) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  if (!pokemon) return null;
  return <PokemonCard pokemon={pokemon} size="sm" />;
}

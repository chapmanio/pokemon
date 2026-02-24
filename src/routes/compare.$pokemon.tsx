import {
  createFileRoute,
  Outlet,
  useNavigate,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { fetchPokemonSpecies } from "@/entities/pokemon/api/fetchPokemonSpecies";
import { usePokemonList } from "@/features/pokemon-list/usePokemonList";
import { PokemonListFilters } from "@/features/pokemon-list/PokemonListFilters";
import { PokemonDetailHeader } from "@/features/pokemon-detail/PokemonDetailHeader";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/compare/$pokemon")({
  component: ComparePokemonPage,
});

function ComparePokemonPage() {
  const { pokemon: selectedName } = Route.useParams();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isVsPage = pathname.includes("/vs/");

  const { data: pokemonA } = useQuery({
    queryKey: ["pokemon", selectedName],
    queryFn: () => fetchPokemon(selectedName),
  });
  const { data: speciesA } = useQuery({
    queryKey: ["pokemonSpecies", selectedName],
    queryFn: () => fetchPokemonSpecies(selectedName),
    enabled: !!pokemonA,
  });

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

  const imgA =
    pokemonA?.sprites.other?.["official-artwork"]?.front_default ??
    pokemonA?.sprites.front_default ??
    "";
  const flavorA =
    speciesA?.flavor_text_entries?.find((e) => e.language.name === "en")
      ?.flavor_text ?? "";

  // On the vs page, render only the head-to-head content (no list/search).
  if (isVsPage) {
    return <Outlet />;
  }

  return (
    <>
      {!pokemonA ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
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
          <div className="h-18" aria-hidden />
          <PokemonDetailHeader
            name={pokemonA.name}
            imgSrc={imgA}
            types={pokemonA.types}
            flavorText={flavorA}
            linkLabel="Pokédex"
            linkTo="/$name"
            linkParams={{ name: pokemonA.name }}
          />

          <p className="text-muted-foreground text-sm">
            Choose an opponent to compare.
          </p>
          <div className="space-y-2">
            {regionLoading ? (
              <p className="text-slate-500 text-sm">Loading region…</p>
            ) : isLoading ? (
              <p className="text-slate-500 text-sm">Loading…</p>
            ) : (
              visible.map((entry) => (
                <CompareListRow
                  key={entry.name}
                  name={entry.name}
                  onCompare={() =>
                    navigate({
                      to: "/compare/$pokemon/vs/$opponent",
                      params: { pokemon: selectedName, opponent: entry.name },
                    })
                  }
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
      )}
    </>
  );
}

function CompareListRow({
  name,
  onCompare,
}: {
  name: string;
  onCompare: () => void;
}) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  if (!pokemon) return null;

  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "";

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={img}
            alt={pokemon.name}
            className="w-12 h-12 object-contain shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium capitalize">{pokemon.name}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {pokemon.types.map((t) => (
                <Badge
                  key={t.type.name}
                  variant="secondary"
                  className="text-xs capitalize border-0"
                  style={{
                    backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8",
                    color: "white",
                  }}
                >
                  {t.type.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              #{String(pokemon.id).padStart(3, "0")}
            </p>
            <Link
              to="/$name"
              params={{ name: pokemon.name }}
              className="text-xs text-muted-foreground hover:underline mt-1.5 inline-block"
            >
              Pokédex
            </Link>
          </div>
        </div>
        <Button size="sm" onClick={onCompare}>
          Compare
        </Button>
      </CardContent>
    </Card>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePokemonList } from "@/features/pokemon-list/usePokemonList";
import { PokemonListFilters } from "@/features/pokemon-list/PokemonListFilters";
import { useTeam } from "@/features/team-builder/useTeam";
import { TeamListRow } from "@/features/team-builder/TeamListRow";

export const Route = createFileRoute("/team/")({
  component: TeamIndexPage,
});

function TeamIndexPage() {
  const navigate = useNavigate();
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
  const { team, add, remove, isFull } = useTeam();

  return (
    <div className="space-y-4">
      <div
        className="fixed left-0 right-0 top-13.5 z-10 border-b border-slate-200/80 bg-slate-50 py-2"
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
      <div className="h-22" aria-hidden />
      <p className="text-muted-foreground text-sm">
        Add up to 6 Pokémon to build your team, then view the analysis.
      </p>
      <div className="space-y-2">
        {regionLoading ? (
          <p className="text-slate-500 text-sm">Loading region…</p>
        ) : isLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          visible.map((entry) => (
            <TeamListRow
              key={entry.name}
              name={entry.name}
              team={team}
              isFull={isFull}
              onAdd={add}
              onRemove={remove}
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
        {team.length > 0 && <div className="h-20" aria-hidden />}
      </div>

      {team.length > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-16 z-10">
          <button
            type="button"
            onClick={() => navigate({ to: "/team/view" })}
            className="rounded-full bg-red-600 px-6 py-2.5 text-white font-semibold shadow-lg hover:bg-red-500 active:bg-red-700 transition-colors"
            aria-label={`View team, ${team.length} Pokémon selected`}
          >
            View Team ({team.length})
          </button>
        </div>
      )}
    </div>
  );
}

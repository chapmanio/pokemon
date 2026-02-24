import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTeam } from "@/features/team-builder/useTeam";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { fetchType } from "@/entities/type/api/fetchType";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import { Button } from "@/components/ui/button";
import {
  getTeamCoverage,
  getTeamWeaknessMap,
  getCoverageGaps,
  ALL_TYPES,
} from "@/features/team-builder/teamTypeAnalysis";
import { getStat } from "@/shared/lib/matchupScore";
import { useMemo } from "react";

const STAT_NAMES = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;
const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "Spe",
};

export const Route = createFileRoute("/team/view")({
  component: TeamViewPage,
});

function TeamViewPage() {
  const navigate = useNavigate();
  const { team, remove } = useTeam();

  const { data: typeChart } = useQuery({
    queryKey: ["typeChart"],
    queryFn: async () => {
      const chart: Record<string, Awaited<ReturnType<typeof fetchType>>> = {};
      for (const t of ALL_TYPES) {
        chart[t] = await fetchType(t);
      }
      return chart;
    },
    enabled: team.length > 0,
  });

  const teamPokemonQueries = useQuery({
    queryKey: ["teamPokemon", team.map((e) => e.name).sort().join(",")],
    queryFn: async () => {
      const list = await Promise.all(team.map((e) => fetchPokemon(e.name)));
      return list;
    },
    enabled: team.length > 0,
  });

  const teamTypeSets = useMemo(() => {
    const list = teamPokemonQueries.data;
    if (!list) return [];
    return list.map((p) => p.types.map((t) => t.type.name));
  }, [teamPokemonQueries.data]);

  const coverage = useMemo(
    () => (typeChart ? getTeamCoverage(teamTypeSets, typeChart) : new Set<string>()),
    [typeChart, teamTypeSets]
  );
  const weaknessMap = useMemo(
    () => (typeChart ? getTeamWeaknessMap(teamTypeSets, typeChart) : new Map<string, number>()),
    [typeChart, teamTypeSets]
  );
  const gaps = useMemo(
    () => getCoverageGaps(coverage, weaknessMap),
    [coverage, weaknessMap]
  );

  const weak4x = useMemo(
    () => ALL_TYPES.filter((t) => (weaknessMap.get(t) ?? 0) >= 4),
    [weaknessMap]
  );
  const weak2xOnly = useMemo(
    () => ALL_TYPES.filter((t) => (weaknessMap.get(t) ?? 0) === 2),
    [weaknessMap]
  );

  if (team.length === 0) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4 text-center">
        <p className="text-muted-foreground">No Pokémon in your team. Add up to 6 to see type coverage, weaknesses, and stats.</p>
        <Button asChild>
          <Link to="/team">Add Pokémon</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <p className="text-muted-foreground text-sm">
        Your team lineup. Back to{" "}
        <button
          type="button"
          onClick={() => navigate({ to: "/team" })}
          className="text-red-600 font-medium hover:underline"
        >
          edit team
        </button>
        .
      </p>
      <section>
        <h2 className="text-lg font-semibold mb-2">Roster</h2>
        <div className="space-y-2">
          {team.map((entry) => (
            <TeamViewRow
              key={entry.id}
              name={entry.name}
              onRemove={() => remove(entry.id)}
            />
          ))}
        </div>
      </section>

      {!teamPokemonQueries.data && teamPokemonQueries.isLoading && (
        <p className="text-slate-500 text-sm">Loading team data…</p>
      )}
      {typeChart && teamTypeSets.length === team.length && (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-2">Type coverage</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Types your team can hit super effectively:
            </p>
            <div className="flex flex-wrap gap-1">
              {ALL_TYPES.filter((t) => coverage.has(t)).map((typeName) => (
                <span
                  key={typeName}
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium capitalize"
                  style={{
                    backgroundColor: TYPE_COLORS[typeName] ?? "#94a3b8",
                  }}
                >
                  {typeName}
                </span>
              ))}
              {coverage.size === 0 && (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Team weaknesses</h2>
            {weak4x.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium mb-1">4× weak to</p>
                <div className="flex flex-wrap gap-1">
                  {weak4x.map((typeName) => (
                    <span
                      key={typeName}
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium capitalize"
                      style={{
                        backgroundColor: TYPE_COLORS[typeName] ?? "#94a3b8",
                      }}
                    >
                      {typeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {weak2xOnly.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">2× weak to</p>
                <div className="flex flex-wrap gap-1">
                  {weak2xOnly.map((typeName) => (
                    <span
                      key={typeName}
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium capitalize"
                      style={{
                        backgroundColor: TYPE_COLORS[typeName] ?? "#94a3b8",
                      }}
                    >
                      {typeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {gaps.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-2">Coverage gaps</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Types that hit your team super effectively and you don’t cover:
              </p>
              <div className="flex flex-wrap gap-1">
                {gaps.map((typeName) => (
                  <span
                    key={typeName}
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium capitalize"
                    style={{
                      backgroundColor: TYPE_COLORS[typeName] ?? "#94a3b8",
                    }}
                  >
                    {typeName}
                  </span>
                ))}
              </div>
            </section>
          )}

          {teamPokemonQueries.data && teamPokemonQueries.data.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-2">Stats</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Base stats and total (BST). Team average:{" "}
                <span className="font-medium text-foreground">
                  {Math.round(
                    teamPokemonQueries.data.reduce(
                      (sum, p) => sum + STAT_NAMES.reduce((s, name) => s + getStat(p, name), 0),
                      0
                    ) / teamPokemonQueries.data.length
                  )}
                </span>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Pokémon</th>
                      {STAT_NAMES.map((name) => (
                        <th key={name} className="text-right py-1.5 px-1 font-medium text-muted-foreground tabular-nums">
                          {STAT_LABELS[name]}
                        </th>
                      ))}
                      <th className="text-right py-1.5 pl-2 font-medium text-muted-foreground tabular-nums">BST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPokemonQueries.data.map((pokemon) => {
                      const bst = STAT_NAMES.reduce((s, name) => s + getStat(pokemon, name), 0);
                      return (
                        <tr key={pokemon.name} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 font-medium capitalize truncate max-w-[100px]">
                            {pokemon.name}
                          </td>
                          {STAT_NAMES.map((name) => (
                            <td key={name} className="text-right py-1.5 px-1 tabular-nums">
                              {getStat(pokemon, name)}
                            </td>
                          ))}
                          <td className="text-right py-1.5 pl-2 tabular-nums font-medium">{bst}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TeamViewRow({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
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
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
      <img src={img} alt={pokemon.name} className="w-16 h-16 object-contain shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold capitalize text-slate-900">{pokemon.name}</p>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{
                backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8",
              }}
            >
              {t.type.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">#{String(pokemon.id).padStart(3, "0")}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/$name" params={{ name: pokemon.name }} className="text-xs">
            Pokédex
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          onClick={onRemove}
          aria-label={`Remove ${pokemon.name} from team`}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

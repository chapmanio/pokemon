import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { fetchPokemonSpecies } from "@/entities/pokemon/api/fetchPokemonSpecies";
import { fetchType } from "@/entities/type/api/fetchType";
import { fetchMove } from "@/entities/move/api/fetchMove";
import { chanceToDefeat, getStat } from "@/shared/lib/matchupScore";
import { getDefenderMultiplier } from "@/shared/lib/typeEffectiveness";
import type { TypeApiResponse } from "@/shared/lib/typeEffectiveness";
import { PokemonDetailHeader } from "@/features/pokemon-detail/PokemonDetailHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/compare/$pokemon/vs/$opponent")({
  component: CompareHeadToHeadPage,
});

function CompareHeadToHeadPage() {
  const { pokemon: nameA, opponent: nameB } = Route.useParams();
  const navigate = useNavigate();

  const { data: pokemonA } = useQuery({
    queryKey: ["pokemon", nameA],
    queryFn: () => fetchPokemon(nameA),
  });
  const { data: pokemonB } = useQuery({
    queryKey: ["pokemon", nameB],
    queryFn: () => fetchPokemon(nameB),
  });
  const { data: speciesA } = useQuery({
    queryKey: ["pokemonSpecies", nameA],
    queryFn: () => fetchPokemonSpecies(nameA),
    enabled: !!pokemonA,
  });
  const { data: speciesB } = useQuery({
    queryKey: ["pokemonSpecies", nameB],
    queryFn: () => fetchPokemonSpecies(nameB),
    enabled: !!pokemonB,
  });

  const typesA = pokemonA?.types.map((t) => t.type.name) ?? [];
  const typesB = pokemonB?.types.map((t) => t.type.name) ?? [];
  const allTypes = [...new Set([...typesA, ...typesB])];

  const { data: typeData } = useQuery({
    queryKey: ["types", allTypes],
    queryFn: async () => {
      const chart: Record<string, TypeApiResponse> = {};
      for (const t of allTypes) {
        chart[t] = await fetchType(t);
      }
      return chart;
    },
    enabled: allTypes.length > 0,
  });

  if (!pokemonA || !pokemonB || !typeData) {
    return <p className="text-slate-500">Loading…</p>;
  }

  // Chance A defeats B from offensive pressure: atk × type effectiveness / def each way
  const chanceA = chanceToDefeat(pokemonA, pokemonB, typeData);
  const favoured = chanceA >= 55;
  const unfavoured = chanceA <= 45;

  const imgA =
    pokemonA.sprites.other?.["official-artwork"]?.front_default ?? pokemonA.sprites.front_default ?? "";
  const imgB =
    pokemonB.sprites.other?.["official-artwork"]?.front_default ?? pokemonB.sprites.front_default ?? "";
  const flavorA =
    speciesA?.flavor_text_entries?.find((e) => e.language.name === "en")?.flavor_text ?? "";
  const flavorB =
    speciesB?.flavor_text_entries?.find((e) => e.language.name === "en")?.flavor_text ?? "";

  const scoreColor = favoured ? "text-green-600" : unfavoured ? "text-red-600" : "text-foreground";

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch max-w-4xl">
        <Card className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Change Pokémon (back to compare list)"
            onClick={() => navigate({ to: "/compare" })}
          >
            <X className="size-4" />
          </Button>
          <CardContent className="p-4">
            <PokemonDetailHeader
              name={pokemonA.name}
              imgSrc={imgA}
              types={pokemonA.types}
              flavorText={flavorA}
              linkLabel="Pokédex"
              linkTo="/$name"
              linkParams={{ name: pokemonA.name }}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
          <p className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{chanceA}%</p>
          <p className="text-xs text-muted-foreground">chance of defeating</p>
        </div>

        <Card className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Change opponent (back to compare list)"
            onClick={() => navigate({ to: "/compare/$pokemon", params: { pokemon: nameA } })}
          >
            <X className="size-4" />
          </Button>
          <CardContent className="p-4">
            <PokemonDetailHeader
              name={pokemonB.name}
              imgSrc={imgB}
              types={pokemonB.types}
              flavorText={flavorB}
              linkLabel="Pokédex"
              linkTo="/$name"
              linkParams={{ name: pokemonB.name }}
            />
          </CardContent>
        </Card>
      </div>

      <StatsComparison pokemonA={pokemonA} pokemonB={pokemonB} />
      <SuperEffectiveMoves
        attackerMoves={pokemonA.moves}
        defenderTypes={typesB}
        typeChart={typeData}
      />
    </div>
  );
}

const statNames = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;
const statLabels: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

const maxStat = 255;

function StatsComparison({
  pokemonA,
  pokemonB,
}: {
  pokemonA: { name: string; stats: { base_stat: number; stat: { name: string } }[] };
  pokemonB: { name: string; stats: { base_stat: number; stat: { name: string } }[] };
}) {
  return (
    <section>
      <h3 className="text-base font-semibold mb-2">
        Stats <span className="text-muted-foreground font-normal text-sm">(base stat, max {maxStat})</span>
      </h3>
      <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "6rem 2.5rem 1fr 1fr" }}>
        <span className="text-sm text-muted-foreground" />
        <span className="text-xs text-muted-foreground text-right tabular-nums" title="Your Pokémon vs opponent">±</span>
        <span className="text-sm font-medium capitalize truncate">{pokemonA.name}</span>
        <span className="text-sm font-medium capitalize truncate">{pokemonB.name}</span>
        {statNames.map((name) => {
          const valA = getStat(pokemonA, name);
          const valB = getStat(pokemonB, name);
          return (
            <StatsRow
              key={name}
              label={statLabels[name] ?? name}
              valueA={valA}
              valueB={valB}
            />
          );
        })}
      </div>
    </section>
  );
}

function StatsRow({
  label,
  valueA,
  valueB,
}: {
  label: string;
  valueA: number;
  valueB: number;
}) {
  const diff = valueA - valueB;
  const pctA = (valueA / maxStat) * 100;
  const pctB = (valueB / maxStat) * 100;
  const diffStr = diff > 0 ? `+${diff}` : diff < 0 ? String(diff) : "0";
  const diffClass = diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground";
  return (
    <>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs font-medium tabular-nums text-right shrink-0 ${diffClass}`} title="Your Pokémon vs opponent">
        {diffStr}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden min-w-0">
          <div
            className="h-full rounded-full bg-red-500"
            style={{ width: `${pctA}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums w-8 shrink-0">{valueA}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden min-w-0">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${pctB}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums w-8 shrink-0">{valueB}</span>
      </div>
    </>
  );
}

function SuperEffectiveMoves({
  attackerMoves,
  defenderTypes,
  typeChart,
}: {
  attackerMoves: { move: { name: string } }[];
  defenderTypes: string[];
  typeChart: Record<string, TypeApiResponse>;
}) {
  const moveNames = attackerMoves.map((m) => m.move.name);
  const queries = useQuery({
    queryKey: ["movesBatch", moveNames],
    queryFn: () => Promise.all(moveNames.map((name) => fetchMove(name))),
    enabled: moveNames.length > 0,
  });

  type MoveRow = { name: string; type: string; power: number | null; pp: number | null; accuracy: number | null };

  const movesByType = useMemo(() => {
    if (!queries.data) return new Map<string, MoveRow[]>();
    const map = new Map<string, MoveRow[]>();
    for (let i = 0; i < queries.data.length; i++) {
      const move = queries.data[i];
      if (!move?.type?.name) continue;
      const mult = getDefenderMultiplier(move.type.name, defenderTypes, typeChart);
      if (mult > 1) {
        const row: MoveRow = {
          name: move.name ?? moveNames[i] ?? "",
          type: move.type.name,
          power: move.power ?? null,
          pp: move.pp ?? null,
          accuracy: move.accuracy ?? null,
        };
        const list = map.get(move.type.name) ?? [];
        list.push(row);
        map.set(move.type.name, list);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [queries.data, moveNames, defenderTypes, typeChart]);

  const typeOrder = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
  ];
  const types = useMemo(() => {
    const keys = Array.from(movesByType.keys());
    const ordered = typeOrder.filter((t) => keys.includes(t));
    const rest = keys.filter((k) => !typeOrder.includes(k)).sort();
    return ordered.concat(rest);
  }, [movesByType]);

  type SortCol = "name" | "power" | "pp" | "accuracy";
  const [sortColumn, setSortColumn] = useState<SortCol>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortMoves = (list: MoveRow[]): MoveRow[] => {
    return [...list].sort((a, b) => {
      const mult = sortDirection === "asc" ? 1 : -1;
      if (sortColumn === "name") {
        return mult * a.name.localeCompare(b.name);
      }
      const col = sortColumn as "power" | "pp" | "accuracy";
      const va = a[col] ?? -1;
      const vb = b[col] ?? -1;
      return mult * (va - vb);
    });
  };

  const handleSort = (col: SortCol) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection(col === "name" ? "asc" : "desc");
    }
  };

  const SortHeader = ({
    col,
    label,
    className,
  }: {
    col: SortCol;
    label: string;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={() => handleSort(col)}
      className={`tabular-nums text-right shrink-0 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded ${className ?? ""}`}
    >
      {label}
      {sortColumn === col && (
        <span className="ml-0.5 text-muted-foreground">{sortDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );

  const tableContent = (typeKey: string) => (
    <>
      <div className="flex gap-4 text-xs text-muted-foreground mb-1">
        <button
          type="button"
          onClick={() => handleSort("name")}
          className="min-w-0 flex-1 text-left hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded"
        >
          Move{sortColumn === "name" ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
        </button>
        <SortHeader col="power" label="Power" className="w-10" />
        <SortHeader col="pp" label="PP" className="w-8" />
        <SortHeader col="accuracy" label="Accuracy" className="w-14" />
      </div>
      <ul className="space-y-1">
        {sortMoves(movesByType.get(typeKey) ?? []).map((m) => (
          <li key={m.name} className="flex items-center gap-4 text-sm">
            <span className="capitalize min-w-0 flex-1">{m.name.replace(/-/g, " ")}</span>
            <span className="text-muted-foreground tabular-nums w-10 text-right shrink-0">
              {m.power != null ? m.power : "—"}
            </span>
            <span className="text-muted-foreground tabular-nums w-8 text-right shrink-0">
              {m.pp != null ? m.pp : "—"}
            </span>
            <span className="text-muted-foreground tabular-nums w-14 text-right shrink-0">
              {m.accuracy != null ? m.accuracy : "—"}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  if (queries.isLoading) {
    return (
      <section>
        <h3 className="text-base font-semibold mb-2">Super effective moves</h3>
        <p className="text-muted-foreground text-sm">Loading moves…</p>
      </section>
    );
  }

  if (types.length === 0) {
    return (
      <section>
        <h3 className="text-base font-semibold mb-2">Super effective moves</h3>
        <p className="text-muted-foreground text-sm">No super effective moves.</p>
      </section>
    );
  }

  const defaultTab = types[0];

  return (
    <section>
      <h3 className="text-base font-semibold mb-2">Super effective moves</h3>
      {types.length === 1 ? (
        <div className="mt-3">{tableContent(types[0])}</div>
      ) : (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex flex-nowrap overflow-x-auto h-auto gap-1 p-1 w-full justify-start">
            {types.map((typeKey) => (
              <TabsTrigger key={typeKey} value={typeKey} className="capitalize text-xs">
                {typeKey}
              </TabsTrigger>
            ))}
          </TabsList>
          {types.map((typeKey) => (
            <TabsContent key={typeKey} value={typeKey} className="mt-3">
              {tableContent(typeKey)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </section>
  );
}

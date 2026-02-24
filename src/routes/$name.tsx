import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { fetchPokemonSpecies } from "@/entities/pokemon/api/fetchPokemonSpecies";
import { fetchEvolutionChain } from "@/entities/pokemon/api/fetchEvolutionChain";
import { fetchMove } from "@/entities/move/api/fetchMove";
import { fetchType } from "@/entities/type/api/fetchType";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TypeApiResponse } from "@/shared/lib/typeEffectiveness";
import { getTypeWeaknesses } from "@/shared/lib/typeEffectiveness";
import { Badge } from "@/components/ui/badge";
import { fetchPokedex, getSlugsWithGroupLabels } from "@/entities/pokedex/api/fetchPokedex";

export const Route = createFileRoute("/$name")({
  component: PokedexEntry,
});

function PokedexEntry() {
  const { name } = Route.useParams();

  // Scroll the main container to top when viewing a (possibly new) Pokémon so we don't stay mid-page.
  useEffect(() => {
    document.getElementById("main-scroll")?.scrollTo(0, 0);
  }, [name]);

  const { data: pokemon, isLoading: pokemonLoading } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    retry: 1,
  });

  const speciesNameForQuery = pokemon?.species?.name ?? name;
  const { data: species } = useQuery({
    queryKey: ["pokemonSpecies", speciesNameForQuery],
    queryFn: () => fetchPokemonSpecies(speciesNameForQuery),
    enabled: !!pokemon,
  });

  const chainId = species?.evolution_chain?.url?.match(/evolution-chain\/(\d+)/)?.[1];
  const { data: evolutionChain } = useQuery({
    queryKey: ["evolutionChain", chainId],
    queryFn: () => fetchEvolutionChain(chainId!),
    enabled: !!chainId,
  });

  const typeNames = pokemon?.types.map((t) => t.type.name) ?? [];
  const { data: typeDataMap } = useQuery({
    queryKey: ["typesForEffectiveness", typeNames],
    queryFn: async () => {
      const map: Record<string, TypeApiResponse> = {};
      for (const t of typeNames) {
        map[t] = await fetchType(t);
      }
      return map;
    },
    enabled: typeNames.length > 0,
  });

  const speciesName = species?.name;
  const { data: regionLabels } = useQuery({
    queryKey: ["regionsForSpecies", speciesName],
    queryFn: async () => {
      const slugWithLabels = getSlugsWithGroupLabels();
      const dexes = await Promise.all(
        slugWithLabels.map(({ slug }) => fetchPokedex(slug))
      );
      const labelsSeen = new Set<string>();
      dexes.forEach((dex, i) => {
        const hasSpecies = dex.pokemon_entries.some(
          (e) => e.pokemon_species.name === speciesName
        );
        if (hasSpecies) {
          const groupLabel = slugWithLabels[i].groupLabel;
          if (groupLabel) labelsSeen.add(groupLabel);
        }
      });
      return Array.from(labelsSeen).sort((a, b) => a.localeCompare(b));
    },
    enabled: !!speciesName,
  });

  if (pokemonLoading || !pokemon) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        {pokemonLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <p className="text-slate-600">Pokémon not found.</p>
        )}
      </div>
    );
  }

  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "";
  const flavorText =
    species?.flavor_text_entries?.find((e) => e.language.name === "en")
      ?.flavor_text ?? "";

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex gap-4 items-start">
        <img
          src={img}
          alt={pokemon.name}
          className="w-40 h-40 object-contain"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold capitalize text-slate-900">
            {pokemon.name}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {pokemon.types.map((t) => (
              <span
                key={t.type.name}
                className="text-sm px-3 py-1 rounded-full text-white font-medium"
                style={{
                  backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8",
                }}
              >
                {t.type.name}
              </span>
            ))}
          </div>
          {flavorText && (
            <p className="text-slate-600 text-sm mt-3">{flavorText}</p>
          )}
          {regionLabels && regionLabels.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Found in: {regionLabels.join(", ")}
            </p>
          )}
          <Link
            to="/compare/$pokemon"
            params={{ pokemon: pokemon.name }}
            className="text-sm text-red-600 underline underline-offset-2 decoration-red-600 hover:decoration-red-800 mt-2 inline-block"
          >
            Head to head
          </Link>
        </div>
      </div>

      <StatBars pokemon={pokemon} />

      {evolutionChain && (
        <section>
          <h3 className="text-base font-semibold mb-2">Evolution</h3>
          <EvolutionChainFlat chain={evolutionChain.chain} />
        </section>
      )}

      {species?.varieties && species.varieties.length > 1 && (
        <section>
          <h3 className="text-base font-semibold mb-2">Other forms</h3>
          <p className="text-sm text-slate-700">
            {[...species.varieties]
              .sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name))
              .map((v, i) => {
                const varietyName = v.pokemon.name;
                const isCurrent = varietyName === pokemon.name;
                const displayName = varietyName
                  .split("-")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ");
                return (
                  <span key={varietyName}>
                    {i > 0 && ", "}
                    <Link
                      to="/$name"
                      params={{ name: varietyName }}
                      className={`underline underline-offset-2 decoration-red-600 hover:decoration-red-800 text-red-600 ${isCurrent ? "font-bold" : ""}`}
                    >
                      {displayName}
                    </Link>
                  </span>
                );
              })}
          </p>
        </section>
      )}

      {typeDataMap && (
        <TypeEffectivenessSection
          defenderTypes={typeNames}
          typeChart={typeDataMap}
        />
      )}

      {pokemon.moves.length > 0 && (
        <MovesSection moves={pokemon.moves} />
      )}
    </div>
  );
}

function StatBars({
  pokemon,
}: {
  pokemon: { stats: { base_stat: number; stat: { name: string } }[] };
}) {
  const max = 255;
  const statNames: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };

  return (
    <section>
      <h3 className="text-base font-semibold mb-2">
        Stats <span className="text-muted-foreground font-normal text-sm">(base stat, max 255)</span>
      </h3>
      <div className="space-y-1">
        {pokemon.stats.map((s) => (
          <div key={s.stat.name} className="flex items-center gap-2">
            <span className="w-16 text-sm text-muted-foreground">
              {statNames[s.stat.name] ?? s.stat.name}
            </span>
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${(s.base_stat / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-8">{s.base_stat}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface ChainLink {
  species: { name: string };
  evolution_details: { min_level?: number; item?: { name: string }; trigger: { name: string }; min_happiness?: number }[];
  evolves_to: ChainLink[];
}

/** Flatten evolution chain to a single list: each Pokémon once with its evolution method. */
function flattenChain(chain: ChainLink): { name: string; method: string }[] {
  const result: { name: string; method: string }[] = [
    { name: chain.species.name, method: "" },
  ];
  for (const e of chain.evolves_to) {
    const method = e.evolution_details[0]
      ? formatEvolutionMethod(e.evolution_details[0])
      : "";
    result.push({ name: e.species.name, method });
    const sub = flattenChain(e);
    for (let i = 1; i < sub.length; i++) result.push(sub[i]);
  }
  return result;
}

function EvolutionChainFlat({ chain }: { chain: ChainLink }) {
  const items = flattenChain(chain);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {items.map((item, i) => (
        <span key={`${item.name}-${i}`} className="inline-flex items-baseline gap-1">
          {i > 0 && <span className="text-muted-foreground text-sm">→</span>}
          <Link
            to="/$name"
            params={{ name: item.name }}
            className="text-sm text-red-600 underline underline-offset-2 decoration-red-600 hover:decoration-red-800 capitalize"
          >
            {item.name}
          </Link>
          {item.method && (
            <span className="text-muted-foreground text-sm">({item.method})</span>
          )}
        </span>
      ))}
    </div>
  );
}

function TypeEffectivenessSection({
  defenderTypes,
  typeChart,
}: {
  defenderTypes: string[];
  typeChart: Record<string, TypeApiResponse>;
}) {
  const weaknesses = useMemo(
    () => getTypeWeaknesses(defenderTypes, typeChart),
    [defenderTypes, typeChart]
  );
  const { weakAgainst, strongAgainst, immuneTo } = useMemo(() => {
    const weak: string[] = [];
    const strong: string[] = [];
    const immune: string[] = [];
    for (const w of weaknesses) {
      if (w.group === "4x" || w.group === "2x") weak.push(w.type);
      else if (w.group === "0.5x" || w.group === "0.25x") strong.push(w.type);
      else if (w.group === "0x") immune.push(w.type);
    }
    return { weakAgainst: weak, strongAgainst: strong, immuneTo: immune };
  }, [weaknesses]);

  const typeBadges = (types: string[]) => (
    <div className="flex flex-wrap gap-1">
      {types.map((typeName) => (
        <Badge
          key={typeName}
          variant="secondary"
          className="capitalize border-0 text-white"
          style={{ backgroundColor: TYPE_COLORS[typeName] ?? "#94a3b8" }}
        >
          {typeName}
        </Badge>
      ))}
    </div>
  );

  return (
    <section>
      <h3 className="text-base font-semibold mb-2">Type effectiveness</h3>
      <div className="space-y-3">
        {weakAgainst.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Weak against</p>
            {typeBadges(weakAgainst)}
          </div>
        )}
        {strongAgainst.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Strong against</p>
            {typeBadges(strongAgainst)}
          </div>
        )}
        {immuneTo.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Immune to</p>
            {typeBadges(immuneTo)}
          </div>
        )}
      </div>
    </section>
  );
}

function MovesSection({ moves }: { moves: { move: { name: string } }[] }) {
  const moveNames = moves.map((m) => m.move.name);
  const queries = useQuery({
    queryKey: ["movesBatch", moveNames],
    queryFn: async () => {
      const results = await Promise.all(
        moveNames.map((name) => fetchMove(name))
      );
      return results;
    },
    enabled: moveNames.length > 0,
  });

  const movesByType = useMemo(() => {
    type MoveRow = { name: string; power: number | null; pp: number | null; accuracy: number | null };
    if (!queries.data) return new Map<string, MoveRow[]>();
    const map = new Map<string, MoveRow[]>();
    for (let i = 0; i < queries.data.length; i++) {
      const move = queries.data[i];
      const typeName = move?.type?.name ?? "other";
      const list = map.get(typeName) ?? [];
      list.push({
        name: move?.name ?? moveNames[i] ?? "",
        power: move?.power ?? null,
        pp: move?.pp ?? null,
        accuracy: move?.accuracy ?? null,
      });
      map.set(typeName, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [queries.data, moveNames]);

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

  type MoveRow = { name: string; power: number | null; pp: number | null; accuracy: number | null };
  type SortCol = "name" | "power" | "pp" | "accuracy";
  const [sortColumn, setSortColumn] = useState<SortCol>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortMoves = (list: MoveRow[]): MoveRow[] => {
    const sorted = [...list].sort((a, b) => {
      const mult = sortDirection === "asc" ? 1 : -1;
      if (sortColumn === "name") {
        return mult * a.name.localeCompare(b.name);
      }
      const col = sortColumn as "power" | "pp" | "accuracy";
      const va = a[col] ?? -1;
      const vb = b[col] ?? -1;
      return mult * (va - vb);
    });
    return sorted;
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

  if (types.length === 0 && !queries.isLoading) return null;
  const defaultTab = types[0];

  return (
    <section>
      <h3 className="text-base font-semibold mb-2">Moves</h3>
      {queries.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading moves…</p>
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
            </TabsContent>
          ))}
        </Tabs>
      )}
    </section>
  );
}

function formatEvolutionMethod(d: {
  min_level?: number;
  item?: { name: string };
  trigger: { name: string };
  min_happiness?: number;
}): string {
  const parts: string[] = [];
  if (d.min_level) parts.push(`level ${d.min_level}`);
  if (d.min_happiness) parts.push("high friendship");
  if (d.item) parts.push(d.item.name.replace(/-/g, " "));
  if (d.trigger.name === "level-up" && !d.min_level && !d.min_happiness) parts.push("level up");
  else if (d.trigger.name === "use-item") parts.push("use item");
  else if (d.trigger.name === "trade") parts.push("trade");
  else if (d.trigger.name !== "level-up") parts.push(d.trigger.name.replace(/-/g, " "));
  return parts.join(", ") || "evolves";
}

import type { PokemonApiResponse } from "@/entities/pokemon/api/fetchPokemon";
import { getDefenderMultiplier } from "./typeEffectiveness";
import type { TypeApiResponse } from "./typeEffectiveness";

export function getStat(
  pokemon: { stats: { base_stat: number; stat: { name: string } }[] },
  statName: string
): number {
  const s = pokemon.stats.find(
    (x) => x.stat.name === statName || x.stat.name.replace("-", "_") === statName
  );
  return s?.base_stat ?? 0;
}

/**
 * Simple matchup score 0-100: how favoured is B vs A?
 * Uses offensive score (B's attack vs A's defense) and defensive score (A's attack vs B's defense).
 */
export function matchupScore(
  a: PokemonApiResponse,
  b: PokemonApiResponse,
  typeChart: Record<string, TypeApiResponse>
): number {
  const aTypes = a.types.map((t) => t.type.name);
  const bTypes = b.types.map((t) => t.type.name);

  const bAtk = Math.max(getStat(b, "attack"), getStat(b, "special-attack"));
  const aDef = Math.max(getStat(a, "defense"), getStat(a, "special-defense"));
  const aAtk = Math.max(getStat(a, "attack"), getStat(a, "special-attack"));
  const bDef = Math.max(getStat(b, "defense"), getStat(b, "special-defense"));

  let bVsA = 1;
  for (const bt of bTypes) {
    bVsA *= getDefenderMultiplier(bt, aTypes, typeChart);
  }
  let aVsB = 1;
  for (const at of aTypes) {
    aVsB *= getDefenderMultiplier(at, bTypes, typeChart);
  }

  const offScore = bAtk * bVsA / (aDef || 1);
  const defScore = bDef * aVsB / (aAtk || 1);
  const raw = offScore / (offScore + defScore);
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

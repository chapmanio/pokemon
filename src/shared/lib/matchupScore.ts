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
 * Offensive pressure of attacker vs defender: attack × type effectiveness / defense.
 * Higher = attacker hits harder relative to defender's bulk. Uses best attack and
 * best defense (physical or special) as a simple proxy for "expected damage".
 */
export function offensivePressure(
  attacker: PokemonApiResponse,
  defender: PokemonApiResponse,
  typeChart: Record<string, TypeApiResponse>
): number {
  const atkTypes = attacker.types.map((t) => t.type.name);
  const defTypes = defender.types.map((t) => t.type.name);

  const atk = Math.max(getStat(attacker, "attack"), getStat(attacker, "special-attack"));
  const def = Math.max(getStat(defender, "defense"), getStat(defender, "special-defense"));

  let typeMult = 1;
  for (const t of atkTypes) {
    typeMult *= getDefenderMultiplier(t, defTypes, typeChart);
  }

  return (atk * typeMult) / (def || 1);
}

/**
 * Chance (0–100) that A defeats B, based on each side's offensive pressure.
 * Stats and type advantage both matter: e.g. Venusaur's higher stats can outweigh
 * Charmander's fire advantage, so Venusaur still comes out ahead.
 */
export function chanceToDefeat(
  a: PokemonApiResponse,
  b: PokemonApiResponse,
  typeChart: Record<string, TypeApiResponse>
): number {
  const powerA = offensivePressure(a, b, typeChart);
  const powerB = offensivePressure(b, a, typeChart);
  const total = powerA + powerB;
  if (total === 0) return 50;
  return Math.round(Math.min(100, Math.max(0, (100 * powerA) / total)));
}

export type DamageRelation =
  | "double_damage_from"
  | "double_damage_to"
  | "half_damage_from"
  | "half_damage_to"
  | "no_damage_from"
  | "no_damage_to";

export interface TypeApiResponse {
  name: string;
  damage_relations: {
    double_damage_from: { name: string }[];
    double_damage_to: { name: string }[];
    half_damage_from: { name: string }[];
    half_damage_to: { name: string }[];
    no_damage_from: { name: string }[];
    no_damage_to: { name: string }[];
  };
}

/**
 * Returns the damage multiplier when attacker hits defender.
 * damageRelations should be the attacker type's damage_relations.
 * 2 = super effective, 0.5 = not very effective, 0 = no effect.
 */
export function getTypeMultiplier(
  defenderType: string,
  damageRelations: TypeApiResponse["damage_relations"]
): number {
  const doubleTo = damageRelations.double_damage_to.map((t) => t.name);
  const halfTo = damageRelations.half_damage_to.map((t) => t.name);
  const noneTo = damageRelations.no_damage_to.map((t) => t.name);

  let mult = 1;
  if (doubleTo.includes(defenderType)) mult *= 2;
  if (halfTo.includes(defenderType)) mult *= 0.5;
  if (noneTo.includes(defenderType)) mult *= 0;
  return mult;
}

/**
 * Returns the damage multiplier when defender takes damage from attackerType.
 * Combines defender's damage_relations (double_damage_from, half_damage_from, no_damage_from).
 * For dual-type defenders, multiply per-type modifiers.
 */
export function getDefenderMultiplier(
  attackerType: string,
  defenderTypes: string[],
  typeChart: Record<string, TypeApiResponse>
): number {
  let mult = 1;
  for (const defType of defenderTypes) {
    const rel = typeChart[defType]?.damage_relations;
    if (!rel) continue;
    if (rel.double_damage_from.some((t) => t.name === attackerType)) mult *= 2;
    if (rel.half_damage_from.some((t) => t.name === attackerType)) mult *= 0.5;
    if (rel.no_damage_from.some((t) => t.name === attackerType)) mult *= 0;
  }
  return mult;
}

export type EffectivenessGroup =
  | "4x"
  | "2x"
  | "1x"
  | "0.5x"
  | "0.25x"
  | "0x";

export interface TypeWeakness {
  type: string;
  multiplier: number;
  group: EffectivenessGroup;
}

/**
 * Given defender types and a type chart, returns all attacking types grouped by effectiveness.
 */
export function getTypeWeaknesses(
  defenderTypes: string[],
  typeChart: Record<string, TypeApiResponse>
): TypeWeakness[] {
  const allTypes = [
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon",
    "dark",
    "steel",
    "fairy",
  ];

  const results: TypeWeakness[] = [];
  for (const atk of allTypes) {
    const mult = getDefenderMultiplier(atk, defenderTypes, typeChart);
    const group: EffectivenessGroup =
      mult >= 4 ? "4x" : mult >= 2 ? "2x" : mult >= 1 ? "1x" : mult >= 0.5 ? "0.5x" : mult > 0 ? "0.25x" : "0x";
    results.push({ type: atk, multiplier: mult, group });
  }
  return results;
}

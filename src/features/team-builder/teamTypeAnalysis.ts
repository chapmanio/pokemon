import {
  getTypeWeaknesses,
  getDefenderMultiplier,
  type TypeApiResponse,
} from "@/shared/lib/typeEffectiveness";
import { TYPE_COLORS } from "@/shared/config/typeColors";

const ALL_TYPES = Object.keys(TYPE_COLORS) as string[];

/**
 * Types the team can hit super effectively (2× or 4×). Union of double_damage_to
 * for every type present on any team member.
 */
export function getTeamCoverage(
  teamTypeSets: string[][],
  typeChart: Record<string, TypeApiResponse>
): Set<string> {
  const covered = new Set<string>();
  const teamTypes = new Set(teamTypeSets.flat());

  for (const typeName of teamTypes) {
    const rel = typeChart[typeName]?.damage_relations;
    if (!rel) continue;
    for (const { name } of rel.double_damage_to) {
      covered.add(name);
    }
  }

  return covered;
}

/**
 * For each attacking type, the maximum damage multiplier any team member takes.
 * So if one member is 2× weak to Fire and another is 1×, team weakness to Fire is 2.
 */
export function getTeamWeaknessMap(
  teamTypeSets: string[][],
  typeChart: Record<string, TypeApiResponse>
): Map<string, number> {
  const maxByType = new Map<string, number>();

  for (const atkType of ALL_TYPES) {
    let max = 0;
    for (const defTypes of teamTypeSets) {
      const mult = getDefenderMultiplier(atkType, defTypes, typeChart);
      if (mult > max) max = mult;
    }
    if (max > 0) maxByType.set(atkType, max);
  }

  return maxByType;
}

/**
 * Types that hit the team super effectively (2× or 4×) and the team has no SE coverage against.
 */
export function getCoverageGaps(
  teamCoverage: Set<string>,
  teamWeaknessMap: Map<string, number>
): string[] {
  const gaps: string[] = [];
  for (const [typeName, mult] of teamWeaknessMap) {
    if (mult >= 2 && !teamCoverage.has(typeName)) {
      gaps.push(typeName);
    }
  }
  return gaps.sort((a, b) => a.localeCompare(b));
}

/**
 * Re-export for callers that need per-member weaknesses.
 */
export { getTypeWeaknesses };
export { ALL_TYPES };

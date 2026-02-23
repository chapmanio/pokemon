import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";

export interface PokedexEntry {
  entry_number: number;
  pokemon_species: { name: string; url: string };
}

export interface PokedexApiResponse {
  id: number;
  name: string;
  is_main_series: boolean;
  pokemon_entries: PokedexEntry[];
  region?: { name: string };
  names?: { name: string; language: { name: string } }[];
}

export function fetchPokedex(idOrName: string | number): Promise<PokedexApiResponse> {
  return fetchWithCache<PokedexApiResponse>(
    `pokedex/${String(idOrName).toLowerCase()}`,
    "pokedex" as StoreName
  );
}

/** Grouped regional dexes: same label prefix → one dropdown option, multiple API slugs merged. */
const POKEDEX_REGIONS_GROUPED: { value: string; label: string; slugs: string[] }[] = [
  { value: "", label: "All", slugs: [] },
  { value: "national", label: "National", slugs: ["national"] },
  { value: "kanto", label: "Kanto", slugs: ["kanto"] },
  { value: "johto", label: "Johto", slugs: ["original-johto", "updated-johto"] },
  { value: "hoenn", label: "Hoenn", slugs: ["hoenn", "updated-hoenn"] },
  { value: "sinnoh", label: "Sinnoh", slugs: ["original-sinnoh", "extended-sinnoh"] },
  { value: "unova", label: "Unova", slugs: ["original-unova", "updated-unova"] },
  { value: "kalos", label: "Kalos", slugs: ["kalos-central", "kalos-coastal", "kalos-mountain"] },
  {
    value: "alola",
    label: "Alola",
    slugs: [
      "original-alola",
      "original-melemele",
      "original-akala",
      "original-ulaula",
      "original-poni",
      "updated-alola",
      "updated-melemele",
      "updated-akala",
      "updated-ulaula",
      "updated-poni",
    ],
  },
  { value: "letsgo-kanto", label: "Let's Go Kanto", slugs: ["letsgo-kanto"] },
  { value: "galar", label: "Galar", slugs: ["galar"] },
  { value: "isle-of-armor", label: "Isle of Armor", slugs: ["isle-of-armor"] },
  { value: "crown-tundra", label: "Crown Tundra", slugs: ["crown-tundra"] },
  { value: "hisui", label: "Hisui", slugs: ["hisui"] },
  { value: "paldea", label: "Paldea", slugs: ["paldea"] },
  { value: "kitakami", label: "Kitakami", slugs: ["kitakami"] },
  { value: "blueberry", label: "Blueberry", slugs: ["blueberry"] },
  { value: "lumiose-city", label: "Lumiose City", slugs: ["lumiose-city"] },
  { value: "conquest-gallery", label: "Conquest Gallery", slugs: ["conquest-gallery"] },
  { value: "hyperspace", label: "Hyperspace", slugs: ["hyperspace"] },
];

/** Dropdown options: value + label only (for Region filter). */
export const POKEDEX_REGIONS: { value: string; label: string }[] =
  POKEDEX_REGIONS_GROUPED.map((g) => ({ value: g.value, label: g.label }));

/** Get API slugs for a region filter value (one or more dexes to merge). */
export function getSlugsForRegionValue(value: string): string[] {
  const group = POKEDEX_REGIONS_GROUPED.find((g) => g.value === value);
  return group?.slugs ?? [];
}

/** All slugs with their display group label (for "Found in" deduped by group). */
export function getSlugsWithGroupLabels(): { slug: string; groupLabel: string }[] {
  return POKEDEX_REGIONS_GROUPED.flatMap((g) =>
    g.slugs.map((slug) => ({ slug, groupLabel: g.label }))
  );
}

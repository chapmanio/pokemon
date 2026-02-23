import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";

export interface PokemonSpeciesApiResponse {
  id: number;
  name: string;
  evolution_chain: { url: string };
  varieties?: { is_default: boolean; pokemon: { name: string; url: string } }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  genera: { genus: string; language: { name: string } }[];
}

export function fetchPokemonSpecies(
  nameOrId: string | number
): Promise<PokemonSpeciesApiResponse> {
  return fetchWithCache<PokemonSpeciesApiResponse>(
    `pokemon-species/${String(nameOrId).toLowerCase()}`,
    "pokemonSpecies" as StoreName
  );
}

import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";

export interface PokemonListEntry {
  name: string;
  url: string;
}

export interface PokemonListApiResponse {
  count: number;
  results: PokemonListEntry[];
}

export function fetchPokemonList(limit = 2000): Promise<PokemonListApiResponse> {
  return fetchWithCache<PokemonListApiResponse>(
    `pokemon?limit=${limit}`,
    "pokemonList" as StoreName
  );
}

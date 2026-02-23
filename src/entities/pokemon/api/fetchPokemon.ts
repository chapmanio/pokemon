import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";

export interface PokemonStats {
  base_stat: number;
  stat: { name: string };
}

export interface PokemonType {
  type: { name: string };
}

export interface PokemonMove {
  move: { name: string; url: string };
}

export interface PokemonGameIndex {
  game_index: number;
  version: { name: string; url: string };
}

export interface PokemonApiResponse {
  id: number;
  name: string;
  species?: { name: string; url: string };
  types: PokemonType[];
  stats: PokemonStats[];
  sprites: {
    other?: {
      "official-artwork"?: { front_default: string };
    };
    front_default?: string;
  };
  moves: PokemonMove[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  game_indices?: PokemonGameIndex[];
}

export function fetchPokemon(nameOrId: string | number): Promise<PokemonApiResponse> {
  const path = `pokemon/${String(nameOrId).toLowerCase()}`;
  return fetchWithCache<PokemonApiResponse>(path, "pokemon" as StoreName);
}

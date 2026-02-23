import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";

export interface EvolutionDetail {
  min_level?: number;
  item?: { name: string };
  trigger: { name: string };
  time_of_day?: string;
  min_happiness?: number;
  min_affection?: number;
  known_move_type?: { name: string };
}

export interface EvolutionChainLink {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChainApiResponse {
  id: number;
  chain: EvolutionChainLink;
}

export function fetchEvolutionChain(id: string | number): Promise<EvolutionChainApiResponse> {
  return fetchWithCache<EvolutionChainApiResponse>(
    `evolution-chain/${id}`,
    "evolutionChain" as StoreName
  );
}

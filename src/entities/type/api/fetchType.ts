import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";
import type { TypeApiResponse } from "@/shared/lib/typeEffectiveness";

export interface TypeApiResponseFull extends TypeApiResponse {
  pokemon: { pokemon: { name: string; url: string } }[];
}

export function fetchType(name: string): Promise<TypeApiResponseFull> {
  return fetchWithCache<TypeApiResponseFull>(`type/${name}`, "type" as StoreName);
}

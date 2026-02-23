import { fetchWithCache } from "@/shared/api/fetch";
import type { StoreName } from "@/shared/api/cache";

export interface MoveApiResponse {
  name: string;
  type: { name: string };
  power: number | null;
  pp: number | null;
  accuracy: number | null;
  damage_class: { name: string };
}

export function fetchMove(nameOrId: string | number): Promise<MoveApiResponse> {
  return fetchWithCache<MoveApiResponse>(
    `move/${String(nameOrId).toLowerCase()}`,
    "move" as StoreName
  );
}

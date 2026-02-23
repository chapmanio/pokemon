import { getDB, cacheKey, type StoreName } from "./cache";
import { POKEAPI_BASE } from "../config/api";

export async function fetchWithCache<T>(
  path: string,
  store: StoreName
): Promise<T> {
  const url = path.startsWith("http") ? path : `${POKEAPI_BASE}/${path}`;
  const key = cacheKey(url);

  const db = await getDB();
  const cached = await db.get(store, key);
  if (cached) {
    return cached as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`PokéAPI error: ${res.status} ${path}`);
  }
  const data = (await res.json()) as T;
  await db.put(store, data, key);
  return data;
}

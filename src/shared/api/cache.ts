import { openDB } from "idb";
import { POKEAPI_BASE } from "../config/api";

const DB_NAME = "pokemon-assistant-db";
const DB_VERSION = 2;

const stores = {
  pokemon: "pokemon",
  type: "type",
  pokemonList: "pokemonList",
  pokedex: "pokedex",
  pokemonSpecies: "pokemonSpecies",
  evolutionChain: "evolutionChain",
  move: "move",
  team: "team",
} as const;

export type StoreName = (typeof stores)[keyof typeof stores];

let dbPromise: ReturnType<typeof openDB> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of Object.values(stores)) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      },
    });
  }
  return dbPromise;
}

export function cacheKey(url: string): string {
  return url.replace(POKEAPI_BASE, "").replace(/^\//, "") || "root";
}

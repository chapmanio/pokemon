import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemonList } from "@/entities/pokemon/api/fetchPokemonList";
import { fetchType } from "@/entities/type/api/fetchType";
import {
  fetchPokedex,
  POKEDEX_REGIONS,
  getSlugsForRegionValue,
} from "@/entities/pokedex/api/fetchPokedex";
import type { PokemonListEntry } from "@/entities/pokemon/api/fetchPokemonList";
import { TYPE_COLORS } from "@/shared/config/typeColors";

const PAGE_SIZE = 20;
const TYPE_NAMES = Object.keys(TYPE_COLORS);

function getIdFromUrl(url: string): string {
  return url.match(/pokemon\/(\d+)/)?.[1] ?? "";
}

function matchesPokedexSpecies(pokemonName: string, speciesNames: Set<string>): boolean {
  if (speciesNames.has(pokemonName)) return true;
  for (const s of speciesNames) {
    if (pokemonName === s || pokemonName.startsWith(s + "-")) return true;
  }
  return false;
}

export { POKEDEX_REGIONS, PAGE_SIZE };

export function usePokemonList() {
  const [search, setSearch] = useState("");
  const [regionValue, setRegionValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: list, isLoading } = useQuery({
    queryKey: ["pokemonList"],
    queryFn: () => fetchPokemonList(1350),
  });

  const regionSlugs = useMemo(
    () => getSlugsForRegionValue(regionValue),
    [regionValue]
  );

  const { data: pokedexList } = useQuery({
    queryKey: ["pokedex", regionValue, regionSlugs],
    queryFn: () => Promise.all(regionSlugs.map((slug) => fetchPokedex(slug))),
    enabled: !!regionValue && regionSlugs.length > 0,
  });

  const regionSpeciesNames = useMemo(() => {
    if (!pokedexList?.length) return null;
    const set = new Set<string>();
    for (const dex of pokedexList) {
      for (const e of dex.pokemon_entries ?? []) {
        set.add(e.pokemon_species.name);
      }
    }
    return set;
  }, [pokedexList]);

  const searchLower = search.toLowerCase().trim();
  const isTypeSearch = TYPE_NAMES.includes(searchLower);

  const { data: typeData } = useQuery({
    queryKey: ["type", searchLower],
    queryFn: () => fetchType(searchLower),
    enabled: !!searchLower && isTypeSearch,
  });

  const typeNames = useMemo(() => {
    if (!typeData?.pokemon) return new Set<string>();
    return new Set(typeData.pokemon.map((p) => p.pokemon.name));
  }, [typeData?.pokemon]);

  const filtered = useMemo(() => {
    if (!list?.results) return [];
    let base = list.results;
    if (regionSpeciesNames) {
      base = base.filter((p) => matchesPokedexSpecies(p.name, regionSpeciesNames));
    }
    if (!searchLower) return base;

    const matchesName = (p: PokemonListEntry) => p.name.toLowerCase().includes(searchLower);
    const matchesNumber = (p: PokemonListEntry) => {
      const id = getIdFromUrl(p.url);
      const qNum = searchLower.replace(/^#/, "");
      return id === qNum || id.padStart(3, "0").includes(qNum) || id.includes(qNum);
    };
    const matchesType = (p: PokemonListEntry) => isTypeSearch && typeNames.has(p.name);

    const seen = new Set<string>();
    const result: PokemonListEntry[] = [];
    for (const p of base) {
      if (seen.has(p.name)) continue;
      if (matchesName(p) || matchesNumber(p) || matchesType(p)) {
        seen.add(p.name);
        result.push(p);
      }
    }
    return result;
  }, [list?.results, searchLower, isTypeSearch, typeNames, regionSpeciesNames]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visible.length < filtered.length;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length));
  }, [hasMore, filtered.length]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore) loadMore();
        },
        { threshold: 0, rootMargin: "100px" }
      );
      if (node) observerRef.current.observe(node);
    },
    [hasMore, loadMore]
  );

  const resetVisible = useCallback(() => {
    setVisibleCount(PAGE_SIZE);
  }, []);

  const regionLoading = !!regionValue && regionSlugs.length > 0 && !pokedexList;

  return {
    search,
    setSearch,
    regionValue,
    setRegionValue,
    filtered,
    visible,
    hasMore,
    lastItemRef,
    resetVisible,
    regionLoading,
    isLoading,
  };
}

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemonList } from "@/entities/pokemon/api/fetchPokemonList";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import { Input } from "@/components/ui/input";

interface PokemonSelectorProps {
  onSelect: (name: string) => void;
  placeholder?: string;
}

export function PokemonSelector({ onSelect, placeholder = "Search Pokémon…" }: PokemonSelectorProps) {
  const [search, setSearch] = useState("");

  const { data: list } = useQuery({
    queryKey: ["pokemonList"],
    queryFn: () => fetchPokemonList(1010),
  });

  const filtered = useMemo(() => {
    if (!list?.results) return [];
    if (!search.trim()) return list.results.slice(0, 20);
    const q = search.toLowerCase().trim();
    return list.results.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30);
  }, [list?.results, search]);

  return (
    <div className="space-y-2">
      <Input
        type="search"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoComplete="off"
      />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filtered.map((entry) => (
          <SelectorResult key={entry.name} name={entry.name} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function SelectorResult({ name, onSelect }: { name: string; onSelect: (name: string) => void }) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  if (!pokemon) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(pokemon.name)}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-left transition-colors"
    >
      <img
        src={
          pokemon.sprites.other?.["official-artwork"]?.front_default ??
          pokemon.sprites.front_default ??
          ""
        }
        alt={pokemon.name}
        className="w-12 h-12 object-contain"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium capitalize text-slate-900">{pokemon.name}</p>
        <div className="flex gap-1">
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8" }}
            >
              {t.type.name}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

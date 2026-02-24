import { useQuery } from "@tanstack/react-query";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import { Button } from "@/components/ui/button";
import type { TeamEntry } from "@/entities/team/api/teamStore";
import { Plus, Minus } from "lucide-react";

interface TeamListRowProps {
  name: string;
  team: TeamEntry[];
  isFull: boolean;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function TeamListRow({ name, team, isFull, onAdd, onRemove }: TeamListRowProps) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  const entry = team.find((e) => e.name === name);
  const isInTeam = !!entry;

  if (!pokemon) return null;

  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm min-h-[72px]">
      <img
        src={img}
        alt={pokemon.name}
        className="w-16 h-16 object-contain shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold capitalize text-slate-900 truncate">{pokemon.name}</p>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{
                backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8",
              }}
            >
              {t.type.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">#{String(pokemon.id).padStart(3, "0")}</p>
      </div>
      {isInTeam ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          onClick={() => entry && onRemove(entry.id)}
          aria-label={`Remove ${pokemon.name}`}
        >
          <Minus className="size-4" aria-hidden />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onAdd(name)}
          disabled={isFull}
          aria-label={`Add ${pokemon.name} to team`}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}

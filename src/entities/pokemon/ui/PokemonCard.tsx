import { Link } from "@tanstack/react-router";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import type { PokemonApiResponse } from "../api/fetchPokemon";

interface PokemonCardProps {
  pokemon: PokemonApiResponse;
  size?: "sm" | "md";
  /** Default: link to Pokédex detail. Override to e.g. link to compare. */
  to?: string;
  params?: Record<string, string>;
}

export function PokemonCard({ pokemon, size = "md", to = "/$name", params }: PokemonCardProps) {
  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ?? "";

  const sizeClasses = size === "sm" ? "w-16 h-16" : "w-24 h-24";
  const linkParams = params ?? { name: pokemon.name };

  return (
    <Link
      to={to as "/$name"}
      params={linkParams as { name: string }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md active:bg-slate-50 transition-colors min-h-[72px]"
    >
      <img
        src={img}
        alt={pokemon.name}
        className={`${sizeClasses} object-contain`}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold capitalize text-slate-900 truncate">
          {pokemon.name}
        </p>
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
    </Link>
  );
}

import { Link } from "@tanstack/react-router";
import { TYPE_COLORS } from "@/shared/config/typeColors";

interface PokemonDetailHeaderProps {
  name: string;
  imgSrc: string;
  types: { type: { name: string } }[];
  flavorText?: string;
  /** Optional link shown under the description (e.g. "Pokédex" or "Head to head") */
  linkLabel?: string;
  linkTo?: string;
  linkParams?: Record<string, string>;
}

export function PokemonDetailHeader({
  name,
  imgSrc,
  types,
  flavorText,
  linkLabel,
  linkTo,
  linkParams,
}: PokemonDetailHeaderProps) {
  return (
    <div className="flex gap-4 items-start">
      <img
        src={imgSrc}
        alt={name}
        className="w-40 h-40 object-contain shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold capitalize text-slate-900">
          {name}
        </h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {types.map((t) => (
            <span
              key={t.type.name}
              className="text-sm px-3 py-1 rounded-full text-white font-medium"
              style={{
                backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8",
              }}
            >
              {t.type.name}
            </span>
          ))}
        </div>
        {flavorText && (
          <p className="text-slate-600 text-sm mt-3">{flavorText}</p>
        )}
        {linkLabel && linkTo && linkParams && (
          <Link
            to={linkTo as "/$name"}
            params={linkParams as { name: string }}
            className="text-sm text-red-600 underline underline-offset-2 decoration-red-600 hover:decoration-red-800 mt-2 inline-block"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useTeam } from "@/features/team-builder/useTeam";
import { PokemonSelector } from "@/features/pokemon-selector/PokemonSelector";
import { useQuery } from "@tanstack/react-query";
import { fetchPokemon } from "@/entities/pokemon/api/fetchPokemon";
import { useState } from "react";
import { TYPE_COLORS } from "@/shared/config/typeColors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/team")({
  component: TeamPage,
});

function TeamPage() {
  const { team, add, remove, isFull } = useTeam();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <p className="text-muted-foreground">
        Add up to 6 Pokémon. Tap × to remove. When your team is ready, scroll down for the summary.
      </p>

      <div className="space-y-2">
        {team.map((entry) => (
          <TeamMember
            key={entry.id}
            name={entry.name}
            onRemove={() => remove(entry.id)}
          />
        ))}
      </div>

      {!isFull && (
        showSelector ? (
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSelector(false)}>
              Cancel
            </Button>
            <PokemonSelector
              placeholder="Search Pokémon to add…"
              onSelect={(name) => {
                add(name);
                setShowSelector(false);
              }}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full py-6 border-dashed"
            onClick={() => setShowSelector(true)}
          >
            + Add Pokémon
          </Button>
        )
      )}

      {team.length > 0 && (
        <Card id="team-summary" className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Team summary {team.length}/6
            </CardTitle>
            {isFull && (
              <p className="text-sm text-muted-foreground font-normal">
                Your team is full. Here’s your lineup.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {team.map((entry) => (
              <TeamSummaryRow key={entry.id} name={entry.name} />
            ))}
            <p className="text-sm text-muted-foreground pt-2">
              Team weaknesses and coverage will appear here in a future update.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamSummaryRow({ name }: { name: string }) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });
  if (!pokemon) return null;
  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "";
  return (
    <div className="flex items-center gap-2 py-1">
      <img src={img} alt={pokemon.name} className="w-8 h-8 object-contain shrink-0" />
      <span className="font-medium capitalize">{pokemon.name}</span>
      <div className="flex gap-1">
        {pokemon.types.map((t) => (
          <Badge
            key={t.type.name}
            variant="secondary"
            className="text-xs capitalize border-0"
            style={{ backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8", color: "white" }}
          >
            {t.type.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TeamMember({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  const { data: pokemon } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => fetchPokemon(name),
    enabled: !!name,
  });

  if (!pokemon) return null;

  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "";

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <img src={img} alt={pokemon.name} className="w-16 h-16 object-contain shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold capitalize">{pokemon.name}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {pokemon.types.map((t) => (
              <Badge
                key={t.type.name}
                variant="secondary"
                className="text-xs capitalize border-0"
                style={{ backgroundColor: TYPE_COLORS[t.type.name] ?? "#94a3b8", color: "white" }}
              >
                {t.type.name}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          onClick={onRemove}
          aria-label={`Remove ${pokemon.name}`}
        >
          Remove
        </Button>
      </CardContent>
    </Card>
  );
}

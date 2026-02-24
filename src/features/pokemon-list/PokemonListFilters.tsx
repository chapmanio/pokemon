import { Input } from "@/components/ui/input";
import { POKEDEX_REGIONS } from "./usePokemonList";

export function PokemonListFilters({
  search,
  setSearch,
  regionValue,
  setRegionValue,
  resetVisible,
}: {
  search: string;
  setSearch: (s: string) => void;
  regionValue: string;
  setRegionValue: (s: string) => void;
  resetVisible: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <select
        value={regionValue}
        onChange={(e) => {
          setRegionValue(e.target.value);
          resetVisible();
        }}
        className="h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Region"
      >
        {POKEDEX_REGIONS.map((r) => (
          <option key={r.value || "all"} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <Input
        type="search"
        placeholder="Search by name, # or type…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          resetVisible();
        }}
        autoComplete="off"
        className="h-8 w-full text-sm"
      />
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadTeam, saveTeam, type TeamEntry } from "@/entities/team/api/teamStore";

export function useTeam() {
  const queryClient = useQueryClient();

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: loadTeam,
  });

  const save = useMutation({
    mutationFn: saveTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const add = (name: string) => {
    if (team.length >= 6) return;
    const entry: TeamEntry = { id: crypto.randomUUID(), name };
    save.mutate([...team, entry]);
  };

  const remove = (id: string) => {
    save.mutate(team.filter((e) => e.id !== id));
  };

  const reorder = (from: number, to: number) => {
    const next = [...team];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    save.mutate(next);
  };

  return { team, add, remove, reorder, isFull: team.length >= 6 };
}

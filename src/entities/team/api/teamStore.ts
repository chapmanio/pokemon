import { getDB } from "@/shared/api/cache";

const STORE = "team";

export const TEAM_KEY = "current-team";

export interface TeamEntry {
  id: string;
  name: string;
}

export async function loadTeam(): Promise<TeamEntry[]> {
  const db = await getDB();
  const raw = await db.get(STORE, TEAM_KEY);
  return Array.isArray(raw) ? raw : [];
}

export async function saveTeam(team: TeamEntry[]): Promise<void> {
  const db = await getDB();
  await db.put(STORE, team.slice(0, 6), TEAM_KEY);
}

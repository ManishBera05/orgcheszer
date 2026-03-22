import api from "./axios";
import type {
  TournamentResponse,
  TournamentCreateRequest,
  TournamentPlayerDTO,
  TournamentStatus,
} from "../types";

/* ─── Public ──────────────────────────────────────────────── */

export async function getAllTournaments(
  status?: TournamentStatus,
): Promise<TournamentResponse[]> {
  // TODO: backend will support /api/tournaments?status={} once implemented
  const res = await api.get<TournamentResponse[]>("/api/tournaments", {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function getTournament(
  tournamentId: string,
): Promise<TournamentResponse> {
  const res = await api.get<TournamentResponse>(
    `/api/tournaments/${tournamentId}`,
  );
  return res.data;
}

export async function getTournamentPlayers(
  tournamentId: string,
): Promise<TournamentPlayerDTO[]> {
  const res = await api.get<TournamentPlayerDTO[]>(
    `/api/tournaments/${tournamentId}/players`,
  );
  return res.data;
}

/* ─── TODO: stats endpoint ────────────────────────────────── */
// export async function getPlatformStats(): Promise<{ totalTournaments: number; totalUsers: number; activeTournaments: number }> {
//   const res = await api.get("/api/stats");
//   return res.data;
// }

/* ─── Authenticated ───────────────────────────────────────── */

export async function createTournament(
  data: TournamentCreateRequest,
): Promise<TournamentResponse> {
  const res = await api.post<TournamentResponse>("/api/tournaments", data);
  return res.data;
}

export async function updateTournament(
  tournamentId: string,
  data: TournamentCreateRequest,
): Promise<TournamentResponse> {
  const res = await api.put<TournamentResponse>(
    `/api/tournaments/${tournamentId}`,
    data,
  );
  return res.data;
}

export async function registerForTournament(
  tournamentId: string,
): Promise<void> {
  await api.post(`/api/tournaments/${tournamentId}/register`);
}

export async function cancelTournament(tournamentId: string): Promise<void> {
  await api.patch(`/api/tournaments/${tournamentId}/cancel`);
}

export async function getMyTournaments(): Promise<TournamentResponse[]> {
  const res = await api.get<TournamentResponse[]>(
    "/api/tournaments/my-tournaments",
  );
  return res.data;
}

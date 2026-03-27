import api from "./axios";
import type {
  RoundPairingsResponse,
  LeaderboardEntryDTO,
  Page,
} from "../types";

/* ─── Round pairings ──────────────────────────────────────── */
export async function getRoundPairings(
  tournamentId: string,
  roundNumber: number,
): Promise<RoundPairingsResponse> {
  const res = await api.get<RoundPairingsResponse>(
    `/api/tournaments/${tournamentId}/rounds/${roundNumber}/pairings`,
  );
  return res.data;
}

export async function generateNextRound(
  tournamentId: string,
): Promise<RoundPairingsResponse> {
  const res = await api.post<RoundPairingsResponse>(
    `/api/tournaments/${tournamentId}/rounds/generate`,
  );
  return res.data;
}

export async function submitResult(
  tournamentId: string,
  gameId: string,
  result: string,
): Promise<string> {
  const res = await api.patch<string>(
    `/api/tournaments/${tournamentId}/games/${gameId}/result`,
    null,
    { params: { result } },
  );
  return res.data;
}

/* ─── Leaderboard (paged) ─────────────────────────────────── */
export async function getLeaderboard(
  tournamentId: string,
  page = 0,
  size = 50,
): Promise<Page<LeaderboardEntryDTO>> {
  const res = await api.get<Page<LeaderboardEntryDTO>>(
    `/api/tournaments/${tournamentId}/leaderboard`,
    { params: { page, size } },
  );
  return res.data;
}

/* ─── Tickets & check-in ──────────────────────────────────── */
export async function getMyTicket(tournamentId: string): Promise<string> {
  const res = await api.get<string>(
    `/api/tournaments/${tournamentId}/my-ticket`,
  );
  return res.data;
}

export async function checkIn(
  tournamentId: string,
  token: string,
): Promise<string> {
  const res = await api.post<string>(
    `/api/tournaments/${tournamentId}/tickets/checkin`,
    null,
    { params: { token } },
  );
  return res.data;
}

/* ─── Staff keys ──────────────────────────────────────────── */
export async function generateStaffKeys(
  tournamentId: string,
  numberOfKeys: number,
): Promise<string[]> {
  const res = await api.post<string[]>(
    `/api/tournaments/${tournamentId}/staff-keys/generate`,
    null,
    { params: { numberOfKeys } },
  );
  return res.data;
}

export async function getStaffKeys(tournamentId: string) {
  const res = await api.get(`/api/tournaments/${tournamentId}/staff-keys`);
  return res.data;
}

export async function redeemStaffKey(keyValue: string): Promise<void> {
  await api.post("/api/tournaments/staff-keys/redeem", null, {
    params: { keyValue },
  });
}

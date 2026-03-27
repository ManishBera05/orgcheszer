import api from "./axios";
import type {
  PublicUserProfileDTO,
  UserTournamentStatsDTO,
  MyTournamentDTO,
  Page,
} from "../types";

/* ─── Public profile ──────────────────────────────────────── */
export async function getPublicProfile(
  userId: string,
): Promise<PublicUserProfileDTO> {
  const res = await api.get<PublicUserProfileDTO>(`/api/users/${userId}`);
  return res.data;
}

/* ─── Per-tournament stats (public) ──────────────────────── */
export async function getUserTournamentStats(
  userId: string,
  tournamentId: string,
): Promise<UserTournamentStatsDTO> {
  const res = await api.get<UserTournamentStatsDTO>(
    `/api/users/${userId}/tournament/${tournamentId}`,
  );
  return res.data;
}

/* ─── My detailed tournament history (private) ───────────── */
export interface MyTournamentsParams {
  role?: string; // "PLAYER" | "ORGANIZER" | "STAFF"
  page?: number;
  size?: number;
}

export async function getMyTournamentHistory(
  params: MyTournamentsParams = {},
): Promise<Page<MyTournamentDTO>> {
  // FIX: Changed from "/api/users/me" to "/api/users/my-tournaments"
  const res = await api.get<Page<MyTournamentDTO>>(
    "/api/users/my-tournaments",
    {
      params: {
        ...(params.role ? { role: params.role } : {}),
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    },
  );
  return res.data;
}

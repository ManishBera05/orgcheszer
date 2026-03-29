// --- START OF FILE src/api/users.ts ---
import api from "./axios";
import type {
  PublicUserProfileDTO,
  UserTournamentStatsDTO,
  MyTournamentDTO,
  UserDetailsDTO,
  Page,
} from "../types";

export async function getPublicProfile(
  userId: string,
): Promise<PublicUserProfileDTO> {
  const res = await api.get<PublicUserProfileDTO>(`/api/users/${userId}`);
  return res.data;
}

export async function getUserTournamentStats(
  userId: string,
  tournamentId: string,
): Promise<UserTournamentStatsDTO> {
  const res = await api.get<UserTournamentStatsDTO>(
    `/api/users/${userId}/tournament/${tournamentId}`,
  );
  return res.data;
}

export interface MyTournamentsParams {
  role?: string;
  page?: number;
  size?: number;
}

export async function getMyTournamentHistory(
  params: MyTournamentsParams = {},
): Promise<Page<MyTournamentDTO>> {
  const res = await api.get<Page<MyTournamentDTO>>(
    "/api/users/my-tournaments",
    {
      params: {
        ...(params.role && params.role !== "ALL" ? { role: params.role } : {}),
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    },
  );
  return res.data;
}

// NEW: Fetch private profile details
export async function getMyProfile(): Promise<UserDetailsDTO> {
  const res = await api.get<UserDetailsDTO>("/api/users/me");
  return res.data;
}
// --- END OF FILE src/api/users.ts ---

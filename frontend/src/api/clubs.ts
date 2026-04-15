// --- START OF FILE src/api/clubs.ts ---
import api from "./axios";
import type {
  ClubDTO,
  ClubCreateRequest,
  ClubMemberDTO,
  ClubLeaderboardDTO,
  TournamentResponse,
  TournamentCreateRequest,
} from "../types";

export async function getMyClubs(): Promise<ClubDTO[]> {
  const res = await api.get<ClubDTO[]>("/api/clubs/my-clubs");
  return res.data;
}

export async function createClub(data: ClubCreateRequest): Promise<ClubDTO> {
  const res = await api.post<ClubDTO>("/api/clubs", data);
  return res.data;
}

export async function joinClub(inviteCode: string): Promise<void> {
  await api.post(`/api/clubs/join/${inviteCode}`);
}

export async function getClubDetails(clubId: string): Promise<ClubDTO> {
  const res = await api.get<ClubDTO>(`/api/clubs/${clubId}`);
  return res.data;
}

export async function getClubMembers(clubId: string): Promise<ClubMemberDTO[]> {
  const res = await api.get<ClubMemberDTO[]>(`/api/clubs/${clubId}/members`);
  return res.data;
}

export async function getClubRequests(
  clubId: string,
): Promise<ClubMemberDTO[]> {
  const res = await api.get<ClubMemberDTO[]>(`/api/clubs/${clubId}/requests`);
  return res.data;
}

export async function approveClubRequest(
  clubId: string,
  userId: string,
): Promise<void> {
  await api.put(`/api/clubs/${clubId}/requests/${userId}/approve`);
}

export async function removeClubMember(
  clubId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/api/clubs/${clubId}/members/${userId}`);
}

export async function generateClubInviteCode(clubId: string): Promise<void> {
  await api.put(`/api/clubs/${clubId}/invite-code`);
}

export async function getClubLeaderboard(
  clubId: string,
): Promise<ClubLeaderboardDTO[]> {
  const res = await api.get<ClubLeaderboardDTO[]>(
    `/api/clubs/${clubId}/leaderboard`,
  );
  return res.data;
}

// ─── NEW: CLUB TOURNAMENT ENDPOINTS ───

export async function getClubTournaments(
  clubId: string,
): Promise<TournamentResponse[]> {
  const res = await api.get<TournamentResponse[]>(
    `/api/clubs/${clubId}/tournaments`,
  );
  return res.data;
}

export async function createClubTournament(
  clubId: string,
  data: TournamentCreateRequest,
): Promise<void> {
  await api.post(`/api/clubs/${clubId}/tournament`, data);
}

export async function endClubTournament(tournamentId: string): Promise<void> {
  await api.patch(`/api/clubs/${tournamentId}/end-tournament`);
}
// --- END OF FILE src/api/clubs.ts ---

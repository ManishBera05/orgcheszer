import api from "./axios";
import type {
  UserTournamentSummaryDTO,
  UserTournamentStatsDTO,
} from "../types";

export const usersApi = {
  // ── Public endpoints ─────────────────────────────────────────

  getTournamentHistory: async (
    userId: string,
  ): Promise<UserTournamentSummaryDTO[]> => {
    const res = await api.get<UserTournamentSummaryDTO[]>(
      `/api/users/${userId}`,
    );
    return res.data;
  },

  getTournamentStats: async (
    userId: string,
    tournamentId: string,
  ): Promise<UserTournamentStatsDTO> => {
    const res = await api.get<UserTournamentStatsDTO>(
      `/api/users/${userId}/tournament/${tournamentId}`,
    );
    return res.data;
  },
};

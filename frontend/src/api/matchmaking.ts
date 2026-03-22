import api from "./axios";
import type { RoundPairingsResponse, GameResult } from "../types";

export const matchmakingApi = {
  // ── Public ───────────────────────────────────────────────────

  getRoundPairings: async (
    tournamentId: string,
    roundNumber: number,
  ): Promise<RoundPairingsResponse> => {
    const res = await api.get<RoundPairingsResponse>(
      `/api/tournaments/${tournamentId}/rounds/${roundNumber}/pairings`,
    );
    return res.data;
  },

  // ── Organizer only ───────────────────────────────────────────

  generateNextRound: async (
    tournamentId: string,
  ): Promise<RoundPairingsResponse> => {
    const res = await api.post<RoundPairingsResponse>(
      `/api/tournaments/${tournamentId}/rounds/generate`,
    );
    return res.data;
  },

  // ── Staff / Organizer ─────────────────────────────────────────

  submitResult: async (
    tournamentId: string,
    gameId: string,
    result: GameResult,
  ): Promise<string> => {
    const res = await api.patch<string>(
      `/api/tournaments/${tournamentId}/games/${gameId}/result`,
      null,
      { params: { result } },
    );
    return res.data;
  },
};

import api from "./axios";

/**
 * Stats API — placeholder endpoints.
 * Add the corresponding backend routes when ready.
 * The frontend handles 404/errors gracefully (shows "—").
 */
export const statsApi = {
  /**
   * GET /api/stats/total-users
   * Expected response: a plain number, e.g. 2840
   * Add this endpoint to the Spring Boot backend later.
   */
  getTotalUsers: async (): Promise<number> => {
    const res = await api.get<number>("/api/stats/total-users");
    return res.data;
  },
};

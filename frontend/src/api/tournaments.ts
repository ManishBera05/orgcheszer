import api from "./axios";
import type {
  TournamentResponse,
  TournamentCreateRequest,
  TournamentPlayerDTO,
  TournamentStatus,
} from "../types";

/* ─── Pagination params ───────────────────────────────────── */
export interface TournamentFilterParams {
  status?: TournamentStatus | TournamentStatus[];
  format?: string; // "SWISS" | "ROUND_ROBIN"
  type?: string; // TODO: backend "type" field — "BLITZ" | "RAPID" | "CLASSICAL"
  startDateFrom?: string; // ISO date string
  startDateTo?: string; // ISO date string
  page?: number; // 0-indexed
  size?: number; // items per page
}

export interface PagedTournamentResponse {
  content: TournamentResponse[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-indexed)
  last: boolean; // true if this is the last page
}

/* ─── Paginated tournament list ───────────────────────────── */
// TODO: backend endpoint is GET /api/tournaments with query params:
//   ?status=UPCOMING&format=SWISS&type=BLITZ&startDateFrom=2025-01-01
//   &startDateTo=2025-12-31&page=0&size=9
// The "type" param is not yet implemented — add when backend supports it.
// Until backend returns a paged wrapper, the response is a plain array —
// we simulate pagination client-side via the "page" + "size" params commented out.
export async function getTournamentsPaged(
  params: TournamentFilterParams,
): Promise<PagedTournamentResponse> {
  const queryParams: Record<string, string> = {};

  if (params.status) {
    // Backend accepts single status param; multiple statuses sent as comma-separated
    // TODO: confirm backend supports comma-separated status values or adjust
    queryParams.status = Array.isArray(params.status)
      ? params.status.join(",")
      : params.status;
  }
  if (params.format) queryParams.format = params.format;
  if (params.startDateFrom) queryParams.startDateFrom = params.startDateFrom;
  if (params.startDateTo) queryParams.startDateTo = params.startDateTo;
  // TODO: uncomment when backend implements type filter
  // if (params.type)       queryParams.type           = params.type;
  // TODO: uncomment when backend implements pagination
  // queryParams.page = String(params.page ?? 0);
  // queryParams.size = String(params.size ?? 9);

  const res = await api.get<TournamentResponse[]>("/api/tournaments", {
    params: queryParams,
  });

  // ── Simulate pagination client-side until backend supports it ──
  const all = res.data;
  const size = params.size ?? 9;
  const page = params.page ?? 0;
  const start = page * size;
  const slice = all.slice(start, start + size);

  return {
    content: slice,
    totalElements: all.length,
    totalPages: Math.ceil(all.length / size),
    number: page,
    last: start + size >= all.length,
  };
}

/* ─── Simple full list (used by HomePage) ─────────────────── */
export async function getAllTournaments(
  status?: TournamentStatus,
): Promise<TournamentResponse[]> {
  const res = await api.get<TournamentResponse[]>("/api/tournaments", {
    params: status ? { status } : undefined,
  });
  return res.data;
}

/* ─── Single tournament ───────────────────────────────────── */
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

/* ─── TODO: platform stats ────────────────────────────────── */
// export async function getPlatformStats() {
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

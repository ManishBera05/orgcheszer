// --- START OF FILE src/api/tournaments.ts ---
import api from "./axios";
import type {
  TournamentResponse,
  TournamentCreateRequest,
  TournamentPlayerDTO,
  TournamentStatus,
  RegistrationRequestDTO,
  StaffForTournamentResponse,
  Page,
} from "../types";

export interface TournamentFilterParams {
  status?: TournamentStatus | string;
  statuses?: (TournamentStatus | string)[];
  format?: string;
  type?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  size?: number;
}

export async function getTournamentsPaged(
  params: TournamentFilterParams,
): Promise<Page<TournamentResponse>> {
  const page = params.page ?? 0;
  const size = params.size ?? 12;
  const statuses =
    params.statuses ?? (params.status ? [params.status] : [undefined]);

  if (statuses.length <= 1) {
    const res = await api.get<Page<TournamentResponse>>("/api/tournaments", {
      params: { ...(statuses[0] ? { status: statuses[0] } : {}), page, size },
    });
    return res.data;
  }

  const results = await Promise.all(
    statuses.map((status) =>
      api
        .get<
          Page<TournamentResponse>
        >("/api/tournaments", { params: { status, page: 0, size: 200 } })
        .then((r) => r.data.content),
    ),
  );

  const merged = results
    .flat()
    .sort(
      (a, b) =>
        new Date(b.startDateTime).getTime() -
        new Date(a.startDateTime).getTime(),
    );
  const start = page * size;
  const slice = merged.slice(start, start + size);

  return {
    content: slice,
    totalElements: merged.length,
    totalPages: Math.ceil(merged.length / size),
    number: page,
    size,
    first: page === 0,
    last: start + size >= merged.length,
    numberOfElements: slice.length,
    empty: slice.length === 0,
  };
}

export async function getAllTournaments(
  status?: TournamentStatus,
): Promise<TournamentResponse[]> {
  const res = await api.get<Page<TournamentResponse>>("/api/tournaments", {
    params: { ...(status ? { status } : {}), page: 0, size: 50 },
  });
  return res.data.content;
}

export async function getTournament(
  tournamentId: string,
): Promise<TournamentResponse> {
  const res = await api.get<TournamentResponse>(
    `/api/tournaments/${tournamentId}`,
  );
  return res.data;
}

// UPDATED: Now returns a Page object
export async function getTournamentPlayers(
  tournamentId: string,
  page = 0,
  size = 50,
): Promise<Page<TournamentPlayerDTO>> {
  const res = await api.get<Page<TournamentPlayerDTO>>(
    `/api/tournaments/${tournamentId}/players`,
    { params: { page, size } },
  );
  return res.data;
}

export async function registerForTournament(
  tournamentId: string,
): Promise<RegistrationRequestDTO> {
  const res = await api.post<RegistrationRequestDTO>(
    `/api/tournaments/${tournamentId}/register`,
  );
  return res.data;
}

// UPDATED: Now returns a Page object
export async function getPendingRequests(
  tournamentId: string,
  page = 0,
  size = 50,
): Promise<Page<RegistrationRequestDTO>> {
  const res = await api.get<Page<RegistrationRequestDTO>>(
    `/api/tournaments/${tournamentId}/requests`,
    { params: { page, size } },
  );
  return res.data;
}

export async function approveRequest(
  tournamentId: string,
  requestId: string,
): Promise<void> {
  await api.patch(
    `/api/tournaments/${tournamentId}/requests/${requestId}/approve`,
  );
}

export async function rejectRequest(
  tournamentId: string,
  requestId: string,
): Promise<void> {
  await api.patch(
    `/api/tournaments/${tournamentId}/requests/${requestId}/reject`,
  );
}

export async function getTournamentStaffs(
  tournamentId: string,
): Promise<StaffForTournamentResponse[]> {
  const res = await api.get<StaffForTournamentResponse[]>(
    `/api/tournaments/${tournamentId}/staffs`,
  );
  return res.data;
}

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

export async function cancelTournament(tournamentId: string): Promise<void> {
  await api.patch(`/api/tournaments/${tournamentId}/cancel`);
}

// NEW: End Tournament
export async function endTournament(tournamentId: string): Promise<string> {
  const res = await api.patch<string>(
    `/api/tournaments/${tournamentId}/end-tournament`,
  );
  return res.data;
}

export async function getMyTournaments(): Promise<TournamentResponse[]> {
  const res = await api.get<Page<TournamentResponse>>("/api/tournaments", {
    params: { page: 0, size: 50 },
  });
  return res.data.content;
}

// Admin API
export async function getDraftTournaments(
  adminKey: string,
): Promise<TournamentResponse[]> {
  const res = await api.get<TournamentResponse[]>(
    "/api/admin/tournaments/drafts",
    { headers: { "X-Admin-Key": adminKey } },
  );
  return res.data;
}

export async function approveTournamentDraft(
  tournamentId: string,
  adminKey: string,
): Promise<void> {
  await api.patch(`/api/admin/tournaments/${tournamentId}/approve`, null, {
    headers: { "X-Admin-Key": adminKey },
  });
}

export async function deleteDraftTournament(
  tournamentId: string,
  adminKey: string,
): Promise<void> {
  await api.delete(`/api/admin/tournaments/${tournamentId}/draft`, {
    headers: { "X-Admin-Key": adminKey },
  });
}
// --- END OF FILE src/api/tournaments.ts ---

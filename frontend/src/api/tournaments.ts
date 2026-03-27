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

/* ─── Filter + pagination params ─────────────────────────── */
export interface TournamentFilterParams {
  status?: TournamentStatus | string; // single status
  statuses?: (TournamentStatus | string)[]; // multiple statuses — triggers parallel requests
  format?: string;
  type?: string; // TODO: wire when backend implements type filter
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  size?: number;
}

/* ─── Paginated list — real Page<T> from backend ─────────── */
// Backend only accepts a single status value per request.
// For the "Past" tab (COMPLETED + CANCELLED) we fire two parallel requests
// and merge the results, preserving sort order by startDateTime desc.
export async function getTournamentsPaged(
  params: TournamentFilterParams,
): Promise<Page<TournamentResponse>> {
  const page = params.page ?? 0;
  const size = params.size ?? 12;

  const statuses =
    params.statuses ?? (params.status ? [params.status] : [undefined]);

  if (statuses.length <= 1) {
    // Single status — direct request
    const res = await api.get<Page<TournamentResponse>>("/api/tournaments", {
      params: {
        ...(statuses[0] ? { status: statuses[0] } : {}),
        page,
        size,
      },
    });
    return res.data;
  }

  // Multiple statuses — parallel requests, merge and re-paginate client-side
  const results = await Promise.all(
    statuses.map((status) =>
      api
        .get<Page<TournamentResponse>>("/api/tournaments", {
          params: { status, page: 0, size: 200 },
        })
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

/* ─── Simple list for homepage (fetches first page, UPCOMING) */
export async function getAllTournaments(
  status?: TournamentStatus,
): Promise<TournamentResponse[]> {
  const res = await api.get<Page<TournamentResponse>>("/api/tournaments", {
    params: {
      ...(status ? { status } : {}),
      page: 0,
      size: 50, // large enough for homepage use
    },
  });
  return res.data.content;
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

/* ─── Registration (now returns RegistrationRequestDTO) ───── */
export async function registerForTournament(
  tournamentId: string,
): Promise<RegistrationRequestDTO> {
  const res = await api.post<RegistrationRequestDTO>(
    `/api/tournaments/${tournamentId}/register`,
  );
  return res.data;
}

/* ─── Registration requests — organizer only ─────────────── */
export async function getPendingRequests(
  tournamentId: string,
): Promise<RegistrationRequestDTO[]> {
  const res = await api.get<RegistrationRequestDTO[]>(
    `/api/tournaments/${tournamentId}/requests`,
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

/* ─── Staff ───────────────────────────────────────────────── */
export async function getTournamentStaffs(
  tournamentId: string,
): Promise<StaffForTournamentResponse[]> {
  const res = await api.get<StaffForTournamentResponse[]>(
    `/api/tournaments/${tournamentId}/staffs`,
  );
  return res.data;
}

/* ─── Organizer actions ───────────────────────────────────── */
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

export async function getMyTournaments(): Promise<TournamentResponse[]> {
  // Kept for backward compat — uses the organizer's tournament list
  const res = await api.get<Page<TournamentResponse>>("/api/tournaments", {
    params: { page: 0, size: 50 },
  });
  return res.data.content;
}

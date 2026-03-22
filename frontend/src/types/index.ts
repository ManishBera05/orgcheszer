/* ─── Auth ──────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobileNo: string;
  dob: string; // "YYYY-MM-DD"
  fideId?: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}

/* ─── Tournament ─────────────────────────────────────────── */

export type TournamentStatus =
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";
export type TournamentFormat = "SWISS" | "ROUND_ROBIN";

export interface TournamentCreateRequest {
  tournamentName: string;
  startDateTime: string; // ISO 8601 e.g. "2030-01-01T10:00:00"
  numberOfRounds: number;
  maxParticipants: number;
  entryFee: number;
  description: string;
  location: string;
  timeControl: string; // e.g. "90+30"
  format: TournamentFormat;
}

export interface TournamentResponse {
  tournamentId: string;
  tournamentName: string;
  startDateTime: string;
  numberOfRounds: number;
  maxParticipants: number;
  entryFee: number;
  description: string;
  location: string;
  timeControl: string;
  format: TournamentFormat;
  organizerName: string;
  organizerPhoneNumber: string;
  currentNumberOfParticipants: number;
  status: TournamentStatus;
}

export interface TournamentPlayerDTO {
  userId: string;
  firstName: string;
  lastName: string;
  eloRating: number;
  fideId: string;
  checkInStatus: string;
}

/* ─── Matchmaking ─────────────────────────────────────────── */

export type GameResult =
  | "PENDING"
  | "WHITE_WINS"
  | "BLACK_WINS"
  | "DRAW"
  | "BYE";

export interface GamePairingDTO {
  gameId: string;
  whiteName: string;
  blackName: string;
  boardNumber: number;
  result: GameResult;
}

export interface RoundPairingsResponse {
  roundNumber: number;
  pairings: GamePairingDTO[];
}

/* ─── Leaderboard ─────────────────────────────────────────── */

export interface LeaderboardEntryDTO {
  rank: number;
  playerID: string;
  playerName: string;
  fideId: string;
  eloRating: number;
  score: number;
  buchholz: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  gamesWithBlack: number;
  numberOfWins: number;
}

/* ─── Staff Keys ──────────────────────────────────────────── */

export interface StaffKeyResponse {
  keyValue: string;
  used: boolean;
  createdAt: string;
  usedAt: string | null;
}

/* ─── User Profiles ───────────────────────────────────────── */

export interface UserTournamentSummaryDTO {
  tournamentId: string;
  tournamentName: string;
  format: TournamentFormat;
  status: TournamentStatus;
  role: string;
}

export interface OpponentDTO {
  roundNumber: number;
  opponentId: string;
  opponentName: string;
  result: string;
}

export interface UserTournamentStatsDTO {
  tournamentId: string;
  tournamentName: string;
  role: string;
  finalRank: number | null;
  currentScore: number;
  buchholz: number;
  buchholzCut1: number;
  sonnenbornBerger: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  byesReceived: number;
  opponents: OpponentDTO[];
}

/* ─── Auth store shape (used by authStore + useAuth) ─────── */

export interface AuthUser {
  token: string;
}

/* ─── API error shape ────────────────────────────────────── */

export interface ApiError {
  message: string;
  status?: number;
}

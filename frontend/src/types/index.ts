// --- START OF FILE src/types/index.ts ---
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

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
  dob: string;
  fideId?: string;
}
export interface AuthResponse {
  token: string;
  message: string;
}

// NEW TYPES FOR OTP VERIFICATION
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
export interface InitiateResponse {
  message: string;
}

export type TournamentStatus =
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";
export type TournamentFormat = "SWISS" | "ROUND_ROBIN" | "KNOCKOUT";

export interface TournamentCreateRequest {
  tournamentName: string;
  startDateTime: string;
  numberOfRounds: number;
  maxParticipants: number;
  entryFee: number;
  description: string;
  location: string;
  timeControl: string;
  format: TournamentFormat;
}

export interface TournamentResponse {
  tournamentId: string;
  tournamentName: string;
  startDateTime: string;
  numberOfRounds: number;
  currentRound: number;
  maxParticipants: number;
  entryFee: number;
  description: string;
  location: string;
  timeControl: string;
  format: TournamentFormat;
  organizerName: string;
  organizerId: string;
  organizerPhoneNumber: string | null;
  checkedInPlayers: number;
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
export interface RegistrationRequestDTO {
  requestId: string;
  playerId: string;
  playerName: string;
  playerEloRating: number;
  playerFideId: string;
  requestedAt: string;
}
export type GameResult =
  | "PENDING"
  | "WHITE_WINS"
  | "BLACK_WINS"
  | "DRAW"
  | "BYE";
export interface GamePairingDTO {
  gameId: string;
  whiteId?: string;
  blackId?: string;
  whiteName: string;
  blackName: string;
  boardNumber: number;
  result: GameResult;
}
export interface RoundPairingsResponse {
  roundNumber: number;
  pairings: GamePairingDTO[];
  roundStatus: string;
}

export interface LeaderboardEntryDTO {
  rank: number;
  playerID: string;
  playerName: string;
  fideId: string;
  eloRating: number;
  score: number;
  totalGamesPlayed: number;
  buchholz: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  gamesWithBlack: number;
  numberOfWins: number;
  buchholzCut2?: number;
  buchholzMedian?: number;
  winsWithBlack?: number;
  directEncounterScore?: number;
}

export interface StaffKeyResponse {
  keyValue: string;
  used: boolean;
  createdAt: string;
  usedAt: string | null;
}
export interface StaffForTournamentResponse {
  keyUsed: string;
  name: string;
  userID: string;
}
export interface PublicUserProfileDTO {
  userId: string;
  firstName: string;
  lastName: string;
  eloRating: number;
  fideId: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  tournamentsPlayed: number;
  tournamentsOrganized: number;
  tournamentsStaffed: number;
}
export interface MyTournamentDTO {
  tournamentId: string;
  tournamentName: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startDateTime: string;
  location: string;
  role: string;
  score: number;
  finalRank: number | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
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
export interface UserDetailsDTO {
  userId: string;
  firstName: string;
  lastName: string;
  date_of_birth: string;
  email: string;
  mobileNo: string;
  fideId: string;
}
export interface PlatformStatsDTO {
  totalUsers: number;
  totalTournamentsOrganized: number;
  totalGamesPlayed: number;
  liveTournaments: number;
}
export interface AuthUser {
  token: string;
}
export interface ApiError {
  message: string;
  status?: number;
}
// --- END OF FILE src/types/index.ts ---

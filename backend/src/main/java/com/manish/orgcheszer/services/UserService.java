package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.MyTournamentDTO;
import com.manish.orgcheszer.dtos.OpponentDTO;
import com.manish.orgcheszer.dtos.PublicUserProfileDTO;
import com.manish.orgcheszer.dtos.UserTournamentStatsDTO;
import com.manish.orgcheszer.dtos.UserTournamentSummaryDTO;
import com.manish.orgcheszer.entities.Game;
import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.Rounds;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.TournamentStaff;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.repositories.GameRepository;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RoundsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentStaffRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UsersRepository                 usersRepository;
    private final TournamentRepository            tournamentRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final TournamentStaffRepository       staffRepository;
    private final GameRepository                  gameRepository;
    private final RoundsRepository                roundsRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC: summary numbers only — no sensitive data
    // ─────────────────────────────────────────────────────────────────────────
    public PublicUserProfileDTO getPublicProfile(UUID userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Aggregate game stats from PlayerTournamentStats
        long gamesWon   = statsRepository.sumWinsByPlayerId(userId);
        long gamesDrawn = statsRepository.sumDrawsByPlayerId(userId);
        long gamesPlayed = statsRepository.sumGamesPlayedByPlayerId(userId);
        long gamesLost  = gamesPlayed - gamesWon - gamesDrawn;

        // Tournament counts
        long tournamentsPlayed    = statsRepository.countByPlayerId(userId);
        long tournamentsOrganized = tournamentRepository
                .countByOrganizerIdAndIsDemoFalse(userId);
        long tournamentsStaffed   = staffRepository.countByUserId(userId);

        return PublicUserProfileDTO.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .eloRating(user.getEloRating())
                .fideId(user.getFideId())
                .gamesPlayed(gamesPlayed)
                .gamesWon(gamesWon)
                .gamesLost(Math.max(0, gamesLost))
                .gamesDrawn(gamesDrawn)
                .tournamentsPlayed(tournamentsPlayed)
                .tournamentsOrganized(tournamentsOrganized)
                .tournamentsStaffed(tournamentsStaffed)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE: current user's full tournament history with role filter
    // ─────────────────────────────────────────────────────────────────────────
    public Page<MyTournamentDTO> getMyTournaments(String role, int page, int size) {
        Users currentUser = getCurrentUser();

        if (role == null) {
            // For merged results use unpaged internally
            Pageable pageable = PageRequest.of(page, size);
            return getAllRoles(currentUser.getId(), pageable);
        }

        return switch (role.toUpperCase()) {
            case "ORGANIZER" -> {
                // Tournament entity has startDataTime directly
                Pageable pageable = PageRequest.of(page, size,
                        Sort.by("startDataTime").descending());
                yield getOrganizedTournaments(currentUser.getId(), pageable);
            }
            case "STAFF" -> {
                // TournamentStaff → tournament.startDataTime
                Pageable pageable = PageRequest.of(page, size,
                        Sort.by("tournament.startDataTime").descending());
                yield getStaffedTournaments(currentUser.getId(), pageable);
            }
            case "PLAYER" -> {
                // PlayerTournamentStats → tournament.startDataTime
                Pageable pageable = PageRequest.of(page, size,
                        Sort.by("tournament.startDataTime").descending());
                yield getPlayedTournaments(currentUser.getId(), pageable);
            }
            default -> throw new RuntimeException(
                    "Invalid role filter. Use: ORGANIZER, STAFF or PLAYER");
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ROLE-SPECIFIC QUERIES
    // ─────────────────────────────────────────────────────────────────────────
    private Page<MyTournamentDTO> getOrganizedTournaments(UUID userId, Pageable pageable) {
        Page<Tournament> tournaments = tournamentRepository
                .findByOrganizerIdAndIsDemoFalse(userId, pageable);

        // FIX: return empty page instead of erroring when no results
        if (tournaments.isEmpty()) {
            return Page.empty(pageable);
        }

        return tournaments.map(t -> MyTournamentDTO.builder()
                .tournamentId(t.getTournamentId())
                .tournamentName(t.getTournamentName())
                .format(t.getFormat())
                .status(t.getStatus())
                .startDateTime(t.getStartDataTime())
                .location(t.getLocation())
                .role("ORGANIZER")
                .build());
    }

    private Page<MyTournamentDTO> getStaffedTournaments(UUID userId, Pageable pageable) {
        Page<TournamentStaff> staffed = staffRepository.findByUserId(userId, pageable);

        // FIX: return empty page instead of erroring when no results
        if (staffed.isEmpty()) {
            return Page.empty(pageable);
        }

        return staffed.map(ts -> MyTournamentDTO.builder()
                .tournamentId(ts.getTournament().getTournamentId())
                .tournamentName(ts.getTournament().getTournamentName())
                .format(ts.getTournament().getFormat())
                .status(ts.getTournament().getStatus())
                .startDateTime(ts.getTournament().getStartDataTime())
                .location(ts.getTournament().getLocation())
                .role("STAFF")
                .build());
    }

    private Page<MyTournamentDTO> getPlayedTournaments(UUID userId, Pageable pageable) {
        Page<PlayerTournamentStats> stats = statsRepository.findByPlayerId(userId, pageable);

        // FIX: return empty page instead of erroring when no results
        if (stats.isEmpty()) {
            return Page.empty(pageable);
        }

        return stats.map(s -> {
            int wins   = s.getWinsWithWhite()  + s.getWinsWithBlack();
            int draws  = s.getDrawsWithWhite() + s.getDrawsWithBlack();
            int games  = s.getGamesWithWhite() + s.getGamesWithBlack();
            int losses = Math.max(0, games - wins - draws);

            return MyTournamentDTO.builder()
                    .tournamentId(s.getTournament().getTournamentId())
                    .tournamentName(s.getTournament().getTournamentName())
                    .format(s.getTournament().getFormat())
                    .status(s.getTournament().getStatus())
                    .startDateTime(s.getTournament().getStartDataTime())
                    .location(s.getTournament().getLocation())
                    .role("PLAYER")
                    .score(s.getCurrentScore())
                    .finalRank(s.getFinalRank())
                    .gamesPlayed(games)
                    .wins(wins)
                    .losses(losses)
                    .draws(draws)
                    .build();
        });
    }

    // When no role filter — merge all three into a single page
    private Page<MyTournamentDTO> getAllRoles(UUID userId, Pageable pageable) {
        // Fetch all records without pagination first, then manually paginate
        Pageable unpaged = Pageable.unpaged();

        var organized = getOrganizedTournaments(userId, unpaged).getContent();
        var staffed   = getStaffedTournaments(userId, unpaged).getContent();
        var played    = getPlayedTournaments(userId, unpaged).getContent();

        var merged = new java.util.ArrayList<MyTournamentDTO>();
        merged.addAll(organized);
        merged.addAll(staffed);
        merged.addAll(played);

        // Sort merged list by startDateTime descending
        merged.sort((a, b) -> {
            if (a.getStartDateTime() == null && b.getStartDateTime() == null) return 0;
            if (a.getStartDateTime() == null) return 1;
            if (b.getStartDateTime() == null) return -1;
            return b.getStartDateTime().compareTo(a.getStartDateTime());
        });

        // Manually paginate the merged list
        int total = merged.size();
        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), total);

        // FIX: return empty page instead of throwing when start >= total
        if (start >= total) {
            return new org.springframework.data.domain.PageImpl<>(
                    java.util.Collections.emptyList(), pageable, total);
        }

        return new org.springframework.data.domain.PageImpl<>(
                merged.subList(start, end), pageable, total);
    }

    public UserTournamentStatsDTO getUserTournamentStats(UUID userId, UUID tournamentId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Determine role
        String role;
        if (tournament.getOrganizer().getId().equals(userId)) {
            role = "ORGANIZER";
        } else if (staffRepository.existsByUserIdAndTournamentTournamentId(userId, tournamentId)) {
            role = "STAFF";
        } else {
            role = "PLAYER";
        }

        UserTournamentStatsDTO dto = UserTournamentStatsDTO.builder()
                .tournamentId(tournamentId)
                .tournamentName(tournament.getTournamentName())
                .role(role)
                .build();

        // Only players have stats
        if (!role.equals("PLAYER")) return dto;

        PlayerTournamentStats stats = statsRepository
                .findByPlayerIdAndTournamentTournamentId(userId, tournamentId)
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        int wins   = stats.getWinsWithWhite()  + stats.getWinsWithBlack();
        int draws  = stats.getDrawsWithWhite() + stats.getDrawsWithBlack();
        int games  = stats.getGamesWithWhite() + stats.getGamesWithBlack();
        int losses = games - wins - draws;

        // Build per-round opponent list
        List<OpponentDTO> opponents = new ArrayList<>();
        List<Rounds> rounds = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId);

        for (int i = 0; i < stats.getOpponentIds().size(); i++) {
            UUID oppId = stats.getOpponentIds().get(i);
            int  roundNumber = i + 1;

            if (oppId == null) {
                opponents.add(OpponentDTO.builder()
                        .roundNumber(roundNumber)
                        .opponentId(null)
                        .opponentName("BYE")
                        .result("BYE")
                        .build());
                continue;
            }

            Users opp = usersRepository.findById(oppId).orElseThrow();

            // Find the game to get result
            Rounds round = rounds.get(i);
            Game game = gameRepository.findByRoundId(round.getId()).stream()
                    .filter(g -> (g.getWhitePlayer().getId().equals(userId)
                            || (g.getBlackPlayer() != null
                            && g.getBlackPlayer().getId().equals(userId))))
                    .findFirst().orElseThrow();

            boolean isWhite = game.getWhitePlayer().getId().equals(userId);
            String result = resolveResultString(game.getResult(), isWhite);

            opponents.add(OpponentDTO.builder()
                    .roundNumber(roundNumber)
                    .opponentId(oppId)
                    .opponentName(opp.getFirstName() + " " + opp.getLastName())
                    .result(result)
                    .build());
        }

        dto.setFinalRank(stats.getFinalRank());
        dto.setCurrentScore(stats.getCurrentScore());
        dto.setBuchholz(stats.getBuchholz());
        dto.setBuchholzCut1(stats.getBuchholzCut1());
        dto.setSonnenbornBerger(stats.getSonnebornBerger());
        dto.setGamesPlayed(games);
        dto.setWins(wins);
        dto.setLosses(losses);
        dto.setDraws(draws);
        dto.setByesReceived(stats.getByesReceived());
        dto.setOpponents(opponents);

        return dto;
    }

    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String resolveResultString(GameResult result, boolean isWhite) {
        return switch (result) {
            case WHITE_WINS -> isWhite ? "WIN" : "LOSS";
            case BLACK_WINS -> isWhite ? "LOSS" : "WIN";
            case DRAW       -> "DRAW";
            case BYE        -> "BYE";
            default         -> "UNKNOWN";
        };
    }
}
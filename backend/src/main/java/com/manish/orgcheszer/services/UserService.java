package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.OpponentDTO;
import com.manish.orgcheszer.dtos.UserTournamentStatsDTO;
import com.manish.orgcheszer.dtos.UserTournamentSummaryDTO;
import com.manish.orgcheszer.entities.Game;
import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.Rounds;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.repositories.GameRepository;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RoundsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentStaffRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UsersRepository usersRepo;
    private final TournamentRepository tournamentRepo;
    private final PlayerTournamentStatsRepository statsRepo;
    private final TournamentStaffRepository staffRepo;
    private final RoundsRepository roundsRepo;
    private final GameRepository gameRepo;

    public List<UserTournamentSummaryDTO> getUserTournaments(UUID userId) {
        Users user = usersRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserTournamentSummaryDTO> result = new ArrayList<>();

        // Tournaments organized
        tournamentRepo.findByOrganizerIdOrderByStartDataTimeDesc(userId)
                .forEach(t -> result.add(UserTournamentSummaryDTO.builder()
                        .tournamentId(t.getTournamentId())
                        .tournamentName(t.getTournamentName())
                        .format(t.getFormat().name())
                        .status(t.getStatus().name())
                        .role("ORGANIZER")
                        .build()));

        // Tournaments staffed
        staffRepo.findByUserId(userId)
                .forEach(ts -> result.add(UserTournamentSummaryDTO.builder()
                        .tournamentId(ts.getTournament().getTournamentId())
                        .tournamentName(ts.getTournament().getTournamentName())
                        .format(ts.getTournament().getFormat().name())
                        .status(ts.getTournament().getStatus().name())
                        .role("STAFF")
                        .build()));

        // Tournaments played
        statsRepo.findByPlayerId(userId)
                .forEach(s -> result.add(UserTournamentSummaryDTO.builder()
                        .tournamentId(s.getTournament().getTournamentId())
                        .tournamentName(s.getTournament().getTournamentName())
                        .format(s.getTournament().getFormat().name())
                        .status(s.getTournament().getStatus().name())
                        .role("PLAYER")
                        .build()));

        return result;
    }

    public UserTournamentStatsDTO getUserTournamentStats(UUID userId, UUID tournamentId) {
        Users user = usersRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Tournament tournament = tournamentRepo.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Determine role
        String role;
        if (tournament.getOrganizer().getId().equals(userId)) {
            role = "ORGANIZER";
        } else if (staffRepo.existsByUserIdAndTournamentTournamentId(userId, tournamentId)) {
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

        PlayerTournamentStats stats = statsRepo
                .findByPlayerIdAndTournamentTournamentId(userId, tournamentId)
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        int wins   = stats.getWinsWithWhite()  + stats.getWinsWithBlack();
        int draws  = stats.getDrawsWithWhite() + stats.getDrawsWithBlack();
        int games  = stats.getGamesWithWhite() + stats.getGamesWithBlack();
        int losses = games - wins - draws;

        // Build per-round opponent list
        List<OpponentDTO> opponents = new ArrayList<>();
        List<Rounds> rounds = roundsRepo
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

            Users opp = usersRepo.findById(oppId).orElseThrow();

            // Find the game to get result
            Rounds round = rounds.get(i);
            Game game = gameRepo.findByRoundId(round.getId()).stream()
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
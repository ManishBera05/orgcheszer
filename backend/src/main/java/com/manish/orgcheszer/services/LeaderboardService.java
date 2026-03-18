package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final TournamentRepository            tournamentRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final RoundsRepository                roundsRepository;
    private final GameRepository                  gameRepository;

    // GET LEADERBOARD
    // Returns sorted standings for a tournament at any point in time
    @Transactional(readOnly = true) // Still good practice for read operations
    public List<LeaderboardEntryDTO> getLeaderboard(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        List<PlayerTournamentStats> allStats = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        List<LeaderboardEntryDTO> leaderboard = allStats.stream()
                .map(stats -> LeaderboardEntryDTO.builder()
                        .playerName(stats.getPlayer().getFirstName()
                                + " " + stats.getPlayer().getLastName())
                        .fideId(stats.getPlayer().getFideId())
                        .playerID(stats.getPlayer().getId())
                        .eloRating(stats.getPlayer().getEloRating())
                        .score(stats.getCurrentScore())
                        .buchholz(stats.getBuchholz())
                        .buchholzCut1(stats.getBuchholzCut1())
                        .sonnebornBerger(stats.getSonnebornBerger())
                        .numberOfWins(stats.getWinsWithWhite() + stats.getWinsWithBlack())
                        .gamesWithBlack(stats.getGamesWithBlack())
                        .build())
                .collect(Collectors.toList());

        // Sort by the correct tiebreaker order based on format
        if (tournament.getFormat() == TournamentFormat.SWISS) {
            sortSwiss(leaderboard);
        } else {
            sortRoundRobin(leaderboard);
        }

        // Assign ranks after sorting
        for (int i = 0; i < leaderboard.size(); i++) {
            LeaderboardEntryDTO currentPlayer = leaderboard.get(i);
            currentPlayer.setRank(i + 1);
            UUID currentPlayerId = currentPlayer.getPlayerID();
            PlayerTournamentStats requiredPlayer = statsRepository
                    .findByPlayerIdAndTournamentTournamentId(currentPlayerId,tournamentId)
                    .orElseThrow(() -> new RuntimeException("Round not found"));
            requiredPlayer.setFinalRank(i+1);
        }

        return leaderboard;
    }

    // SWISS sort priority:
    // 1. Score (desc)
    // 2. Buchholz Cut-1 (desc)
    // 3. Buchholz (desc)
    // 4. Games with Black (desc)
    // 5. Number of Wins (desc)
    private void sortSwiss(List<LeaderboardEntryDTO> leaderboard) {
        leaderboard.sort(
                Comparator.comparingDouble(LeaderboardEntryDTO::getScore).reversed()
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getBuchholzCut1).reversed())
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getBuchholz).reversed())
                        .thenComparing(Comparator.comparingInt(LeaderboardEntryDTO::getGamesWithBlack).reversed())
                        .thenComparing(Comparator.comparingInt(LeaderboardEntryDTO::getNumberOfWins).reversed())
        );
    }

    // ROUND ROBIN sort priority:
    // 1. Score (desc)
    // 2. Sonneborn-Berger (desc)
    // 3. Number of Wins (desc)
    private void sortRoundRobin(List<LeaderboardEntryDTO> leaderboard) {
        leaderboard.sort(
                Comparator.comparingDouble(LeaderboardEntryDTO::getScore).reversed()
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getSonnebornBerger).reversed())
                        .thenComparing(Comparator.comparingInt(LeaderboardEntryDTO::getNumberOfWins).reversed())
        );
    }

    // RECALCULATE TIEBREAKERS
    // Called by MatchmakingService after every result submission.
    // Recalculates all tiebreaker values for ALL players in the tournament
    // since every result changes opponent scores which affects everyone's Buchholz.
    @Transactional
    public void recalculateTiebreakers(UUID tournamentId) {
        List<PlayerTournamentStats> allStats = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        // Build a quick lookup map: playerId → stats
        Map<UUID, PlayerTournamentStats> statsMap = allStats.stream()
                .collect(Collectors.toMap(
                        s -> s.getPlayer().getId(),
                        s -> s));

        // Load all games in this tournament
        List<Game> allGames = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId)
                .stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .filter(g -> g.getResult() != null)
                .filter(g -> g.getResult() != GameResult.PENDING)
                .collect(Collectors.toList());

        // Recalculate for every player
        for (PlayerTournamentStats stats : allStats) {
            UUID playerId = stats.getPlayer().getId();

            // Get all completed games for this player (exclude byes)
            List<Game> playerGames = allGames.stream()
                    .filter(g -> g.getBlackPlayer() != null) // exclude byes
                    .filter(g -> g.getWhitePlayer().getId().equals(playerId)
                            || g.getBlackPlayer().getId().equals(playerId))
                    .filter(g -> g.getResult() != GameResult.PENDING)
                    .collect(Collectors.toList());

            // Buchholz
            // Sum of all opponents' current scores
            double buchholz = playerGames.stream()
                    .mapToDouble(g -> {
                        UUID oppId = g.getWhitePlayer().getId().equals(playerId)
                                ? g.getBlackPlayer().getId()
                                : g.getWhitePlayer().getId();
                        PlayerTournamentStats oppStats = statsMap.get(oppId);
                        return oppStats != null ? oppStats.getCurrentScore() : 0.0;
                    })
                    .sum();

            // Buchholz Cut-1
            // Buchholz minus the lowest opponent score
            List<Double> opponentScores = playerGames.stream()
                    .map(g -> {
                        UUID oppId = g.getWhitePlayer().getId().equals(playerId)
                                ? g.getBlackPlayer().getId()
                                : g.getWhitePlayer().getId();
                        PlayerTournamentStats oppStats = statsMap.get(oppId);
                        return oppStats != null ? oppStats.getCurrentScore() : 0.0;
                    })
                    .collect(Collectors.toList());

            double buchholzCut1 = buchholz;
            if (!opponentScores.isEmpty()) {
                double lowestOpponentScore = Collections.min(opponentScores);
                buchholzCut1 = buchholz - lowestOpponentScore;
            }

            // Sonneborn-Berger
            // Win  → add opponent's full score
            // Draw → add half opponent's score
            // Loss → add nothing
            double sonnenbornBerger = playerGames.stream()
                    .mapToDouble(g -> {
                        boolean isWhite = g.getWhitePlayer().getId().equals(playerId);
                        UUID oppId = isWhite
                                ? g.getBlackPlayer().getId()
                                : g.getWhitePlayer().getId();

                        PlayerTournamentStats oppStats = statsMap.get(oppId);
                        double oppScore = oppStats != null ? oppStats.getCurrentScore() : 0.0;

                        boolean won  = (isWhite && g.getResult() == GameResult.WHITE_WINS)
                                || (!isWhite && g.getResult() == GameResult.BLACK_WINS);
                        boolean drew = g.getResult() == GameResult.DRAW;

                        if (won)  return oppScore;
                        if (drew) return oppScore / 2.0;
                        return 0.0;
                    })
                    .sum();

            // Persist updated tiebreaker values
            stats.setBuchholz(buchholz);
            stats.setBuchholzCut1(buchholzCut1);
            stats.setSonnebornBerger(sonnenbornBerger);
            statsRepository.save(stats);
        }
    }
}
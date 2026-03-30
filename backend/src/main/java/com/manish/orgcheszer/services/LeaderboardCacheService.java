package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
import com.manish.orgcheszer.entities.Game;
import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.repositories.GameRepository;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RoundsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardCacheService {
    private final TournamentRepository tournamentRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final RoundsRepository roundsRepository;
    private final GameRepository gameRepository;

    @Cacheable(value = "leaderboard", key = "#tournamentId.toString()")
    public List<LeaderboardEntryDTO> getFullLeaderboard(UUID tournamentId) {
        // Move ALL your existing getLeaderboard() logic here
        // Remove the pagination part (PageImpl) — just return the full sorted list
        // Keep: load stats, build DTOs, sort, assign ranks, persist finalRank
        // Return: List<LeaderboardEntryDTO>
        System.out.println("Leaderboard miss");
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        List<PlayerTournamentStats> allStats = statsRepository
                .findCheckedInStatsByTournamentId(tournamentId);

        List<LeaderboardEntryDTO> leaderboard = allStats.stream()
                .map(stats -> LeaderboardEntryDTO.builder()
                        .playerName(stats.getPlayer().getFirstName()
                                + " " + stats.getPlayer().getLastName())
                        .fideId(stats.getPlayer().getFideId())
                        .playerID(stats.getPlayer().getId())
                        .eloRating(stats.getPlayer().getEloRating())
                        .score(stats.getCurrentScore())
                        .totalGamesPlayed(stats.getGamesWithBlack()+stats.getGamesWithWhite()+stats.getByesReceived())
                        .buchholz(stats.getBuchholz())
                        .buchholzCut1(stats.getBuchholzCut1())
                        .buchholzCut2(stats.getBuchholzCut2())
                        .buchholzMedian(stats.getBuchholzMedian())
                        .winsWithBlack(stats.getWinsWithBlack())
                        .sonnebornBerger(stats.getSonnebornBerger())
                        .numberOfWins(stats.getWinsWithWhite() + stats.getWinsWithBlack())
                        .gamesWithBlack(stats.getGamesWithBlack())
                        .build())
                .collect(Collectors.toList());

        List<Game> allGames = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId)
                .stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .filter(g -> g.getResult() != null && g.getResult() != GameResult.PENDING)
                .toList();

        // Sort by the correct tiebreaker order based on format
        if (tournament.getFormat() == TournamentFormat.SWISS) {
            sortSwiss(leaderboard);
        } else {
            sortRoundRobin(leaderboard,allStats,allGames);
        }

        // Assign ranks after sorting
        for (int i = 0; i < leaderboard.size(); i++) {
            LeaderboardEntryDTO currentPlayer = leaderboard.get(i);
            currentPlayer.setRank(i + 1);
            UUID currentPlayerId = currentPlayer.getPlayerID();
            PlayerTournamentStats requiredPlayer = statsRepository
                    .findByPlayerIdAndTournamentTournamentId(currentPlayerId,tournamentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Round not found"));
            requiredPlayer.setFinalRank(i+1);
            statsRepository.save(requiredPlayer);
        }
        return leaderboard;
    }

    // AICF Swiss: BuchholzCut1 → BuchholzCut2 → SonnenbornBerger → BuchholzMedian
    private void sortSwiss(List<LeaderboardEntryDTO> leaderboard) {
        leaderboard.sort(
                Comparator.comparingDouble(LeaderboardEntryDTO::getScore).reversed()
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getBuchholzCut1).reversed())
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getBuchholzCut2).reversed())
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getSonnebornBerger).reversed())
                        .thenComparing(Comparator.comparingDouble(LeaderboardEntryDTO::getBuchholzMedian).reversed())
        );
    }

    // AICF Round Robin: DirectEncounter → SonnenbornBerger → Wins → WinsWithBlack
    private void sortRoundRobin(List<LeaderboardEntryDTO> leaderboard,
                                  List<PlayerTournamentStats> allStats,
                                  List<Game> allGames) {

        // Group players by score to apply direct encounter within tied groups
        Map<Double, List<LeaderboardEntryDTO>> scoreGroups = leaderboard.stream()
                .collect(Collectors.groupingBy(LeaderboardEntryDTO::getScore));

        // Calculate direct encounter scores for each tied group
        Map<UUID, Double> directEncounterScores = new HashMap<>();
        for (List<LeaderboardEntryDTO> group : scoreGroups.values()) {
            if (group.size() <= 1) {
                // No tie — direct encounter score irrelevant
                group.forEach(p -> directEncounterScores.put(p.getPlayerID(), 0.0));
                continue;
            }

            // Get UUIDs of all players in this tied group
            Set<UUID> groupIds = group.stream()
                    .map(LeaderboardEntryDTO::getPlayerID)
                    .collect(Collectors.toSet());

            // For each player in the group, sum their scores only against
            // other players in the same tied group
            for (LeaderboardEntryDTO player : group) {
                double deScore = allGames.stream()
                        .filter(g -> g.getBlackPlayer() != null)
                        .filter(g -> {
                            boolean playerInvolved =
                                    g.getWhitePlayer().getId().equals(player.getPlayerID())
                                            || g.getBlackPlayer().getId().equals(player.getPlayerID());
                            if (!playerInvolved) return false;

                            UUID oppId = g.getWhitePlayer().getId().equals(player.getPlayerID())
                                    ? g.getBlackPlayer().getId()
                                    : g.getWhitePlayer().getId();
                            return groupIds.contains(oppId); // only games within the tied group
                        })
                        .mapToDouble(g -> {
                            boolean isWhite = g.getWhitePlayer().getId()
                                    .equals(player.getPlayerID());
                            boolean won  = (isWhite && g.getResult() == GameResult.WHITE_WINS)
                                    || (!isWhite && g.getResult() == GameResult.BLACK_WINS);
                            boolean drew = g.getResult() == GameResult.DRAW;
                            if (won)  return 1.0;
                            if (drew) return 0.5;
                            return 0.0;
                        })
                        .sum();

                directEncounterScores.put(player.getPlayerID(), deScore);
            }
        }

        // Set direct encounter score on each DTO
        leaderboard.forEach(p ->
                p.setDirectEncounterScore(
                        directEncounterScores.getOrDefault(p.getPlayerID(), 0.0)));

        leaderboard.sort(
                Comparator.comparingDouble(LeaderboardEntryDTO::getScore).reversed()
                        .thenComparing(Comparator.comparingDouble(
                                LeaderboardEntryDTO::getDirectEncounterScore).reversed())
                        .thenComparing(Comparator.comparingDouble(
                                LeaderboardEntryDTO::getSonnebornBerger).reversed())
                        .thenComparing(Comparator.comparingInt(
                                LeaderboardEntryDTO::getNumberOfWins).reversed())
                        .thenComparing(Comparator.comparingInt(
                                LeaderboardEntryDTO::getWinsWithBlack).reversed())
        );
    }
}
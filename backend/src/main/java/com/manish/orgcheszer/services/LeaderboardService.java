package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
    private final TournamentTicketRepository      ticketRepository;
    // GET LEADERBOARD
    // Returns sorted standings for a tournament at any point in time
    @Transactional
    public Page<LeaderboardEntryDTO> getLeaderboard(UUID tournamentId, int page, int size) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

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
                    .orElseThrow(() -> new RuntimeException("Round not found"));
            requiredPlayer.setFinalRank(i+1);
            statsRepository.save(requiredPlayer);
        }

        int total = leaderboard.size();
        int start = page * size;
        int end = Math.min(start + size, total);

        if(start >= total){
            return new PageImpl<>(Collections.emptyList(),
                    PageRequest.of(page,size), total);
        }
        return new PageImpl<>(
                leaderboard.subList(start, end),
                PageRequest.of(page, size),
                total);
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

     /**RECALCULATE TIEBREAKERS
     Called by MatchmakingService after every result submission.
     Recalculates all tiebreaker values for ALL players in the tournament
     since every result changes opponent scores which affects everyone's Buchholz.*/
    @Transactional
    public void recalculateTiebreakers(UUID tournamentId) {
        List<PlayerTournamentStats> allStats = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        Map<UUID, PlayerTournamentStats> statsMap = allStats.stream()
                .collect(Collectors.toMap(s -> s.getPlayer().getId(), s -> s));

        List<Game> allGames = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId)
                .stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .filter(g -> g.getResult() != null)
                .filter(g -> g.getResult() != GameResult.PENDING)
                .collect(Collectors.toList());

        for (PlayerTournamentStats stats : allStats) {
            UUID playerId = stats.getPlayer().getId();

            List<Game> playerGames = allGames.stream()
                    .filter(g -> g.getBlackPlayer() != null)
                    .filter(g -> g.getWhitePlayer().getId().equals(playerId)
                            || g.getBlackPlayer().getId().equals(playerId))
                    .collect(Collectors.toList());

            // Collect opponent scores
            List<Double> opponentScores = playerGames.stream()
                    .map(g -> {
                        UUID oppId = g.getWhitePlayer().getId().equals(playerId)
                                ? g.getBlackPlayer().getId()
                                : g.getWhitePlayer().getId();
                        PlayerTournamentStats opp = statsMap.get(oppId);
                        return opp != null ? opp.getCurrentScore() : 0.0;
                    })
                    .sorted()
                    .collect(Collectors.toList());

            double buchholz = opponentScores.stream()
                    .mapToDouble(Double::doubleValue).sum();

            // ── Buchholz Cut 1 — remove lowest ───────────────────────────────
            double buchholzCut1 = buchholz;
            if (!opponentScores.isEmpty()) {
                buchholzCut1 = buchholz - opponentScores.get(0);
            }

            // ── Buchholz Cut 2 — remove two lowest ───────────────────────────
            double buchholzCut2 = buchholz;
            if (opponentScores.size() >= 2) {
                buchholzCut2 = buchholz
                        - opponentScores.get(0)
                        - opponentScores.get(1);
            } else if (opponentScores.size() == 1) {
                buchholzCut2 = buchholz - opponentScores.get(0);
            }

            // ── Buchholz Median — remove highest AND lowest ───────────────────
            double buchholzMedian = buchholz;
            if (opponentScores.size() >= 2) {
                double lowest  = opponentScores.get(0);
                double highest = opponentScores.get(opponentScores.size() - 1);
                buchholzMedian = buchholz - lowest - highest;
            }

            // ── Sonneborn-Berger ──────────────────────────────────────────────
            double sonnenbornBerger = playerGames.stream()
                    .mapToDouble(g -> {
                        boolean isWhite = g.getWhitePlayer().getId().equals(playerId);
                        UUID oppId = isWhite
                                ? g.getBlackPlayer().getId()
                                : g.getWhitePlayer().getId();
                        PlayerTournamentStats opp = statsMap.get(oppId);
                        double oppScore = opp != null ? opp.getCurrentScore() : 0.0;

                        boolean won  = (isWhite && g.getResult() == GameResult.WHITE_WINS)
                                || (!isWhite && g.getResult() == GameResult.BLACK_WINS);
                        boolean drew = g.getResult() == GameResult.DRAW;

                        if (won)  return oppScore;
                        if (drew) return oppScore / 2.0;
                        return 0.0;
                    })
                    .sum();

            stats.setBuchholz(buchholz);
            stats.setBuchholzCut1(buchholzCut1);
            stats.setBuchholzCut2(buchholzCut2);
            stats.setBuchholzMedian(buchholzMedian);
            stats.setSonnebornBerger(sonnenbornBerger);
            statsRepository.save(stats);
        }
    }
}
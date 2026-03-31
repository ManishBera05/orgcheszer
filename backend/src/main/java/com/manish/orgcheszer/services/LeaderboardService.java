package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final TournamentRepository            tournamentRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final RoundsRepository                roundsRepository;
    private final GameRepository                  gameRepository;
    private final TournamentTicketRepository      ticketRepository;
    private final LeaderboardCacheService         leaderboardCacheService;
    // GET LEADERBOARD

    // Returns sorted standings for a tournament at any point in time
    @Transactional
    public Page<LeaderboardEntryDTO> getLeaderboard(UUID tournamentId, int page, int size) {
        List<LeaderboardEntryDTO> full = leaderboardCacheService.getFullLeaderboard(tournamentId);

        int total = full.size();
        int start = page * size;
        int end = Math.min(start + size, total);

        if(start >= total){
            return new PageImpl<>(Collections.emptyList(),
                    PageRequest.of(page,size), total);
        }
        return new PageImpl<>(
                full.subList(start, end),
                PageRequest.of(page, size),
                total);
    }



     /**RECALCULATE TIEBREAKERS
     Called by MatchmakingService after every result submission.
     Recalculates all tiebreaker values for ALL players in the tournament
     since every result changes opponent scores which affects everyone's Buchholz.
      */
    @CacheEvict(value = "leaderboard", key = "#tournamentId.toString()")
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
                .toList();

        for (PlayerTournamentStats stats : allStats) {
            UUID playerId = stats.getPlayer().getId();

            List<Game> playerGames = allGames.stream()
                    .filter(g -> g.getBlackPlayer() != null)
                    .filter(g -> g.getWhitePlayer().getId().equals(playerId)
                            || g.getBlackPlayer().getId().equals(playerId))
                    .toList();

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
                    .toList();

            double buchholz = opponentScores.stream()
                    .mapToDouble(Double::doubleValue).sum();

            // ── Buchholz Cut 1 — remove lowest ───────────────────────────────
            double buchholzCut1 = buchholz;
            if (!opponentScores.isEmpty()) {
                buchholzCut1 = buchholz - opponentScores.getFirst();
            }

            // ── Buchholz Cut 2 — remove two lowest ───────────────────────────
            double buchholzCut2 = buchholz;
            if (opponentScores.size() >= 2) {
                buchholzCut2 = buchholz
                        - opponentScores.get(0)
                        - opponentScores.get(1);
            } else if (opponentScores.size() == 1) {
                buchholzCut2 = buchholz - opponentScores.getFirst();
            }

            // ── Buchholz Median — remove highest AND lowest ───────────────────
            double buchholzMedian = buchholz;
            if (opponentScores.size() >= 2) {
                double lowest  = opponentScores.getFirst();
                double highest = opponentScores.getLast();
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

            log.info("Tie breaks Calculated and saved");
        }
    }
}
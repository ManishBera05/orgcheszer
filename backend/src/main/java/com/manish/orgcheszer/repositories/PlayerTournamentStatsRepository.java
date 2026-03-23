package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.PlayerTournamentStats;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlayerTournamentStatsRepository extends JpaRepository<PlayerTournamentStats, UUID> {
    boolean existsByPlayerIdAndTournamentTournamentId(UUID userId, UUID tournamentId);  // role check
    int countByTournamentTournamentId(UUID tournamentId);
    // Count for public profile
    long countByPlayerId(UUID playerID);
    // Aggregated game stats for public profile
    @Query("SELECT COALESCE(SUM(s.winsWithWhite + s.winsWithBlack), 0) FROM PlayerTournamentStats s WHERE s.player.id = :playerId")
    long sumWinsByPlayerId(@Param("playerId") UUID playerId);

    @Query("SELECT COALESCE(SUM(s.drawsWithWhite + s.drawsWithBlack), 0) FROM PlayerTournamentStats s WHERE s.player.id = :playerId")
    long sumDrawsByPlayerId(@Param("playerId") UUID playerId);

    @Query("SELECT COALESCE(SUM(s.gamesWithWhite + s.gamesWithBlack), 0) FROM PlayerTournamentStats s WHERE s.player.id = :playerId")

    long sumGamesPlayedByPlayerId(@Param("playerId") UUID playerId);
    Page<PlayerTournamentStats> findByPlayerId(UUID playerId, Pageable pageable);
    Optional<PlayerTournamentStats> findByPlayerIdAndTournamentTournamentId(UUID playerId, UUID tournamentId);
    List<PlayerTournamentStats> findByTournamentTournamentIdOrderByCurrentScoreDesc(UUID tournamentId); // leaderboard
}
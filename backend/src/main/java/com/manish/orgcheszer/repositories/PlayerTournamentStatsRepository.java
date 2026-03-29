package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.Users;
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
    Page<PlayerTournamentStats> findByTournamentTournamentId(UUID tournamentId, Pageable pageable);
    Page<PlayerTournamentStats> findByTournamentTournamentIdOrderByPairingId(UUID tournamentTournamentId, Pageable pageable);
    List<PlayerTournamentStats> findByTournamentTournamentIdOrderByCurrentScoreDesc(UUID tournamentId); // leaderboard

    @Query("SELECT s FROM PlayerTournamentStats s " +
            "JOIN TournamentTicket t ON t.player.id = s.player.id " +
            "AND t.tournament.tournamentId = s.tournament.tournamentId " +
            "WHERE s.tournament.tournamentId = :tournamentId " +
            "AND t.status = 'CHECKED_IN' " +
            "ORDER BY s.currentScore DESC")
    List<PlayerTournamentStats> findCheckedInStatsByTournamentId(UUID tournamentId);
}
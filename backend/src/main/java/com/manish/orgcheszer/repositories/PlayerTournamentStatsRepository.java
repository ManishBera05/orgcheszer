package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.PlayerTournamentStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlayerTournamentStatsRepository extends JpaRepository<PlayerTournamentStats, UUID> {
    boolean existsByPlayerIdAndTournamentTournamentId(UUID userId, UUID tournamentId);  // role check
    int countByTournamentTournamentId(UUID tournamentId);
    Optional<PlayerTournamentStats> findByPlayerIdAndTournamentTournamentId(UUID playerId, UUID tournamentId);
    List<PlayerTournamentStats> findByTournamentTournamentIdOrderByCurrentScoreDesc(UUID tournamentId); // leaderboard
}
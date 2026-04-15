package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.ClubPlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClubPlayerStatsRepository extends JpaRepository<ClubPlayerStats, UUID> {
    Optional<ClubPlayerStats> findByClubIdAndPlayerId(UUID clubId, UUID playerId);
    List<ClubPlayerStats> findByClubIdOrderByTotalScoreDesc(UUID clubId);
}
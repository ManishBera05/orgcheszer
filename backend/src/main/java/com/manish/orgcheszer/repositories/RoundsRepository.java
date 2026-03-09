package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Rounds;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoundsRepository extends JpaRepository<Rounds, UUID> {
    List<Rounds> findByTournamentTournamentIdOrderByRoundNumber(UUID tournamentId);
    Optional<Rounds> findByTournamentTournamentIdAndRoundNumber(UUID tournamentId, int roundNumber);
}
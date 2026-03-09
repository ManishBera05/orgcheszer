package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.TournamentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TournamentTicketRepository extends JpaRepository<TournamentTicket, UUID> {
    Optional<TournamentTicket> findByTicketToken(String token);  // QR validation
    boolean existsByPlayerIdAndTournamentTournamentId(UUID playerId, UUID tournamentId); // duplicate ticket check
}
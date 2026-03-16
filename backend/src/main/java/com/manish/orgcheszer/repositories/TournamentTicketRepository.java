package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.TournamentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TournamentTicketRepository extends JpaRepository<TournamentTicket, UUID> {
    Optional<TournamentTicket> findByTicketToken(String token);  // QR validation
    Optional<TournamentTicket> findByPlayerIdAndTournamentTournamentId(UUID playerId, UUID tournamentId);
    boolean existsByPlayerIdAndTournamentTournamentId(UUID playerId, UUID tournamentId); // duplicate ticket check
    @Query("SELECT t.player.id FROM TournamentTicket t " +
            "WHERE t.tournament.tournamentId = :tournamentId " +
            "AND t.status = 'CHECKED_IN'")
    List<UUID> findCheckedInPlayerIds(@Param("tournamentId") UUID tournamentId);
}
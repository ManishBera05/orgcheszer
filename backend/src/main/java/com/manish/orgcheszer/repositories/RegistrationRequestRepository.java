package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.RegistrationRequest;
import com.manish.orgcheszer.enums.RegistrationRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RegistrationRequestRepository
        extends JpaRepository<RegistrationRequest, UUID> {

    // Check if a player already has a pending request for this tournament
    boolean existsByPlayerIdAndTournamentTournamentIdAndStatus(
            UUID playerId, UUID tournamentId, RegistrationRequestStatus status);

    // Check if a player has any request (pending or otherwise) for this tournament
    boolean existsByPlayerIdAndTournamentTournamentId(
            UUID playerId, UUID tournamentId);

    // Count pending requests for cap check (pending + approved players)
    long countByTournamentTournamentIdAndStatus(
            UUID tournamentId, RegistrationRequestStatus status);

    // Get all pending requests for a tournament (organizer view)
    Page<RegistrationRequest> findByTournamentTournamentIdAndStatus(
            UUID tournamentId, RegistrationRequestStatus status, Pageable pageable);

    // Delete all requests for a tournament (on cancel or tournament start)
    void deleteAllByTournamentTournamentId(UUID tournamentId);

    // Delete all pending requests when tournament starts
    void deleteAllByTournamentTournamentIdAndStatus(
            UUID tournamentId, RegistrationRequestStatus status);
}
package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.enums.TournamentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, UUID> {
    Page<Tournament> findByStatusNotAndIsDemoFalse(TournamentStatus status, Pageable pageable);
    Page<Tournament> findByStatusAndIsDemoFalse(TournamentStatus status, Pageable pageable);
    List<Tournament> findByStatus(TournamentStatus status);
    long countByStatusNotAndIsDemoFalse(TournamentStatus status);
    long countByStatusAndIsDemoFalse(TournamentStatus status);
    Page<Tournament> findByOrganizerIdAndIsDemoFalse(UUID organizerId, Pageable pageable);
    long countByOrganizerIdAndIsDemoFalse(UUID organizerId);
}
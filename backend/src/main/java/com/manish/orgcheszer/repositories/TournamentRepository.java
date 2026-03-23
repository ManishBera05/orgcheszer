package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.TournamentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, UUID> {
    long countByIsDemoFalse();
    long countByStatusAndIsDemoFalse(TournamentStatus status);
    List<Tournament> findByOrganizerIdOrderByStartDataTimeDesc(UUID organizerId); // organizer's tournaments
    Page<Tournament> findByOrganizerIdAndIsDemoFalse(UUID organizerId, Pageable pageable);
    long countByOrganizerIdAndIsDemoFalse(UUID organizerId);
}
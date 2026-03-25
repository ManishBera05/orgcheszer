package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.TournamentStaff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TournamentStaffRepository extends JpaRepository<TournamentStaff, UUID> {
    boolean existsByUserIdAndTournamentTournamentId(UUID userId, UUID tournamentId);  // role check
    List<TournamentStaff> findByTournamentTournamentId(UUID tournamentTournamentId);
    Page<TournamentStaff> findByUserId(UUID userId, Pageable pageable);
    long countByUserId(UUID userId);
}
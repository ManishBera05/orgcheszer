package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.StaffKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffKeyRepository extends JpaRepository<StaffKey, UUID> {
    Optional<StaffKey> findByKeyValue(String keyValue);
    List<StaffKey> findByTournamentTournamentId(UUID tournamentId);
}
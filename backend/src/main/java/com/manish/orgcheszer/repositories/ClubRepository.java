package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClubRepository extends JpaRepository<Club, UUID> {
    Optional<Club> findByInviteCode(String inviteCode);
    Optional<Club> findById(UUID id);
    List<Club> findByOrganizerId(UUID organizerId);
}

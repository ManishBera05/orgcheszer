package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.ClubMembership;
import com.manish.orgcheszer.enums.ClubMembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClubMembershipRepository extends JpaRepository<ClubMembership, UUID> {
    Optional<ClubMembership> findByClubIdAndUserId(UUID clubId, UUID userId);
    List<ClubMembership> findByClubIdAndStatus(UUID clubId, ClubMembershipStatus status);
    List<ClubMembership> findByUserId(UUID userId);
    boolean existsByClubIdAndUserIdAndStatus(UUID clubId, UUID userId, ClubMembershipStatus status);
}
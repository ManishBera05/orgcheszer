package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, UUID> {
    List<Tournament> findByOrganizerIdOrderByStartDataTimeDesc(UUID organizerId); // organizer's tournaments
}
package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Game;
import com.manish.orgcheszer.enums.GameResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {
    List<Game> findByRoundId(UUID roundId);            // all games in a round
    long countByResultNot(GameResult result);
    List<Game> findByWhitePlayerIdOrBlackPlayerId(UUID whiteId, UUID blackId); // player's games
}
package com.manish.orgcheszer.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class PlayerTournamentStats {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rank")
    private int finalRank;

    @Column(name = "games_with_white")
    private int gamesWithWhite;
    @Column(name = "games_with_black")
    private int gamesWithBlack;
    @Column(name = "wins_with_white")
    private int winsWithWhite;
    @Column(name = "wins_with_black")
    private int winsWithBlack;
    @Column(name = "draws_with_white")
    private int drawsWithWhite;
    @Column(name = "draws_with_black")
    private int drawsWithBlack;
    @Column(name = "byes_received")
    private int byesReceived;

    @Column(name = "current_score", nullable = false)
    private double currentScore; // require to store instead of calculating for faster generation of leaderboard

    private double sonnebornBerger; // for tiebreakers(more of these will be added later after reading all the documentations)

    /*

   --- more tiebreaker variable

     */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false )
    private Users player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;
}

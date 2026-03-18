package com.manish.orgcheszer.entities;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import jakarta.persistence.OrderColumn;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
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

    private int pairingId; // assigned once at tournament start, reused every round(necessary for JaVaFo)

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
    private double currentScore; // Store instead of calculating for faster leaderboard generation

    // Same as Buchholz but drop the lowest-scoring opponent.
    // First tie-breaker priority for swiss tournametns
    private double buchholzCut1;

    // For each player, sum up the current scores of every opponent they've faced.
    // Second tie-breaker priority for swiss tournaments
    private double buchholz;

    /**
     *  First priority in the Round-robin tournament tie-breaker
     *  for each game: if you won, add your opponent's full score.
     *  If you drew, add half your opponent's score.
     *  If you lost, add nothing.
     */
    private double sonnebornBerger;

    @ElementCollection
    @CollectionTable(
            name = "player_round_opponents",
            joinColumns = @JoinColumn(name = "stats_id")
    )
    @Column(name = "opponent_id")
    @OrderColumn(name = "round_index") // preserves round order
    private List<UUID> opponentIds = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false )
    private Users player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;
}

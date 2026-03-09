package com.manish.orgcheszer.entities;

import com.manish.orgcheszer.enums.GameResult;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "board_number", nullable = false)
    private int boardNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_result", nullable = false)
    private GameResult result = GameResult.PENDING; // default is pending

    @ManyToOne
    @JoinColumn(name = "round_id", nullable = false)
    private Rounds round;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "white_player_id", nullable = false)
    private Users whitePlayer;

    // The Black Player (Can be nullable if you implement "Byes" for odd player counts)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "black_player_id")
    private Users blackPlayer;
}
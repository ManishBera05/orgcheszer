package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClubLeaderboardDTO {
    private int rank;
    private UUID userId;
    private String playerName;
    private Integer eloRating;
    private int tournamentsPlayed;
    private int totalGamesPlayed;
    private int totalWins;
    private int totalLosses;
    private int totalDraws;
    private double totalScore;
}
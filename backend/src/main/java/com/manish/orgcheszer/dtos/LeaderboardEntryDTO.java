package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDTO {
    private int    rank;
    private String playerName;
    private String fideId;
    private int    eloRating;
    private double score;
    private double buchholz;
    private double buchholzCut1;
    private double sonnebornBerger;
    private int    gamesWithBlack;
    private int    numberOfWins;
}
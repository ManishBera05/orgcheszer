package com.manish.orgcheszer.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDTO {

    @Schema(description = "Current standing in the tournament",
            example = "1")
    private int rank;

    private UUID playerID;

    @Schema(example = "Carlsen, Magnus")
    private String playerName;

    @Schema(example = "1503014")
    private String fideId;

    @Schema(example = "2830")
    private int eloRating;

    @Schema(description = "Total points scored (Win = 1, Draw = 0.5, Bye = 1)",
            example = "4.5")
    private double score;

    @Schema(description = "Tiebreaker 1: Sum of all opponents' scores",
            example = "12.5")
    private double buchholz;

    @Schema(description = "Tiebreaker 2: Buchholz minus the lowest scoring opponent",
            example = "11.0")
    private double buchholzCut1;

    @Schema(description = "Tiebreaker 3: Sum of defeated opponents' scores + half of drawn opponents' scores",
            example = "9.25")
    private double sonnebornBerger;

    @Schema(description = "Number of times played with Black pieces (used for color balancing)",
            example = "2")
    private int gamesWithBlack;

    @Schema(example = "4")
    private int numberOfWins;
}
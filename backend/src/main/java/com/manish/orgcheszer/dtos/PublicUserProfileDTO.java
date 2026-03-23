package com.manish.orgcheszer.dtos;

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
public class PublicUserProfileDTO {
    private UUID userId;
    private String firstName;
    private String lastName;
    private int    eloRating;
    private String fideId;

    // Game stats
    private long gamesPlayed;
    private long gamesWon;
    private long gamesLost;
    private long gamesDrawn;

    // Tournament stats
    private long tournamentsPlayed;
    private long tournamentsOrganized;
    private long tournamentsStaffed;
}
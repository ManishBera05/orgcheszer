package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTournamentStatsDTO {
    private UUID tournamentId;
    private String tournamentName;
    private String role;

    // Player stats — null if role is STAFF or ORGANIZER
    private Integer finalRank;
    private Double  currentScore;
    private Double  buchholz;
    private Double  buchholzCut1;
    private Double  sonnenbornBerger;
    private Integer gamesPlayed;
    private Integer wins;
    private Integer losses;
    private Integer draws;
    private Integer byesReceived;
    private List<OpponentDTO> opponents; // per-round opponent details
}
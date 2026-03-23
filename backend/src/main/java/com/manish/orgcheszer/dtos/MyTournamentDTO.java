package com.manish.orgcheszer.dtos;

import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.enums.TournamentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyTournamentDTO {
    private UUID tournamentId;
    private String          tournamentName;
    private TournamentFormat format;
    private TournamentStatus status;
    private LocalDateTime startDateTime;
    private String          location;
    private String          role; // "ORGANIZER", "STAFF", "PLAYER"

    // Only populated when role = PLAYER
    private Double  score;
    private Integer finalRank;
    private Integer gamesPlayed;
    private Integer wins;
    private Integer losses;
    private Integer draws;
}

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
public class UserTournamentSummaryDTO {
    private UUID tournamentId;
    private String tournamentName;
    private String format;
    private String status;
    private String role; // "ORGANIZER", "STAFF", "PLAYER"
}
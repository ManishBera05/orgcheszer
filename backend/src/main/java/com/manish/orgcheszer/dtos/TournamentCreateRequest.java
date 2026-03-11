package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TournamentCreateRequest {
    private String tournamentName;
    private LocalDateTime startDateTime;
    private int numberOfRounds;
    private int maxParticipants;
    private int entryFee;
    private String description;
    private String location;
    private String timeControl; // e.g "90+30" (FIDE standard)
    private String format;
}

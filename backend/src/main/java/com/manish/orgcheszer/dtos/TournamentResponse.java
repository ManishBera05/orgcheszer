package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TournamentResponse {
    private UUID tournamentId;
    private String tournamentName;
    private LocalDateTime startDateTime;
    private int numberOfRounds;
    private int maxParticipants;
    private int entryFee;
    private String description;
    private String location;
    private String timeControl;
    private String format;
    private String organizerName;
    private String organizerPhoneNumber;
    private int currentNumberOfParticipants;
    private String status; // UPCOMING, ONGOING, COMPLETED, CANCELLED
}
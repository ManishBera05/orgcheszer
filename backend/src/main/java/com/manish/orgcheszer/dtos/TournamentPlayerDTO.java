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
public class TournamentPlayerDTO {
    private UUID userId;
    private String firstName;
    private String lastName;
    private int    eloRating;
    private String fideId;
    private String checkInStatus; // "VALID", "CHECKED_IN", "CANCELLED"
}
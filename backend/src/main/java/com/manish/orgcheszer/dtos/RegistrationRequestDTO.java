package com.manish.orgcheszer.dtos;

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
public class RegistrationRequestDTO {
    private UUID          requestId;
    private UUID          playerId;
    private String        playerName;
    private int           playerEloRating;
    private String        playerFideId;
    private LocalDateTime requestedAt;
}
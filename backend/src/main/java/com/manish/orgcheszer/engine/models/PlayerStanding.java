package com.manish.orgcheszer.engine.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStanding {
    private UUID playerId;

    // JA-VA-FO Requirements
    private int pairingId;     // E.g., 1, 2, 3 (Must be 1-based index)
    private String name;       // "Carlsen Magnus"
    private int rating;        // E.g., 2830 (0 if unrated)
    private String title;      // "g", "m", "f", or ""
    private String federation; // "NOR", "IND", or ""

    private double currentScore;
    private int rank;

    @Builder.Default
    private List<PastMatch> matchHistory = new ArrayList<>();
}
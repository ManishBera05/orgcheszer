package com.manish.orgcheszer.engine.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pairing {
    private UUID whitePlayerId;

    // Will be null if isBye is true
    private UUID blackPlayerId;

    private boolean isBye;
}
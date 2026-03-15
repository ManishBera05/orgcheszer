package com.manish.orgcheszer.engine.models;

public record PastMatch(
        int opponentPairingId,
        char color, // 'w', 'b', or '-'
        char result // '1', '=', '0', 'H', 'Z', etc.
) {}
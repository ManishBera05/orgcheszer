package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.RoundPairingsResponse;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.services.MatchmakingService;
import com.manish.orgcheszer.services.RoundPairingsCacheService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@Tag(name = "3. Matchmaking & Gameplay",
        description = "Endpoints for generating pairings and submitting game results")
public class MatchmakingController {

    private final MatchmakingService matchmakingService;
    private final RoundPairingsCacheService roundPairingsCacheService;

    @Operation(summary = "Generate next round",
            description = "Organizer triggers API to generate pairings. Organizer only.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{tournamentId}/rounds/generate")
    public ResponseEntity<RoundPairingsResponse> generateNextRound(
            @PathVariable UUID tournamentId) {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Submit game result",
            description = "Staff or Organizer submits a match result.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{tournamentId}/games/{gameId}/result")
    public ResponseEntity<String> submitResult(
            @PathVariable UUID tournamentId,
            @PathVariable UUID gameId,
            @RequestParam GameResult result) {
        matchmakingService.submitResult(tournamentId, gameId, result);
        return ResponseEntity.ok("Result submitted successfully");
    }

    @Operation(summary = "Get round pairings",
            description = "Public endpoint to view pairings for a specific round.")
    @GetMapping("/{tournamentId}/rounds/{roundNumber}/pairings")
    public ResponseEntity<RoundPairingsResponse> getRoundPairings(
            @PathVariable UUID tournamentId,
            @PathVariable int roundNumber) {
        return ResponseEntity.ok(
                roundPairingsCacheService.getRoundPairings(tournamentId, roundNumber));
    }
}
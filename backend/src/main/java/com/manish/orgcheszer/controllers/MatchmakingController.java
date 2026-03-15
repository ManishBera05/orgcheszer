package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.RoundPairingsResponse;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.services.MatchmakingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class MatchmakingController {

    private final MatchmakingService matchmakingService;

    // Organizer calls this to generate pairings for the next round
    @PostMapping("/{tournamentId}/rounds/generate")
    public ResponseEntity<RoundPairingsResponse> generateNextRound(
            @PathVariable UUID tournamentId) {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        return ResponseEntity.ok(response);
    }

    // Organizer or staff calls this to submit a game result
    @PatchMapping("/{tournamentId}/games/{gameId}/result")
    public ResponseEntity<String> submitResult(
            @PathVariable UUID tournamentId,
            @PathVariable UUID gameId,
            @RequestParam GameResult result) {
        matchmakingService.submitResult(tournamentId, gameId, result);
        return ResponseEntity.ok("Result submitted successfully");
    }

    // View pairings for a specific round
    @GetMapping("/{tournamentId}/rounds/{roundNumber}/pairings")
    public ResponseEntity<RoundPairingsResponse> getRoundPairings(
            @PathVariable UUID tournamentId,
            @PathVariable int roundNumber) {
        return ResponseEntity.ok(
                matchmakingService.getRoundPairings(tournamentId, roundNumber));
    }
}
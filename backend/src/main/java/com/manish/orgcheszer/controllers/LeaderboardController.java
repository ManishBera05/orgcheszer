package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
import com.manish.orgcheszer.services.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    // Public — anyone can view the leaderboard
    @GetMapping("/{tournamentId}/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(tournamentId));
    }
}
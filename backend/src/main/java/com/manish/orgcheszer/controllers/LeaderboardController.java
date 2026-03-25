package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
import com.manish.orgcheszer.services.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@Tag(name = "6. Leaderboard", description = "Endpoint to view tournament standings")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Operation(summary = "Get live leaderboard",
            description = "Public endpoint returning players sorted by FIDE Tiebreakers.")
    @GetMapping("/{tournamentId}/leaderboard")
    public ResponseEntity<Page<LeaderboardEntryDTO>> getLeaderboard(
            @PathVariable UUID tournamentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                leaderboardService.getLeaderboard(tournamentId, page, size));
    }
}
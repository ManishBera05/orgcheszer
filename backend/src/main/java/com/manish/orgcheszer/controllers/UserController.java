package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.UserTournamentStatsDTO;
import com.manish.orgcheszer.dtos.UserTournamentSummaryDTO;
import com.manish.orgcheszer.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "7. User Profiles", description = "Public endpoints to view user tournament history")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get user's tournament history",
            description = "Public endpoint to view all tournaments a user has organized, " +
                    "staffed, or played in. No token required.")
    @GetMapping("/{userId}")
    public ResponseEntity<List<UserTournamentSummaryDTO>> getUserTournaments(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserTournaments(userId));
    }

    @Operation(summary = "Get user's specific tournament details",
            description = "Public endpoint to view a user's role and stats in a specific tournament. No token required.")
    @GetMapping("/{userId}/tournament/{tournamentId}")
    public ResponseEntity<UserTournamentStatsDTO> getUserTournamentStats(
            @PathVariable UUID userId,
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(userService.getUserTournamentStats(userId, tournamentId));
    }
}
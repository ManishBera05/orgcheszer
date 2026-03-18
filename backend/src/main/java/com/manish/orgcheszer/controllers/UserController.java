package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.UserTournamentStatsDTO;
import com.manish.orgcheszer.dtos.UserTournamentSummaryDTO;
import com.manish.orgcheszer.services.UserService;
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
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<UserTournamentSummaryDTO>> getUserTournaments(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserTournaments(userId));
    }

    @GetMapping("/{userId}/tournament/{tournamentId}")
    public ResponseEntity<UserTournamentStatsDTO> getUserTournamentStats(
            @PathVariable UUID userId,
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(userService.getUserTournamentStats(userId, tournamentId));
    }
}
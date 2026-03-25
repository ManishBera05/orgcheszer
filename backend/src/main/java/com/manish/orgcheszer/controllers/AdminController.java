package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.services.TournamentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "8. Admin Controller",
        description = "Endpoints for Admin to validate tournaments")
public class AdminController {

    @Value("${admin.secret.key}")
    private String adminSecret;

    private final TournamentService tournamentService;

    public AdminController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @Operation(summary = "Approve tournaments",
            description = "Admin approves the requests for a tournament creation.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/tournaments/{tournamentId}/approve")
    public ResponseEntity<String> approveTournament(
            @PathVariable UUID tournamentId,
            @RequestHeader("X-Admin-Key") String adminKey) {

        if (!adminKey.equals(adminSecret)) {
            throw new AccessDeniedException("Invalid admin key");
        }

        tournamentService.approveDraftTournament(tournamentId);
        return ResponseEntity.ok("Tournament approved successfully");
    }

    // View all draft tournaments (so you know what's pending)
    @Operation(summary = "Get draft tournaments",
            description = "Get all the requests for a tournament creation.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/tournaments/drafts")
    public ResponseEntity<List<TournamentResponse>> getDraftTournaments(
            @RequestHeader("X-Admin-Key") String adminKey) {

        if (!adminKey.equals(adminSecret)) {
            throw new AccessDeniedException("Invalid admin key");
        }

        return ResponseEntity.ok(tournamentService.getDraftTournaments());
    }
}
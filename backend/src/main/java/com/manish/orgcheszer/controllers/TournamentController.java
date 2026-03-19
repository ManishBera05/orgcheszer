package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentPlayerDTO;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.services.TournamentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@Tag(name = "2. Tournament Management",
        description = "Endpoints for creating, viewing, and managing tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    @Operation(summary = "Get all public tournaments",
            description = "Public endpoint to view all tournaments.")
    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAllTournaments() {
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @Operation(summary = "Get specific tournament",
            description = "Public endpoint to view tournament details.")
    @GetMapping("/{tournamentId}")
    public ResponseEntity<TournamentResponse> getTournament(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(tournamentService.getTournament(tournamentId));
    }

    @Operation(summary = "Create a new tournament",
            description = "Any logged-in user can create a tournament." +" They automatically become the Organizer.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<TournamentResponse> createTournament(
            @RequestBody TournamentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tournamentService.createTournament(request));
    }

    @Operation(summary = "Update tournament details",
            description = "Only the specific Organizer of this tournament can update it.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{tournamentId}")
    public ResponseEntity<TournamentResponse> updateTournament(
            @PathVariable UUID tournamentId,
            @RequestBody TournamentCreateRequest request) {
        return ResponseEntity.ok(tournamentService.updateTournament(tournamentId, request));
    }

    @Operation(summary = "Cancel a tournament",
            description = "Only the specific Organizer can cancel it.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{tournamentId}/cancel")
    public ResponseEntity<Void> cancelTournament(
            @PathVariable UUID tournamentId) {
        tournamentService.cancelTournament(tournamentId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get my organized tournaments",
            description = "Fetches tournaments where the currently logged-in user is the Organizer.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/my-tournaments")
    public ResponseEntity<List<TournamentResponse>> getMyTournaments() {
        return ResponseEntity.ok(tournamentService.getMyTournaments());
    }

    @Operation(summary = "Get registered players",
            description = "Public endpoint to see who is playing in a tournament.")
    @GetMapping("/{tournamentId}/players")
    public ResponseEntity<List<TournamentPlayerDTO>> getTournamentPlayers(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(tournamentService.getTournamentPlayers(tournamentId));
    }

    @Operation(summary = "Register for tournament",
            description = "Registers the currently logged-in user as a player in the tournament.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{tournamentId}/register")
    public ResponseEntity<Void> registerPlayer(
            @PathVariable UUID tournamentId) {
        tournamentService.registerPlayer(tournamentId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
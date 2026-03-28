package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.RegistrationRequestDTO;
import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentPlayerDTO;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.services.TournamentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<Page<TournamentResponse>> getAllTournaments(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(
                tournamentService.getAllTournaments(status, page, size));
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

    // View pending requests (organizer only)
    @Operation(summary = "Shows the users requesting to join the tournament",
            description = "Fetches all the registered participants verify them for the payment",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{tournamentId}/requests")
    public ResponseEntity<Page<RegistrationRequestDTO>> getPendingRequests(
            @PathVariable UUID tournamentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                tournamentService.getPendingRequests(tournamentId, page, size));
    }

    @Operation(summary = "Verify payment and grant the user to enter the tournament",
            description = "Grant access to the tournament to the registered player to enter in the tournament",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{tournamentId}/requests/{requestId}/approve")
    public ResponseEntity<Void> approveRequest(
            @PathVariable UUID tournamentId,
            @PathVariable UUID requestId) {
        tournamentService.approveRequest(tournamentId, requestId);
        return ResponseEntity.ok().build();
    }

    // Reject a request (organizer only)
    @Operation(summary = "Reject the user from entering the tournament",
            description = "Reject the request to enter a tournament to a user who requested for it.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{tournamentId}/requests/{requestId}/reject")
    public ResponseEntity<Void> rejectRequest(
            @PathVariable UUID tournamentId,
            @PathVariable UUID requestId) {
        tournamentService.rejectRequest(tournamentId, requestId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get registered players",
            description = "Public endpoint to see who is playing in a tournament.")
    @GetMapping("/{tournamentId}/players")
    public ResponseEntity<Page<TournamentPlayerDTO>> getTournamentPlayers(
            @PathVariable UUID tournamentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                tournamentService.getTournamentPlayers(tournamentId, page, size));
    }

    @Operation(summary = "End tournament",
            description = "Ends the tournament in the current round(all games must end)",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{tournamentId}/end-tournament")
    public ResponseEntity<String> endTournament(
            @PathVariable UUID tournamentId) {
        tournamentService.endTournament(tournamentId);
        return ResponseEntity.ok(
                "Tournament ended early and marked as completed");
    }

    @Operation(summary = "Register for tournament",
            description = "Registers the currently logged-in user as a player in the tournament.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{tournamentId}/register")
    public ResponseEntity<RegistrationRequestDTO> registerPlayer(
            @PathVariable UUID tournamentId) {
        RegistrationRequestDTO registrationRequestDTO = tournamentService.registerPlayer(tournamentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationRequestDTO);
    }
}
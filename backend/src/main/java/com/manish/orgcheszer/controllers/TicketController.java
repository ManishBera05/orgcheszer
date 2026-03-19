package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.services.TournamentService;
import com.manish.orgcheszer.services.TournamentTicketService;
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
@Tag(name = "5. Tickets & Check-in",
        description = "Endpoints for QR tickets and player check-ins")
public class TicketController {

    private final TournamentTicketService ticketService;
    private final TournamentService       tournamentService;

    @Operation(summary = "Check in player",
            description = "Staff/Organizer scans a token to mark a player as physically present.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{tournamentId}/tickets/checkin")
    public ResponseEntity<String> checkIn(
            @PathVariable UUID tournamentId,
            @RequestParam String token) {
        ticketService.checkIn(token, tournamentId);
        return ResponseEntity.ok("Player checked in successfully");
    }

    @Operation(summary = "Get my ticket token",
            description = "Registered player fetches their token to generate a QR code.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{tournamentId}/my-ticket")
    public ResponseEntity<String> getMyTicket(
            @PathVariable UUID tournamentId) {
        String token = tournamentService.getMyTicketToken(tournamentId);
        return ResponseEntity.ok(token);
    }
}
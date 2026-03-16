package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.services.TournamentService;
import com.manish.orgcheszer.services.TournamentTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class TicketController {

    private final TournamentTicketService ticketService;
    private final TournamentService       tournamentService;

    // Staff or organizer scans QR or manually enters token
    @PostMapping("/{tournamentId}/tickets/checkin")
    public ResponseEntity<String> checkIn(
            @PathVariable UUID tournamentId,
            @RequestParam String token) {
        ticketService.checkIn(token, tournamentId);
        return ResponseEntity.ok("Player checked in successfully");
    }

    // Get player's own ticket token (player uses this to show their QR)
    @GetMapping("/{tournamentId}/my-ticket")
    public ResponseEntity<String> getMyTicket(
            @PathVariable UUID tournamentId) {
        String token = tournamentService.getMyTicketToken(tournamentId);
        return ResponseEntity.ok(token);
    }
}
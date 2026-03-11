package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.services.TournamentService;
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
public class TournamentController {

    private final TournamentService tournamentService;

    // Public Endpoints (no token needed)
    // View tournaments
    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAllTournaments() {
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @GetMapping("/{tournamentId}")
    public ResponseEntity<TournamentResponse> getTournament(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(tournamentService.getTournament(tournamentId));
    }

    // Organizer Endpoints (token required)

    @PostMapping
    public ResponseEntity<TournamentResponse> createTournament(
            @RequestBody TournamentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tournamentService.createTournament(request));
    }

    @PutMapping("/{tournamentId}")
    public ResponseEntity<TournamentResponse> updateTournament(
            @PathVariable UUID tournamentId,
            @RequestBody TournamentCreateRequest request) {
        return ResponseEntity.ok(tournamentService.updateTournament(tournamentId, request));
    }

    @PatchMapping("/{tournamentId}/cancel")
    public ResponseEntity<Void> cancelTournament(
            @PathVariable UUID tournamentId) {
        tournamentService.cancelTournament(tournamentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-tournaments")
    public ResponseEntity<List<TournamentResponse>> getMyTournaments() {
        return ResponseEntity.ok(tournamentService.getMyTournaments());
    }

    // Player Endpoints (token required)

    @PostMapping("/{tournamentId}/register")
    public ResponseEntity<Void> registerPlayer(
            @PathVariable UUID tournamentId) {
        tournamentService.registerPlayer(tournamentId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
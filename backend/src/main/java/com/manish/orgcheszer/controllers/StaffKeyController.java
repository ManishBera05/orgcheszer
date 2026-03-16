package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.StaffKeyResponse;
import com.manish.orgcheszer.services.StaffKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class StaffKeyController {

    private final StaffKeyService staffKeyService;

    // Generate keys (organizer only)
    @PostMapping("/{tournamentId}/staff-keys/generate")
    public ResponseEntity<List<String>> generateKeys(
            @PathVariable UUID tournamentId,
            @RequestParam int numberOfKeys) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffKeyService.generateKeys(tournamentId, numberOfKeys));
    }

    // Redeem a key (staff member i.e. any other user on the platform except the organizer himself or the player of the tournament)
    @PostMapping("/staff-keys/redeem")
    public ResponseEntity<Void> redeemKey(@RequestParam String keyValue) {
        staffKeyService.redeemKey(keyValue);
        return ResponseEntity.ok().build();
    }

    // View all keys (organizer only)
    @GetMapping("/{tournamentId}/staff-keys")
    public ResponseEntity<List<StaffKeyResponse>> getKeys(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(staffKeyService.getKeysForTournament(tournamentId));
    }
}

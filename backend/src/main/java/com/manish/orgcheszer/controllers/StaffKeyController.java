package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.StaffForTournamentResponse;
import com.manish.orgcheszer.dtos.StaffKeyResponse;
import com.manish.orgcheszer.services.StaffKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "4. Staff Keys",
        description = "Endpoints for generating and redeeming staff keys")
public class StaffKeyController {

    private final StaffKeyService staffKeyService;

    @Operation(summary = "Generate staff keys",
            description = "Generates N keys. Organizer only.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{tournamentId}/staff-keys/generate")
    public ResponseEntity<List<String>> generateKeys(
            @PathVariable UUID tournamentId,
            @RequestParam int numberOfKeys) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffKeyService.generateKeys(tournamentId, numberOfKeys));
    }

    @Operation(summary = "Redeem staff key",
            description = "Logged-in user redeems a key to become staff for a tournament.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/staff-keys/redeem")
    public ResponseEntity<Void> redeemKey(@RequestParam String keyValue) {
        staffKeyService.redeemKey(keyValue);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "View staff keys",
            description = "View all keys generated for a tournament. Organizer only.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{tournamentId}/staff-keys")
    public ResponseEntity<List<StaffKeyResponse>> getKeys(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(staffKeyService.getKeysForTournament(tournamentId));
    }

    @Operation(summary = "View tournament staffs",
            description = "View all users who redeemed the staff keys of a tournament. Organizer only.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{tournamentId}/staffs")
    public ResponseEntity<List<StaffForTournamentResponse>> getStaffs(
            @PathVariable UUID tournamentId) {
        return ResponseEntity.ok(staffKeyService.getStaffsForTournament(tournamentId));
    }

}

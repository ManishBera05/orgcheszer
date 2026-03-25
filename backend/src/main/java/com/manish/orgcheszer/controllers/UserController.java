package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.MyTournamentDTO;
import com.manish.orgcheszer.dtos.PublicUserProfileDTO;
import com.manish.orgcheszer.dtos.UserTournamentStatsDTO;
import com.manish.orgcheszer.dtos.UserTournamentSummaryDTO;
import com.manish.orgcheszer.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "7. User Profiles",
        description = "Public endpoints to view user tournament history")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get user's public profile",
            description = "Public endpoint to view users overall status and how many games he won tournaments organized, participated etc.")
    @GetMapping("/{userId}")
    public ResponseEntity<PublicUserProfileDTO> getPublicProfile(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    @Operation(summary = "Gets user's detailed profile",
            description = "Private endpoint that shows which tournament participated along with the roles and opponents played against.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public ResponseEntity<Page<MyTournamentDTO>> getMyTournaments(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(userService.getMyTournaments(role, page, size));
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
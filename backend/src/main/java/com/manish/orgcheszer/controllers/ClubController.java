package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.ClubCreateRequest;
import com.manish.orgcheszer.dtos.ClubLeaderboardDTO;
import com.manish.orgcheszer.dtos.ClubMemberDTO;
import com.manish.orgcheszer.dtos.ClubResponseDTO;
import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.services.ClubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
@Tag(name = "10. Club Management",
        description = "Endpoints to create, join clubs")
public class ClubController {

    private final ClubService clubService;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE CLUB
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Create a club",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<ClubResponseDTO> createClub(@RequestBody ClubCreateRequest request) {
        ClubResponseDTO newClub = clubService.createClub(request.getName(), request.getDescription());
        return new ResponseEntity<>(newClub, HttpStatus.CREATED);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET MY CLUBS (Put this before /{clubId} to avoid route collision)
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Get my club",
            description = "Get all the clubs which i created or is a players of",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/my-clubs")
    public ResponseEntity<List<ClubResponseDTO>> getMyClubs() {
        return ResponseEntity.ok(clubService.getMyClubs());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET CLUB BY ID
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Get a particular club",
            description = "Public endpoint to get the details of a particular club with the club id..")
    @GetMapping("/{clubId}")
    public ResponseEntity<ClubResponseDTO> getClub(@PathVariable UUID clubId) {
        return ResponseEntity.ok(clubService.getClub(clubId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REQUEST TO JOIN VIA INVITE CODE
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Join a club",
            description = "Join a club by typing the invite code.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<Map<String, String>> requestToJoin(@PathVariable String inviteCode) {
        clubService.requestToJoin(inviteCode);
        return ResponseEntity.ok(Map.of("message", "Join request sent successfully"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PENDING MEMBERSHIP REQUESTS (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Get request to join club",
            description = "Organizer gets all the pending request for the club joining request",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{clubId}/requests")
    public ResponseEntity<List<ClubMemberDTO>> getPendingRequests(@PathVariable UUID clubId) {
        return ResponseEntity.ok(clubService.getPendingRequests(clubId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPROVE MEMBERSHIP (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Approve a join",
            description = "Organizer approves a player to join the club",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{clubId}/requests/{userId}/approve")
    public ResponseEntity<Map<String, String>> approveMembership(
            @PathVariable UUID clubId,
            @PathVariable UUID userId) {

        clubService.approveMembership(clubId, userId);
        return ResponseEntity.ok(Map.of("message", "Membership approved successfully"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REJECT / REMOVE MEMBER (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Remove player from club",
            description = "Organizer removes or reject a player request from the club.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{clubId}/members/{userId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable UUID clubId,
            @PathVariable UUID userId) {

        clubService.removeMember(clubId, userId);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }



    // ─────────────────────────────────────────────────────────────────────────
// START A CLUB TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Start a club tournament",
            description = "Organizer starts a club tournament with the selected players from the club.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{clubId}/tournament")
    public ResponseEntity<Map<String, String>> createTournament(
            @PathVariable UUID clubId,
            @RequestBody TournamentCreateRequest tournamentCreateRequest) {

        clubService.createTournament(clubId, tournamentCreateRequest, tournamentCreateRequest.getPlayerId());
        return ResponseEntity.ok(Map.of("message", "Tournament created successfully"));
    }

    @Operation(summary = "Show all club tournament")
    @GetMapping("/{clubId}/tournaments")
    public ResponseEntity<List<TournamentResponse>> createTournament(
            @PathVariable UUID clubId) {

//        clubService.createTournament(clubId, tournamentCreateRequest, playerIds);

        return ResponseEntity.ok(clubService.getAllClubTournaments(clubId));
    }

    @Operation(summary = "End Club tournament",
            description = "Ends the club tournament in the current round(all games must end)",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{tournamentId}/end-tournament")
    public ResponseEntity<String> endTournament(
            @PathVariable UUID tournamentId) {
        clubService.endClubTournament(tournamentId);
        return ResponseEntity.ok(
                "Club tournament ended and marked as completed");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ACTIVE MEMBERS
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Get club members",
            description = "Public endpoint to view the members of a particular club")
    @GetMapping("/{clubId}/members")
    public ResponseEntity<List<ClubMemberDTO>> getActiveMembers(@PathVariable UUID clubId) {
        return ResponseEntity.ok(clubService.getActiveMembers(clubId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLUB LEADERBOARD
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Get club leaderboard",
            description = "Public endpoint to view the leaderboard of a particular club")
    @GetMapping("/{clubId}/leaderboard")
    public ResponseEntity<List<ClubLeaderboardDTO>> getClubLeaderboard(@PathVariable UUID clubId) {
        return ResponseEntity.ok(clubService.getClubLeaderboard(clubId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGENERATE INVITE CODE (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Operation(summary = "Generate invite code",
            description = "Organizer triggers endpoint to generate the invite code for the club.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{clubId}/invite-code")
    public ResponseEntity<Map<String, String>> regenerateInviteCode(@PathVariable UUID clubId) {
        String newCode = clubService.regenerateInviteCode(clubId);
        return ResponseEntity.ok(Map.of(
                "message", "Invite code regenerated successfully",
                "inviteCode", newCode
        ));
    }
}
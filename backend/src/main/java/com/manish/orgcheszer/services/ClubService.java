package com.manish.orgcheszer.services;
import com.manish.orgcheszer.dtos.ClubLeaderboardDTO;
import com.manish.orgcheszer.dtos.ClubMemberDTO;
import com.manish.orgcheszer.dtos.ClubResponseDTO;
import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.entities.Club;
import com.manish.orgcheszer.entities.ClubMembership;
import com.manish.orgcheszer.entities.ClubPlayerStats;
import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.Rounds;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.ClubMembershipStatus;
import com.manish.orgcheszer.enums.TicketStatus;
import com.manish.orgcheszer.exceptions.ConflictException;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.repositories.ClubMembershipRepository;
import com.manish.orgcheszer.repositories.ClubPlayerStatsRepository;
import com.manish.orgcheszer.repositories.ClubRepository;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RoundsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentTicketRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final ClubMembershipRepository membershipRepository;
    private final ClubPlayerStatsRepository clubStatsRepository;
    private final UsersRepository usersRepository;
    private final TournamentRepository tournamentRepository;
    private final PlayerTournamentStatsRepository playerTournamentStatsRepository;
    private final TournamentService tournamentService;
    private final RoundsRepository roundsRepository;
    private final TournamentTicketRepository ticketRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE CLUB
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ClubResponseDTO createClub(String name, String description) {
        Users organizer = getCurrentUser();

        Club club = new Club();
        club.setName(name);
        club.setDescription(description);
        club.setOrganizer(organizer);
        club.setInviteCode(generateInviteCode());
        club.setCreatedAt(LocalDateTime.now());
        clubRepository.save(club);

        // Organizer is automatically an ACTIVE member
        ClubMembership membership = new ClubMembership();
        membership.setClub(club);
        membership.setUser(organizer);
        membership.setStatus(ClubMembershipStatus.ACTIVE);
        membership.setRequestedAt(LocalDateTime.now());
        membership.setApprovedAt(LocalDateTime.now());
        membershipRepository.save(membership);

        // Create initial stats for organizer
        createInitialStats(club, organizer);

        return mapToClubResponse(club);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET CLUB BY ID
    // ─────────────────────────────────────────────────────────────────────────
    public ClubResponseDTO getClub(UUID clubId) {
        Club club = findClub(clubId);
        assertActiveMember(club);
        return mapToClubResponse(club);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET MY CLUBS
    // ─────────────────────────────────────────────────────────────────────────
    public List<ClubResponseDTO> getMyClubs() {
        Users currentUser = getCurrentUser();
        return membershipRepository.findByUserId(currentUser.getId())
                .stream()
                .filter(m -> m.getStatus() == ClubMembershipStatus.ACTIVE)
                .map(m -> mapToClubResponse(m.getClub()))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REQUEST TO JOIN VIA INVITE CODE
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void requestToJoin(String inviteCode) {
        Users currentUser = getCurrentUser();
        Club club = clubRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));

        // Already a member or pending
        if (membershipRepository.existsByClubIdAndUserIdAndStatus(
                club.getId(), currentUser.getId(), ClubMembershipStatus.ACTIVE)) {
            throw new RuntimeException("You are already a member of this club");
        }
        if (membershipRepository.existsByClubIdAndUserIdAndStatus(
                club.getId(), currentUser.getId(), ClubMembershipStatus.PENDING)) {
            throw new RuntimeException("You already have a pending request for this club");
        }

        ClubMembership membership = new ClubMembership();
        membership.setClub(club);
        membership.setUser(currentUser);
        membership.setStatus(ClubMembershipStatus.PENDING);
        membership.setRequestedAt(LocalDateTime.now());
        membershipRepository.save(membership);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PENDING MEMBERSHIP REQUESTS (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    public List<ClubMemberDTO> getPendingRequests(UUID clubId) {
        Club club = findClub(clubId);
        assertOrganizer(club);

        return membershipRepository
                .findByClubIdAndStatus(clubId, ClubMembershipStatus.PENDING)
                .stream()
                .map(m -> ClubMemberDTO.builder()
                        .userId(m.getUser().getId())
                        .firstName(m.getUser().getFirstName())
                        .lastName(m.getUser().getLastName())
                        .eloRating(m.getUser().getEloRating())
                        .fideId(m.getUser().getFideId())
                        .status(m.getStatus().name())
                        .joinedAt(m.getApprovedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPROVE MEMBERSHIP (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void approveMembership(UUID clubId, UUID userId) {
        Club club = findClub(clubId);
        assertOrganizer(club);

        ClubMembership membership = membershipRepository
                .findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new RuntimeException("Membership request not found"));

        if (membership.getStatus() != ClubMembershipStatus.PENDING) {
            throw new RuntimeException("This request is not pending");
        }

        membership.setStatus(ClubMembershipStatus.ACTIVE);
        membership.setApprovedAt(LocalDateTime.now());
        membershipRepository.save(membership);

        // Create initial club stats for new member
        createInitialStats(club, membership.getUser());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REJECT / REMOVE MEMBER (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void removeMember(UUID clubId, UUID userId) {
        Club club = findClub(clubId);
        assertOrganizer(club);

        if (club.getOrganizer().getId().equals(userId)) {
            throw new RuntimeException("Cannot remove the organizer from the club");
        }

        ClubMembership membership = membershipRepository
                .findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        membershipRepository.delete(membership);
    }

//     ─────────────────────────────────────────────────────────────────────────
//     GET ACTIVE MEMBERS (visible to club members only)
//     ─────────────────────────────────────────────────────────────────────────
    public List<ClubMemberDTO> getActiveMembers(UUID clubId) {
        Club club = findClub(clubId);
        assertActiveMember(club);

        return membershipRepository
                .findByClubIdAndStatus(clubId, ClubMembershipStatus.ACTIVE)
                .stream()
                .map(m -> ClubMemberDTO.builder()
                        .userId(m.getUser().getId())
                        .firstName(m.getUser().getFirstName())
                        .lastName(m.getUser().getLastName())
                        .eloRating(m.getUser().getEloRating())
                        .fideId(m.getUser().getFideId())
                        .status(m.getStatus().name())
                        .joinedAt(m.getApprovedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLUB LEADERBOARD — cumulative stats across all club tournaments
    // ─────────────────────────────────────────────────────────────────────────
    public List<ClubLeaderboardDTO> getClubLeaderboard(UUID clubId) {
        Club club = findClub(clubId);
        assertActiveMember(club);

        List<ClubPlayerStats> stats = clubStatsRepository
                .findByClubIdOrderByTotalScoreDesc(clubId);

        List<ClubLeaderboardDTO> leaderboard = new ArrayList<>();
        for (int i = 0; i < stats.size(); i++) {
            ClubPlayerStats s = stats.get(i);
            leaderboard.add(ClubLeaderboardDTO.builder()
                    .rank(i + 1)
                    .userId(s.getPlayer().getId())
                    .playerName(s.getPlayer().getFirstName()
                            + " " + s.getPlayer().getLastName())
                    .eloRating(s.getPlayer().getEloRating())
                    .tournamentsPlayed(s.getTournamentsPlayed())
                    .totalGamesPlayed(s.getTotalGamesPlayed())
                    .totalWins(s.getTotalWins())
                    .totalLosses(s.getTotalLosses())
                    .totalDraws(s.getTotalDraws())
                    .totalScore(s.getTotalScore())
                    .build());
        }
        return leaderboard;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE CLUB STATS after a club tournament completes
    // Called by TournamentService.endTournamentEarly() when isClubTournament
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void updateClubStatsAfterTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (!tournament.isClubTournament() || tournament.getClub() == null) return;

        Club club = tournament.getClub();

        List<PlayerTournamentStats> tournamentStats = playerTournamentStatsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        for (PlayerTournamentStats ts : tournamentStats) {
            ClubPlayerStats clubStats = clubStatsRepository
                    .findByClubIdAndPlayerId(club.getId(), ts.getPlayer().getId())
                    .orElseGet(() -> createInitialStats(club, ts.getPlayer()));

            int wins   = ts.getWinsWithWhite()  + ts.getWinsWithBlack();
            int draws  = ts.getDrawsWithWhite() + ts.getDrawsWithBlack();
            int games  = ts.getGamesWithWhite() + ts.getGamesWithBlack();
            int losses = Math.max(0, games - wins - draws);

            clubStats.setTournamentsPlayed(clubStats.getTournamentsPlayed() + 1);
            clubStats.setTotalGamesPlayed(clubStats.getTotalGamesPlayed() + games);
            clubStats.setTotalWins(clubStats.getTotalWins() + wins);
            clubStats.setTotalLosses(clubStats.getTotalLosses() + losses);
            clubStats.setTotalDraws(clubStats.getTotalDraws() + draws);
            clubStats.setTotalScore(clubStats.getTotalScore() + ts.getCurrentScore());
            clubStatsRepository.save(clubStats);
        }

        // Recalculate club ranks
        List<ClubPlayerStats> allStats = clubStatsRepository
                .findByClubIdOrderByTotalScoreDesc(club.getId());
        for (int i = 0; i < allStats.size(); i++) {
            allStats.get(i).setClubRank(i + 1);
            clubStatsRepository.save(allStats.get(i));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGENERATE INVITE CODE (organizer only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public String regenerateInviteCode(UUID clubId) {
        Club club = findClub(clubId);
        assertOrganizer(club);
        club.setInviteCode(generateInviteCode());
        clubRepository.save(club);
        return club.getInviteCode();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private ClubPlayerStats createInitialStats(Club club, Users player) {
        // Avoid duplicate stats
        return clubStatsRepository
                .findByClubIdAndPlayerId(club.getId(), player.getId())
                .orElseGet(() -> {
                    ClubPlayerStats stats = new ClubPlayerStats();
                    stats.setClub(club);
                    stats.setPlayer(player);
                    stats.setTournamentsPlayed(0);
                    stats.setTotalGamesPlayed(0);
                    stats.setTotalWins(0);
                    stats.setTotalLosses(0);
                    stats.setTotalDraws(0);
                    stats.setTotalScore(0);
                    stats.setClubRank(0);
                    return clubStatsRepository.save(stats);
                });
    }

    private String generateInviteCode() {
        // 8-character alphanumeric code e.g. "A3X9KP2Q"
        return UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();
    }

    private Club findClub(UUID clubId) {
        return clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));
    }

    private void assertOrganizer(Club club) {
        Users currentUser = getCurrentUser();
        if (!club.getOrganizer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the club organizer can perform this action");
        }
    }

    private void assertActiveMember(Club club) {
        Users currentUser = getCurrentUser();
        boolean isMember = membershipRepository.existsByClubIdAndUserIdAndStatus(
                club.getId(), currentUser.getId(), ClubMembershipStatus.ACTIVE);
        if (!isMember) {
            throw new AccessDeniedException("Only club members can access this");
        }
    }

    private ClubResponseDTO mapToClubResponse(Club club) {
        long activeMembers = membershipRepository
                .findByClubIdAndStatus(club.getId(), ClubMembershipStatus.ACTIVE)
                .size();
        long pendingRequests = membershipRepository
                .findByClubIdAndStatus(club.getId(), ClubMembershipStatus.PENDING)
                .size();

        return ClubResponseDTO.builder()
                .clubId(club.getId())
                .organizerId(club.getOrganizer().getId())
                .name(club.getName())
                .description(club.getDescription())
                .organizerName(club.getOrganizer().getFirstName()
                        + " " + club.getOrganizer().getLastName())
                .inviteCode(club.getInviteCode())
                .activeMembers(activeMembers)
                .pendingRequests(pendingRequests)
                .createdAt(club.getCreatedAt())
                .build();
    }

    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void createTournament(UUID clubId,TournamentCreateRequest tournamentCreateRequest, List<UUID> playerIds) {
        // create a club tournament

        TournamentResponse response = tournamentService.createTournament(tournamentCreateRequest);
        log.info("Club Tournament is created");
        // add the players
        for(UUID playerId : playerIds){
            Users player = usersRepository.findById(playerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Tournament tournament = tournamentRepository.findById(response.getTournamentId())
                            .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

            Club club = clubRepository.findById(clubId)
                    .orElseThrow(() -> new ResourceNotFoundException("Club not found"));


            clubStatsRepository.findByClubIdAndPlayerId(clubId, playerId)
                            .orElseThrow(() -> new ConflictException("Player cannot join tournament because it doesn't belong to this club"));

            log.info("Everything fine , lets add the player to this club tournament");
            tournamentService.addClubPlayerToTournamentFrom(player, tournament ,club);
        }
    }

    @Transactional
    public void endClubTournament(UUID tournamentId){
        tournamentService.endTournament(tournamentId);
        updateClubStatsAfterTournament(tournamentId);
    }

    public List<TournamentResponse> getAllClubTournaments(UUID clubId) {
        List<Tournament> response = tournamentRepository.findByClub_Id(clubId);

        return response.stream()
                .map(this::mapToResponse)
                .toList(); // or collect(Collectors.toList()) if using older Java
    }

    private TournamentResponse mapToResponse(Tournament tournament) {
        TournamentResponse response = new TournamentResponse();
        List<Rounds> rounds = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(
                        tournament.getTournamentId());

        int currentRound = rounds.isEmpty()
                ? 0
                : rounds.getLast().getRoundNumber();
        response.setTournamentId(tournament.getTournamentId());
        response.setTournamentName(tournament.getTournamentName());
        response.setStartDateTime(tournament.getStartDateTime());
        response.setNumberOfRounds(tournament.getNumberOfRounds());
        response.setCurrentRound(currentRound);
        response.setMaxParticipants(tournament.getMaxParticipants());
        response.setEntryFee(tournament.getEntryFee());
        response.setDescription(tournament.getDescription());
        response.setLocation(tournament.getLocation());
        response.setTimeControl(tournament.getTimeControl());
        response.setFormat(tournament.getFormat().name());
        response.setStatus(tournament.getStatus().name());
        response.setCheckedInPlayers(
                (int) ticketRepository.countByTournamentTournamentIdAndStatus(
                        tournament.getTournamentId(), TicketStatus.CHECKED_IN));
        response.setOrganizerName(
                tournament.getOrganizer().getFirstName() + " " +
                        tournament.getOrganizer().getLastName()
        );
        response.setOrganizerId(tournament.getOrganizer().getId());
        response.setCurrentNumberOfParticipants(
                tournament.getPlayers() != null ? tournament.getPlayers().size() : 0
        );
        return response;
    }
}
package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.RegistrationRequestDTO;
import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentPlayerDTO;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.RegistrationRequest;
import com.manish.orgcheszer.entities.Rounds;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.TournamentTicket;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.RegistrationRequestStatus;
import com.manish.orgcheszer.enums.TicketStatus;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.exceptions.BadRequestException;
import com.manish.orgcheszer.exceptions.ConflictException;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.exceptions.UnauthorizedActionException;
import com.manish.orgcheszer.repositories.GameRepository;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RegistrationRequestRepository;
import com.manish.orgcheszer.repositories.RoundsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentStaffRepository;
import com.manish.orgcheszer.repositories.TournamentTicketRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final UsersRepository usersRepository;
    private final PlayerTournamentStatsRepository playerTournamentStatsRepository;
    private final TournamentStaffRepository tournamentStaffRepository;
    private final TournamentTicketService tournamentTicketService;
    private final TournamentTicketRepository ticketRepository;
    private final RegistrationRequestRepository registrationRequestRepository;
    private final LeaderboardService leaderboardService;
    private final RoundsRepository roundsRepository;
    private final GameRepository gameRepository;

    @Value("${tournament.require-approval}")
    private boolean requireApproval;

    // Helper: get current logged in user
    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        System.out.println("error here : "+ email);
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Create Tournament
    public TournamentResponse createTournament(TournamentCreateRequest request) {
        validateTournamentRequest(request);
        Users organizer = getCurrentUser();

        Tournament tournament = new Tournament();
        tournament.setTournamentName(request.getTournamentName());
        tournament.setStartDateTime(request.getStartDateTime());
        tournament.setNumberOfRounds(request.getNumberOfRounds());
        tournament.setMaxParticipants(request.getMaxParticipants());
        tournament.setEntryFee(request.getEntryFee());
        tournament.setDescription(request.getDescription());
        tournament.setLocation(request.getLocation());
        tournament.setTimeControl(request.getTimeControl());
        tournament.setFormat(TournamentFormat.valueOf(request.getFormat()));
        tournament.setStatus(requireApproval ? TournamentStatus.DRAFT : TournamentStatus.UPCOMING);
        tournament.setOrganizer(organizer);

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    public Page<TournamentResponse> getAllTournaments(
            String status, int page, int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by("startDateTime").descending());

        Page<Tournament> tournaments;

        if (status == null || status.isBlank()) {
            tournaments = tournamentRepository.findByStatusNotAndIsDemoFalse(TournamentStatus.DRAFT,pageable);
        } else {
            TournamentStatus tournamentStatus;
            try {
                tournamentStatus = TournamentStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(
                        "Invalid status. Use: UPCOMING, ONGOING, COMPLETED or CANCELLED");
            }
            tournaments = tournamentRepository
                    .findByStatusAndIsDemoFalse(tournamentStatus, pageable);
        }

        return tournaments.map(this::mapToResponse);
    }

    public TournamentResponse getTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));
        return mapToResponse(tournament);
    }

    public TournamentResponse updateTournament(UUID tournamentId, TournamentCreateRequest request) {
        validateTournamentRequest(request);
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Only the organizer can update this tournament");
        }

        if (tournament.getStatus() != TournamentStatus.UPCOMING) {
            throw new ConflictException("Cannot update a tournament that has already started");
        }
        if(tournament.getPlayers().size() > request.getMaxParticipants()){
            throw new ConflictException("The number of registered players already more than the set max");
        }

        tournament.setTournamentName(request.getTournamentName());
        tournament.setStartDateTime(request.getStartDateTime());
        tournament.setNumberOfRounds(request.getNumberOfRounds());
        tournament.setMaxParticipants(request.getMaxParticipants());
        tournament.setEntryFee(request.getEntryFee());
        tournament.setDescription(request.getDescription());
        tournament.setLocation(request.getLocation());
        tournament.setTimeControl(request.getTimeControl());
        tournament.setFormat(TournamentFormat.valueOf(request.getFormat()));

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    public void cancelTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Only the organizer can cancel this tournament");
        }

        if (tournament.getStatus() == TournamentStatus.COMPLETED ||
                tournament.getStatus() == TournamentStatus.ONGOING) {
            throw new ConflictException("Cannot cancel a completed or ongoing tournament");
        }

        // Delete All pending registration requests for this tournament
        registrationRequestRepository.deleteAllByTournamentTournamentId(tournamentId);

        tournament.setStatus(TournamentStatus.CANCELLED);
        tournamentRepository.save(tournament);
    }

    public RegistrationRequestDTO registerPlayer(UUID tournamentId) {
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        // Validations
        if (tournament.getStatus() != TournamentStatus.UPCOMING) {
            throw new ConflictException("Registration is closed for this tournament");
        }
        if (tournament.getPlayers().size() >= tournament.getMaxParticipants()) {
            throw new ConflictException("Tournament is full");
        }
        if (playerTournamentStatsRepository
                .existsByPlayerIdAndTournamentTournamentId(
                        currentUser.getId(), tournamentId)) {
            throw new ConflictException("You are already registered for this tournament");
        }
        if (tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new ConflictException("Organizer cannot register as a player");
        }
        if(tournamentStaffRepository.existsByUserIdAndTournamentTournamentId(currentUser.getId(),tournamentId)){
            throw new ConflictException("Staff member cannot register as a player");
        }

        if (tournament.getEntryFee() == 0) {
            // ── FREE TOURNAMENT: existing flow unchanged ───────────────────────
            if (tournament.getPlayers().size() >= tournament.getMaxParticipants()) {
                throw new ConflictException("Tournament is full");
            }
            return addPlayerToTournament(currentUser, tournament);
        } else {
            // ── PAID TOURNAMENT: goes through request/approval flow ────────────
            return submitRegistrationRequest(currentUser, tournament);
        }

        // Add to players list
//        tournament.getPlayers().add(currentUser);
//
//        // Count existing players to determine next pairingId
//        int currentCount = playerTournamentStatsRepository
//                .countByTournamentTournamentId(tournamentId);
//
//        // Create stats entry
//        PlayerTournamentStats stats = new PlayerTournamentStats();
//        stats.setPlayer(currentUser);
//        stats.setTournament(tournament);
//        stats.setPairingId(currentCount + 1); // permanent, 1-based
//        stats.setCurrentScore(0);
//
//        tournamentRepository.save(tournament);
//        playerTournamentStatsRepository.save(stats);
//        tournamentTicketService.issueTicket(currentUser, tournament);
    }

    // SUBMIT REGISTRATION REQUEST (paid tournaments only)
// ─────────────────────────────────────────────────────────────────────────────
    private RegistrationRequestDTO submitRegistrationRequest(Users player, Tournament tournament) {
        UUID tournamentId = tournament.getTournamentId();

        // Block duplicate pending requests
        if (registrationRequestRepository
                .existsByPlayerIdAndTournamentTournamentIdAndStatus(
                        player.getId(), tournamentId,
                        RegistrationRequestStatus.PENDING)) {
            throw new ConflictException(
                    "You already have a pending registration request for this tournament");
        }

        // Cap: pending requests cannot exceed 3x maxParticipants
        // Cap counts: current PENDING requests + already approved players
        long pendingCount = registrationRequestRepository
                .countByTournamentTournamentIdAndStatus(
                        tournamentId, RegistrationRequestStatus.PENDING);
        long approvedCount = tournament.getPlayers().size();
        long totalRequests = pendingCount + approvedCount;

        if (totalRequests >= (long) tournament.getMaxParticipants() * 3) {
            throw new ConflictException(
                    "Registration requests are full for this tournament");
        }

        RegistrationRequest request = new RegistrationRequest();
        request.setPlayer(player);
        request.setTournament(tournament);
        request.setStatus(RegistrationRequestStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());
        registrationRequestRepository.save(request);
        return RegistrationRequestDTO.builder()
                .requestedAt(LocalDateTime.now())
                .playerEloRating(player.getEloRating())
                .playerId(player.getId())
                .playerName(player.getFirstName() + " " + player.getLastName())
                .playerFideId(player.getFideId())
                .requestId(request.getId())
                .build();
    }

    // GET PENDING REQUESTS (organizer only)
// ─────────────────────────────────────────────────────────────────────────────
    public Page<RegistrationRequestDTO> getPendingRequests(UUID tournamentId, int page, int size) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException(
                    "Only the organizer can view registration requests");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
        return registrationRequestRepository
                .findByTournamentTournamentIdAndStatus(
                        tournamentId, RegistrationRequestStatus.PENDING, pageable)
                .map(req -> RegistrationRequestDTO.builder()
                        .requestId(req.getId())
                        .playerId(req.getPlayer().getId())
                        .playerName(req.getPlayer().getFirstName()
                                + " " + req.getPlayer().getLastName())
                        .playerEloRating(req.getPlayer().getEloRating())
                        .playerFideId(req.getPlayer().getFideId())
                        .requestedAt(req.getRequestedAt())
                        .build());
    }

    // APPROVE REQUEST (organizer only)
// ─────────────────────────────────────────────────────────────────────────────
    public void approveRequest(UUID tournamentId, UUID requestId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException(
                    "Only the organizer can approve registration requests");
        }

        RegistrationRequest request = registrationRequestRepository
                .findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration request not found"));

        // Verify request belongs to this tournament
        if (!request.getTournament().getTournamentId().equals(tournamentId)) {
            throw new ConflictException(
                    "This request does not belong to this tournament");
        }

        if (request.getStatus() != RegistrationRequestStatus.PENDING) {
            throw new ConflictException("This request is no longer pending");
        }

        // Capacity check at approval time
        if (tournament.getPlayers().size() >= tournament.getMaxParticipants()) {
            throw new ConflictException(
                    "Tournament is full — cannot approve more players");
        }

        // Tournament must still be upcoming
        if (tournament.getStatus() != TournamentStatus.UPCOMING) {
            throw new ConflictException(
                    "Cannot approve requests — tournament is no longer upcoming");
        }

        // Add player to tournament — then delete the request
        addPlayerToTournament(request.getPlayer(), tournament);
        registrationRequestRepository.delete(request);
    }


    // REJECT REQUEST (organizer only) — silently deletes the request
// ─────────────────────────────────────────────────────────────────────────────
    public void rejectRequest(UUID tournamentId, UUID requestId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException(
                    "Only the organizer can reject registration requests");
        }

        RegistrationRequest request = registrationRequestRepository
                .findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration request not found"));

        if (!request.getTournament().getTournamentId().equals(tournamentId)) {
            throw new ConflictException(
                    "This request does not belong to this tournament");
        }

        if (request.getStatus() != RegistrationRequestStatus.PENDING) {
            throw new ConflictException("This request is no longer pending");
        }

        // Silently delete — player can reapply
        registrationRequestRepository.delete(request);
    }

    private void validateTournamentRequest(TournamentCreateRequest request) {

        if (Objects.equals(request.getFormat(), TournamentFormat.ROUND_ROBIN.toString())) {

            // Cap Round Robin at 32 players
            if (request.getMaxParticipants() > 32) {
                throw new BadRequestException(
                        "Round Robin tournaments cannot have more than 32 participants " +
                                "— " + request.getMaxParticipants() + " players would require " +
                                (request.getMaxParticipants() - 1) + " rounds which is not feasible");
            }

            // Also validate numberOfRounds matches RR rules
            // RR rounds = maxParticipants - 1 (even) or maxParticipants (odd)
            int expectedRounds = request.getMaxParticipants() % 2 == 0
                    ? request.getMaxParticipants() - 1
                    : request.getMaxParticipants();

            if (request.getNumberOfRounds() != expectedRounds) {
                throw new BadRequestException(
                        "Round Robin tournament with " + request.getMaxParticipants() +
                                " participants must have exactly " + expectedRounds + " rounds, " +
                                "not " + request.getNumberOfRounds());
            }
        }

        if (Objects.equals(request.getFormat(), TournamentFormat.SWISS.toString())) {
            // Swiss needs at least 2 rounds to be meaningful
            if (request.getNumberOfRounds() < 2) {
                throw new BadRequestException(
                        "Swiss tournaments must have at least 2 rounds");
            }

            // Swiss needs at least 4 players
            if (request.getMaxParticipants() < 4) {
                throw new BadRequestException(
                        "Swiss tournaments must have at least 4 participants");
            }
        }

        // Common validations for all formats
        if (request.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "Tournament start time cannot be in the past");
        }

        if (request.getEntryFee() < 0) {
            throw new BadRequestException(
                    "Entry fee cannot be negative");
        }
    }

    public String getMyTicketToken(UUID tournamentId) {
        Users currentUser = getCurrentUser();
        TournamentTicket ticket = ticketRepository
                .findByPlayerIdAndTournamentTournamentId(
                        currentUser.getId(), tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No ticket found — you are not registered for this tournament"));
        return ticket.getTicketToken();
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

    public Page<TournamentPlayerDTO> getTournamentPlayers(UUID tournamentId, int page, int size) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Pageable pageable = PageRequest.of(page, size);

//        return tournament.getPlayers().stream()
//                .map(player -> {
//                    TournamentTicket ticket = ticketRepository
//                            .findByPlayerIdAndTournamentTournamentId(
//                                    player.getId(), tournamentId)
//                            .orElse(null);
//
//                    return TournamentPlayerDTO.builder()
//                            .userId(player.getId())
//                            .firstName(player.getFirstName())
//                            .lastName(player.getLastName())
//                            .eloRating(player.getEloRating())
//                            .fideId(player.getFideId())
//                            .checkInStatus(ticket != null
//                                    ? ticket.getStatus().name()
//                                    : "NOT_REGISTERED")
//                            .build();
//                })
//                .collect(Collectors.toList());

        return playerTournamentStatsRepository
                .findByTournamentTournamentIdOrderByPairingId(tournamentId, pageable)
                .map(stats -> {
                    Users player = stats.getPlayer();
                    TournamentTicket ticket = ticketRepository
                            .findByPlayerIdAndTournamentTournamentId(
                                    player.getId(), tournamentId)
                            .orElse(null);

                    return TournamentPlayerDTO.builder()
                            .userId(player.getId())
                            .firstName(player.getFirstName())
                            .lastName(player.getLastName())
                            .eloRating(player.getEloRating())
                            .fideId(player.getFideId())
                            .checkInStatus(ticket != null
                                    ? ticket.getStatus().name()
                                    : "NOT_REGISTERED")
                            .build();
                });
    }

    public void approveDraftTournament(UUID tournamentId){
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        if (tournament.getStatus() != TournamentStatus.DRAFT) {
            throw new ConflictException(
                    "Tournament is not in DRAFT status — current status: "
                            + tournament.getStatus());
        }

        tournament.setStatus(TournamentStatus.UPCOMING);
        tournamentRepository.save(tournament);
    }

    public List<TournamentResponse> getDraftTournaments() {
        return tournamentRepository
                .findByStatus(TournamentStatus.DRAFT)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // HELPER — shared by free tournament flow and approval flow
    // Creates stats, adds to players list, issues ticket
    // ─────────────────────────────────────────────────────────────────────────────
    private RegistrationRequestDTO addPlayerToTournament(Users player, Tournament tournament) {
        UUID tournamentId = tournament.getTournamentId();

        // Assign pairingId
        int pairingId = playerTournamentStatsRepository
                .countByTournamentTournamentId(tournamentId) + 1;

        tournament.getPlayers().add(player);

        PlayerTournamentStats stats = new PlayerTournamentStats();
        stats.setPlayer(player);
        stats.setTournament(tournament);
        stats.setCurrentScore(0);
//        stats.setPairingId(pairingId);
        playerTournamentStatsRepository.save(stats);

        tournamentRepository.save(tournament);
        tournamentTicketService.issueTicket(player, tournament);

        return RegistrationRequestDTO.builder()
                .requestedAt(LocalDateTime.now())
                .playerEloRating(player.getEloRating())
                .playerId(player.getId())
                .playerName(player.getFirstName() + " " + player.getLastName())
                .playerFideId(player.getFideId())
                .build();
    }

    public void deleteDraftTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        if (tournament.getStatus() != TournamentStatus.DRAFT) {
            throw new ConflictException(
                    "Cannot delete — tournament is not in DRAFT status");
        }

        tournamentRepository.delete(tournament);
    }

    public void deleteAllDraftTournaments() {
        List<Tournament> drafts = tournamentRepository
                .findByStatus(TournamentStatus.DRAFT);
        tournamentRepository.deleteAll(drafts);
    }

    public void endTournament(UUID tournamentId) {
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException(
                    "Only the organizer can end the tournament");
        }
        if (tournament.getStatus() != TournamentStatus.ONGOING) {
            throw new ConflictException(
                    "Tournament is not ongoing — current status: "
                            + tournament.getStatus());
        }

        List<Rounds> existingRounds = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId);

        if (existingRounds.isEmpty()) {
            throw new ConflictException(
                    "Cannot end — no rounds have been played yet");
        }

        Rounds latestRound = existingRounds.getLast();

        boolean hasPendingGames = gameRepository
                .findByRoundId(latestRound.getId())
                .stream()
                .anyMatch(g -> g.getResult() == null
                        || g.getResult() == GameResult.PENDING);

        if (hasPendingGames) {
            throw new ConflictException(
                    "Cannot end tournament — round "
                            + latestRound.getRoundNumber()
                            + " still has unfinished games. "
                            + "Submit all results first");
        }

        // Works whether called mid-tournament or after the last planned round
        // numberOfRounds is always updated to actual rounds played
        tournament.setNumberOfRounds(latestRound.getRoundNumber());
        tournament.setStatus(TournamentStatus.COMPLETED);
        tournamentRepository.save(tournament);

        // Persist final rankings
        leaderboardService.recalculateTiebreakers(tournamentId);
        leaderboardService.getLeaderboard(tournamentId, 0, Integer.MAX_VALUE);
    }
}
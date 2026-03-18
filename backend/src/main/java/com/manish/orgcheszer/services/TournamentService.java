package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.TournamentCreateRequest;
import com.manish.orgcheszer.dtos.TournamentPlayerDTO;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.entities.PlayerTournamentStats;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.TournamentTicket;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentStaffRepository;
import com.manish.orgcheszer.repositories.TournamentTicketRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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

    // Helper: get current logged in user
    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Create Tournament
    public TournamentResponse createTournament(TournamentCreateRequest request) {
        validateTournamentRequest(request);
        Users organizer = getCurrentUser();

        Tournament tournament = new Tournament();
        tournament.setTournamentName(request.getTournamentName());
        tournament.setStartDataTime(request.getStartDateTime());
        tournament.setNumberOfRounds(request.getNumberOfRounds());
        tournament.setMaxParticipants(request.getMaxParticipants());
        tournament.setEntryFee(request.getEntryFee());
        tournament.setDescription(request.getDescription());
        tournament.setLocation(request.getLocation());
        tournament.setTimeControl(request.getTimeControl());
        tournament.setFormat(TournamentFormat.valueOf(request.getFormat()));
        tournament.setStatus(TournamentStatus.UPCOMING);
        tournament.setOrganizer(organizer);

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        return mapToResponse(tournament);
    }

    public List<TournamentResponse> getMyTournaments() {
        Users organizer = getCurrentUser();
        return tournamentRepository
                .findByOrganizerIdOrderByStartDataTimeDesc(organizer.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse updateTournament(UUID tournamentId, TournamentCreateRequest request) {
        validateTournamentRequest(request);
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the organizer can update this tournament");
        }

        if (tournament.getStatus() != TournamentStatus.UPCOMING) {
            throw new RuntimeException("Cannot update a tournament that has already started");
        }

        tournament.setTournamentName(request.getTournamentName());
        tournament.setStartDataTime(request.getStartDateTime());
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
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the organizer can cancel this tournament");
        }

        if (tournament.getStatus() == TournamentStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed tournament");
        }

        tournament.setStatus(TournamentStatus.CANCELLED);
        tournamentRepository.save(tournament);
    }

    public void registerPlayer(UUID tournamentId) {
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Validations
        if (tournament.getStatus() != TournamentStatus.UPCOMING) {
            throw new RuntimeException("Registration is closed for this tournament");
        }
        if (tournament.getPlayers().size() >= tournament.getMaxParticipants()) {
            throw new RuntimeException("Tournament is full");
        }
        if (playerTournamentStatsRepository
                .existsByPlayerIdAndTournamentTournamentId(
                        currentUser.getId(), tournamentId)) {
            throw new RuntimeException("You are already registered for this tournament");
        }
        if (tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Organizer cannot register as a player");
        }
        if(tournamentStaffRepository.existsByUserIdAndTournamentTournamentId(currentUser.getId(),tournamentId)){
            throw new RuntimeException("Staff member cannot register as a player");
        }

        // Add to players list
        tournament.getPlayers().add(currentUser);

        // Count existing players to determine next pairingId
        int currentCount = playerTournamentStatsRepository
                .countByTournamentTournamentId(tournamentId);

        // Create stats entry
        PlayerTournamentStats stats = new PlayerTournamentStats();
        stats.setPlayer(currentUser);
        stats.setTournament(tournament);
        stats.setPairingId(currentCount + 1); // permanent, 1-based
        stats.setCurrentScore(0);

        tournamentRepository.save(tournament);
        playerTournamentStatsRepository.save(stats);
        tournamentTicketService.issueTicket(currentUser, tournament);
    }

    private void validateTournamentRequest(TournamentCreateRequest request) {

        if (Objects.equals(request.getFormat(), TournamentFormat.ROUND_ROBIN.toString())) {

            // Cap Round Robin at 32 players
            if (request.getMaxParticipants() > 32) {
                throw new RuntimeException(
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
                throw new RuntimeException(
                        "Round Robin tournament with " + request.getMaxParticipants() +
                                " participants must have exactly " + expectedRounds + " rounds, " +
                                "not " + request.getNumberOfRounds());
            }
        }

        if (Objects.equals(request.getFormat(), TournamentFormat.SWISS.toString())) {
            // Swiss needs at least 2 rounds to be meaningful
            if (request.getNumberOfRounds() < 2) {
                throw new RuntimeException(
                        "Swiss tournaments must have at least 2 rounds");
            }

            // Swiss needs at least 4 players
            if (request.getMaxParticipants() < 4) {
                throw new RuntimeException(
                        "Swiss tournaments must have at least 4 participants");
            }
        }

        // Common validations for all formats
        if (request.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Tournament start time cannot be in the past");
        }

        if (request.getEntryFee() < 0) {
            throw new RuntimeException(
                    "Entry fee cannot be negative");
        }
    }

    public String getMyTicketToken(UUID tournamentId) {
        Users currentUser = getCurrentUser();
        TournamentTicket ticket = ticketRepository
                .findByPlayerIdAndTournamentTournamentId(
                        currentUser.getId(), tournamentId)
                .orElseThrow(() -> new RuntimeException(
                        "No ticket found — you are not registered for this tournament"));
        return ticket.getTicketToken();
    }

    private TournamentResponse mapToResponse(Tournament tournament) {
        TournamentResponse response = new TournamentResponse();
        response.setTournamentId(tournament.getTournamentId());
        response.setTournamentName(tournament.getTournamentName());
        response.setStartDateTime(tournament.getStartDataTime());
        response.setNumberOfRounds(tournament.getNumberOfRounds());
        response.setMaxParticipants(tournament.getMaxParticipants());
        response.setEntryFee(tournament.getEntryFee());
        response.setDescription(tournament.getDescription());
        response.setLocation(tournament.getLocation());
        response.setTimeControl(tournament.getTimeControl());
        response.setFormat(tournament.getFormat().name());
        response.setStatus(tournament.getStatus().name());
        response.setOrganizerName(
                tournament.getOrganizer().getFirstName() + " " +
                        tournament.getOrganizer().getLastName()
        );
        response.setCurrentNumberOfParticipants(
                tournament.getPlayers() != null ? tournament.getPlayers().size() : 0
        );
        return response;
    }

    public List<TournamentPlayerDTO> getTournamentPlayers(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        return tournament.getPlayers().stream()
                .map(player -> {
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
                })
                .collect(Collectors.toList());
    }
}
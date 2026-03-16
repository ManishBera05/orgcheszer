package com.manish.orgcheszer.services;

import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.TicketStatus;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TournamentTicketService {

    private final TournamentTicketRepository ticketRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentStaffRepository tournamentStaffRepository;
    private final UsersRepository usersRepository;

    // ISSUE TICKET
    // Called immediately after a player successfully registers
    @Transactional
    public TournamentTicket issueTicket(Users player, Tournament tournament) {

        // Prevent duplicate tickets
        if (ticketRepository.existsByPlayerIdAndTournamentTournamentId(
                player.getId(), tournament.getTournamentId())) {
            throw new RuntimeException("Ticket already issued for this player");
        }

        TournamentTicket ticket = new TournamentTicket();
        ticket.setPlayer(player);
        ticket.setTournament(tournament);
        ticket.setTicketToken(UUID.randomUUID().toString()); // encoded in QR
        ticket.setStatus(TicketStatus.VALID);
        ticket.setIssuedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }

    // CHECK IN PLAYER
    // Called when organizer/staff scans QR or manually enters token
    // Sets status to CHECKED_IN so generateNextRound() includes this player
    @Transactional
    public void checkIn(String ticketToken, UUID tournamentId) {
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        boolean isOrganizer = tournament.getOrganizer().getId().equals(currentUser.getId());
        boolean isStaff = tournamentStaffRepository
                .existsByUserIdAndTournamentTournamentId(currentUser.getId(), tournamentId);

        if (!isOrganizer && !isStaff) {
            throw new AccessDeniedException(
                    "Only the organizer or staff of this tournament can check in players");
        }

        TournamentTicket ticket = ticketRepository.findByTicketToken(ticketToken)
                .orElseThrow(() -> new RuntimeException("Invalid ticket token"));

        if (!ticket.getTournament().getTournamentId().equals(tournamentId)) {
            throw new RuntimeException(
                    "This ticket does not belong to tournament " + tournamentId);
        }
        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            throw new RuntimeException(player(ticket) + " is already checked in");
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new RuntimeException(
                    "This ticket has been cancelled — player cannot check in");
        }

        ticket.setStatus(TicketStatus.CHECKED_IN);
        ticket.setScannedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
    }

    // CANCEL TICKET
    // Called when tournament is cancelled — bulk cancel all tickets
    @Transactional
    public void cancelTicket(TournamentTicket ticket) {
        ticket.setStatus(TicketStatus.CANCELLED);
        ticketRepository.save(ticket);
    }

    // Helpers
    private String player(TournamentTicket ticket) {
        return ticket.getPlayer().getFirstName()
                + " " + ticket.getPlayer().getLastName();
    }

    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
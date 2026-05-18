package com.manish.orgcheszer.config;

import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.TicketStatus;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Profile("dev")
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsersRepository            usersRepository;
    private final TournamentRepository       tournamentRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final PasswordEncoder            passwordEncoder;
    private final TournamentTicketRepository ticketRepository;

    @Override
    public void run(String... args) {

        // Only seed if DB is empty — safe to restart anytime
        if (usersRepository.count() > 0) {
            System.out.println("Database already seeded, skipping.");
            return;
        }

        System.out.println("Seeding test data...");

        // ── Create organizer ──────────────────────────────────────────────────
        Users organizer = createUser("Arbiter", "One",
                "organizer@test.com", 0);

        // ── Create 5 players ──────────────────────────────────────────────────
        Users magnus   = createUser("Magnus",  "Carlsen",       "magnus@test.com",   2800);
        Users hikaru   = createUser("Hikaru",  "Nakamura",      "hikaru@test.com",   2750);
        Users fabiano  = createUser("Fabiano", "Caruana",       "fabiano@test.com",  2700);
        Users anish    = createUser("Anish",   "Giri",          "anish@test.com",    2650);
        Users ian      = createUser("Ian",     "Nepomniachtchi","ian@test.com",       2600);

        // ── Create tournament ─────────────────────────────────────────────────
        Tournament tournament = new Tournament();
        tournament.setTournamentName("Swiss Open 2026Swiss Open 2026Swiss Open 2026Swiss Open 2026");
        tournament.setStartDateTime(LocalDateTime.now().plusDays(1));
        tournament.setFormat(TournamentFormat.SWISS);
        tournament.setNumberOfRounds(4);
        tournament.setMaxParticipants(10);
        tournament.setEntryFee(0);
        tournament.setDescription("Auto-seeded test tournament this tournament is very very very good and it really like lskdflkajsdlkf lsdto sldfj ");
        tournament.setLocation("Asansolsdfasdfasdfja;slkdfj;alksdjf;klja");
        tournament.setTimeControl("90m + 30s");
        tournament.setStatus(TournamentStatus.UPCOMING);
        tournament.setOrganizer(organizer);
        tournament.setPlayers(new ArrayList<>(List.of(magnus, hikaru, fabiano, anish, ian)));
        tournamentRepository.save(tournament);

        int pairingId = 1;
        // ── Create PlayerTournamentStats for each player ──────────────────────
        for (Users player : List.of(magnus, hikaru, fabiano, anish, ian)) {
            PlayerTournamentStats stats = new PlayerTournamentStats();
            stats.setPlayer(player);
            stats.setTournament(tournament);
            stats.setPairingId(pairingId++); // ← assign 1,2,3,4,5
            stats.setCurrentScore(0);
            statsRepository.save(stats);
        }

        for (Users player : List.of(magnus, hikaru, fabiano, anish)) {
            TournamentTicket ticket = new TournamentTicket();
            ticket.setPlayer(player);
            ticket.setTournament(tournament);
            ticket.setTicketToken(UUID.randomUUID().toString());
            ticket.setStatus(TicketStatus.CHECKED_IN); // auto check-in for test data
            ticket.setIssuedAt(LocalDateTime.now());
            ticket.setScannedAt(LocalDateTime.now());
            ticketRepository.save(ticket);
        }

        System.out.println("✅ Seeded: 1 organizer, 5 players, 1 tournament");
        System.out.println("   Organizer token: POST /api/auth/login { email: organizer@test.com, password: pass123 }");
        System.out.println("   Tournament ID: " + tournament.getTournamentId());
    }

//    @Column(nullable = true)
//    private String title;        // "g", "m", "f", "wg" etc
//
//    @Column(nullable = true)
//    private String federation;   // "IND", "NOR" etc
//
//    @Column(nullable = true)
//    private String sex;          // "m", "w"

    private Users createUser(String first, String last, String email, int elo) {
        Users user = new Users();
        user.setFirstName(first);
        user.setLastName(last);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("pass123")); // same password for everyone
        user.setMobileNo("0000000000");
        user.setDob(LocalDate.of(1990, 1, 1));
        user.setEloRating(elo);
        return usersRepository.save(user);
    }
}
package com.manish.orgcheszer.integration;

import com.manish.orgcheszer.dtos.GamePairingDTO;
import com.manish.orgcheszer.dtos.RoundPairingsResponse;
import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.*;
import com.manish.orgcheszer.repositories.*;
import com.manish.orgcheszer.services.LeaderboardService;
import com.manish.orgcheszer.services.MatchmakingService;
import com.manish.orgcheszer.services.TournamentService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end Swiss pairing simulation test.
 *
 * Ground truth: the 10-player 5-round TRF from JaVaFo documentation.
 * Each round: assert pairings match expected → feed results → repeat.
 * Final assertion: each player's total score matches the TRF.
 */
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@WithMockUser(username = "organizer@test.com")
class SwissPairingSimulationTests {

    @Autowired private UsersRepository            usersRepo;
    @Autowired private TournamentRepository       tournamentRepo;
    @Autowired private PlayerTournamentStatsRepository statsRepo;
    @Autowired private TournamentTicketRepository ticketRepo;
    @Autowired private RoundsRepository           roundsRepo;
    @Autowired private GameRepository             gameRepo;
    @Autowired private MatchmakingService         matchmakingService;
    @Autowired private LeaderboardService         leaderboardService;
    @Autowired private TournamentService          tournamentService;

    // Shared state across test methods
    private static UUID tournamentId;
    private static final Map<Integer, UUID> pairingIdToUserId = new LinkedHashMap<>(); // pairingId → userId

    // SETUP — runs once before all tests
    @BeforeAll
    static void setupSecurityContext() {
        // Mock authenticated organizer for SecurityContextHolder
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("organizer@test.com", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @Order(0)
    void setupTournament() {
        // Create organizer
        Users organizer = createUser("Organizer", "One", "organizer@test.com", 0);

        // Create 10 players matching TRF exactly
        // PairingId assignment must match TRF: highest rated = 1
        String[][] playerData = {
                {"Magnus",      "Carlsen",        "magnus@t.com",   "2800"},
                {"Hikaru",      "Nakamura",       "hikaru@t.com",   "2750"},
                {"Fabiano",     "Caruana",        "fabiano@t.com",  "2700"},
                {"Anish",       "Giri",           "anish@t.com",    "2650"},
                {"Ding",        "Liren",          "ding@t.com",     "2600"},
                {"Ian",         "Nepomniachtchi", "ian@t.com",      "2550"},
                {"Alireza",     "Firouzja",       "alireza@t.com",  "2500"},
                {"Wesley",      "So",             "wesley@t.com",   "2450"},
                {"Viswanathan", "Anand",          "anand@t.com",    "2400"},
                {"R",           "Praggnanandhaa", "pragg@t.com",    "2350"},
        };

        // Create tournament
        Tournament t = new Tournament();
        t.setTournamentName("JaVaFo Simulation Test");
        t.setStartDateTime(LocalDateTime.now());
        t.setFormat(TournamentFormat.SWISS);
        t.setNumberOfRounds(5);
        t.setMaxParticipants(10);
        t.setEntryFee(0);
        t.setDescription("Simulation test");
        t.setLocation("Test");
        t.setTimeControl("90m + 30s");
        t.setStatus(TournamentStatus.UPCOMING);
        t.setOrganizer(organizer);
        t.setPlayers(new ArrayList<>());
        tournamentRepo.save(t);
        tournamentId = t.getTournamentId();

        // Register players with correct pairingIds
        int pairingId = 1;
        for (String[] data : playerData) {
            Users player = createUser(data[0], data[1], data[2], Integer.parseInt(data[3]));

            t.getPlayers().add(player);

            PlayerTournamentStats stats = new PlayerTournamentStats();
            stats.setPlayer(player);
            stats.setTournament(t);
            stats.setCurrentScore(0);
            stats.setPairingId(pairingId);
            statsRepo.save(stats);

            TournamentTicket ticket = new TournamentTicket();
            ticket.setPlayer(player);
            ticket.setTournament(t);
            ticket.setTicketToken(UUID.randomUUID().toString());
            ticket.setStatus(TicketStatus.CHECKED_IN);
            ticket.setIssuedAt(LocalDateTime.now());
            ticket.setScannedAt(LocalDateTime.now());
            ticketRepo.save(ticket);

            pairingIdToUserId.put(pairingId, player.getId());
            pairingId++;
        }

        tournamentRepo.save(t);
        assertEquals(10, statsRepo.countByTournamentTournamentId(tournamentId));
    }

    // ROUND 1
    // Expected pairings from TRF:
    //   P1(w) vs P6(b) → BLACK_WINS
    //   P7(w) vs P2(b) → WHITE_WINS
    //   P3(w) vs P8(b) → DRAW
    //   P9(w) vs P4(b) → DRAW
    //   P5(w) vs P10(b)→ WHITE_WINS
    @Test
    @Order(1)
    void round1_pairingsCorrectThenFeedResults() {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        assertEquals(1, response.getRoundNumber());
        assertEquals(5, response.getPairings().size());

        assertPairing(response, 1, 6);   // P1 white vs P6 black
        assertPairing(response, 7, 2);   // P7 white vs P2 black
        assertPairing(response, 3, 8);   // P3 white vs P8 black
        assertPairing(response, 9, 4);   // P9 white vs P4 black
        assertPairing(response, 5, 10);  // P5 white vs P10 black

        // Feed results
        submitResult(1, 1, 6, GameResult.BLACK_WINS);
        submitResult(1, 7, 2, GameResult.WHITE_WINS);
        submitResult(1, 3, 8, GameResult.DRAW);
        submitResult(1, 9, 4, GameResult.DRAW);
        submitResult(1, 5, 10, GameResult.WHITE_WINS);

        // Verify scores after round 1
        assertScore(1, 0.0);   // Magnus lost
        assertScore(2, 0.0);   // Hikaru lost
        assertScore(3, 0.5);   // Fabiano drew
        assertScore(4, 0.5);   // Anish drew
        assertScore(5, 1.0);   // Ding won
        assertScore(6, 1.0);   // Ian won
        assertScore(7, 1.0);   // Alireza won
        assertScore(8, 0.5);   // Wesley drew
        assertScore(9, 0.5);   // Anand drew
        assertScore(10, 0.0);  // Pragg lost
    }

    // ROUND 2
    // Expected pairings from TRF:
    //   P10(w) vs P1(b) → WHITE_WINS
    //   P2(w)  vs P3(b) → DRAW
    //   P4(w)  vs P7(b) → DRAW
    //   P6(w)  vs P5(b) → WHITE_WINS
    //   P8(w)  vs P9(b) → DRAW
    @Test
    @Order(2)
    void round2_pairingsCorrectThenFeedResults() {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        assertEquals(2, response.getRoundNumber());
        assertEquals(5, response.getPairings().size());

        assertPairing(response, 10, 1);
        assertPairing(response, 2, 3);
        assertPairing(response, 4, 7);
        assertPairing(response, 6, 5);
        assertPairing(response, 8, 9);

        submitResult(2, 10, 1, GameResult.WHITE_WINS);
        submitResult(2, 2, 3, GameResult.DRAW);
        submitResult(2, 4, 7, GameResult.DRAW);
        submitResult(2, 6, 5, GameResult.WHITE_WINS);
        submitResult(2, 8, 9, GameResult.DRAW);

        assertScore(1, 0.0);
        assertScore(2, 0.5);
        assertScore(3, 1.0);
        assertScore(4, 1.0);
        assertScore(5, 1.0);
        assertScore(6, 2.0);
        assertScore(7, 1.5);
        assertScore(8, 1.0);
        assertScore(9, 1.0);
        assertScore(10, 1.0);
    }

    // ROUND 3
    // Expected pairings from TRF:
    //   P1(w)  vs P2(b)  → DRAW
    //   P3(w)  vs P4(b)  → DRAW
    //   P7(w)  vs P6(b)  → BLACK_WINS
    //   P9(w)  vs P10(b) → WHITE_WINS
    //   P5(w)  vs P8(b)  → BLACK_WINS
    @Test
    @Order(3)
    void round3_pairingsCorrectThenFeedResults() {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        assertEquals(3, response.getRoundNumber());
        assertEquals(5, response.getPairings().size());

        assertPairing(response, 1, 2);
        assertPairing(response, 3, 4);
        assertPairing(response, 7, 6);
        assertPairing(response, 9, 10);
        assertPairing(response, 5, 8);

        submitResult(3, 1, 2, GameResult.DRAW);
        submitResult(3, 3, 4, GameResult.DRAW);
        submitResult(3, 7, 6, GameResult.BLACK_WINS);
        submitResult(3, 9, 10, GameResult.WHITE_WINS);
        submitResult(3, 5, 8, GameResult.BLACK_WINS);

        assertScore(1, 0.5);
        assertScore(2, 1.0);
        assertScore(3, 1.5);
        assertScore(4, 1.5);
        assertScore(5, 1.0);
        assertScore(6, 3.0);
        assertScore(7, 1.5);
        assertScore(8, 2.0);
        assertScore(9, 2.0);
        assertScore(10, 1.0);
    }

    // ROUND 4
    // Expected pairings from TRF:
    //   P1(w)  vs P5(b)  → WHITE_WINS
    //   P7(w)  vs P3(b)  → DRAW
    //   P8(w)  vs P4(b)  → DRAW
    //   P6(w)  vs P9(b)  → WHITE_WINS
    //   P2(w)  vs P10(b) → DRAW
    @Test
    @Order(4)
    void round4_pairingsCorrectThenFeedResults() {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        assertEquals(4, response.getRoundNumber());
        assertEquals(5, response.getPairings().size());

        assertPairing(response, 1, 5);
        assertPairing(response, 7, 3);
        assertPairing(response, 8, 4);
        assertPairing(response, 6, 9);
        assertPairing(response, 2, 10);

        submitResult(4, 1, 5, GameResult.WHITE_WINS);
        submitResult(4, 7, 3, GameResult.DRAW);
        submitResult(4, 8, 4, GameResult.DRAW);
        submitResult(4, 6, 9, GameResult.WHITE_WINS);
        submitResult(4, 2, 10, GameResult.DRAW);

        assertScore(1, 1.5);
        assertScore(2, 1.5);
        assertScore(3, 2.0);
        assertScore(4, 2.0);
        assertScore(5, 1.0);
        assertScore(6, 4.0);
        assertScore(7, 2.0);
        assertScore(8, 2.5);
        assertScore(9, 2.0);
        assertScore(10, 1.5);
    }

    // ROUND 5
    // Expected pairings from TRF:
    //   P4(w)  vs P1(b)  → BLACK_WINS
    //   P5(w)  vs P2(b)  → DRAW
    //   P10(w) vs P3(b)  → DRAW
    //   P8(w)  vs P6(b)  → BLACK_WINS
    //   P9(w)  vs P7(b)  → WHITE_WINS
    @Test
    @Order(5)
    void round5_pairingsCorrectThenFeedResultsAndVerifyFinalScores() {
        RoundPairingsResponse response = matchmakingService.generateNextRound(tournamentId);
        assertEquals(5, response.getRoundNumber());
        assertEquals(5, response.getPairings().size());

        assertPairing(response, 4, 1);
        assertPairing(response, 5, 2);
        assertPairing(response, 10, 3);
        assertPairing(response, 8, 6);
        assertPairing(response, 9, 7);

        submitResult(5, 4, 1, GameResult.BLACK_WINS);
        submitResult(5, 5, 2, GameResult.DRAW);
        submitResult(5, 10, 3, GameResult.DRAW);
        submitResult(5, 8, 6, GameResult.BLACK_WINS);
        submitResult(5, 9, 7, GameResult.WHITE_WINS);

        // FINAL SCORE ASSERTIONS — must match TRF exactly
        assertScore(1, 2.5);   // Magnus
        assertScore(2, 2.0);   // Hikaru
        assertScore(3, 2.5);   // Fabiano
        assertScore(4, 2.0);   // Anish
        assertScore(5, 1.5);   // Ding
        assertScore(6, 5.0);   // Ian — tournament winner
        assertScore(7, 2.0);   // Alireza
        assertScore(8, 2.5);   // Wesley
        assertScore(9, 3.0);   // Anand
        assertScore(10, 2.0);  // Pragg

        // End the tournament
        tournamentService.endTournament(tournamentId);
        // Check if the tournament properly ended
        Tournament t = tournamentRepo.findById(tournamentId).orElseThrow();
        assertEquals(TournamentStatus.COMPLETED, t.getStatus());
    }


    // After the tournament is completed we have to check the tie-break score is calculated as per proper logic or not
    @Test
    @Order(6)
    void testTieBreakerScores(){
        List<PlayerTournamentStats> allPlayers = statsRepo.findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        double delta = 0.001; // Acceptable error range due to double precision
        // Manually calculated values of {buchholzCut1, buchholz and sonnebornBerger} of all players on the tested tournament
        double[][] calculatedResults = {
                {11.0,12.5,4.5}, // Magnus Carlsen
                {9.0,10.5,4.25}, // Hikaru Nakamura
                {8.5,10.5,5.25}, // Fabiano Caruana
                {10.5,12.5,5.00}, // Anish Giri
                {12.0,14.0,3.00}, // Ding Liren
                {10.0,11.5,11.5}, // Ian Nepomniachtchi
                {12.5,14.5,4.25}, // Alireza Firouzja
                {12.5,14.0,5.25}, // Wesley So
                {11.5,13.5,6.25}, // Viswanathan Anand
                {10.0,11.5,4.75} // R. Praggnanandhaa
        };

        for (PlayerTournamentStats currentPlayer : allPlayers) {
            int currentPlayerStartingPosition = currentPlayer.getPairingId();

            double currentPlayerBuchholzCut1 = currentPlayer.getBuchholzCut1();
            double currentPlayerBuccolz = currentPlayer.getBuchholz();
            double currentPlayerSonnebornBerger = currentPlayer.getSonnebornBerger();

            // Assert Buchholz Cut 1
            assertEquals(calculatedResults[currentPlayerStartingPosition - 1][0], currentPlayerBuchholzCut1, delta,
                    "Buchholz Cut 1 mismatch for player at starting position " + currentPlayerStartingPosition);

            // Assert Buchholz

            assertEquals(calculatedResults[currentPlayerStartingPosition - 1][1], currentPlayerBuccolz,
                    "Buchholz mismatch for player at starting position " + currentPlayerStartingPosition);

            // Assert Sonneborn-Berger
            assertEquals(calculatedResults[currentPlayerStartingPosition - 1][2], currentPlayerSonnebornBerger,
                    "Sonneborn-Berger mismatch for player at starting position " + currentPlayerStartingPosition);
        }

    }


    // Check whether the sorting of the leaderboard according to the priority works properly or not
    @Test
    @Order(7)
    @Transactional
    void testLeaderboard(){
        // Generate the leaderboard
        leaderboardService.getLeaderboard(tournamentId,0,100);
        List<PlayerTournamentStats> allPlayers = statsRepo.findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        // Manually calculated the ranks and sorted according to initial pairings
        int[] ranks = {4,9,5,7,10,1,6,3,2,8};
        for (PlayerTournamentStats currentPlayer : allPlayers) {
            int currentPlayerStartingPosition = currentPlayer.getPairingId();
            int currentPlayerFinalRank = currentPlayer.getFinalRank();
            assertEquals(ranks[currentPlayerStartingPosition - 1] , currentPlayerFinalRank);
        }
    }

    // HELPER FUNCTIONS

    // Asserts that a pairing exists with whitePairingId vs blackPairingId
    private void assertPairing(RoundPairingsResponse response, int whitePId, int blackPId) {
        UUID whiteId = pairingIdToUserId.get(whitePId);
        UUID blackId = pairingIdToUserId.get(blackPId);

        Users white = usersRepo.findById(whiteId).orElseThrow();
        Users black = usersRepo.findById(blackId).orElseThrow();

        String whiteName = white.getFirstName() + " " + white.getLastName();
        String blackName = black.getFirstName() + " " + black.getLastName();

        boolean found = response.getPairings().stream().anyMatch(p ->
                p.getWhiteName().equals(whiteName) &&
                        p.getBlackName().equals(blackName));

        assertTrue(found,
                "Expected pairing not found: P" + whitePId + "(w) vs P" + blackPId + "(b)" +
                        " [" + whiteName + " vs " + blackName + "]" +
                        "\nActual pairings: " + formatPairings(response));
    }

    // Submits a result for a game between whitePairingId and blackPairingId in a given round
    private void submitResult(int roundNumber, int whitePId, int blackPId, GameResult result) {
        UUID whiteUserId = pairingIdToUserId.get(whitePId);
        UUID blackUserId = pairingIdToUserId.get(blackPId);

        Rounds round = roundsRepo
                .findByTournamentTournamentIdAndRoundNumber(tournamentId, roundNumber)
                .orElseThrow(() -> new RuntimeException("Round " + roundNumber + " not found"));

        Game game = gameRepo.findByRoundId(round.getId()).stream()
                .filter(g -> g.getWhitePlayer().getId().equals(whiteUserId)
                        && g.getBlackPlayer() != null
                        && g.getBlackPlayer().getId().equals(blackUserId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Game not found: P" + whitePId + " vs P" + blackPId +
                                " in round " + roundNumber));

        matchmakingService.submitResult(tournamentId, game.getId(), result);
    }

    // Asserts a player's current score by their pairingId
    private void assertScore(int pairingId, double expectedScore) {
        UUID userId = pairingIdToUserId.get(pairingId);
        PlayerTournamentStats stats = statsRepo
                .findByPlayerIdAndTournamentTournamentId(userId, tournamentId)
                .orElseThrow();

        assertEquals(expectedScore, stats.getCurrentScore(), 0.001,
                "Score mismatch for P" + pairingId +
                        " — expected " + expectedScore + " but got " + stats.getCurrentScore());
    }

    // Creates and saves a Users entity
    private Users createUser(String first, String last, String email, int elo) {
        Users user = new Users();
        user.setFirstName(first);
        user.setLastName(last);
        user.setEmail(email);
        user.setPassword("$2a$10$dummyhash");
        user.setMobileNo("0000000000");
        user.setDob(LocalDate.of(1990, 1, 1));
        user.setEloRating(elo);
        return usersRepo.save(user);
    }

    // Formats pairings for assertion failure messages
    private String formatPairings(RoundPairingsResponse response) {
        StringBuilder sb = new StringBuilder("\n");
        for (GamePairingDTO p : response.getPairings()) {
            sb.append("  ").append(p.getWhiteName())
                    .append(" vs ").append(p.getBlackName()).append("\n");
        }
        return sb.toString();
    }
}
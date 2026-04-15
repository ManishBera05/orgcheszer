//package com.manish.orgcheszer.unit.services;
//
//import com.manish.orgcheszer.dtos.LeaderboardEntryDTO;
//import com.manish.orgcheszer.entities.PlayerTournamentStats;
//import com.manish.orgcheszer.entities.Tournament;
//import com.manish.orgcheszer.entities.Users;
//import com.manish.orgcheszer.enums.TournamentFormat;
//import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
//import com.manish.orgcheszer.repositories.RoundsRepository;
//import com.manish.orgcheszer.repositories.TournamentRepository;
//import com.manish.orgcheszer.services.LeaderboardService;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Nested;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import java.util.List;
//import java.util.Optional;
//import java.util.UUID;
//import java.util.concurrent.atomic.AtomicLong;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.mockito.Mockito.verify;
//import static org.mockito.Mockito.when;
//
//@ExtendWith(MockitoExtension.class)
//class LeaderboardServiceTest {
//
//    @Mock private TournamentRepository tournamentRepository;
//    @Mock private PlayerTournamentStatsRepository statsRepository;
//    @Mock private RoundsRepository roundsRepository;
//
//    @InjectMocks
//    private LeaderboardService leaderboardService;
//
//    private final AtomicLong idCounter = new AtomicLong(1);
//    private UUID tournamentId;
//    private Tournament mockTournament;
//
//    // Outer setup: shared across all nested classes
//    // Format is intentionally NOT set here; each nested class sets its own.
//    // The `when` stub is safe here because mockTournament is returned by reference,
//    // so mutations made in a nested @BeforeEach (i.e. setFormat) are visible to the stub.
//    @BeforeEach
//    void setUp() {
//        tournamentId = UUID.randomUUID();
//        mockTournament = new Tournament();
//        mockTournament.setTournamentId(tournamentId);
//        when(tournamentRepository.findById(tournamentId)).thenReturn(Optional.of(mockTournament));
//    }
//
//    // Helpers
//    // This ensures unique UUID for all
//    private UUID nextId() {
//        return new UUID(0L, idCounter.getAndIncrement());
//    }
//
//    private Users createUser(String first, String last) {
//        Users user = new Users();
//        user.setId(nextId());
//        user.setFirstName(first);
//        user.setLastName(last);
//        return user;
//    }
//
//    private PlayerTournamentStats createStats(
//            Users player,
//            double score,
//            double buchholzCut1,
//            double buchholz,
//            int sonnebornBerger,
//            int winsWithBlack,
//            int winsWithWhite,
//            int gamesWithBlack
//    ) {
//        PlayerTournamentStats stats = new PlayerTournamentStats();
//        stats.setPlayer(player);
//        stats.setTournament(mockTournament);
//        stats.setCurrentScore(score);
//        stats.setBuchholzCut1(buchholzCut1);
//        stats.setBuchholz(buchholz);
//        stats.setSonnebornBerger(sonnebornBerger);
//        stats.setWinsWithBlack(winsWithBlack);
//        stats.setWinsWithWhite(winsWithWhite);
//        stats.setGamesWithBlack(gamesWithBlack);
//        return stats;
//    }
//
//    // Wires up all mock responses for the given stats list and calls the service.
//    private List<LeaderboardEntryDTO> buildAndGetLeaderboard(List<PlayerTournamentStats> allStats) {
//        when(statsRepository.findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId))
//                .thenReturn(allStats);
//        allStats.forEach(s ->
//                when(statsRepository.findByPlayerIdAndTournamentTournamentId(
//                        s.getPlayer().getId(), tournamentId))
//                        .thenReturn(Optional.of(s))
//        );
//        return leaderboardService.getLeaderboard(tournamentId,0,100).toList();
//    }
//
//    // Asserts the result list matches the expected player order and verifies the repo call.
//    private void assertLeaderboardOrder(List<LeaderboardEntryDTO> result, List<UUID> expectedOrder) {
//        assertEquals(expectedOrder.size(), result.size(), "Leaderboard size mismatch");
//        for (int i = 0; i < expectedOrder.size(); i++) {
//            assertEquals(
//                    expectedOrder.get(i),
//                    result.get(i).getPlayerID(),
//                    "Wrong player at rank " + (i + 1) + ": got " + result.get(i).getPlayerName()
//            );
//        }
//        verify(statsRepository).findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);
//    }
//
//    // SWISS
//
//    @Nested
//    @DisplayName("Swiss format")
//    class SwissLeaderboard {
//
//        /**
//         * Sort priority: score → buchholzCut1 → buchholz → gamesWithBlack → totalWins
//         * <p>
//         *  Rank  Player              Deciding factor
//         *  ────  ──────────────────  ──────────────────────────────────────────
//         *   1    Anand               score 9.0  (unique)
//         *   2    Carlsen             score 8.5  (unique)
//         *   3    Vachier-Lagrave     score 8.0, buchholzCut1 36 > 34
//         *   4    Nakamura            score 8.0, buchholzCut1 34
//         *   5    Caruana             score 7.0, cut1 33, buchholz 40 > 38 > 36
//         *   6    Liren               score 7.0, cut1 33, buchholz 38
//         *   7    Nepomniachtchi      score 7.0, cut1 33, buchholz 36
//         *   8    Firouzja            score 6.5, cut1 30, buch 37, gamesBlack 5 > 3
//         *   9    Giri                score 6.5, cut1 30, buch 37, gamesBlack 3
//         *  10    So                  score 6.0, cut1 28, buch 35, totalWins 5
//         *  11    Aronian             score 6.0, cut1 28, buch 35, totalWins 4
//         *  12    Radjabov            score 6.0, cut1 28, buch 35, totalWins 3
//         */
//        @BeforeEach
//        void setFormat() {
//            mockTournament.setFormat(TournamentFormat.SWISS);
//        }
//
//        @Test
//        @DisplayName("should sort by score, then buchholzCut1, buchholz, gamesWithBlack, totalWins")
//        void shouldReturnCorrectlySortedSwissLeaderboard() {
//            Users carlsen        = createUser("Magnus",      "Carlsen");
//            Users nakamura       = createUser("Hikaru",      "Nakamura");
//            Users caruana        = createUser("Fabiano",     "Caruana");
//            Users liren          = createUser("Ding",        "Liren");
//            Users nepo           = createUser("Ian",         "Nepomniachtchi");
//            Users giri           = createUser("Anish",       "Giri");
//            Users firouzja       = createUser("Alireza",     "Firouzja");
//            Users so             = createUser("Wesley",      "So");
//            Users aronian        = createUser("Levon",       "Aronian");
//            Users anand          = createUser("Viswanathan", "Anand");
//            Users vachierLagrave = createUser("Maxime",      "Vachier-Lagrave");
//            Users radjabov       = createUser("Teimour",     "Radjabov");
//
//            // Stats: (player, score, buchholzCut1, buchholz, sb, winsBlack, winsWhite, gamesBlack)
//            // Ranks 1–2: unique scores
//            PlayerTournamentStats statsRadjabov  = createStats(anand,9.0, 24.0, 29.0,  8, 5, 3, 5);
//            PlayerTournamentStats statsVachier   = createStats(carlsen,8.5, 25.0, 30.0, 10, 4, 3, 4);
//            // Ranks 3–4: same score, different buchholzCut1
//            PlayerTournamentStats statsCarlsen   = createStats(vachierLagrave,8.0, 36.0, 42.0, 21, 3, 5, 4);
//            PlayerTournamentStats statsNakamura  = createStats(nakamura,8.0, 34.0, 43.0, 20, 2, 6, 5);
//            // Ranks 5–7: same score, same buchholzCut1, different buchholz
//            PlayerTournamentStats statsCaruana   = createStats(caruana,7.0, 33.0, 40.0, 19, 3, 4, 4);
//            PlayerTournamentStats statsLiren     = createStats(liren,7.0, 33.0, 38.0, 18, 2, 5, 5);
//            PlayerTournamentStats statsNepo      = createStats(nepo,7.0, 33.0, 36.0, 17, 1, 6, 3);
//            // Ranks 8–9: same score/cut1/buchholz, different gamesWithBlack
//            PlayerTournamentStats statsFirouzja  = createStats(firouzja,6.5, 30.0, 37.0, 15, 2, 3, 5);
//            PlayerTournamentStats statsGiri      = createStats(giri,6.5, 30.0, 37.0, 16, 3, 3, 3);
//            // Ranks 10–12: same score/cut1/buchholz/gamesBlack, different totalWins
//            PlayerTournamentStats statsSo        = createStats(so,6.0, 28.0, 35.0, 14, 1, 3, 4); // totalWins=4
//            PlayerTournamentStats statsAronian   = createStats(aronian,6.0, 28.0, 35.0, 13, 1, 4, 4); // totalWins=5
//            PlayerTournamentStats statsAnand     = createStats(radjabov,6.0, 28.0, 35.0, 12, 1, 2, 4); // totalWins=3
//
//            List<PlayerTournamentStats> allStats = List.of(
//                    statsRadjabov, statsVachier, statsCarlsen, statsNakamura,
//                    statsCaruana, statsLiren, statsNepo,
//                    statsFirouzja, statsGiri,
//                    statsSo, statsAronian, statsAnand
//            );
//
//            List<LeaderboardEntryDTO> result = buildAndGetLeaderboard(allStats);
//
//            assertLeaderboardOrder(result, List.of(
//                    anand.getId(),          //  1
//                    carlsen.getId(),        //  2
//                    vachierLagrave.getId(), //  3
//                    nakamura.getId(),       //  4
//                    caruana.getId(),        //  5
//                    liren.getId(),          //  6
//                    nepo.getId(),           //  7
//                    firouzja.getId(),       //  8
//                    giri.getId(),           //  9
//                    aronian.getId(),        // 10
//                    so.getId(),             // 11
//                    radjabov.getId()        // 12
//            ));
//        }
//    }
//
//    // ROUND ROBIN
//
//    @Nested
//    @DisplayName("Round Robin format")
//    class RoundRobinLeaderboard {
//
//        /**
//         * Sort priority: score → sonnebornBerger → totalWins (winsWithBlack + winsWithWhite)
//         * buchholz / buchholzCut1 / gamesWithBlack are irrelevant — set to 0.
//         * <p>
//         *  Rank  Player              Deciding factor
//         *  ────  ──────────────────  ──────────────────────────────────────
//         *   1    Radjabov            score 9.0  (unique)
//         *   2    Vachier-Lagrave     score 8.5  (unique)
//         *   3    Carlsen             score 8.0, SB 21 > 18
//         *   4    Nakamura            score 8.0, SB 18
//         *   5    Caruana             score 7.0, SB 19, totalWins 7
//         *   6    Liren               score 7.0, SB 19, totalWins 6
//         *   7    Nepomniachtchi      score 7.0, SB 19, totalWins 5
//         *   8    Giri                score 6.0  (unique)
//         *   9    Firouzja            score 5.5  (unique)
//         */
//        @BeforeEach
//        void setFormat() {
//            mockTournament.setFormat(TournamentFormat.ROUND_ROBIN);
//        }
//
//        @Test
//        @DisplayName("should sort by score, then Sonneborn-Berger, then totalWins")
//        void shouldReturnCorrectlySortedRoundRobinLeaderboard() {
//            Users carlsen        = createUser("Magnus",      "Carlsen");
//            Users nakamura       = createUser("Hikaru",      "Nakamura");
//            Users caruana        = createUser("Fabiano",     "Caruana");
//            Users liren          = createUser("Ding",        "Liren");
//            Users nepo           = createUser("Ian",         "Nepomniachtchi");
//            Users giri           = createUser("Anish",       "Giri");
//            Users firouzja       = createUser("Alireza",     "Firouzja");
//            Users vachierLagrave = createUser("Maxime",      "Vachier-Lagrave");
//            Users radjabov       = createUser("Teimour",     "Radjabov");
//
//            // Stats: (player, score, buchholzCut1=0, buchholz=0, sb, winsBlack, winsWhite, gamesBlack=0)
//            // Ranks 1–2: unique scores
//            PlayerTournamentStats statsRadjabov  = createStats(radjabov,9.0, 0, 0, 25, 5, 4, 0);
//            PlayerTournamentStats statsVachier   = createStats(vachierLagrave,8.5, 0, 0, 22, 4, 4, 0);
//            // Ranks 3–4: same score, different Sonneborn-Berger
//            PlayerTournamentStats statsCarlsen   = createStats(carlsen,8.0, 0, 0, 21, 3, 5, 0);
//            PlayerTournamentStats statsNakamura  = createStats(nakamura,8.0, 0, 0, 18, 2, 7, 0);
//            // Ranks 5–7: same score, same SB, different totalWins
//            PlayerTournamentStats statsCaruana   = createStats(caruana,7.0, 0, 0, 19, 3, 4, 0); // totalWins=7
//            PlayerTournamentStats statsLiren     = createStats(liren,7.0, 0, 0, 19, 2, 4, 0); // totalWins=6
//            PlayerTournamentStats statsNepo      = createStats(nepo,7.0, 0, 0, 19, 1, 4, 0); // totalWins=5
//            // Ranks 8–9: unique scores
//            PlayerTournamentStats statsGiri      = createStats(giri,6.0, 0, 0, 15, 3, 3, 0);
//            PlayerTournamentStats statsFirouzja  = createStats(firouzja,5.5, 0, 0, 12, 2, 3, 0);
//
//            List<PlayerTournamentStats> allStats = List.of(
//                    statsRadjabov, statsVachier,
//                    statsCarlsen, statsNakamura,
//                    statsCaruana, statsLiren, statsNepo,
//                    statsGiri, statsFirouzja
//            );
//
//            List<LeaderboardEntryDTO> result = buildAndGetLeaderboard(allStats);
//
//            assertLeaderboardOrder(result, List.of(
//                    radjabov.getId(),       // 1
//                    vachierLagrave.getId(), // 2
//                    carlsen.getId(),        // 3
//                    nakamura.getId(),       // 4
//                    caruana.getId(),        // 5
//                    liren.getId(),          // 6
//                    nepo.getId(),           // 7
//                    giri.getId(),           // 8
//                    firouzja.getId()        // 9
//            ));
//        }
//    }
//}
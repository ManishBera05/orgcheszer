package com.manish.orgcheszer.unit.services;

import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.repositories.*;
import com.manish.orgcheszer.services.LeaderboardService;
import com.manish.orgcheszer.services.MatchmakingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the private updatePlayerScore logic, driven through
 * the public submitResult entry point.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)   // Fix 1
class UpdatePlayerScoreTest {

    @Mock private TournamentRepository            tournamentRepository;
    @Mock private RoundsRepository                roundsRepository;
    @Mock private GameRepository                  gameRepository;
    @Mock private PlayerTournamentStatsRepository statsRepository;
    @Mock private UsersRepository                 usersRepository;
    @Mock private LeaderboardService              leaderboardService;
    @Mock private TournamentTicketRepository      ticketRepository;
    @Mock private ApplicationContext              applicationContext;

    @InjectMocks
    private MatchmakingService matchmakingService;

    private static final UUID   TOURNAMENT_ID   = UUID.randomUUID();
    private static final UUID   GAME_ID         = UUID.randomUUID();
    private static final UUID   WHITE_ID        = UUID.randomUUID();
    private static final UUID   BLACK_ID        = UUID.randomUUID();
    private static final UUID   ORGANIZER_ID    = UUID.randomUUID();
    private static final String ORGANIZER_EMAIL = "organizer@test.com";

    private PlayerTournamentStats whiteStats;
    private PlayerTournamentStats blackStats;

    @BeforeEach
    void setUp() {
        Users organizer = mock(Users.class);
        when(organizer.getId()).thenReturn(ORGANIZER_ID);

        // Players
        Users whitePlayer = mock(Users.class);
        when(whitePlayer.getId()).thenReturn(WHITE_ID);

        Users blackPlayer = mock(Users.class);
        when(blackPlayer.getId()).thenReturn(BLACK_ID);

        // Tournament
        Tournament tournament = mock(Tournament.class);
        when(tournament.getTournamentId()).thenReturn(TOURNAMENT_ID);
        when(tournament.getOrganizer()).thenReturn(organizer);
        when(tournament.getStaffs()).thenReturn(Collections.emptyList());
        when(tournament.getNumberOfRounds()).thenReturn(9);  // keeps finalize check from firing

        // Round
        Rounds round = mock(Rounds.class);
        when(round.getRoundNumber()).thenReturn(1);

        // ── Game — getResult() must track whatever setResult() last received ─
        // game.setResult() is a void call on a mock, so getResult() would
        // otherwise keep returning PENDING forever. The answer array makes the
        // mock stateful so guard conditions in submitResult see the correct
        // result after the save.
        GameResult[] liveResult = {GameResult.PENDING};
        Game game = mock(Game.class);
        when(game.getBlackPlayer()).thenReturn(blackPlayer);
        when(game.getWhitePlayer()).thenReturn(whitePlayer);
        when(game.getRound()).thenReturn(round);
        when(game.getResult()).thenAnswer(inv -> liveResult[0]);
        doAnswer(inv -> { liveResult[0] = inv.getArgument(0); return null; })
                .when(game).setResult(any());

        // Stats — stub ALL numeric getters that feed +1 arithmetic
        // updatePlayerScore does: stats.setGamesWithWhite(stats.getGamesWithWhite() + 1)
        // All getters return 0 by Mockito default, but we stub explicitly so
        // the intent is clear. LENIENT means stubs not consumed by a given
        // test no longer cause UnnecessaryStubbingException.
        whiteStats = mock(PlayerTournamentStats.class);
        when(whiteStats.getCurrentScore()).thenReturn(0.0);
        when(whiteStats.getGamesWithWhite()).thenReturn(0);
        when(whiteStats.getWinsWithWhite()).thenReturn(0);
        when(whiteStats.getDrawsWithWhite()).thenReturn(0);
        when(whiteStats.getOpponentIds()).thenReturn(new ArrayList<>());

        blackStats = mock(PlayerTournamentStats.class);
        when(blackStats.getCurrentScore()).thenReturn(0.0);
        when(blackStats.getGamesWithBlack()).thenReturn(0);
        when(blackStats.getWinsWithBlack()).thenReturn(0);
        when(blackStats.getDrawsWithBlack()).thenReturn(0);
        when(blackStats.getOpponentIds()).thenReturn(new ArrayList<>());

        // Repo stubs
        when(usersRepository.findByEmail(ORGANIZER_EMAIL)).thenReturn(Optional.of(organizer));
        when(tournamentRepository.findById(TOURNAMENT_ID)).thenReturn(Optional.of(tournament));
        when(gameRepository.findById(GAME_ID)).thenReturn(Optional.of(game));

        // statsRepository is called by both addOpponent() and updatePlayerScore()
        // for each player — the same stub handles all calls per UUID.
        when(statsRepository.findByPlayerIdAndTournamentTournamentId(WHITE_ID, TOURNAMENT_ID))
                .thenReturn(Optional.of(whiteStats));
        when(statsRepository.findByPlayerIdAndTournamentTournamentId(BLACK_ID, TOURNAMENT_ID))
                .thenReturn(Optional.of(blackStats));

        // 0 existing rounds < 9 total → checkAndFinalizeTournament exits immediately
        when(roundsRepository.findByTournamentTournamentIdOrderByRoundNumber(TOURNAMENT_ID))
                .thenReturn(Collections.emptyList());
    }

    // Drives submitResult as the organizer, with SecurityContextHolder stubbed.
    private void submitResult(GameResult result) {
        try (MockedStatic<SecurityContextHolder> shMock = mockStatic(SecurityContextHolder.class)) {
            SecurityContext ctx  = mock(SecurityContext.class);
            Authentication  auth = mock(Authentication.class);
            when(auth.getName()).thenReturn(ORGANIZER_EMAIL);
            when(ctx.getAuthentication()).thenReturn(auth);
            shMock.when(SecurityContextHolder::getContext).thenReturn(ctx);

            matchmakingService.submitResult(TOURNAMENT_ID, GAME_ID, result);
        }
    }

    @Test
    @DisplayName("WHITE_WINS: white +1.0 / black +0.0 — white game+win counters up, black game counter up, no black win")
    void whiteWins_updatesScoresAndColourCounters() {
        submitResult(GameResult.WHITE_WINS);

        // Score deltas
        verify(whiteStats).setCurrentScore(1.0);   // 0.0 + 1.0
        verify(blackStats).setCurrentScore(0.0);   // 0.0 + 0.0

        // White side: game played + win recorded
        verify(whiteStats).setGamesWithWhite(1);
        verify(whiteStats).setWinsWithWhite(1);

        // Black side: game played — no win counter incremented (Fix 2)
        verify(blackStats).setGamesWithBlack(1);
        verify(blackStats, never()).setWinsWithBlack(anyInt());
    }

    @Test
    @DisplayName("BLACK_WINS: white +0.0 / black +1.0 — black game+win counters up, white game counter up, no white win")
    void blackWins_updatesScoresAndColourCounters() {
        submitResult(GameResult.BLACK_WINS);

        // Score deltas
        verify(whiteStats).setCurrentScore(0.0);   // 0.0 + 0.0
        verify(blackStats).setCurrentScore(1.0);   // 0.0 + 1.0

        // White side: game played — no win counter
        verify(whiteStats).setGamesWithWhite(1);
        verify(whiteStats, never()).setWinsWithWhite(anyInt());

        // Black side: game played + win recorded
        verify(blackStats).setGamesWithBlack(1);
        verify(blackStats).setWinsWithBlack(1);
    }

    @Test
    @DisplayName("DRAW: both +0.5 — both draw counters up, no win counters touched on either side")
    void draw_updatesBothScoresAndDrawCounters() {
        submitResult(GameResult.DRAW);

        // Score deltas
        verify(whiteStats).setCurrentScore(0.5);   // 0.0 + 0.5
        verify(blackStats).setCurrentScore(0.5);   // 0.0 + 0.5

        // Draw counters
        verify(whiteStats).setGamesWithWhite(1);
        verify(whiteStats).setDrawsWithWhite(1);
        verify(blackStats).setGamesWithBlack(1);
        verify(blackStats).setDrawsWithBlack(1);

        // Win counters must NOT be touched on a draw
        verify(whiteStats, never()).setWinsWithWhite(anyInt());
        verify(blackStats, never()).setWinsWithBlack(anyInt());
    }
}
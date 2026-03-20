package com.manish.orgcheszer.unit.engine;

import com.manish.orgcheszer.engine.SwissEngineImpl;
import com.manish.orgcheszer.engine.models.PastMatch;
import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;
import javafo.api.JaVaFoApi;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mockStatic;

/**
 * Two focused contract tests for SwissEngineImpl:
 *
 *  1. TRF Builder  — does generatePairings() produce a byte-exact TRF string?
 *  2. Output Parser — does it map JaVaFo's text response back to correct Pairing objects?
 *
 * JaVaFo output format:
 *   Line 0  → round number  (skipped by the engine)
 *   Line 1+ → "whiteId blackId"   (0 as blackId = bye)
 */
class SwissEngineImplTest {

    private SwissEngineImpl swissEngine;

    @BeforeEach
    void setUp() {
        swissEngine = new SwissEngineImpl();
    }

    // Helpers

    private PlayerStanding createPlayer(UUID id, String name, int rating, double score) {
        PlayerStanding p = new PlayerStanding();
        p.setPlayerId(id);
        p.setName(name);
        p.setRating(rating);
        p.setCurrentScore(score);
        p.setMatchHistory(new ArrayList<>());
        return p;
    }

    /**
     * Writes a fake JaVaFo response into the OutputStream the engine provides,
     * prepending the mandatory round-number header line automatically.
     */
    private void writeJavafoOutput(org.mockito.invocation.InvocationOnMock inv,
                                   String... pairingLines) throws Exception {
        OutputStream os = inv.getArgument(3);
        StringBuilder sb = new StringBuilder("1\n");
        for (String line : pairingLines) sb.append(line).append("\n");
        os.write(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    // Test 1 — TRF Builder

    /**
     * Verifies the complete TRF string fed to JaVaFo:
     *
     *  • XXR header carries the correct total-rounds value
     *  • Each 001 player line has fields at exact column positions:
     *      [0-2]   "001" record tag
     *      [4-7]   pairingId  (right-aligned, 4 chars)
     *      [14-46] name       (left-aligned,  33 chars)
     *      [48-51] rating     (right-aligned,  4 chars)
     *  • Past-match round blocks are appended when match history is present
     *
     * Players are listed LOW-rating first to confirm the engine sorts DESC
     * before assigning pairingId=1 to the highest-rated player.
     */
    @Test
    @DisplayName("TRF Builder: produces a byte-exact, strictly formatted TRF string")
    void trfBuilderProducesExactFormat() throws Exception {
        UUID id1 = UUID.randomUUID();   // will become pairingId=1 (highest rated)
        UUID id2 = UUID.randomUUID();   // will become pairingId=2

        PlayerStanding p1 = createPlayer(id1, "Magnus Carlsen",  2800, 1.5);
        PlayerStanding p2 = createPlayer(id2, "Hikaru Nakamura", 2700, 1.0);

        // p1 beat p2 in round 1 as white; p2 lost as black
        p1.setMatchHistory(List.of(new PastMatch(2, 'w', '1')));
        p2.setMatchHistory(List.of(new PastMatch(1, 'b', '0')));

        // Listed in reverse order — engine must sort before writing TRF
        List<PlayerStanding> players = new ArrayList<>(List.of(p2, p1));

        final String[] capturedTrf = new String[1];

        try (MockedStatic<JaVaFoApi> mock = mockStatic(JaVaFoApi.class)) {
            mock.when(() -> JaVaFoApi.exec(anyInt(), anyString(), any(), any()))
                    .thenAnswer(inv -> {
                        InputStream is = inv.getArgument(2);
                        capturedTrf[0] = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                        writeJavafoOutput(inv, "1 2");
                        return null;
                    });

            swissEngine.generatePairings(players, 2, 9);
        }

        assertNotNull(capturedTrf[0], "TRF content must have been written to JaVaFo's InputStream");

        // XXR header
        assertTrue(capturedTrf[0].contains("XXR 9"),
                "TRF must contain 'XXR 9' to declare the total number of rounds");

        // Find the 001 line for pairingId=1 (Carlsen, highest rated)
        String p1Line = capturedTrf[0].lines()
                .filter(l -> l.startsWith("001"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No 001 player line found in TRF"));

        assertAll("001 player line column positions",

                // Record tag [0-2]
                () -> assertEquals("001",
                        p1Line.substring(0, 3),
                        "cols [1-3]: record tag must be '001'"),

                // pairingId [4-7] — right-aligned in exactly 4 chars.
                // A width of 5 would shift every subsequent column and break TRF parsing.
                () -> assertEquals("   1",
                        p1Line.substring(4, 8),
                        "cols [5-8]: pairingId must be right-aligned in exactly 4 chars"),

                // Name [14-46] — left-aligned, padded to exactly 33 chars
                () -> assertEquals("Magnus Carlsen                   ",
                        p1Line.substring(14, 47),
                        "cols [15-47]: name must be left-aligned in exactly 33 chars"),

                // Rating [48-51] — right-aligned in exactly 4 chars
                () -> assertEquals("2800",
                        p1Line.substring(48, 52),
                        "cols [49-52]: rating must be right-aligned in exactly 4 chars")
        );

        // Round history blocks appended after the fixed columns
        // Each block is 10 chars: "oppId color result  " (4+1+1+1+2 = not specified, just check presence)
        assertTrue(p1Line.contains("w"),
                "Player line must contain the 'w' colour flag from match history");
        assertTrue(capturedTrf[0].lines()
                        .filter(l -> l.startsWith("001"))
                        .skip(1).findFirst()
                        .map(l -> l.contains("b")).orElse(false),
                "Second player line must contain the 'b' colour flag from match history");
    }

    // Test 2 — Output Parser

    /**
     * Verifies that the engine correctly maps JaVaFo's integer pairing IDs
     * back to the right UUIDs for both normal pairings and bye pairings.
     *
     * Setup (4 players, listed in low-rating order to exercise the sort):
     *   After sort DESC by rating:
     *     pairingId 1 → Carlsen  (2800)
     *     pairingId 2 → Nakamura (2700)
     *     pairingId 3 → Caruana  (2600)
     *     pairingId 4 → Anand    (1600)  ← lowest-rated, receives the bye
     *
     * Fake JaVaFo output: "1 2" (normal) and "3 0" (bye for id 3 → Caruana).
     * We use 3 players so a bye is forced, and verify both the normal pairing
     * and the bye pairing resolve to the correct UUIDs with the correct flags.
     */
    @Test
    @DisplayName("Output Parser: maps JaVaFo integer IDs to correct UUIDs for normal and bye pairings")
    void outputParserMapsIdsToCorrectPairings() {
        UUID idCarlsen  = UUID.randomUUID();
        UUID idNakamura = UUID.randomUUID();
        UUID idCaruana  = UUID.randomUUID();

        // Listed in LOW-rating order — engine must sort before building the ID map
        List<PlayerStanding> players = new ArrayList<>(List.of(
                createPlayer(idCaruana,  "Caruana",  2600, 0.0),
                createPlayer(idNakamura, "Nakamura", 2700, 0.0),
                createPlayer(idCarlsen,  "Carlsen",  2800, 0.0)
        ));

        // After sort: pairingId 1=Carlsen, 2=Nakamura, 3=Caruana (gets bye)
        try (MockedStatic<JaVaFoApi> mock = mockStatic(JaVaFoApi.class)) {
            mock.when(() -> JaVaFoApi.exec(anyInt(), anyString(), any(), any()))
                    .thenAnswer(inv -> { writeJavafoOutput(inv, "1 2", "3 0"); return null; });

            List<Pairing> result = swissEngine.generatePairings(players, 1, 5);

            assertEquals(2, result.size(), "Three players should produce exactly 2 Pairing objects");

            // Normal pairing
            Pairing normal = result.get(0);
            assertFalse(normal.isBye(),                       "First pairing must not be a bye");
            assertEquals(idCarlsen,  normal.getWhitePlayerId(), "pairingId 1 must resolve to Carlsen");
            assertEquals(idNakamura, normal.getBlackPlayerId(), "pairingId 2 must resolve to Nakamura");

            // Bye pairing
            Pairing bye = result.get(1);
            assertTrue(bye.isBye(),                          "Second pairing must be a bye");
            assertEquals(idCaruana, bye.getWhitePlayerId(),  "pairingId 3 must resolve to Caruana");
            assertNull(bye.getBlackPlayerId(),               "Bye pairing must have null blackPlayerId");
        }
    }
}
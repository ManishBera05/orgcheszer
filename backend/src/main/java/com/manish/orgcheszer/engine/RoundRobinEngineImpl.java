package com.manish.orgcheszer.engine;

import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;
import org.springframework.stereotype.Component;

import java.util.*;

@Component("ROUND_ROBIN")
public class RoundRobinEngineImpl implements PairingEngine {

    // Sentinel UUID for the bye slot when player count is odd
    private static final UUID BYE_SENTINEL = UUID.fromString("00000000-0000-0000-0000-000000000000");

    // Generates ALL rounds upfront using the Berger circle method.
    //
    // Returns a flat list of Pairings — each Pairing carries a roundNumber
    // field so MatchmakingService knows which round each game belongs to.
    //
    // For N players:
    //   - If N is even → N-1 rounds, each with N/2 games
    //   - If N is odd  → N rounds, each with (N-1)/2 games + 1 bye
    @Override
    public List<Pairing> generatePairings(List<PlayerStanding> players,
                                          int currentRound,
                                          int totalRounds) {

        List<UUID> ids = new ArrayList<>();
        for (PlayerStanding p : players) {
            ids.add(p.getPlayerId());
        }

        // If odd number of players, add a bye sentinel
        boolean hasByeSlot = ids.size() % 2 != 0;
        if (hasByeSlot) {
            ids.add(BYE_SENTINEL);
        }

        int n          = ids.size();       // always even now
        int rounds     = n - 1;
        int gamesPerRound = n / 2;

        List<Pairing> allPairings = new ArrayList<>();

        // Circle array: position 0 is fixed (ids.get(0)), positions 1..n-1 rotate
        List<UUID> circle = new ArrayList<>(ids);

        for (int round = 1; round <= rounds; round++) {

            for (int i = 0; i < gamesPerRound; i++) {
                UUID top    = circle.get(i);
                UUID bottom = circle.get(n - 1 - i);

                // Skip if either player is the bye sentinel
                boolean topIsBye    = top.equals(BYE_SENTINEL);
                boolean bottomIsBye = bottom.equals(BYE_SENTINEL);

                if (topIsBye || bottomIsBye) {
                    // Real player gets a bye
                    UUID realPlayer = topIsBye ? bottom : top;
                    allPairings.add(Pairing.builder()
                            .whitePlayerId(realPlayer)
                            .blackPlayerId(null)
                            .isBye(true)
                            .roundNumber(round)
                            .build());
                    continue;
                }

                // Assign colors — alternate based on round parity and position
                // Even rounds: swap top/bottom colors relative to round 1
                UUID white;
                UUID black;
                if (round % 2 == 1) {
                    white = (i % 2 == 0) ? top : bottom;
                    black = (i % 2 == 0) ? bottom : top;
                } else {
                    white = (i % 2 == 0) ? bottom : top;
                    black = (i % 2 == 0) ? top : bottom;
                }

                allPairings.add(Pairing.builder()
                        .whitePlayerId(white)
                        .blackPlayerId(black)
                        .isBye(false)
                        .roundNumber(round)
                        .build());
            }

            // Move last element to position 1, shift rest right
            UUID last = circle.remove(n - 1);
            circle.add(1, last);
        }

        return allPairings;
    }
}
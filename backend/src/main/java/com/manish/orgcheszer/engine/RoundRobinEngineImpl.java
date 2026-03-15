package com.manish.orgcheszer.engine;

import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component("ROUND_ROBIN") // Must match the TournamentFormat enum exactly
public class RoundRobinEngineImpl implements PairingEngine {

    @Override
    public List<Pairing> generatePairings(List<PlayerStanding> players, int currentRound, int totalRounds) {
        List<Pairing> pairings = new ArrayList<>();

        // TODO: Implement Circle Method for Round Robin later

        return pairings;
    }
}
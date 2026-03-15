package com.manish.orgcheszer.engine;

import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;

import java.util.List;

public interface PairingEngine {
    List<Pairing> generatePairings(List<PlayerStanding> players, int currentRound, int totalRounds);
}
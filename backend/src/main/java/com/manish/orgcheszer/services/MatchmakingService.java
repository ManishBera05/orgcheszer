package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.GamePairingDTO;
import com.manish.orgcheszer.dtos.RoundPairingsResponse;
import com.manish.orgcheszer.engine.PairingEngine;
import com.manish.orgcheszer.engine.models.PastMatch;
import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;
import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private final TournamentRepository             tournamentRepository;
    private final RoundsRepository                 roundsRepository;
    private final GameRepository                   gameRepository;
    private final PlayerTournamentStatsRepository  statsRepository;
    private final UsersRepository                  usersRepository;
    private final ApplicationContext               applicationContext; // to resolve @Component("SWISS") etc.

    // view pairings of existing rounds
    public RoundPairingsResponse getRoundPairings(UUID tournamentId, int roundNumber) {
        Rounds round = roundsRepository
                .findByTournamentTournamentIdAndRoundNumber(tournamentId, roundNumber)
                .orElseThrow(() -> new RuntimeException("Round not found"));

        List<Game> games = gameRepository.findByRoundId(round.getId());

        List<GamePairingDTO> pairs = games.stream().map(g -> new GamePairingDTO(
                g.getId(),
                g.getWhitePlayer().getFirstName() + " " + g.getWhitePlayer().getLastName(),
                g.getBlackPlayer() != null
                        ? g.getBlackPlayer().getFirstName() + " " + g.getBlackPlayer().getLastName()
                        : "BYE",
                g.getBoardNumber(),
                g.getResult() != null ? g.getResult().name() : "PENDING"
        )).collect(Collectors.toList());

        return new RoundPairingsResponse(roundNumber, pairs);
    }

    // generate pairings for the next round, after all the results of the games are submitted
    @Transactional
    public RoundPairingsResponse generateNextRound(UUID tournamentId) {

        // Auth check : only organizers can generate pairing for next rounds
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the organizer can generate pairings");
        }

        // Status checks : checks whether max number of rounds are reached or more rounds pairings are even possible
        if (tournament.getStatus() == TournamentStatus.COMPLETED) {
            throw new RuntimeException("Tournament is already completed");
        }
        if (tournament.getStatus() == TournamentStatus.CANCELLED) {
            throw new RuntimeException("Tournament is cancelled");
        }

        // determines round number
        List<Rounds> existingRounds = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId);

        int nextRoundNumber = existingRounds.size() + 1;

        if (nextRoundNumber > tournament.getNumberOfRounds()) {
            throw new RuntimeException("All rounds have already been generated");
        }

        // checks whether all the games result is mentioned
        if (!existingRounds.isEmpty()) {
            Rounds lastRound = existingRounds.get(existingRounds.size() - 1);
            boolean hasUnfinishedGames = gameRepository
                    .findByRoundId(lastRound.getId())
                    .stream()
                    .anyMatch(g -> g.getResult() == null || g.getResult() == GameResult.PENDING);

            if (hasUnfinishedGames) {
                throw new RuntimeException(
                        "Cannot generate next round — round " + lastRound.getRoundNumber()
                                + " still has unfinished games");
            }
        }

        // if next rounds is the first round set tournament status to ongoing
        if (nextRoundNumber == 1) {
            tournament.setStatus(TournamentStatus.ONGOING);
            tournamentRepository.save(tournament);
        }

        // Load all games played so far
        List<Game> allGames = existingRounds.stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .collect(Collectors.toList());

        // Build PlayerStanding list
        List<PlayerTournamentStats> allStats = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId); // needs upgradation with the FIDE tie-break system

        // Build pairing ID map: UUID → pairingId (1-based, sorted by rating DESC) required for the JaVaFo API
        // This must be consistent every round, sort by rating then by UUID for stability
        List<PlayerTournamentStats> sortedByRating = new ArrayList<>(allStats);
        sortedByRating.sort(Comparator
                .comparingInt((PlayerTournamentStats s) -> s.getPlayer().getEloRating())
                .reversed()
                .thenComparing(s -> s.getPlayer().getId().toString())); // stable tiebreak

        Map<UUID, Integer> uuidToPairingId = new LinkedHashMap<>();
        for (int i = 0; i < sortedByRating.size(); i++) {
            uuidToPairingId.put(sortedByRating.get(i).getPlayer().getId(), i + 1);
        }

        // Build reverse map for history building
        Map<UUID, Integer> pairingIdMap = uuidToPairingId;

        List<PlayerStanding> standings = new ArrayList<>();
        for (PlayerTournamentStats stats : allStats) {
            standings.add(buildPlayerStanding(
                    stats, pairingIdMap, allGames, nextRoundNumber - 1));
        }

        // Resolve the correct engine via format
        String engineBeanName = tournament.getFormat().name(); // "SWISS" or "ROUND_ROBIN"
        PairingEngine engine = (PairingEngine) applicationContext.getBean(engineBeanName);

        // Generate pairings
        List<Pairing> pairings = engine.generatePairings(
                standings, nextRoundNumber, tournament.getNumberOfRounds());

        // Handle bad round generation request
        if (pairings.isEmpty()) {
            long validPairsRemaining = checkRemainingPossiblePairs(tournamentId);
            if (validPairsRemaining == 0) {
                tournament.setStatus(TournamentStatus.COMPLETED);
                tournament.setNumberOfRounds(nextRoundNumber - 1);
                tournamentRepository.save(tournament);
                throw new RuntimeException(
                        "No valid pairings possible — all players have already played each other. " +
                                "Tournament finalized at round " + (nextRoundNumber - 1));
            }
            throw new RuntimeException(
                    "Pairing engine returned no pairings — check TRF file format");
        }

        // Create Round entity
        Rounds newRound = new Rounds();
        newRound.setRoundNumber(nextRoundNumber);
        newRound.setTournament(tournament);
        newRound.setStartTime(LocalDateTime.now());
        roundsRepository.save(newRound);

        // Create Game entities
        int boardNumber = 1;
        for (Pairing pairing : pairings) {
            Users whitePlayer = usersRepository.findById(pairing.getWhitePlayerId())
                    .orElseThrow(() -> new RuntimeException("White player not found"));

            Game game = new Game();
            game.setRound(newRound);
            game.setWhitePlayer(whitePlayer);
            game.setBoardNumber(boardNumber++);

            if (pairing.isBye()) {
                game.setBlackPlayer(null);
                game.setResult(GameResult.BYE); // auto-resolve immediately
            } else {
                Users blackPlayer = usersRepository.findById(pairing.getBlackPlayerId())
                        .orElseThrow(() -> new RuntimeException("Black player not found"));
                game.setBlackPlayer(blackPlayer);
                game.setResult(GameResult.PENDING);
            }

            gameRepository.save(game);

            // Auto-update stats for bye player immediately
            if (pairing.isBye()) {
                updatePlayerScore(
                        pairing.getWhitePlayerId(), tournamentId, GameResult.BYE, true);
            }
        }

        // Return pairings as response
        return getRoundPairings(tournamentId, nextRoundNumber);
    }

    // Checks how many unplayed pairs still remain in the tournament
    // Used to distinguish "no valid pairings" from a TRF format error
    private long checkRemainingPossiblePairs(UUID tournamentId) {
        List<PlayerTournamentStats> allStats = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId);

        List<Game> allGames = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId)
                .stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .filter(g -> g.getBlackPlayer() != null) // exclude byes
                .collect(Collectors.toList());

        // Build set of already-played pairs
        Set<String> playedPairs = new HashSet<>();
        for (Game g : allGames) {
            playedPairs.add(sortedPairKey(
                    g.getWhitePlayer().getId(),
                    g.getBlackPlayer().getId()));
        }

        // Count remaining valid pairs
        List<UUID> playerIds = allStats.stream()
                .map(s -> s.getPlayer().getId())
                .collect(Collectors.toList());

        long validPairsRemaining = 0;
        for (int i = 0; i < playerIds.size(); i++) {
            for (int j = i + 1; j < playerIds.size(); j++) {
                if (!playedPairs.contains(
                        sortedPairKey(playerIds.get(i), playerIds.get(j)))) {
                    validPairsRemaining++;
                }
            }
        }
        return validPairsRemaining;
    }

    private String sortedPairKey(UUID a, UUID b) {
        return a.compareTo(b) < 0 ? a + "_" + b : b + "_" + a;
    }

    // SUBMIT GAME RESULT
    // Called by organizer or staff after each game finishes
    @Transactional
    public void submitResult(UUID tournamentId, UUID gameId, GameResult result) {

        // Auth: organizer or staff only
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        boolean isOrganizer = tournament.getOrganizer().getId().equals(currentUser.getId());
        boolean isStaff     = tournament.getStaffs().stream()
                .anyMatch(s -> s.getUser().getId().equals(currentUser.getId()));

        if (!isOrganizer && !isStaff) {
            throw new AccessDeniedException("Only organizer or staff can submit results");
        }

        // Load and validate game
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (game.getResult() != GameResult.PENDING) {
            throw new RuntimeException("Result already submitted for this game");
        }
        if (result == GameResult.PENDING || result == GameResult.BYE) {
            throw new RuntimeException("Invalid result submitted");
        }

        // Save result
        game.setResult(result);
        gameRepository.save(game);

        // Update PlayerTournamentStats for both players
        updatePlayerScore(game.getWhitePlayer().getId(), tournamentId, result, true);
        updatePlayerScore(game.getBlackPlayer().getId(), tournamentId, result, false);

        // Check if this was the last game of the last round
        checkAndFinalizeTournament(tournament);
    }

    // UPDATE PLAYER SCORE + STATS after a result is submitted
    private void updatePlayerScore(UUID playerId, UUID tournamentId,
                                   GameResult result, boolean isWhite) {

        PlayerTournamentStats stats = statsRepository
                .findByPlayerIdAndTournamentTournamentId(playerId, tournamentId)
                .orElseThrow(() -> new RuntimeException("Player stats not found"));

        double points = switch (result) {
            case WHITE_WINS -> isWhite ? 1.0 : 0.0;
            case BLACK_WINS -> isWhite ? 0.0 : 1.0;
            case DRAW       -> 0.5;
            case BYE        -> 1.0; // FIDE: bye = full point
            default         -> 0.0;
        };

        stats.setCurrentScore(stats.getCurrentScore() + points);

        // Update color counters
        if (result != GameResult.BYE) {
            if (isWhite) {
                stats.setGamesWithWhite(stats.getGamesWithWhite() + 1);
                if (result == GameResult.WHITE_WINS) stats.setWinsWithWhite(stats.getWinsWithWhite() + 1);
                if (result == GameResult.DRAW)       stats.setDrawsWithWhite(stats.getDrawsWithWhite() + 1);
            } else {
                stats.setGamesWithBlack(stats.getGamesWithBlack() + 1);
                if (result == GameResult.BLACK_WINS) stats.setWinsWithBlack(stats.getWinsWithBlack() + 1);
                if (result == GameResult.DRAW)       stats.setDrawsWithBlack(stats.getDrawsWithBlack() + 1);
            }
        } else {
            stats.setByesReceived(stats.getByesReceived() + 1);
        }

        statsRepository.save(stats);
    }

    // BUILDS PlayerStanding from DB data
    // This is the bridge between entities and the pairing engine
    private PlayerStanding buildPlayerStanding(PlayerTournamentStats stats,
                                               Map<UUID, Integer> pairingIdMap,
                                               List<Game> allGames,
                                               int roundsPlayed) {
        Users player = stats.getPlayer();

        // Build match history in round order
        List<PastMatch> history = new ArrayList<>();
        for (int round = 1; round <= roundsPlayed; round++) {
            final int r = round;
            Optional<Game> gameOpt = allGames.stream()
                    .filter(g -> g.getRound().getRoundNumber() == r)
                    .filter(g -> g.getWhitePlayer().getId().equals(player.getId())
                            || (g.getBlackPlayer() != null
                            && g.getBlackPlayer().getId().equals(player.getId())))
                    .findFirst();

            if (gameOpt.isEmpty() || gameOpt.get().getBlackPlayer() == null) {
                // Pairing-allocated bye — JaVaFo requires '+'
                history.add(new PastMatch(0, '-', '+'));
                continue;
            }

            Game   game    = gameOpt.get();
            boolean isWhite = game.getWhitePlayer().getId().equals(player.getId());
            Users   opp     = isWhite ? game.getBlackPlayer() : game.getWhitePlayer();
            int     oppId   = pairingIdMap.getOrDefault(opp.getId(), 0);
            char    color   = isWhite ? 'w' : 'b';
            char    result  = resolveResultChar(game.getResult(), isWhite);

            history.add(new PastMatch(oppId, color, result));
        }

        return PlayerStanding.builder()
                .playerId(player.getId())
                .pairingId(pairingIdMap.get(player.getId()))
                .name(player.getFirstName() + " " + player.getLastName())
                .rating(player.getEloRating())
                .title("")          // add title field to Users entity later
                .federation("IND")  // add federation field to Users entity later
                .currentScore(stats.getCurrentScore())
                .rank(pairingIdMap.get(player.getId()))
                .matchHistory(history)
                .build();
    }

    // Converts GameResult + perspective to TRF result character=
    private char resolveResultChar(GameResult result, boolean isWhite) {
        return switch (result) {
            case WHITE_WINS -> isWhite ? '1' : '0';
            case BLACK_WINS -> isWhite ? '0' : '1';
            case DRAW       -> '=';
            case BYE        -> '+';
            default         -> 'U';
        };
    }

    // Checks if all rounds are complete and finalizes the tournament
    private void checkAndFinalizeTournament(Tournament tournament) {
        List<Rounds> allRounds = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(
                        tournament.getTournamentId());

        if (allRounds.size() < tournament.getNumberOfRounds()) return;

        boolean allComplete = allRounds.stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .allMatch(g -> g.getResult() != null
                        && g.getResult() != GameResult.PENDING);

        if (allComplete) {
            tournament.setStatus(TournamentStatus.COMPLETED);
            tournamentRepository.save(tournament);
        }
    }

    // Helper function to get the current user of the current session
    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
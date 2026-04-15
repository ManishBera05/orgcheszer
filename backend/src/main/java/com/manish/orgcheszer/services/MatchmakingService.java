package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.GamePairingDTO;
import com.manish.orgcheszer.dtos.RoundPairingsResponse;
import com.manish.orgcheszer.engine.PairingEngine;
import com.manish.orgcheszer.engine.models.PastMatch;
import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;
import com.manish.orgcheszer.entities.*;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.RegistrationRequestStatus;
import com.manish.orgcheszer.enums.RoundStatus;
import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.exceptions.BadRequestException;
import com.manish.orgcheszer.exceptions.ConflictException;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.exceptions.UnauthorizedActionException;
import com.manish.orgcheszer.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private final TournamentRepository            tournamentRepository;
    private final RoundsRepository                roundsRepository;
    private final GameRepository                  gameRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final UsersRepository                 usersRepository;
    private final LeaderboardService              leaderboardService;
    private final TournamentTicketRepository      ticketRepository;
    private final ApplicationContext              applicationContext;
    private final RegistrationRequestRepository   registrationRequestRepository;
    private final RoundPairingsCacheService       roundPairingsCacheService;

    // PUBLIC METHODS


    // generate pairings for the next round, after all the results of the games are submitted
    @CacheEvict(value = "pairings", allEntries = true)
    @Transactional
    public RoundPairingsResponse generateNextRound(UUID tournamentId) {

        // Auth check : only organizers can generate pairing for next rounds
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Only the organizer can generate pairings");
        }

        // Status checks : checks whether max number of rounds are reached or more rounds pairings are even possible
        if (tournament.getStatus() == TournamentStatus.COMPLETED) {
            throw new ConflictException("Tournament is already completed");
        }
        if (tournament.getStatus() == TournamentStatus.CANCELLED) {
            throw new ConflictException("Tournament is cancelled");
        }

        if(LocalDateTime.now().isBefore(tournament.getStartDateTime())){
            throw new BadRequestException("Cannot generate rounds before the tournament starts");
        }

//        if(tournament)
        // determines round number
        List<Rounds> existingRounds = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId);

        int nextRoundNumber = existingRounds.size() + 1;

        if (nextRoundNumber > tournament.getNumberOfRounds()) {
            throw new ConflictException("All rounds have already been generated");
        }

        // checks whether all the games result is mentioned
        if (!existingRounds.isEmpty()) {
            Rounds lastRound = existingRounds.getLast();
            boolean hasUnfinishedGames = gameRepository
                    .findByRoundId(lastRound.getId())
                    .stream()
                    .anyMatch(g -> g.getResult() == null || g.getResult() == GameResult.PENDING);
            if (hasUnfinishedGames) {
                throw new BadRequestException(
                        "Cannot generate next round — round " + lastRound.getRoundNumber()
                                + " still has unfinished games");
            }
        }

        List<UUID> checkedInIds = ticketRepository.findCheckedInPlayerIds(tournamentId);
        if (checkedInIds.isEmpty()) {
            throw new BadRequestException(
                    "No players have checked in yet — scan player tickets before generating pairings");
        }
        if (checkedInIds.size() < 4) {
            throw new BadRequestException("At least 4 players must be checked in to generate pairings");
        }

        if (nextRoundNumber == 1) {
            tournament.setStatus(TournamentStatus.ONGOING);
            tournamentRepository.save(tournament);

            // Delete all pending requests — tournament has started
            registrationRequestRepository
                    .deleteAllByTournamentTournamentIdAndStatus(
                            tournamentId, RegistrationRequestStatus.PENDING);
        }

        // Load all games played so far
        List<Game> allGames = existingRounds.stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .collect(Collectors.toList());

        // Build PlayerStanding list
        List<PlayerTournamentStats> allStats = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId)
                .stream()
                .filter(s -> checkedInIds.contains(s.getPlayer().getId()))
                .toList();

        // Build pairing ID map: UUID → pairingId (1-based, sorted by rating DESC) required for the JaVaFo API
        // This must be consistent every round, sort by rating then by UUID for stability
        List<PlayerTournamentStats> sortedByRating = new ArrayList<>(allStats);
        sortedByRating.sort(Comparator
                .comparingInt((PlayerTournamentStats s) -> s.getPlayer().getEloRating())
                .reversed()
                .thenComparing(PlayerTournamentStats::getPairingId));

        // Use permanently stored pairingIds — no sorting needed
        Map<UUID, Integer> pairingIdMap = new LinkedHashMap<>();
        for (int i = 0; i < sortedByRating.size(); i++) {
            pairingIdMap.put(sortedByRating.get(i).getPlayer().getId(), i + 1);
        }

        List<PlayerStanding> standings = allStats.stream()
                .map(s -> buildPlayerStanding(s, pairingIdMap, allGames, nextRoundNumber - 1))
                .collect(Collectors.toList());

        PairingEngine engine = (PairingEngine) applicationContext
                .getBean(tournament.getFormat().name());

        if (tournament.getFormat() == TournamentFormat.ROUND_ROBIN) {
            if (nextRoundNumber > 1) {
                throw new ConflictException(
                        "Round Robin pairings are generated all at once — all rounds already exist");
            }
            generateAllRoundRobinRounds(tournament, standings, engine);
            return roundPairingsCacheService.getRoundPairings(tournamentId, 1);
        }

        List<Pairing> pairings = engine.generatePairings(
                standings, nextRoundNumber, tournament.getNumberOfRounds());

        if (pairings.isEmpty()) {
            long validPairsRemaining = checkRemainingPossiblePairs(tournamentId, checkedInIds);
            if (validPairsRemaining == 0) {
                tournament.setStatus(TournamentStatus.COMPLETED);
                tournament.setNumberOfRounds(nextRoundNumber - 1);
                tournamentRepository.save(tournament);
                throw new ConflictException(
                        "No valid pairings possible — all players have already played each other. " +
                                "Tournament finalized at round " + (nextRoundNumber - 1));
            }
            throw new ConflictException("Pairing engine returned no pairings, check TRF file format");
        }

        Rounds newRound = new Rounds();
        newRound.setRoundNumber(nextRoundNumber);
        newRound.setTournament(tournament);
        newRound.setStartTime(LocalDateTime.now());
        newRound.setStatus(RoundStatus.IN_PROGRESS);
        roundsRepository.save(newRound);

        int boardNumber = 1;
        for (Pairing pairing : pairings) {
            Users whitePlayer = usersRepository.findById(pairing.getWhitePlayerId())
                    .orElseThrow(() -> new ResourceNotFoundException("White player not found"));

            Game game = new Game();
            game.setRound(newRound);
            game.setWhitePlayer(whitePlayer);
            game.setBoardNumber(boardNumber++);

            if (pairing.isBye()) {
                game.setBlackPlayer(null);
                game.setResult(GameResult.BYE);
                updatePlayerScore(pairing.getWhitePlayerId(), tournamentId, GameResult.BYE, true);

                PlayerTournamentStats byeStats = statsRepository
                        .findByPlayerIdAndTournamentTournamentId(
                                pairing.getWhitePlayerId(), tournamentId)
                        .orElseThrow();
                byeStats.getOpponentIds().add(null);
                statsRepository.save(byeStats);

            } else {
                Users blackPlayer = usersRepository.findById(pairing.getBlackPlayerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Black player not found"));
                game.setBlackPlayer(blackPlayer);
                game.setResult(GameResult.PENDING);
            }

            gameRepository.save(game);
        }

        log.info("Rounnd {} of tournament {} generated.", newRound, tournamentId);
        return roundPairingsCacheService.getRoundPairings(tournamentId, nextRoundNumber);
    }

    @CacheEvict(value = "pairings", allEntries = true) // Optimization could be possible in future
    // hint :- @CacheEvict(value = "pairings", key = "#tournamentId + '_' + #gameId") try to match the key
    @Transactional
    public void submitResult(UUID tournamentId, UUID gameId, GameResult result) {
        Users currentUser = getCurrentUser();
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        boolean isOrganizer = tournament.getOrganizer().getId().equals(currentUser.getId());
        boolean isStaff = tournament.getStaffs().stream()
                .anyMatch(s -> s.getUser().getId().equals(currentUser.getId()));

        if (!isOrganizer && !isStaff) {
            throw new UnauthorizedActionException("Only organizer or staff can submit results");
        }

        if(tournament.getStatus() != TournamentStatus.ONGOING){
            throw new BadRequestException("Cannot submit result if a tournament isn't ongoing.");
        }

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        // guard against bye games
        if (game.getBlackPlayer() == null) {
            throw new BadRequestException("Cannot manually submit result for a bye game");
        }
        if (result == GameResult.PENDING || result == GameResult.BYE) {
            throw new BadRequestException("Invalid result submitted");
        }

        boolean isResultAlreadySet = game.getResult() != null
                && game.getResult() != GameResult.PENDING;

        if (isResultAlreadySet && !isOrganizer) {
            throw new UnauthorizedActionException(
                    "Result already submitted — only the organizer can change it");
        }

        if (isResultAlreadySet && isOrganizer) {
            int currentRoundNumber = game.getRound().getRoundNumber();
            boolean nextRoundExists = roundsRepository
                    .findByTournamentTournamentIdAndRoundNumber(
                            tournamentId, currentRoundNumber + 1)
                    .isPresent();
            if (nextRoundExists) {
                throw new ConflictException(
                        "Cannot change result — round " + (currentRoundNumber + 1)
                                + " has already been generated");
            }
            reversePlayerScore(game.getWhitePlayer().getId(), tournamentId, game.getResult(), true);
            reversePlayerScore(game.getBlackPlayer().getId(), tournamentId, game.getResult(), false);
        }

        game.setResult(result);
        gameRepository.save(game);

        // Update round status
        Rounds round = game.getRound();
        List<Game> roundGames = gameRepository.findByRoundId(round.getId());

        boolean allDone = roundGames.stream()
                .allMatch(g -> g.getResult() != null
                        && g.getResult() != GameResult.PENDING);

        round.setStatus(allDone ? RoundStatus.COMPLETED : RoundStatus.IN_PROGRESS);
        roundsRepository.save(round);

        // After saving the result, record opponents for both players
        if (!isResultAlreadySet) {
            addOpponent(game.getWhitePlayer().getId(), tournamentId, game.getBlackPlayer().getId());
            addOpponent(game.getBlackPlayer().getId(), tournamentId, game.getWhitePlayer().getId());
        }

        updatePlayerScore(game.getWhitePlayer().getId(), tournamentId, result, true);
        updatePlayerScore(game.getBlackPlayer().getId(), tournamentId, result, false);

        leaderboardService.recalculateTiebreakers(tournamentId);
        log.info("Result of game {} submitted ", gameId);
//        checkAndFinalizeTournament(tournament);
    }

    // PRIVATE HELPER METHODS
    private void generateAllRoundRobinRounds(Tournament tournament,
                                             List<PlayerStanding> standings,
                                             PairingEngine engine) {
        // Rcalculate rounds based on actual checked-in player count
        int actualPlayers = standings.size();
        int actualRounds  = actualPlayers % 2 == 0 ? actualPlayers - 1 : actualPlayers;

        tournament.setNumberOfRounds(actualRounds);
        tournamentRepository.save(tournament);

        List<Pairing> allPairings = engine.generatePairings(standings, 1, actualRounds);

        Map<Integer, List<Pairing>> byRound = new LinkedHashMap<>();
        for (Pairing p : allPairings) {
            byRound.computeIfAbsent(p.getRoundNumber(), k -> new ArrayList<>()).add(p);
        }

        for (Map.Entry<Integer, List<Pairing>> entry : byRound.entrySet()) {
            Rounds round = new Rounds();
            round.setRoundNumber(entry.getKey());
            round.setTournament(tournament);
            round.setStatus(RoundStatus.IN_PROGRESS);
            roundsRepository.save(round);

            int boardNumber = 1;
            for (Pairing pairing : entry.getValue()) {
                Users whitePlayer = usersRepository.findById(pairing.getWhitePlayerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Player not found"));

                Game game = new Game();
                game.setRound(round);
                game.setWhitePlayer(whitePlayer);
                game.setBoardNumber(boardNumber++);

                if (pairing.isBye()) {
                    game.setBlackPlayer(null);
                    game.setResult(GameResult.BYE);
                    updatePlayerScore(pairing.getWhitePlayerId(),
                            tournament.getTournamentId(), GameResult.BYE, true);
                } else {
                    Users blackPlayer = usersRepository.findById(pairing.getBlackPlayerId())
                            .orElseThrow(() -> new ResourceNotFoundException("Player not found"));
                    game.setBlackPlayer(blackPlayer);
                    game.setResult(GameResult.PENDING);
                }

                gameRepository.save(game);
            }
        }

        tournament.setStatus(TournamentStatus.ONGOING);
        tournamentRepository.save(tournament);
        log.info("All round robin rounds of tournament {} generated", tournament.getTournamentId());
    }

    private void updatePlayerScore(UUID playerId, UUID tournamentId,
                                   GameResult result, boolean isWhite) {
        PlayerTournamentStats stats = statsRepository
                .findByPlayerIdAndTournamentTournamentId(playerId, tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Player stats not found"));

        double points = switch (result) {
            case WHITE_WINS -> isWhite ? 1.0 : 0.0;
            case BLACK_WINS -> isWhite ? 0.0 : 1.0;
            case DRAW       -> 0.5;
            case BYE        -> 1.0;
            default         -> 0.0;
        };
        stats.setCurrentScore(stats.getCurrentScore() + points);

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
        log.info("Player {} score updated in tournament {} ", playerId, tournamentId);
    }

    private void reversePlayerScore(UUID playerId, UUID tournamentId,
                                    GameResult oldResult, boolean wasWhite) {
        PlayerTournamentStats stats = statsRepository
                .findByPlayerIdAndTournamentTournamentId(playerId, tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Player stats not found"));

        double pointsToRemove = switch (oldResult) {
            case WHITE_WINS -> wasWhite ? 1.0 : 0.0;
            case BLACK_WINS -> wasWhite ? 0.0 : 1.0;
            case DRAW       -> 0.5;
            default         -> 0.0;
        };
        stats.setCurrentScore(stats.getCurrentScore() - pointsToRemove);

        if (wasWhite) {
            stats.setGamesWithWhite(Math.max(0, stats.getGamesWithWhite() - 1));
            if (oldResult == GameResult.WHITE_WINS)
                stats.setWinsWithWhite(Math.max(0, stats.getWinsWithWhite() - 1));
            if (oldResult == GameResult.DRAW)
                stats.setDrawsWithWhite(Math.max(0, stats.getDrawsWithWhite() - 1));
        } else {
            stats.setGamesWithBlack(Math.max(0, stats.getGamesWithBlack() - 1));
            if (oldResult == GameResult.BLACK_WINS)
                stats.setWinsWithBlack(Math.max(0, stats.getWinsWithBlack() - 1));
            if (oldResult == GameResult.DRAW)
                stats.setDrawsWithBlack(Math.max(0, stats.getDrawsWithBlack() - 1));
        }

        statsRepository.save(stats);
    }

    private PlayerStanding buildPlayerStanding(PlayerTournamentStats stats,
                                               Map<UUID, Integer> pairingIdMap,
                                               List<Game> allGames,
                                               int roundsPlayed) {
        Users player = stats.getPlayer();
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
                history.add(new PastMatch(0, '-', '+'));
                continue;
            }

            Game    game    = gameOpt.get();
            boolean isWhite = game.getWhitePlayer().getId().equals(player.getId());
            Users   opp     = isWhite ? game.getBlackPlayer() : game.getWhitePlayer();
            int     oppId   = pairingIdMap.getOrDefault(opp.getId(), 0);

            history.add(new PastMatch(oppId, isWhite ? 'w' : 'b',
                    resolveResultChar(game.getResult(), isWhite)));
        }

        return PlayerStanding.builder()
                .playerId(player.getId())
                .pairingId(stats.getPairingId())
                .name(player.getFirstName() + " " + player.getLastName())
                .rating(player.getEloRating())
                .title("")
                .federation("IND")
                .currentScore(stats.getCurrentScore())
                .rank(pairingIdMap.get(player.getId()))
                .matchHistory(history)
                .build();
    }

    private char resolveResultChar(GameResult result, boolean isWhite) {
        return switch (result) {
            case WHITE_WINS -> isWhite ? '1' : '0';
            case BLACK_WINS -> isWhite ? '0' : '1';
            case DRAW       -> '=';
            case BYE        -> '+';
            default         -> 'U';
        };
    }

    private long checkRemainingPossiblePairs(UUID tournamentId, List<UUID> checkedInIds) {
        List<UUID> playerIds = statsRepository
                .findByTournamentTournamentIdOrderByCurrentScoreDesc(tournamentId)
                .stream()
                .filter(s -> checkedInIds.contains(s.getPlayer().getId()))
                .map(s -> s.getPlayer().getId())
                .toList();

        Set<String> playedPairs = roundsRepository
                .findByTournamentTournamentIdOrderByRoundNumber(tournamentId)
                .stream()
                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
                .filter(g -> g.getBlackPlayer() != null)
                .map(g -> sortedPairKey(g.getWhitePlayer().getId(), g.getBlackPlayer().getId()))
                .collect(Collectors.toSet());

        long validPairsRemaining = 0;
        for (int i = 0; i < playerIds.size(); i++) {
            for (int j = i + 1; j < playerIds.size(); j++) {
                if (!playedPairs.contains(sortedPairKey(playerIds.get(i), playerIds.get(j)))) {
                    validPairsRemaining++;
                }
            }
        }
        return validPairsRemaining;
    }

    private void addOpponent(UUID playerId, UUID tournamentId, UUID opponentId) {
        PlayerTournamentStats stats = statsRepository
                .findByPlayerIdAndTournamentTournamentId(playerId, tournamentId)
                .orElseThrow();
        stats.getOpponentIds().add(opponentId);
        statsRepository.save(stats);
    }

    private String sortedPairKey(UUID a, UUID b) {
        return a.compareTo(b) < 0 ? a + "_" + b : b + "_" + a;
    }

//    private void checkAndFinalizeTournament(Tournament tournament) {
//        List<Rounds> allRounds = roundsRepository
//                .findByTournamentTournamentIdOrderByRoundNumber(tournament.getTournamentId());
//
//        if (allRounds.size() < tournament.getNumberOfRounds()) return;
//
//        boolean allComplete = allRounds.stream()
//                .flatMap(r -> gameRepository.findByRoundId(r.getId()).stream())
//                .allMatch(g -> g.getResult() != null && g.getResult() != GameResult.PENDING);
//
//        if (allComplete) {
//            tournament.setStatus(TournamentStatus.COMPLETED);
//            tournamentRepository.save(tournament);
//        }
//    }

    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
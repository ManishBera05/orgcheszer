package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.GamePairingDTO;
import com.manish.orgcheszer.dtos.RoundPairingsResponse;
import com.manish.orgcheszer.entities.Rounds;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.repositories.GameRepository;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RegistrationRequestRepository;
import com.manish.orgcheszer.repositories.RoundsRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentTicketRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoundPairingsCacheService {

    private final TournamentRepository tournamentRepository;
    private final RoundsRepository roundsRepository;
    private final GameRepository gameRepository;
    private final PlayerTournamentStatsRepository statsRepository;
    private final UsersRepository usersRepository;
    private final LeaderboardService              leaderboardService;
    private final TournamentTicketRepository ticketRepository;
    private final ApplicationContext applicationContext;
    private final RegistrationRequestRepository registrationRequestRepository;

    @Cacheable(value = "pairings", key = "#tournamentId.toString() + '_' + #roundNumber")
    public RoundPairingsResponse getRoundPairings(UUID tournamentId, int roundNumber) {
        System.out.println("Round Pairing miss");
        Rounds round = roundsRepository
                .findByTournamentTournamentIdAndRoundNumber(tournamentId, roundNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Round not found"));

        List<GamePairingDTO> pairs = gameRepository.findByRoundId(round.getId())
                .stream()
                .map(g -> new GamePairingDTO(
                        g.getId(),
                        g.getWhitePlayer().getFirstName() + " " + g.getWhitePlayer().getLastName(),
                        g.getBlackPlayer() != null
                                ? g.getBlackPlayer().getFirstName() + " " + g.getBlackPlayer().getLastName()
                                : "BYE",
                        g.getWhitePlayer().getId(),
                        g.getBlackPlayer() != null
                                ? g.getBlackPlayer().getId(): new UUID(0,0),
                        g.getBoardNumber(),
                        g.getResult() != null ? g.getResult().name() : "PENDING"))
                .collect(Collectors.toList());

        return new RoundPairingsResponse(roundNumber, pairs,round.getStatus().name());
    }
}

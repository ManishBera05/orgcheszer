package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.PlatformStatsDTO;
import com.manish.orgcheszer.enums.GameResult;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.repositories.GameRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlatformStatsService {

    private final UsersRepository usersRepository;
    private final TournamentRepository tournamentRepository;
    private final GameRepository gameRepository;

    public PlatformStatsDTO getStats() {
        return PlatformStatsDTO.builder()
                .totalUsers(usersRepository.count())
                .totalTournamentsOrganized(
                        tournamentRepository.countByIsDemoFalse())
                .totalGamesPlayed(
                        gameRepository.countByResultNot(GameResult.PENDING))
                .liveTournaments(
                        tournamentRepository.countByStatusAndIsDemoFalse(
                                TournamentStatus.ONGOING))
                .build();
    }
}
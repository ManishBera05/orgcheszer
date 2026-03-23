package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformStatsDTO {
    private long totalUsers;
    private long totalTournamentsOrganized;
    private long totalGamesPlayed;
    private long liveTournaments;
}
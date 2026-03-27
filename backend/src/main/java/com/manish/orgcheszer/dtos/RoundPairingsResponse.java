package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoundPairingsResponse {
    private int roundNumber;
    private List<GamePairingDTO> pairings;
    private String roundStatus; //PENDING, IN_PROGRESS, COMPLETED
}
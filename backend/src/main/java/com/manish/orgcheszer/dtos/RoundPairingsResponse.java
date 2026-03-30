package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoundPairingsResponse implements Serializable {
    private int roundNumber;
    private List<GamePairingDTO> pairings;
    private String roundStatus; //PENDING, IN_PROGRESS, COMPLETED
}
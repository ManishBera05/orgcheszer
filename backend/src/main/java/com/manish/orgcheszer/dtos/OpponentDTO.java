package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpponentDTO {
    private int    roundNumber;
    private UUID opponentId;
    private String opponentName;
    private String result;  // "WIN", "LOSS", "DRAW", "BYE"
}
package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GamePairingDTO {
    private UUID gameId;
    private String whiteName;
    private String blackName; // "BYE" if bye game
    private int    boardNumber;
    private String result;    // "PENDING", "WHITE_WINS", "DRAW" etc.
}
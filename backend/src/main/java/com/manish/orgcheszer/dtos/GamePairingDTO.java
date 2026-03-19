package com.manish.orgcheszer.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
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

    @Schema(description = "The unique ID of this match")
    private UUID gameId;

    @Schema(description = "Name of the player with White pieces",
            example = "Carlsen, Magnus")
    private String whiteName;

    @Schema(description = "Name of the player with Black pieces. Displays 'BYE' if there is no opponent.",
            example = "Nakamura, Hikaru")
    private String blackName;

    @Schema(description = "Physical table number",
            example = "1")
    private int boardNumber;

    @Schema(description = "Current state of the game",
            allowableValues = {"PENDING", "WHITE_WINS", "BLACK_WINS", "DRAW", "BYE"},
            example = "PENDING")
    private String result;
}
package com.manish.orgcheszer.dtos;

import com.manish.orgcheszer.entities.Club;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TournamentCreateRequest {

    @Schema(description = "Official name of the event",
            example = "Winter Grandmaster Open")
    private String tournamentName;

    @Schema(description = "Date and time the first round begins",
            example = "2030-01-01T10:00:00")
    private LocalDateTime startDateTime;

    @Schema(description = "Total number of rounds to be played",
            example = "9")
    private int numberOfRounds;

    @Schema(description = "Maximum player capacity",
            example = "100")
    private int maxParticipants;

    @Schema(description = "Entry fee",
            example = "2500")
    private int entryFee;

    @Schema(description = "Information about the tournament",
            example = "Unrated Swiss tournament with exciting prizes.")
    private String description;

    @Schema(description = "Physical address or online link",
            example = "Oslo Chess Club")
    private String location;

    @Schema(description = "Standard chess time control format",
            example = "90+30")
    private String timeControl;

    @Schema(description = "Format of the tournament. Currently supports SWISS or ROUND_ROBIN",
            example = "SWISS")
    private String format;

    List<UUID> playerId;

    @Schema(description = "Tells if the tournament is a intra club tournament or not",
            example = "false")
    private Boolean isClubTournament;

    @Schema(description = "Tells which club the tournament belongs to")
    private UUID clubId;
}

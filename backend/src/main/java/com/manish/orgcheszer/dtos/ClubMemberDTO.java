package com.manish.orgcheszer.dtos;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClubMemberDTO {
    private UUID userId;
    private String firstName;
    private String lastName;
    private Integer eloRating;
    private String fideId;
    private String status;
    private LocalDateTime joinedAt;
}
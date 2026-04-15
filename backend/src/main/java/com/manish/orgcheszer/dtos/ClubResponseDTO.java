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
public class ClubResponseDTO {
    private UUID clubId;
    private UUID organizerId;
    private String name;
    private String description;
    private String organizerName;
    private String inviteCode;
    private long activeMembers;
    private long pendingRequests;
    private LocalDateTime createdAt;
}
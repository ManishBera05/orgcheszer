package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaffKeyResponse {
    private String keyValue;
    private boolean used;
    private LocalDateTime createdAt;
    private LocalDateTime usedAt;
}
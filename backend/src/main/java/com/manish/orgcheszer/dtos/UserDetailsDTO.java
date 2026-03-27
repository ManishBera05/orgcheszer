package com.manish.orgcheszer.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDetailsDTO {
    private UUID userId;
    private String firstName;
    private String lastName;
    private LocalDate date_of_birth;
    private String email;
    private String mobileNo;
    private String fideId;
}

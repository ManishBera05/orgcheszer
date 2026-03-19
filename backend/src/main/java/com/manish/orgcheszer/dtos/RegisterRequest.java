package com.manish.orgcheszer.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @Schema(description = "Player's first name",
            example = "Magnus")
    private String firstName;

    @Schema(description = "Player's last name",
            example = "Carlsen")
    private String lastName;

    @Schema(description = "Valid email address for login",
            example = "magnus@example.com")
    private String email;

    @Schema(description = "Strong password",
            example = "SecurePass123!")
    private String password;

    @Schema(description = "Contact number",
            example = "123456789")
    private String mobileNo;

    @Schema(description = "Date of Birth",
            example = "2000-01-01")
    private LocalDate dob;

    @Schema(description = "Official FIDE ID (Optional)",
            example = "1503014",
            nullable = true)
    private String fideId;
}
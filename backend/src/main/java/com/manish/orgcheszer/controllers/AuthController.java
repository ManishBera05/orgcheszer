package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.AuthResponse;
import com.manish.orgcheszer.dtos.LoginRequest;
import com.manish.orgcheszer.dtos.MessageResponse;
import com.manish.orgcheszer.dtos.OtpVerifyRequest;
import com.manish.orgcheszer.dtos.RegisterRequest;
import com.manish.orgcheszer.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "1. Authentication",
        description = "Endpoints for User Registration and Login")
public class AuthController {

    private final AuthService authService;

    // use this in testing environment
//    @Operation(summary = "Register a new user",
//            description = "Creates a new user account. No token required.")
//    @PostMapping("/register")
//    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
//        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
//    }

    @PostMapping("/register/initiate")
    @Operation(summary = "Initiate registration", description = "Validates fields and sends OTP to email")
    public ResponseEntity<MessageResponse> initiateRegistration(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.initiateRegistration(request));
    }

    @PostMapping("/register/verify")
    @Operation(summary = "Verify OTP and complete registration", description = "Verifies OTP and creates the account")
    public ResponseEntity<AuthResponse> verifyAndRegister(@RequestBody OtpVerifyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.verifyAndRegister(request));
    }

    @Operation(summary = "Login user",
            description = "Authenticates a user and returns a JWT token. No token required.")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
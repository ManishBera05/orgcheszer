package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.AuthResponse;
import com.manish.orgcheszer.dtos.LoginRequest;
import com.manish.orgcheszer.dtos.RegisterRequest;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.exceptions.ConflictException;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.repositories.UsersRepository;
import com.manish.orgcheszer.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // Check duplicate email
        if (usersRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        Users user = new Users();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt hash
        user.setMobileNo(request.getMobileNo());
        user.setDob(request.getDob());
        user.setFideId(request.getFideId());

        usersRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "User registered successfully");
    }

    public AuthResponse login(LoginRequest request) {
        // This throws automatically if credentials are wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Users user = usersRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Login successful");
    }
}
package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.AuthResponse;
import com.manish.orgcheszer.dtos.LoginRequest;
import com.manish.orgcheszer.dtos.MessageResponse;
import com.manish.orgcheszer.dtos.OtpVerifyRequest;
import com.manish.orgcheszer.dtos.RegisterRequest;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.exceptions.BadRequestException;
import com.manish.orgcheszer.exceptions.ConflictException;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.repositories.UsersRepository;
import com.manish.orgcheszer.security.JwtService;
import com.manish.orgcheszer.services.model.PendingRegistrationStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PendingRegistrationStore pendingRegistrationStore;

    // Step 1: Initiate registration
    public MessageResponse initiateRegistration(RegisterRequest request) {
        if (usersRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        String otp = otpService.generateOtp();
        pendingRegistrationStore.save(request.getEmail(), request, otp);
        emailService.sendOtpEmail(request.getEmail(), otp);

        log.info("OTP sent for registration. email: {}", request.getEmail());
        return new MessageResponse("OTP sent to " + request.getEmail());
    }

    // Step 2: Verify OTP and complete registration
    public AuthResponse verifyAndRegister(OtpVerifyRequest request) {
        PendingRegistrationStore.PendingEntry entry = pendingRegistrationStore.get(request.getEmail())
                .orElseThrow(() -> new BadRequestException("No pending registration for this email"));

        if (otpService.isExpired(entry.getExpiresAt())) {
            pendingRegistrationStore.remove(request.getEmail());
            throw new BadRequestException("OTP has expired. Please register again.");
        }

        if (!entry.getOtp().equals(request.getOtp())) {
            throw new BadRequestException("Invalid OTP");
        }

        // OTP valid — now save the user
        RegisterRequest reg = entry.getRegisterRequest();
        Users user = new Users();
        user.setFirstName(reg.getFirstName());
        user.setLastName(reg.getLastName());
        user.setEmail(reg.getEmail());
        user.setPassword(passwordEncoder.encode(reg.getPassword()));
        user.setMobileNo(reg.getMobileNo());
        user.setDob(reg.getDob());
        user.setFideId(reg.getFideId());

        usersRepository.save(user);
        pendingRegistrationStore.remove(request.getEmail()); // cleanup

        String token = jwtService.generateToken(user);
        log.info("User registered via OTP. userId: {}", user.getId());
        return new AuthResponse(token, "User registered successfully");
    }


    // Use it for easier registration in dev mode
//    public AuthResponse register(RegisterRequest request) {
//        // Check duplicate email
//        if (usersRepository.existsByEmail(request.getEmail())) {
//            throw new ConflictException("Email already registered");
//        }
//
//        Users user = new Users();
//        user.setFirstName(request.getFirstName());
//        user.setLastName(request.getLastName());
//        user.setEmail(request.getEmail());
//        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt hash
//        user.setMobileNo(request.getMobileNo());
//        user.setDob(request.getDob());
//        user.setFideId(request.getFideId());
//
//        usersRepository.save(user);
//
//        String token = jwtService.generateToken(user);
//        log.info("New user registered. userId: {}", user.getId());
//        return new AuthResponse(token, "User registered successfully");
//    }

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
        log.info("User successfully authenticated. userId: {}", user.getId());
        return new AuthResponse(token, "Login successful");
    }
}
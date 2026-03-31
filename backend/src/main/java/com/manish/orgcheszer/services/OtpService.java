package com.manish.orgcheszer.services;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    public String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(999999));
    }

    public boolean isExpired(LocalDateTime expiresAt) {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
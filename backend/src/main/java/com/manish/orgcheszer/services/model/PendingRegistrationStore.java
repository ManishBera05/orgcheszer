package com.manish.orgcheszer.services.model;

import com.manish.orgcheszer.dtos.RegisterRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PendingRegistrationStore {

    @Value("${otp.expiry.minutes:10}")
    private int otpExpiryMinutes;

    @Data
    @AllArgsConstructor
    public static class PendingEntry {
        private RegisterRequest registerRequest;
        private String otp;
        private LocalDateTime expiresAt;
    }

    private final ConcurrentHashMap<String, PendingEntry> store = new ConcurrentHashMap<>();

    public void save(String email, RegisterRequest request, String otp) {
        store.put(email, new PendingEntry(
                request, otp, LocalDateTime.now().plusMinutes(otpExpiryMinutes)
        ));
    }

    public Optional<PendingEntry> get(String email) {
        return Optional.ofNullable(store.get(email));
    }

    public void remove(String email) {
        store.remove(email);
    }

    @Scheduled(fixedRate = 60000) // runs every 60 seconds
    public void cleanupExpiredEntries() {
        store.entrySet().removeIf(entry ->
                LocalDateTime.now().isAfter(entry.getValue().getExpiresAt())
        );
    }
}

package com.manish.orgcheszer.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String baseKey = resolveKey(request);
        String path = request.getRequestURI();
        String category = getCategoryForPath(path);

        // COMBINED KEY: user:manish:auth OR user:manish:default
        String finalKey = "ratelimit:" + baseKey + ":" + category;

        try {
            Bucket bucket = proxyManager.builder().build(finalKey, () -> buildConfig(category));
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (probe.isConsumed()) {
                response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
                chain.doFilter(request, response);
            } else {
                long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
                response.setStatus(429);
                response.setContentType("application/json");
                response.setHeader("Retry-After", String.valueOf(waitSeconds));

                response.getWriter().write(String.format("""
                    {
                      "timestamp": "%s",
                      "status": 429,
                      "error": "Too Many Requests",
                      "message": "Rate limit exceeded. Try again in %d seconds.",
                      "path": "%s"
                    }
                    """, java.time.LocalDateTime.now(), waitSeconds, request.getRequestURI()));
            }
        } catch (Exception e) {
            // If Redis is down, log the error but allow the request to pass through!
            System.err.println("Redis Rate Limiter failed, bypassing... " + e.getMessage());
            chain.doFilter(request, response);
        }
    }

    private String resolveKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetails user) {
            return "user:" + user.getUsername();
        }

        String ip = getClientIp(request);
        String ua = request.getHeader("User-Agent");
        return "anon:" + ip + ":" + (ua != null ? ua.hashCode() : "unknown");
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // Categorize paths instead of just normalizing them
    private String getCategoryForPath(String path) {
        if (path.startsWith("/api/auth")) return "auth";
        if (path.contains("/generate") || path.contains("/end-early")) return "heavy";
        return "default";
    }

    private BucketConfiguration buildConfig(String category) {
        return switch (category) {
            case "auth", "heavy" -> BucketConfiguration.builder()
                    .addLimit(Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build())
                    .build();
            default -> BucketConfiguration.builder()
                    .addLimit(Bandwidth.builder().capacity(50).refillGreedy(50, Duration.ofMinutes(1)).build())
                    .build();
        };
    }
}
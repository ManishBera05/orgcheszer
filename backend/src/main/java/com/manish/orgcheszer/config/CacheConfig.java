package com.manish.orgcheszer.config;


import io.lettuce.core.ClientOptions;
import io.lettuce.core.TimeoutOptions;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.data.redis.autoconfigure.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Slf4j
@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    // Tell Spring's Cache Redis Client to Fail-Fast in 2000ms
    @Bean
    public LettuceClientConfigurationBuilderCustomizer lettuceClientCustomizer() {
        return builder -> builder.clientOptions(
                ClientOptions.builder()
                        .disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS) // Instantly reject if down
                        .timeoutOptions(TimeoutOptions.builder().fixedTimeout(Duration.ofMillis(2000)).build()) // 2000ms timeout
                        .build()
        );
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
                log.warn("Redis GET failed for key {}. Bypassing cache...", key);
            }

            @Override
            public void handleCachePutError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key, Object value) {
                log.warn("Redis PUT failed for key {}. Data saved to DB but not cached.", key);
            }

            @Override
            public void handleCacheEvictError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
                log.warn("Redis EVICT failed for key {}.", key);
            }

            @Override
            public void handleCacheClearError(@NonNull RuntimeException exception, @NonNull Cache cache) {
                log.warn("Redis CLEAR failed.");
            }
        };
    }
}
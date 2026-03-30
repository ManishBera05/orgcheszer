package com.manish.orgcheszer.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {

        // Use the new Spring Data Redis 4 Builder API
        GenericJacksonJsonRedisSerializer serializer = GenericJacksonJsonRedisSerializer.builder()
                // Explicitly enable default typing to save the class names in Redis.
                // This prevents the LinkedHashMap ClassCastException on retrieval.
                .enableUnsafeDefaultTyping()
                // Optionally add support for Spring Cache NullValues (good practice)
                .enableSpringCacheNullValueSupport()
                .build();

        RedisCacheConfiguration baseConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(serializer)
                );

        RedisCacheConfiguration leaderboardConfig = baseConfig
                .entryTtl(Duration.ofMinutes(5));

        RedisCacheConfiguration pairingsConfig = baseConfig
                .entryTtl(Duration.ofHours(24));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(baseConfig)
                .withCacheConfiguration("leaderboard", leaderboardConfig)
                .withCacheConfiguration("pairings", pairingsConfig)
                .enableStatistics()
                .build();
    }
}
package com.manish.orgcheszer.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ClientSideConfig;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.TimeoutOptions;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean
    public RedisClient redisClient(
            @Value("${spring.data.redis.host:localhost}") String host,
            @Value("${spring.data.redis.port:6379}") int port) {

        // 1. Set a very short timeout (e.g., 200 milliseconds)
        RedisURI redisUri = RedisURI.builder()
                .withHost(host)
                .withPort(port)
                .withTimeout(Duration.ofMillis(200)) // <-- FAIL FAST TIMEOUT
                .build();

        RedisClient client = RedisClient.create(redisUri);

        // 2. Tell Lettuce NOT to queue commands if Redis is disconnected
        client.setOptions(ClientOptions.builder()
                .disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS) // <-- INSTANTLY REJECT
                .timeoutOptions(TimeoutOptions.builder().fixedTimeout(Duration.ofMillis(2000)).build())
                .build());

        return client;
    }

    @Bean
    public ProxyManager<String> proxyManager(RedisClient redisClient) {

        StatefulRedisConnection<String, byte[]> connection =
                redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

        ExpirationAfterWriteStrategy expirationStrategy =
                ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                        Duration.ofHours(1)
                );

        ClientSideConfig clientConfig = ClientSideConfig.getDefault()
                .withExpirationAfterWriteStrategy(expirationStrategy);

        return LettuceBasedProxyManager.builderFor(connection)
                .withClientSideConfig(clientConfig)
                .build();
    }
}
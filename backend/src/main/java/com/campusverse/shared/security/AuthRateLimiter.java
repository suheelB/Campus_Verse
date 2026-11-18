package com.campusverse.shared.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window, in-memory limiter for authentication endpoints. It exists to
 * slow credential-stuffing and registration abuse on a single instance. For a
 * multi-instance deployment this should be replaced by a shared store (for
 * example Redis) so limits apply across nodes.
 */
@Component
public class AuthRateLimiter {

    private static final int MAX_TRACKED_KEYS = 10_000;

    public record Result(boolean allowed, long retryAfterSeconds) {
    }

    private record Window(Instant windowStart, int count) {
    }

    private final int maxAttempts;
    private final Duration window;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Autowired
    public AuthRateLimiter(
            @Value("${app.auth.rate-limit.max-attempts:10}") int maxAttempts,
            @Value("${app.auth.rate-limit.window-seconds:60}") long windowSeconds) {
        this(maxAttempts, Duration.ofSeconds(windowSeconds), Clock.systemUTC());
    }

    AuthRateLimiter(int maxAttempts, Duration window, Clock clock) {
        this.maxAttempts = Math.max(1, maxAttempts);
        this.window = window;
        this.clock = clock;
    }

    public Result tryAcquire(String key) {
        Instant now = clock.instant();
        evictIfCrowded(now);

        Window updated = windows.compute(key, (ignored, current) -> {
            if (current == null || !now.isBefore(current.windowStart().plus(window))) {
                return new Window(now, 1);
            }
            return new Window(current.windowStart(), current.count() + 1);
        });

        if (updated.count() <= maxAttempts) {
            return new Result(true, 0);
        }
        long retryAfter = Math.max(1, Duration.between(now, updated.windowStart().plus(window)).getSeconds());
        return new Result(false, retryAfter);
    }

    private void evictIfCrowded(Instant now) {
        if (windows.size() < MAX_TRACKED_KEYS) {
            return;
        }
        windows.entrySet().removeIf(entry -> !now.isBefore(entry.getValue().windowStart().plus(window)));
    }
}

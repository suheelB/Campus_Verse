package com.campusverse.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRateLimiterTest {

    @Test
    void allowsAttemptsUpToTheLimitThenBlocks() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        AuthRateLimiter limiter = new AuthRateLimiter(3, Duration.ofSeconds(60), clock);

        assertTrue(limiter.tryAcquire("1.2.3.4|/auth/login").allowed());
        assertTrue(limiter.tryAcquire("1.2.3.4|/auth/login").allowed());
        assertTrue(limiter.tryAcquire("1.2.3.4|/auth/login").allowed());

        AuthRateLimiter.Result blocked = limiter.tryAcquire("1.2.3.4|/auth/login");
        assertFalse(blocked.allowed());
        assertTrue(blocked.retryAfterSeconds() > 0);
    }

    @Test
    void separateKeysHaveIndependentBudgets() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        AuthRateLimiter limiter = new AuthRateLimiter(1, Duration.ofSeconds(60), clock);

        assertTrue(limiter.tryAcquire("1.2.3.4|/auth/login").allowed());
        assertFalse(limiter.tryAcquire("1.2.3.4|/auth/login").allowed());
        assertTrue(limiter.tryAcquire("1.2.3.4|/auth/register").allowed());
    }

    @Test
    void budgetResetsAfterWindow() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        AuthRateLimiter limiter = new AuthRateLimiter(1, Duration.ofSeconds(60), clock);

        assertTrue(limiter.tryAcquire("key").allowed());
        assertFalse(limiter.tryAcquire("key").allowed());

        clock.advance(Duration.ofSeconds(61));

        assertTrue(limiter.tryAcquire("key").allowed());
    }

    @Test
    void filterReturns429WithJsonBodyWhenBudgetExhausted() throws Exception {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        AuthRateLimitFilter filter = new AuthRateLimitFilter(
                new AuthRateLimiter(1, Duration.ofSeconds(60), clock));

        MockHttpServletRequest first = new MockHttpServletRequest("POST", "/auth/login");
        first.setServletPath("/auth/login");
        first.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(first, firstResponse, new MockFilterChain());
        assertEquals(200, firstResponse.getStatus());

        MockHttpServletRequest second = new MockHttpServletRequest("POST", "/auth/login");
        second.setServletPath("/auth/login");
        second.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(second, secondResponse, new MockFilterChain());

        assertEquals(429, secondResponse.getStatus());
        assertTrue(secondResponse.getContentAsString().contains("Too Many Requests"));
        assertTrue(secondResponse.getHeader("Retry-After") != null);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}

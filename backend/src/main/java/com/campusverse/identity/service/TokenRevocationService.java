package com.campusverse.identity.service;

import com.campusverse.identity.domain.RevokedToken;
import com.campusverse.identity.repository.RevokedTokenRepository;
import com.campusverse.identity.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokens;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public boolean revoke(String token, UUID userId) {
        UUID jti = tokenProvider.getTokenId(token);
        if (jti == null) {
            return false;
        }
        Instant expiresAt = tokenProvider.getExpirationFromToken(token);
        if (expiresAt == null || expiresAt.isBefore(Instant.now())) {
            return false;
        }
        if (!revokedTokens.existsById(jti)) {
            revokedTokens.save(RevokedToken.builder()
                    .jti(jti)
                    .userId(userId)
                    .expiresAt(expiresAt)
                    .build());
            log.info("Revoked JWT {} for user {}", jti, userId);
        }
        return true;
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(UUID jti) {
        return jti != null && revokedTokens.existsById(jti);
    }

    @Transactional
    public long purgeExpired() {
        long removed = revokedTokens.deleteByExpiresAtBefore(Instant.now());
        if (removed > 0) {
            log.info("Purged {} expired revoked tokens", removed);
        }
        return removed;
    }
}

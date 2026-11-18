package com.campusverse.identity.service;

import com.campusverse.identity.domain.RevokedToken;
import com.campusverse.identity.repository.RevokedTokenRepository;
import com.campusverse.identity.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenRevocationServiceTest {

    @Mock
    RevokedTokenRepository revokedTokens;
    @Mock
    JwtTokenProvider tokenProvider;

    TokenRevocationService service;

    @BeforeEach
    void setUp() {
        service = new TokenRevocationService(revokedTokens, tokenProvider);
    }

    @Test
    void revokePersistsTokenIdAndExpiry() {
        UUID jti = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Instant expiresAt = Instant.now().plus(1, ChronoUnit.HOURS);
        when(tokenProvider.getTokenId("token")).thenReturn(jti);
        when(tokenProvider.getExpirationFromToken("token")).thenReturn(expiresAt);

        assertTrue(service.revoke("token", userId));

        ArgumentCaptor<RevokedToken> captor = ArgumentCaptor.forClass(RevokedToken.class);
        verify(revokedTokens).save(captor.capture());
        assertEquals(jti, captor.getValue().getJti());
        assertEquals(userId, captor.getValue().getUserId());
        assertEquals(expiresAt, captor.getValue().getExpiresAt());
    }

    @Test
    void alreadyExpiredTokenIsNotStored() {
        when(tokenProvider.getTokenId("token")).thenReturn(UUID.randomUUID());
        when(tokenProvider.getExpirationFromToken("token"))
                .thenReturn(Instant.now().minus(1, ChronoUnit.MINUTES));

        assertFalse(service.revoke("token", UUID.randomUUID()));
        verify(revokedTokens, never()).save(any());
    }

    @Test
    void tokenWithoutIdIsNotStored() {
        when(tokenProvider.getTokenId("token")).thenReturn(null);

        assertFalse(service.revoke("token", UUID.randomUUID()));
        verify(revokedTokens, never()).save(any());
    }

    @Test
    void isRevokedConsultsStore() {
        UUID jti = UUID.randomUUID();
        when(revokedTokens.existsById(jti)).thenReturn(true);

        assertTrue(service.isRevoked(jti));
        assertFalse(service.isRevoked(null));
    }
}

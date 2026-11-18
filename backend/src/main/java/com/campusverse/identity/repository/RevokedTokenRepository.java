package com.campusverse.identity.repository;

import com.campusverse.identity.domain.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, UUID> {

    long deleteByExpiresAtBefore(Instant cutoff);
}

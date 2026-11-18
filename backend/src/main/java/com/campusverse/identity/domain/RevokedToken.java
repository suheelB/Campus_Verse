package com.campusverse.identity.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revoked_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokedToken {

    @Id
    @Column(name = "jti", updatable = false, nullable = false)
    private UUID jti;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "revoked_at", nullable = false, updatable = false)
    private Instant revokedAt;
}

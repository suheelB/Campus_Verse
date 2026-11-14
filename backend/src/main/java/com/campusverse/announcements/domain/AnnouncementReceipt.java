package com.campusverse.announcements.domain;

import com.campusverse.identity.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "announcement_receipts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"announcement_id", "user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementReceipt {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;
}

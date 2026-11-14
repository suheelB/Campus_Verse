package com.campusverse.announcements.domain;

import com.campusverse.clubs.domain.Club;
import com.campusverse.colleges.domain.College;
import com.campusverse.identity.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "announcements")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {

    public enum Priority {
        NORMAL, IMPORTANT, URGENT
    }

    public enum AudienceType {
        ALL_COLLEGE, CLUB_MEMBERS, CLUB_OFFICERS
    }

    public enum Status {
        DRAFT, SCHEDULED, PUBLISHED, EXPIRED, ARCHIVED
    }

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Priority priority = Priority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "audience_type", nullable = false)
    @Builder.Default
    private AudienceType audienceType = AudienceType.ALL_COLLEGE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.PUBLISHED;

    @Column(name = "publish_at", nullable = false)
    @Builder.Default
    private Instant publishAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "requires_acknowledgement", nullable = false)
    @Builder.Default
    private Boolean requiresAcknowledgement = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

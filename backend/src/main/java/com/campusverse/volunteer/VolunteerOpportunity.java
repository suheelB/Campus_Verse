package com.campusverse.volunteer;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "volunteer_opportunities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerOpportunity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_id", nullable = false)
    private User volunteer;

    @Column(name = "role", nullable = false, length = 100)
    private String role;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "required_skills", columnDefinition = "jsonb")
    private String requiredSkills;

    @Column(name = "hours_committed")
    private Integer hoursCommitted;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private Instant updatedAt;
}
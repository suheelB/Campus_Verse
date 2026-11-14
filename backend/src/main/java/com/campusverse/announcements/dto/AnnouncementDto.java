package com.campusverse.announcements.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDto {
    private UUID id;
    private UUID collegeId;
    private UUID clubId;
    private String clubName;
    private UUID authorId;
    private String authorName;
    private String title;
    private String body;
    private String priority;
    private String audienceType;
    private String status;
    private Instant publishAt;
    private Instant expiresAt;
    private Boolean requiresAcknowledgement;
    private Instant createdAt;
    private boolean read;
    private boolean acknowledged;
    private long readCount;
    private long acknowledgedCount;
}

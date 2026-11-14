package com.campusverse.announcements.dto;

import com.campusverse.announcements.domain.Announcement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class AnnouncementRequest {
    private UUID clubId;
    @NotBlank @Size(max = 255)
    private String title;
    @NotBlank @Size(max = 20000)
    private String body;
    private Announcement.Priority priority = Announcement.Priority.NORMAL;
    private Announcement.AudienceType audienceType = Announcement.AudienceType.ALL_COLLEGE;
    private Announcement.Status status = Announcement.Status.PUBLISHED;
    private Instant publishAt;
    private Instant expiresAt;
    private Boolean requiresAcknowledgement = false;
}

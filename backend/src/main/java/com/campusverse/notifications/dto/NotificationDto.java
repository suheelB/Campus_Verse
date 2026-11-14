package com.campusverse.notifications.dto;

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
public class NotificationDto {
    private UUID id;
    private String type;
    private String title;
    private String body;
    private String resourceType;
    private UUID resourceId;
    private Instant readAt;
    private Instant createdAt;
}

package com.campusverse.audit.api;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AuditLogDto {
    private UUID id;
    private UUID actorUserId;
    private String action;
    private String entityType;
    private UUID entityId;
    private Object details;
    private String ipAddress;
    private Instant createdAt;
}

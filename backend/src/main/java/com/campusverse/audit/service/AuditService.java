package com.campusverse.audit.service;

import com.campusverse.audit.api.AuditLogDto;
import com.campusverse.audit.domain.AuditLog;
import com.campusverse.audit.repository.AuditLogRepository;
import com.campusverse.identity.security.CustomUserDetails;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;
import java.util.UUID;

/**
 * Writes the immutable audit trail for sensitive actions. Writes share the
 * caller's transaction so the audit row and the action commit together. An
 * insert failure is logged loudly; in a transactional caller the surrounding
 * transaction then fails rather than committing without its audit row.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuditService {

    private static final int MAX_ACTION_LENGTH = 100;

    private final AuditLogRepository logs;
    private final ObjectMapper objectMapper;

    public void record(String action, String entityType, UUID entityId, Map<String, Object> details) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof CustomUserDetails user
                && user.getCollegeId() != null) {
            record(user.getCollegeId(), user.getUserId(), action, entityType, entityId, details);
        }
    }

    public void record(UUID collegeId, UUID actorUserId, String action, String entityType,
                       UUID entityId, Map<String, Object> details) {
        if (collegeId == null) {
            log.warn("Skipping audit entry without college scope: action={} entity={}", action, entityType);
            return;
        }
        try {
            logs.save(AuditLog.builder()
                    .collegeId(collegeId)
                    .actorUserId(actorUserId)
                    .action(truncate(action))
                    .entityType(truncate(entityType))
                    .entityId(entityId)
                    .details(serialize(details))
                    .ipAddress(clientIp())
                    .build());
        } catch (RuntimeException ex) {
            log.error("Failed to persist audit entry action={} entityType={} entityId={}",
                    action, entityType, entityId, ex);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> search(UUID collegeId, String action, String entityType, UUID entityId,
                                    Pageable pageable) {
        Page<AuditLog> page;
        if (entityType != null && !entityType.isBlank() && entityId != null) {
            page = logs.findByCollegeIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    collegeId, entityType.trim(), entityId, pageable);
        } else if (action != null && !action.isBlank()) {
            page = logs.findByCollegeIdAndActionOrderByCreatedAtDesc(collegeId, action.trim(), pageable);
        } else if (entityType != null && !entityType.isBlank()) {
            page = logs.findByCollegeIdAndEntityTypeOrderByCreatedAtDesc(collegeId, entityType.trim(), pageable);
        } else {
            page = logs.findByCollegeIdOrderByCreatedAtDesc(collegeId, pageable);
        }
        return page.map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog log) {
        return new AuditLogDto(log.getId(), log.getActorUserId(), log.getAction(), log.getEntityType(),
                log.getEntityId(), parse(log.getDetails()), log.getIpAddress(), log.getCreatedAt());
    }

    private Object parse(String details) {
        if (details == null || details.isBlank()) {
            return Map.of();
        }
        try {
            JsonNode node = objectMapper.readTree(details);
            return node;
        } catch (JsonProcessingException ex) {
            return details;
        }
    }

    private String serialize(Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException ex) {
            return "{\"serializationError\":true}";
        }
    }

    private String truncate(String value) {
        if (value == null) {
            return "UNKNOWN";
        }
        return value.length() <= MAX_ACTION_LENGTH ? value : value.substring(0, MAX_ACTION_LENGTH);
    }

    private String clientIp() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
            return null;
        }
        HttpServletRequest request = servletAttributes.getRequest();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

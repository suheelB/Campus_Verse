package com.campusverse.notifications.service;

import com.campusverse.identity.domain.User;
import com.campusverse.notifications.domain.Notification;
import com.campusverse.notifications.dto.NotificationDto;
import com.campusverse.notifications.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    private final NotificationRepository notifications;

    public void createNotification(User user, String type, String title, String body,
                                   String resourceType, UUID resourceId, String deduplicationKey) {
        if (deduplicationKey != null && notifications.existsByUserIdAndDeduplicationKey(user.getId(), deduplicationKey)) {
            return;
        }
        notifications.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .deduplicationKey(deduplicationKey)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> list(UUID userId, Pageable pageable) {
        return notifications.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notifications.countByUserIdAndReadAtIsNull(userId);
    }

    public NotificationDto markRead(UUID notificationId, UUID userId) {
        Notification notification = notifications.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return toDto(notification);
    }

    public void markAllRead(UUID userId) {
        notifications.markAllAsRead(userId, Instant.now());
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .resourceType(n.getResourceType())
                .resourceId(n.getResourceId())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

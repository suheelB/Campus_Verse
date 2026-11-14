package com.campusverse.notifications.controller;

import com.campusverse.identity.security.CustomUserDetails;
import com.campusverse.notifications.dto.NotificationDto;
import com.campusverse.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Page<NotificationDto> list(
            @AuthenticationPrincipal CustomUserDetails user,
            Pageable pageable) {
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50), Sort.by("createdAt").descending());
        return notificationService.list(user.getUserId(), bounded);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal CustomUserDetails user) {
        return Map.of("count", notificationService.unreadCount(user.getUserId()));
    }

    @PutMapping("/{id}/read")
    public NotificationDto markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return notificationService.markRead(id, user.getUserId());
    }

    @PutMapping("/read-all")
    public void markAllRead(@AuthenticationPrincipal CustomUserDetails user) {
        notificationService.markAllRead(user.getUserId());
    }
}

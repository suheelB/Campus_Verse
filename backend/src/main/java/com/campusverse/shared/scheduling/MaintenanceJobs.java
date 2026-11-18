package com.campusverse.shared.scheduling;

import com.campusverse.announcements.service.AnnouncementService;
import com.campusverse.identity.service.TokenRevocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Background maintenance for pilot operations: publish scheduled
 * announcements, expire stale announcements, and purge revoked tokens whose
 * original expiry has already passed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MaintenanceJobs {

    private final AnnouncementService announcementService;
    private final TokenRevocationService tokenRevocationService;

    @Scheduled(fixedDelayString = "${app.maintenance.announcement-interval-ms:60000}")
    public void processAnnouncements() {
        Instant now = Instant.now();
        safe("publish scheduled announcements", () -> announcementService.publishScheduledDue(now));
        safe("expire announcements", () -> announcementService.expireDue(now));
    }

    @Scheduled(fixedDelayString = "${app.maintenance.token-purge-interval-ms:3600000}")
    public void purgeRevokedTokens() {
        safe("purge revoked tokens", tokenRevocationService::purgeExpired);
    }

    private void safe(String task, Runnable action) {
        try {
            action.run();
        } catch (RuntimeException ex) {
            log.error("Scheduled task '{}' failed", task, ex);
        }
    }
}

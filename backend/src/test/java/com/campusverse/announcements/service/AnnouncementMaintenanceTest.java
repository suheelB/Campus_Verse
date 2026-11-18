package com.campusverse.announcements.service;

import com.campusverse.announcements.domain.Announcement;
import com.campusverse.announcements.repository.AnnouncementRepository;
import com.campusverse.announcements.repository.AnnouncementReceiptRepository;
import com.campusverse.audit.service.AuditService;
import com.campusverse.clubs.repository.ClubRepository;
import com.campusverse.clubs.repository.MembershipRepository;
import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.identity.domain.User;
import com.campusverse.identity.repository.UserRepository;
import com.campusverse.notifications.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnouncementMaintenanceTest {

    @Mock AnnouncementRepository announcements;
    @Mock AnnouncementReceiptRepository receipts;
    @Mock ClubRepository clubs;
    @Mock MembershipRepository memberships;
    @Mock UserRepository users;
    @Mock CollegeRepository colleges;
    @Mock NotificationService notifications;
    @Mock JdbcTemplate jdbc;
    @Mock AuditService audit;

    AnnouncementService service;

    UUID collegeId = UUID.randomUUID();
    College college;
    User author;

    @BeforeEach
    void setUp() {
        service = new AnnouncementService(announcements, receipts, clubs, memberships, users, colleges,
                notifications, jdbc, audit);
        college = College.builder().id(collegeId).name("Demo College").build();
        author = User.builder().id(UUID.randomUUID()).collegeId(collegeId).status(User.Status.ACTIVE)
                .displayName("Alice Admin").build();
    }

    @Test
    void publishesDueScheduledAnnouncements() {
        Announcement scheduled = Announcement.builder()
                .id(UUID.randomUUID())
                .college(college)
                .author(author)
                .title("Welcome back")
                .body("Semester kickoff")
                .status(Announcement.Status.SCHEDULED)
                .audienceType(Announcement.AudienceType.ALL_COLLEGE)
                .publishAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(announcements.findDueForPublishing(any())).thenReturn(List.of(scheduled));
        when(users.findByCollegeIdAndStatus(collegeId, User.Status.ACTIVE)).thenReturn(List.of(author));

        int published = service.publishScheduledDue(Instant.now());

        assertEquals(1, published);
        assertEquals(Announcement.Status.PUBLISHED, scheduled.getStatus());
        verify(announcements).save(scheduled);
        verify(audit).record(eq(collegeId), eq(author.getId()), eq("ANNOUNCEMENT_PUBLISH"),
                eq("ANNOUNCEMENT"), eq(scheduled.getId()), any());
    }

    @Test
    void expiresAnnouncementsPastTheirExpiry() {
        Announcement expired = Announcement.builder()
                .id(UUID.randomUUID())
                .college(college)
                .author(author)
                .title("Old notice")
                .body("No longer relevant")
                .status(Announcement.Status.PUBLISHED)
                .publishAt(Instant.now().minus(10, ChronoUnit.DAYS))
                .expiresAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();

        when(announcements.findExpired(any())).thenReturn(List.of(expired));

        int count = service.expireDue(Instant.now());

        assertEquals(1, count);
        assertEquals(Announcement.Status.EXPIRED, expired.getStatus());
        verify(announcements).save(expired);
        verify(audit).record(eq(collegeId), eq(author.getId()), eq("ANNOUNCEMENT_EXPIRE"),
                eq("ANNOUNCEMENT"), eq(expired.getId()), any());
    }
}

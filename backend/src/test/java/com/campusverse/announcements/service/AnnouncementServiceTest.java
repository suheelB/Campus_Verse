package com.campusverse.announcements.service;

import com.campusverse.announcements.domain.Announcement;
import com.campusverse.announcements.domain.AnnouncementReceipt;
import com.campusverse.announcements.dto.AnnouncementDto;
import com.campusverse.announcements.dto.AnnouncementRequest;
import com.campusverse.announcements.repository.AnnouncementReceiptRepository;
import com.campusverse.announcements.repository.AnnouncementRepository;
import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.ClubRole;
import com.campusverse.clubs.domain.Membership;
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
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    @Mock AnnouncementRepository announcements;
    @Mock AnnouncementReceiptRepository receipts;
    @Mock ClubRepository clubs;
    @Mock MembershipRepository memberships;
    @Mock UserRepository users;
    @Mock CollegeRepository colleges;
    @Mock NotificationService notifications;
    @Mock JdbcTemplate jdbc;

    AnnouncementService service;

    UUID collegeId = UUID.randomUUID();
    UUID authorId = UUID.randomUUID();
    UUID clubId = UUID.randomUUID();
    College college;
    User author;
    Club club;

    @BeforeEach
    void setUp() {
        service = new AnnouncementService(announcements, receipts, clubs, memberships, users, colleges, notifications, jdbc);
        college = College.builder().id(collegeId).name("Demo College").build();
        author = User.builder().id(authorId).collegeId(collegeId).status(User.Status.ACTIVE).displayName("Alice Officer").build();
        club = Club.builder().id(clubId).name("Robotics Club").college(college).status(Club.Status.ACTIVE).build();
    }

    @Test
    void nonOfficerCannotPublishClubAnnouncement() {
        AnnouncementRequest req = new AnnouncementRequest();
        req.setClubId(clubId);
        req.setTitle("Important Update");
        req.setBody("Details here");

        when(users.findById(authorId)).thenReturn(Optional.of(author));
        when(colleges.findById(collegeId)).thenReturn(Optional.of(college));
        when(clubs.findById(clubId)).thenReturn(Optional.of(club));
        when(jdbc.queryForObject(any(), eq(Boolean.class), eq(authorId), eq(collegeId))).thenReturn(false);
        when(memberships.findByClubAndUser(club, author)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> service.create(req, authorId, collegeId));
        verify(announcements, never()).save(any());
    }

    @Test
    void officerCanPublishClubAnnouncementAndMembersAreNotified() {
        AnnouncementRequest req = new AnnouncementRequest();
        req.setClubId(clubId);
        req.setTitle("Kickoff Meeting");
        req.setBody("Meeting at 5pm");
        req.setAudienceType(Announcement.AudienceType.CLUB_MEMBERS);

        ClubRole officerRole = ClubRole.builder().name("OFFICER").permissions("[\"MANAGE_MEMBERS\"]").build();
        Membership officerMem = Membership.builder().club(club).user(author).role(officerRole).status(Membership.Status.ACTIVE).build();

        User member = User.builder().id(UUID.randomUUID()).displayName("Bob Member").collegeId(collegeId).status(User.Status.ACTIVE).build();
        Membership normalMem = Membership.builder().club(club).user(member).status(Membership.Status.ACTIVE).build();

        when(users.findById(authorId)).thenReturn(Optional.of(author));
        when(colleges.findById(collegeId)).thenReturn(Optional.of(college));
        when(clubs.findById(clubId)).thenReturn(Optional.of(club));
        when(jdbc.queryForObject(any(), eq(Boolean.class), eq(authorId), eq(collegeId))).thenReturn(false);
        when(memberships.findByClubAndUser(club, author)).thenReturn(Optional.of(officerMem));
        when(announcements.save(any())).thenAnswer(inv -> {
            Announcement a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(memberships.findByClubAndStatus(club, Membership.Status.ACTIVE)).thenReturn(java.util.List.of(officerMem, normalMem));

        AnnouncementDto dto = service.create(req, authorId, collegeId);
        assertNotNull(dto);
        assertEquals("Kickoff Meeting", dto.getTitle());
        verify(notifications, times(2)).createNotification(any(), eq("ANNOUNCEMENT"), any(), any(), eq("ANNOUNCEMENT"), any(), any());
    }

    @Test
    void nonAdminCannotPublishCollegeWideAnnouncement() {
        AnnouncementRequest req = new AnnouncementRequest();
        req.setClubId(null);
        req.setTitle("Campus Closure");
        req.setBody("Snow day tomorrow");

        when(users.findById(authorId)).thenReturn(Optional.of(author));
        when(colleges.findById(collegeId)).thenReturn(Optional.of(college));
        when(jdbc.queryForObject(any(), eq(Boolean.class), eq(authorId), eq(collegeId))).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.create(req, authorId, collegeId));
        verify(announcements, never()).save(any());
    }

    @Test
    void memberCanAcknowledgeRequiredAnnouncement() {
        UUID announcementId = UUID.randomUUID();
        Announcement announcement = Announcement.builder()
                .id(announcementId)
                .college(college)
                .club(club)
                .author(author)
                .title("Safety Policy")
                .body("Must sign")
                .status(Announcement.Status.PUBLISHED)
                .audienceType(Announcement.AudienceType.CLUB_MEMBERS)
                .requiresAcknowledgement(true)
                .build();

        User student = User.builder().id(UUID.randomUUID()).collegeId(collegeId).status(User.Status.ACTIVE).displayName("Student").build();
        Membership memberShip = Membership.builder().club(club).user(student).status(Membership.Status.ACTIVE).build();

        when(announcements.findByIdAndCollegeId(announcementId, collegeId)).thenReturn(Optional.of(announcement));
        when(users.findById(student.getId())).thenReturn(Optional.of(student));
        when(jdbc.queryForObject(any(), eq(Boolean.class), eq(student.getId()), eq(collegeId))).thenReturn(false);
        when(memberships.findByClubAndUser(club, student)).thenReturn(Optional.of(memberShip));
        when(receipts.findByAnnouncementIdAndUserId(announcementId, student.getId())).thenReturn(Optional.empty());
        when(receipts.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AnnouncementDto dto = service.acknowledge(announcementId, collegeId, student.getId());
        assertNotNull(dto);
        assertTrue(dto.isAcknowledged());
        verify(receipts).save(any());
    }
}

package com.campusverse.announcements.service;

import com.campusverse.announcements.domain.Announcement;
import com.campusverse.announcements.domain.AnnouncementReceipt;
import com.campusverse.announcements.dto.AnnouncementDto;
import com.campusverse.announcements.dto.AnnouncementRequest;
import com.campusverse.announcements.repository.AnnouncementReceiptRepository;
import com.campusverse.announcements.repository.AnnouncementRepository;
import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.Membership;
import com.campusverse.clubs.repository.ClubRepository;
import com.campusverse.clubs.repository.MembershipRepository;
import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.identity.domain.User;
import com.campusverse.identity.repository.UserRepository;
import com.campusverse.audit.service.AuditService;
import com.campusverse.notifications.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AnnouncementService {

    private final AnnouncementRepository announcements;
    private final AnnouncementReceiptRepository receipts;
    private final ClubRepository clubs;
    private final MembershipRepository memberships;
    private final UserRepository users;
    private final CollegeRepository colleges;
    private final NotificationService notifications;
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public Page<AnnouncementDto> feed(UUID collegeId, UUID userId, Pageable pageable) {
        User user = activeUser(userId, collegeId);
        List<Membership> userMemberships = memberships.findByUserAndStatus(user, Membership.Status.ACTIVE);
        Set<UUID> memberClubIds = new HashSet<>();
        Set<UUID> officerClubIds = new HashSet<>();

        for (Membership m : userMemberships) {
            memberClubIds.add(m.getClub().getId());
            if (m.getRole() != null && m.getRole().getPermissions().contains("MANAGE_MEMBERS")) {
                officerClubIds.add(m.getClub().getId());
            }
        }
        if (memberClubIds.isEmpty()) memberClubIds.add(UUID.randomUUID());
        if (officerClubIds.isEmpty()) officerClubIds.add(UUID.randomUUID());

        Instant now = Instant.now();
        Page<Announcement> page = announcements.findFeed(collegeId, userId, memberClubIds, officerClubIds, now, pageable);
        List<UUID> announcementIds = page.getContent().stream().map(Announcement::getId).toList();
        Map<UUID, AnnouncementReceipt> userReceipts = new HashMap<>();
        if (!announcementIds.isEmpty()) {
            receipts.findAllByUserIdAndAnnouncementIdIn(userId, announcementIds)
                    .forEach(r -> userReceipts.put(r.getAnnouncement().getId(), r));
        }

        return page.map(a -> toDto(a, userReceipts.get(a.getId())));
    }

    public AnnouncementDto get(UUID announcementId, UUID collegeId, UUID userId) {
        Announcement announcement = announcements.findByIdAndCollegeId(announcementId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found"));
        User user = activeUser(userId, collegeId);
        checkAudienceEligibility(announcement, user);

        AnnouncementReceipt receipt = receipts.findByAnnouncementIdAndUserId(announcementId, userId)
                .orElseGet(() -> AnnouncementReceipt.builder()
                        .announcement(announcement)
                        .user(user)
                        .build());
        if (receipt.getReadAt() == null) {
            receipt.setReadAt(Instant.now());
            receipt = receipts.save(receipt);
        }

        return toDto(announcement, receipt);
    }

    public AnnouncementDto create(AnnouncementRequest request, UUID authorId, UUID collegeId) {
        User author = activeUser(authorId, collegeId);
        College college = college(collegeId);
        Club club = null;

        if (request.getClubId() == null) {
            // College-wide requires college admin
            if (!isCollegeAdmin(authorId, collegeId)) {
                throw new AccessDeniedException("Only college administrators can publish college-wide announcements");
            }
            if (request.getAudienceType() != Announcement.AudienceType.ALL_COLLEGE) {
                throw new IllegalArgumentException("College-wide announcements must target the entire college");
            }
        } else {
            club = clubs.findById(request.getClubId())
                    .orElseThrow(() -> new EntityNotFoundException("Club not found"));
            if (!club.getCollege().getId().equals(collegeId)) {
                throw new EntityNotFoundException("Club not found");
            }
            requireOfficer(club, authorId, collegeId);
            if (request.getAudienceType() == Announcement.AudienceType.ALL_COLLEGE) {
                throw new IllegalArgumentException("Club announcements can only target club members or club officers");
            }
        }

        Instant publishAt = request.getPublishAt() != null ? request.getPublishAt() : Instant.now();
        Announcement.Status initialStatus = request.getStatus();
        if (initialStatus == Announcement.Status.PUBLISHED && publishAt.isAfter(Instant.now())) {
            initialStatus = Announcement.Status.SCHEDULED;
        }

        Announcement announcement = Announcement.builder()
                .college(college)
                .club(club)
                .author(author)
                .title(request.getTitle().trim())
                .body(request.getBody().trim())
                .priority(request.getPriority())
                .audienceType(request.getAudienceType())
                .status(initialStatus)
                .publishAt(publishAt)
                .expiresAt(request.getExpiresAt())
                .requiresAcknowledgement(Boolean.TRUE.equals(request.getRequiresAcknowledgement()))
                .build();
        announcement = announcements.save(announcement);

        // Notify eligible audience if published now
        if (announcement.getStatus() == Announcement.Status.PUBLISHED) {
            dispatchNotifications(announcement);
        }

        audit.record(collegeId, authorId,
                announcement.getStatus() == Announcement.Status.PUBLISHED
                        ? "ANNOUNCEMENT_PUBLISH" : "ANNOUNCEMENT_CREATE",
                "ANNOUNCEMENT", announcement.getId(),
                Map.of("title", announcement.getTitle(), "status", announcement.getStatus().name()));

        return toDto(announcement, null);
    }

    public AnnouncementDto update(UUID announcementId, AnnouncementRequest request, UUID actorId, UUID collegeId) {
        Announcement announcement = announcements.findByIdAndCollegeId(announcementId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found"));
        if (!announcement.getAuthor().getId().equals(actorId) && !isCollegeAdmin(actorId, collegeId)) {
            if (announcement.getClub() != null) {
                requireOfficer(announcement.getClub(), actorId, collegeId);
            } else {
                throw new AccessDeniedException("Not authorized to edit this announcement");
            }
        }

        if (announcement.getClub() == null && request.getAudienceType() != Announcement.AudienceType.ALL_COLLEGE) {
            throw new IllegalArgumentException("College-wide announcements must target the entire college");
        }
        if (announcement.getClub() != null && request.getAudienceType() == Announcement.AudienceType.ALL_COLLEGE) {
            throw new IllegalArgumentException("Club announcements can only target club members or club officers");
        }

        Announcement.Status previousStatus = announcement.getStatus();
        announcement.setTitle(request.getTitle().trim());
        announcement.setBody(request.getBody().trim());
        announcement.setPriority(request.getPriority());
        announcement.setAudienceType(request.getAudienceType());
        announcement.setPublishAt(request.getPublishAt() != null ? request.getPublishAt() : announcement.getPublishAt());
        announcement.setExpiresAt(request.getExpiresAt());
        announcement.setRequiresAcknowledgement(Boolean.TRUE.equals(request.getRequiresAcknowledgement()));
        if (request.getStatus() != null) {
            announcement.setStatus(request.getStatus());
        }

        announcement = announcements.save(announcement);
        if (previousStatus != Announcement.Status.PUBLISHED && announcement.getStatus() == Announcement.Status.PUBLISHED) {
            dispatchNotifications(announcement);
        }
        audit.record(collegeId, actorId,
                previousStatus != Announcement.Status.PUBLISHED && announcement.getStatus() == Announcement.Status.PUBLISHED
                        ? "ANNOUNCEMENT_PUBLISH" : "ANNOUNCEMENT_UPDATE",
                "ANNOUNCEMENT", announcement.getId(),
                Map.of("title", announcement.getTitle(), "status", announcement.getStatus().name()));
        return toDto(announcement, null);
    }

    public AnnouncementDto acknowledge(UUID announcementId, UUID collegeId, UUID userId) {
        Announcement announcement = announcements.findByIdAndCollegeId(announcementId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found"));
        User user = activeUser(userId, collegeId);
        checkAudienceEligibility(announcement, user);

        AnnouncementReceipt receipt = receipts.findByAnnouncementIdAndUserId(announcementId, userId)
                .orElseGet(() -> AnnouncementReceipt.builder()
                        .announcement(announcement)
                        .user(user)
                        .readAt(Instant.now())
                        .build());
        receipt.setAcknowledgedAt(Instant.now());
        receipt = receipts.save(receipt);

        audit.record(collegeId, userId, "ANNOUNCEMENT_ACKNOWLEDGE", "ANNOUNCEMENT", announcementId,
                Map.of("title", announcement.getTitle()));

        return toDto(announcement, receipt);
    }

    public void markRead(UUID announcementId, UUID collegeId, UUID userId) {
        Announcement announcement = announcements.findByIdAndCollegeId(announcementId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found"));
        User user = activeUser(userId, collegeId);
        checkAudienceEligibility(announcement, user);

        AnnouncementReceipt receipt = receipts.findByAnnouncementIdAndUserId(announcementId, userId)
                .orElseGet(() -> AnnouncementReceipt.builder()
                        .announcement(announcement)
                        .user(user)
                        .build());
        if (receipt.getReadAt() == null) {
            receipt.setReadAt(Instant.now());
            receipts.save(receipt);
        }
    }

    @Transactional(readOnly = true)
    public Page<AnnouncementDto> clubAnnouncements(UUID clubId, UUID actorId, UUID collegeId, Pageable pageable) {
        Club club = clubs.findById(clubId).orElseThrow(() -> new EntityNotFoundException("Club not found"));
        if (!club.getCollege().getId().equals(collegeId)) throw new EntityNotFoundException("Club not found");
        requireOfficer(club, actorId, collegeId);

        return announcements.findByClubIdOrderByCreatedAtDesc(clubId, pageable)
                .map(a -> toDto(a, null));
    }

    @Transactional(readOnly = true)
    public List<AnnouncementDto> myCreated(UUID authorId, UUID collegeId) {
        return announcements.findByAuthorIdAndCollegeIdOrderByCreatedAtDesc(authorId, collegeId)
                .stream().map(a -> toDto(a, null)).toList();
    }

    /**
     * Promotes scheduled announcements whose publish time has arrived and sends
     * their notifications. Invoked by the scheduled maintenance job.
     */
    public int publishScheduledDue(Instant now) {
        List<Announcement> due = announcements.findDueForPublishing(now);
        for (Announcement announcement : due) {
            announcement.setStatus(Announcement.Status.PUBLISHED);
            announcements.save(announcement);
            dispatchNotifications(announcement);
            audit.record(announcement.getCollege().getId(), announcement.getAuthor().getId(),
                    "ANNOUNCEMENT_PUBLISH", "ANNOUNCEMENT", announcement.getId(),
                    Map.of("title", announcement.getTitle(), "scheduled", true));
        }
        return due.size();
    }

    /**
     * Marks published announcements past their expiry so they stop appearing in
     * feeds. Invoked by the scheduled maintenance job.
     */
    public int expireDue(Instant now) {
        List<Announcement> expired = announcements.findExpired(now);
        for (Announcement announcement : expired) {
            announcement.setStatus(Announcement.Status.EXPIRED);
            announcements.save(announcement);
            audit.record(announcement.getCollege().getId(), announcement.getAuthor().getId(),
                    "ANNOUNCEMENT_EXPIRE", "ANNOUNCEMENT", announcement.getId(),
                    Map.of("title", announcement.getTitle()));
        }
        return expired.size();
    }

    private void dispatchNotifications(Announcement announcement) {
        if (announcement.getClub() != null) {
            notifyClubMembers(announcement.getClub(), announcement);
        } else {
            notifyCollegeMembers(announcement);
        }
    }

    private void notifyCollegeMembers(Announcement announcement) {
        List<User> recipients = users.findByCollegeIdAndStatus(
                announcement.getCollege().getId(), User.Status.ACTIVE);
        for (User recipient : recipients) {
            if (recipient.getId().equals(announcement.getAuthor().getId())) {
                continue;
            }
            notifications.createNotification(
                    recipient,
                    "ANNOUNCEMENT",
                    announcement.getTitle(),
                    announcement.getBody().substring(0, Math.min(200, announcement.getBody().length())),
                    "ANNOUNCEMENT",
                    announcement.getId(),
                    "announcement:" + announcement.getId() + ":" + recipient.getId()
            );
        }
    }

    private void notifyClubMembers(Club club, Announcement announcement) {
        List<Membership> activeMembers = memberships.findByClubAndStatus(club, Membership.Status.ACTIVE);
        for (Membership m : activeMembers) {
            if (announcement.getAudienceType() == Announcement.AudienceType.CLUB_OFFICERS &&
                    (m.getRole() == null || !m.getRole().getPermissions().contains("MANAGE_MEMBERS"))) {
                continue;
            }
            String dedup = "announcement:" + announcement.getId() + ":" + m.getUser().getId();
            notifications.createNotification(
                    m.getUser(),
                    "ANNOUNCEMENT",
                    announcement.getTitle(),
                    announcement.getBody().substring(0, Math.min(200, announcement.getBody().length())),
                    "ANNOUNCEMENT",
                    announcement.getId(),
                    dedup
            );
        }
    }

    private void checkAudienceEligibility(Announcement a, User user) {
        if (a.getAuthor().getId().equals(user.getId()) || isCollegeAdmin(user.getId(), a.getCollege().getId())) {
            return;
        }
        if (a.getStatus() != Announcement.Status.PUBLISHED) {
            throw new AccessDeniedException("Announcement is not published");
        }
        if (a.getClub() == null && a.getAudienceType() == Announcement.AudienceType.ALL_COLLEGE) {
            return;
        }
        if (a.getClub() != null) {
            Membership m = memberships.findByClubAndUser(a.getClub(), user).orElse(null);
            if (m != null && m.getStatus() == Membership.Status.ACTIVE) {
                if (a.getAudienceType() == Announcement.AudienceType.CLUB_OFFICERS) {
                    if (m.getRole() != null && m.getRole().getPermissions().contains("MANAGE_MEMBERS")) {
                        return;
                    }
                } else {
                    return;
                }
            }
        }
        throw new AccessDeniedException("You are not part of this announcement's target audience");
    }

    private AnnouncementDto toDto(Announcement a, AnnouncementReceipt r) {
        long readCount = receipts.countByAnnouncementIdAndReadAtIsNotNull(a.getId());
        long ackCount = receipts.countByAnnouncementIdAndAcknowledgedAtIsNotNull(a.getId());

        return AnnouncementDto.builder()
                .id(a.getId())
                .collegeId(a.getCollege().getId())
                .clubId(a.getClub() != null ? a.getClub().getId() : null)
                .clubName(a.getClub() != null ? a.getClub().getName() : null)
                .authorId(a.getAuthor().getId())
                .authorName(a.getAuthor().getDisplayName())
                .title(a.getTitle())
                .body(a.getBody())
                .priority(a.getPriority().name())
                .audienceType(a.getAudienceType().name())
                .status(a.getStatus().name())
                .publishAt(a.getPublishAt())
                .expiresAt(a.getExpiresAt())
                .requiresAcknowledgement(a.getRequiresAcknowledgement())
                .createdAt(a.getCreatedAt())
                .read(r != null && r.getReadAt() != null)
                .acknowledged(r != null && r.getAcknowledgedAt() != null)
                .readCount(readCount)
                .acknowledgedCount(ackCount)
                .build();
    }

    private void requireOfficer(Club club, UUID actorId, UUID collegeId) {
        User actor = activeUser(actorId, collegeId);
        if (isCollegeAdmin(actorId, collegeId)) return;
        Membership m = memberships.findByClubAndUser(club, actor).orElse(null);
        if (m == null || m.getStatus() != Membership.Status.ACTIVE || m.getRole() == null ||
                !m.getRole().getPermissions().contains("MANAGE_MEMBERS")) {
            throw new AccessDeniedException("Club officer permission required");
        }
    }

    private boolean isCollegeAdmin(UUID userId, UUID collegeId) {
        Boolean authorized = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM platform_role_assignments WHERE user_id = ? AND ((role = 'COLLEGE_ADMIN' AND college_id = ?) OR role = 'PLATFORM_ADMIN'))",
                Boolean.class, userId, collegeId);
        return Boolean.TRUE.equals(authorized);
    }

    private User activeUser(UUID userId, UUID collegeId) {
        User user = users.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (!user.getCollegeId().equals(collegeId) || user.getStatus() != User.Status.ACTIVE) {
            throw new AccessDeniedException("Active membership in this college is required");
        }
        return user;
    }

    private College college(UUID id) {
        return colleges.findById(id).orElseThrow(() -> new EntityNotFoundException("College not found"));
    }
}

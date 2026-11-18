package com.campusverse.clubs.service;

import com.campusverse.audit.service.AuditService;
import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.ClubCategory;
import com.campusverse.clubs.domain.ClubRole;
import com.campusverse.clubs.domain.Membership;
import com.campusverse.clubs.dto.ClubDto;
import com.campusverse.clubs.dto.ClubRequest;
import com.campusverse.clubs.dto.MembershipDto;
import com.campusverse.clubs.repository.ClubCategoryRepository;
import com.campusverse.clubs.repository.ClubRepository;
import com.campusverse.clubs.repository.ClubRoleRepository;
import com.campusverse.clubs.repository.MembershipRepository;
import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.identity.domain.User;
import com.campusverse.identity.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ClubService {
    private final ClubRepository clubs;
    private final ClubCategoryRepository categories;
    private final ClubRoleRepository roles;
    private final MembershipRepository memberships;
    private final CollegeRepository colleges;
    private final UserRepository users;
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public Page<ClubDto> directory(UUID collegeId, UUID viewerId, String search, String categorySlug, Pageable pageable) {
        activeUser(viewerId, collegeId);
        College college = college(collegeId);
        return clubs.searchDirectory(college, Club.Status.ACTIVE, search, categorySlug, pageable).map(this::clubDto);
    }

    @Transactional(readOnly = true)
    public ClubDto detail(UUID id, UUID collegeId, UUID viewerId) {
        User viewer = activeUser(viewerId, collegeId);
        Club club = club(id);
        requireCollege(club, collegeId);
        if (club.getStatus() != Club.Status.ACTIVE &&
                !viewer.getId().equals(idOf(club.getCreatedBy())) && !isCollegeAdmin(viewerId, collegeId)) {
            throw new EntityNotFoundException("Club not found");
        }
        return clubDto(club);
    }

    public ClubDto requestClub(ClubRequest request, UUID userId, UUID collegeId) {
        User creator = activeUser(userId, collegeId);
        Club club = Club.builder()
                .college(college(creator.getCollegeId()))
                .category(category(request.getCategorySlug()))
                .name(request.getName().trim())
                .slug(uniqueSlug(creator.getCollegeId(), request.getName()))
                .description(request.getDescription().trim())
                .shortDescription(request.getDescription().trim().substring(0, Math.min(500, request.getDescription().trim().length())))
                .contactEmail(request.getContactEmail())
                .createdBy(creator)
                .status(Club.Status.PENDING_APPROVAL)
                .visibility(Club.Visibility.PUBLIC)
                .requireApproval(true)
                .build();
        Club saved = clubs.save(club);
        audit.record(creator.getCollegeId(), userId, "CLUB_REQUEST", "CLUB", saved.getId(),
                Map.of("name", saved.getName(), "slug", saved.getSlug()));
        return clubDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ClubDto> myClubRequests(UUID userId, UUID collegeId) {
        User user = activeUser(userId, collegeId);
        return clubs.findByCreatedByAndCollegeOrderByCreatedAtDesc(user, college(collegeId)).stream()
                .map(this::clubDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ClubDto> pendingClubRequests(UUID userId, UUID collegeId) {
        requireCollegeAdmin(userId, collegeId);
        return clubs.findByCollegeAndStatusOrderByCreatedAtDesc(college(collegeId), Club.Status.PENDING_APPROVAL)
                .stream().map(this::clubDto).toList();
    }

    public ClubDto decideClub(UUID clubId, UUID actorId, UUID collegeId, boolean approve, String reason) {
        Club club = club(clubId);
        requireCollege(club, collegeId);
        requireCollegeAdmin(actorId, collegeId);
        if (club.getStatus() != Club.Status.PENDING_APPROVAL) throw new IllegalStateException("Club request has already been decided");
        User actor = activeUser(actorId, collegeId);
        if (approve) {
            club.setStatus(Club.Status.ACTIVE);
            club.setApprovedAt(Instant.now());
            club.setApprovedBy(actor);
            club.setRejectionReason(null);
            ClubRole memberRole = saveRole(club, "MEMBER", "Member", "[]", true);
            ClubRole officerRole = saveRole(club, "OFFICER", "Club officer", "[\"MANAGE_MEMBERS\"]", false);
            User creator = club.getCreatedBy();
            if (creator != null && memberships.findByClubAndUser(club, creator).isEmpty()) {
                memberships.save(Membership.builder().club(club).user(creator).role(officerRole)
                        .status(Membership.Status.ACTIVE).appliedAt(Instant.now()).approvedAt(Instant.now())
                        .approvedBy(actor).build());
            }
        } else {
            club.setStatus(Club.Status.REJECTED);
            club.setApprovedBy(actor);
            club.setRejectionReason(reason == null || reason.isBlank() ? "Request rejected" : reason.trim());
        }
        audit.record(collegeId, actorId, approve ? "CLUB_APPROVE" : "CLUB_REJECT", "CLUB", club.getId(),
                Map.of("name", club.getName(), "status", club.getStatus().name()));
        return clubDto(club);
    }

    public MembershipDto apply(UUID clubId, UUID userId, UUID collegeId) {
        User applicant = activeUser(userId, collegeId);
        Club club = club(clubId);
        requireCollege(club, collegeId);
        if (club.getStatus() != Club.Status.ACTIVE) throw new IllegalStateException("This club is not accepting applications");
        Membership existing = memberships.findByClubAndUser(club, applicant).orElse(null);
        if (existing != null && existing.getStatus() != Membership.Status.REJECTED && existing.getStatus() != Membership.Status.LEFT) {
            throw new IllegalStateException("You already have a pending application or membership for this club");
        }
        if (existing != null) {
            existing.setStatus(club.getRequireApproval() ? Membership.Status.PENDING : Membership.Status.ACTIVE);
            existing.setAppliedAt(Instant.now());
            existing.setApprovedAt(null);
            existing.setApprovedBy(null);
            existing.setRejectionReason(null);
            existing.setLeftAt(null);
            existing.setRole(club.getRequireApproval() ? null : roles.findByClubAndName(club, "MEMBER").orElse(null));
            audit.record(collegeId, userId, "MEMBERSHIP_APPLY", "MEMBERSHIP", existing.getId(),
                    Map.of("clubId", club.getId().toString(), "status", existing.getStatus().name()));
            return membershipDto(existing);
        }
        Membership membership = Membership.builder().club(club).user(applicant)
                .status(club.getRequireApproval() ? Membership.Status.PENDING : Membership.Status.ACTIVE)
                .appliedAt(Instant.now()).build();
        if (membership.getStatus() == Membership.Status.ACTIVE) {
            membership.setRole(roles.findByClubAndName(club, "MEMBER").orElse(null));
        }
        Membership saved = memberships.save(membership);
        audit.record(collegeId, userId, "MEMBERSHIP_APPLY", "MEMBERSHIP", saved.getId(),
                Map.of("clubId", club.getId().toString(), "status", saved.getStatus().name()));
        return membershipDto(saved);
    }

    public MembershipDto decideMembership(UUID membershipId, UUID actorId, UUID collegeId, boolean approve, String reason) {
        Membership membership = membership(membershipId);
        Club club = membership.getClub();
        requireCollege(club, collegeId);
        requireManager(club, actorId, collegeId);
        if (actorId.equals(membership.getUser().getId())) throw new AccessDeniedException("You cannot decide your own application");
        if (membership.getStatus() != Membership.Status.PENDING) throw new IllegalStateException("Membership request has already been decided");
        if (approve) {
            membership.setStatus(Membership.Status.ACTIVE);
            membership.setRole(roles.findByClubAndName(club, "MEMBER").orElse(null));
            membership.setApprovedAt(Instant.now());
            membership.setApprovedBy(activeUser(actorId, collegeId));
            membership.setRejectionReason(null);
        } else {
            membership.setStatus(Membership.Status.REJECTED);
            membership.setRejectionReason(reason == null || reason.isBlank() ? "Application rejected" : reason.trim());
        }
        audit.record(collegeId, actorId, approve ? "MEMBERSHIP_APPROVE" : "MEMBERSHIP_REJECT", "MEMBERSHIP",
                membership.getId(),
                Map.of("clubId", club.getId().toString(), "memberId", membership.getUser().getId().toString()));
        return membershipDto(membership);
    }

    public void leave(UUID clubId, UUID userId, UUID collegeId) {
        User user = activeUser(userId, collegeId);
        Club club = club(clubId);
        requireCollege(club, collegeId);
        Membership membership = memberships.findByClubAndUser(club, user)
                .orElseThrow(() -> new EntityNotFoundException("Membership not found"));
        if (membership.getStatus() != Membership.Status.ACTIVE) throw new IllegalStateException("Only active members can leave");
        membership.setStatus(Membership.Status.LEFT);
        membership.setLeftAt(Instant.now());
        audit.record(collegeId, userId, "MEMBERSHIP_LEAVE", "MEMBERSHIP", membership.getId(),
                Map.of("clubId", club.getId().toString()));
    }

    @Transactional(readOnly = true)
    public List<MembershipDto> myMemberships(UUID userId, UUID collegeId) {
        User user = activeUser(userId, collegeId);
        return memberships.findByUserOrderByAppliedAtDesc(user).stream().map(this::membershipDto).toList();
    }

    @Transactional(readOnly = true)
    public List<MembershipDto> members(UUID clubId, UUID actorId, UUID collegeId, Membership.Status status) {
        Club club = club(clubId);
        requireCollege(club, collegeId);
        requireManager(club, actorId, collegeId);
        return memberships.findByClubAndStatusOrderByAppliedAtAsc(club, status).stream().map(this::membershipDto).toList();
    }

    public MembershipDto assignRole(UUID membershipId, UUID roleId, UUID actorId, UUID collegeId) {
        Membership membership = membership(membershipId);
        Club club = membership.getClub();
        requireCollege(club, collegeId);
        requireManager(club, actorId, collegeId);
        if (membership.getStatus() != Membership.Status.ACTIVE) throw new IllegalStateException("Only active members can be assigned a role");
        ClubRole role = roles.findById(roleId).orElseThrow(() -> new EntityNotFoundException("Role not found"));
        if (!role.getClub().getId().equals(club.getId())) throw new AccessDeniedException("Role belongs to another club");
        membership.setRole(role);
        audit.record(collegeId, actorId, "MEMBERSHIP_ROLE_ASSIGN", "MEMBERSHIP", membership.getId(),
                Map.of("clubId", club.getId().toString(), "roleId", role.getId().toString()));
        return membershipDto(membership);
    }

    @Transactional(readOnly = true)
    public List<com.campusverse.clubs.dto.ClubRoleDto> rolesForClub(UUID clubId, UUID actorId, UUID collegeId) {
        Club club = club(clubId);
        requireCollege(club, collegeId);
        requireManager(club, actorId, collegeId);
        return roles.findByClubOrderByDisplayOrderAsc(club).stream()
                .map(role -> new com.campusverse.clubs.dto.ClubRoleDto(role.getId(), role.getName(), role.getDisplayName(), role.getDescription()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClubCategory> categories() {
        return categories.findAllByOrderByDisplayOrderAsc();
    }

    private ClubDto clubDto(Club c) {
        return new ClubDto(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getShortDescription(),
                c.getCategory() == null ? null : c.getCategory().getName(),
                c.getCategory() == null ? null : c.getCategory().getSlug(), c.getStatus().name(),
                c.getVisibility().name(), c.getContactEmail(), memberships.countByClubAndStatus(c, Membership.Status.ACTIVE),
                c.getCreatedAt(), c.getRejectionReason());
    }

    private MembershipDto membershipDto(Membership m) {
        return new MembershipDto(m.getId(), m.getClub().getId(), m.getClub().getName(), m.getUser().getId(),
                m.getUser().getDisplayName(), m.getRole() == null ? "Member" : m.getRole().getDisplayName(),
                m.getRole() == null ? null : m.getRole().getId(), m.getStatus().name(), m.getAppliedAt(), m.getRejectionReason());
    }

    private ClubRole saveRole(Club club, String name, String displayName, String permissions, boolean isDefault) {
        return roles.findByClubAndName(club, name).orElseGet(() -> roles.save(ClubRole.builder().club(club)
                .name(name).displayName(displayName).permissions(permissions).isDefault(isDefault).displayOrder(isDefault ? 2 : 1).build()));
    }

    private void requireManager(Club club, UUID actorId, UUID collegeId) {
        User actor = activeUser(actorId, collegeId);
        if (isCollegeAdmin(actorId, collegeId)) return;
        Membership m = memberships.findByClubAndUser(club, actor).orElse(null);
        if (m == null || m.getStatus() != Membership.Status.ACTIVE || m.getRole() == null ||
                !m.getRole().getPermissions().contains("MANAGE_MEMBERS")) {
            throw new AccessDeniedException("Club officer permission required");
        }
    }

    private void requireCollegeAdmin(UUID userId, UUID collegeId) {
        activeUser(userId, collegeId);
        if (!isCollegeAdmin(userId, collegeId)) throw new AccessDeniedException("College administrator permission required");
    }

    private boolean isCollegeAdmin(UUID userId, UUID collegeId) {
        Boolean authorized = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM platform_role_assignments WHERE user_id = ? AND ((role = 'COLLEGE_ADMIN' AND college_id = ?) OR role = 'PLATFORM_ADMIN'))", Boolean.class, userId, collegeId);
        return Boolean.TRUE.equals(authorized);
    }

    private User activeUser(UUID userId, UUID collegeId) {
        User user = users.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (!user.getCollegeId().equals(collegeId) || user.getStatus() != User.Status.ACTIVE) throw new AccessDeniedException("Active membership in this college is required");
        return user;
    }

    private void requireCollege(Club club, UUID collegeId) {
        if (!club.getCollege().getId().equals(collegeId)) throw new EntityNotFoundException("Club not found");
    }

    private College college(UUID id) {
        return colleges.findById(id).orElseThrow(() -> new EntityNotFoundException("College not found"));
    }

    private Club club(UUID id) {
        return clubs.findById(id).orElseThrow(() -> new EntityNotFoundException("Club not found"));
    }

    private Membership membership(UUID id) {
        return memberships.findById(id).orElseThrow(() -> new EntityNotFoundException("Membership not found"));
    }

    private ClubCategory category(String slug) {
        if (slug == null || slug.isBlank()) return null;
        ClubCategory category = categories.findBySlug(slug);
        if (category == null) throw new IllegalArgumentException("Unknown club category");
        return category;
    }

    private String uniqueSlug(UUID collegeId, String name) {
        String base = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (base.isBlank()) base = "club";
        College college = college(collegeId);
        return clubs.existsByCollegeAndSlug(college, base) ? base + "-" + UUID.randomUUID().toString().substring(0, 8) : base;
    }

    private UUID idOf(User user) { return user == null ? null : user.getId(); }
}

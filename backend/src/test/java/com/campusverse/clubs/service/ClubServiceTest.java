package com.campusverse.clubs.service;

import com.campusverse.audit.service.AuditService;
import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.ClubRole;
import com.campusverse.clubs.domain.Membership;
import com.campusverse.clubs.repository.ClubCategoryRepository;
import com.campusverse.clubs.repository.ClubRepository;
import com.campusverse.clubs.repository.ClubRoleRepository;
import com.campusverse.clubs.repository.MembershipRepository;
import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.identity.domain.User;
import com.campusverse.identity.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClubServiceTest {
    @Mock ClubRepository clubs;
    @Mock ClubCategoryRepository categories;
    @Mock ClubRoleRepository roles;
    @Mock MembershipRepository memberships;
    @Mock CollegeRepository colleges;
    @Mock UserRepository users;
    @Mock JdbcTemplate jdbc;
    @Mock AuditService audit;
    ClubService service;

    @BeforeEach
    void setUp() {
        service = new ClubService(clubs, categories, roles, memberships, colleges, users, jdbc, audit);
    }

    @Test
    void doesNotExposeClubsAcrossColleges() {
        UUID viewerCollege = UUID.randomUUID();
        UUID otherCollege = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        User viewer = User.builder().id(viewerId).collegeId(viewerCollege).status(User.Status.ACTIVE).build();
        Club club = Club.builder().college(College.builder().id(otherCollege).build()).status(Club.Status.ACTIVE).build();
        when(users.findById(viewerId)).thenReturn(Optional.of(viewer));
        when(clubs.findById(any())).thenReturn(Optional.of(club));

        assertThrows(EntityNotFoundException.class, () -> service.detail(UUID.randomUUID(), viewerCollege, viewerId));
    }

    @Test
    void duplicatePendingApplicationDoesNotCreateAnotherMembership() {
        UUID collegeId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID clubId = UUID.randomUUID();
        User applicant = User.builder().id(userId).collegeId(collegeId).status(User.Status.ACTIVE).build();
        Club club = Club.builder().id(clubId).college(College.builder().id(collegeId).build())
                .status(Club.Status.ACTIVE).requireApproval(true).build();
        Membership pending = Membership.builder().club(club).user(applicant).status(Membership.Status.PENDING).build();
        when(users.findById(userId)).thenReturn(Optional.of(applicant));
        when(clubs.findById(clubId)).thenReturn(Optional.of(club));
        when(memberships.findByClubAndUser(club, applicant)).thenReturn(Optional.of(pending));

        assertThrows(IllegalStateException.class, () -> service.apply(clubId, userId, collegeId));
        verify(memberships, never()).save(any());
    }

    @Test
    void applicantCannotApproveOwnMembership() {
        UUID collegeId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID clubId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        User user = User.builder().id(userId).collegeId(collegeId).status(User.Status.ACTIVE).build();
        Club club = Club.builder().id(clubId).college(College.builder().id(collegeId).build()).status(Club.Status.ACTIVE).build();
        Membership membership = Membership.builder().id(membershipId).club(club).user(user).status(Membership.Status.PENDING).build();

        when(memberships.findById(membershipId)).thenReturn(Optional.of(membership));
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(jdbc.queryForObject(any(), org.mockito.ArgumentMatchers.eq(Boolean.class), any(), any())).thenReturn(true);

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.decideMembership(membershipId, userId, collegeId, true, null));
    }

    @Test
    void nonOfficerCannotAssignRole() {
        UUID collegeId = UUID.randomUUID();
        UUID officerId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UUID clubId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        User actor = User.builder().id(officerId).collegeId(collegeId).status(User.Status.ACTIVE).build();
        User target = User.builder().id(memberId).collegeId(collegeId).status(User.Status.ACTIVE).build();
        Club club = Club.builder().id(clubId).college(College.builder().id(collegeId).build()).status(Club.Status.ACTIVE).build();
        Membership targetMembership = Membership.builder().id(membershipId).club(club).user(target).status(Membership.Status.ACTIVE).build();

        when(memberships.findById(membershipId)).thenReturn(Optional.of(targetMembership));
        when(users.findById(officerId)).thenReturn(Optional.of(actor));
        when(jdbc.queryForObject(any(), org.mockito.ArgumentMatchers.eq(Boolean.class), any(), any())).thenReturn(false);
        when(memberships.findByClubAndUser(club, actor)).thenReturn(Optional.empty());

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.assignRole(membershipId, UUID.randomUUID(), officerId, collegeId));
    }

    @Test
    void activeMemberCanLeaveClub() {
        UUID collegeId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID clubId = UUID.randomUUID();
        User user = User.builder().id(userId).collegeId(collegeId).status(User.Status.ACTIVE).build();
        Club club = Club.builder().id(clubId).college(College.builder().id(collegeId).build()).status(Club.Status.ACTIVE).build();
        Membership membership = Membership.builder().club(club).user(user).status(Membership.Status.ACTIVE).build();

        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(clubs.findById(clubId)).thenReturn(Optional.of(club));
        when(memberships.findByClubAndUser(club, user)).thenReturn(Optional.of(membership));

        service.leave(clubId, userId, collegeId);
        org.junit.jupiter.api.Assertions.assertEquals(Membership.Status.LEFT, membership.getStatus());
    }
}

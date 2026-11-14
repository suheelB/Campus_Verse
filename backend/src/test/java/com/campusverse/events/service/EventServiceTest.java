package com.campusverse.events.service;

import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.ClubRole;
import com.campusverse.clubs.domain.Membership;
import com.campusverse.clubs.repository.ClubRepository;
import com.campusverse.clubs.repository.MembershipRepository;
import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.events.domain.Event;
import com.campusverse.events.domain.EventAttendance;
import com.campusverse.events.domain.EventRegistration;
import com.campusverse.events.dto.CheckInRequest;
import com.campusverse.events.dto.EventAttendanceDto;
import com.campusverse.events.dto.EventRegistrationDto;
import com.campusverse.events.repository.EventAttendanceRepository;
import com.campusverse.events.repository.EventRegistrationRepository;
import com.campusverse.events.repository.EventRepository;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock EventRepository eventRepository;
    @Mock EventRegistrationRepository registrationRepository;
    @Mock EventAttendanceRepository attendanceRepository;
    @Mock ClubRepository clubRepository;
    @Mock MembershipRepository membershipRepository;
    @Mock UserRepository userRepository;
    @Mock CollegeRepository collegeRepository;
    @Mock NotificationService notificationService;
    @Mock JdbcTemplate jdbc;

    EventService service;

    UUID collegeId = UUID.randomUUID();
    UUID studentId = UUID.randomUUID();
    UUID officerId = UUID.randomUUID();
    UUID eventId = UUID.randomUUID();
    UUID clubId = UUID.randomUUID();

    College college;
    User student;
    User officer;
    Club club;
    Event event;

    @BeforeEach
    void setUp() {
        service = new EventService(
                eventRepository,
                registrationRepository,
                attendanceRepository,
                clubRepository,
                membershipRepository,
                userRepository,
                collegeRepository,
                notificationService,
                jdbc
        );

        college = College.builder().id(collegeId).name("Campus College").build();
        student = User.builder().id(studentId).collegeId(collegeId).status(User.Status.ACTIVE).displayName("Bob Student").email("bob@campus.edu").build();
        officer = User.builder().id(officerId).collegeId(collegeId).status(User.Status.ACTIVE).displayName("Alice Officer").email("alice@campus.edu").build();
        club = Club.builder().id(clubId).name("Coding Club").college(college).status(Club.Status.ACTIVE).build();

        event = Event.builder()
                .id(eventId)
                .college(college)
                .primaryClub(club)
                .title("Hackathon 2026")
                .description("Build awesome apps")
                .status(Event.Status.PUBLISHED)
                .startsAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .endsAt(Instant.now().plus(8, ChronoUnit.DAYS))
                .capacity(50)
                .createdBy(officer)
                .build();
    }

    @Test
    void studentCanRegisterForPublishedEvent() {
        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(registrationRepository.findByEventIdAndUserId(eventId, studentId)).thenReturn(Optional.empty());
        when(registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.REGISTERED)).thenReturn(10L);
        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(inv -> {
            EventRegistration r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        EventRegistrationDto reg = service.registerForEvent(eventId, studentId, collegeId);

        assertNotNull(reg);
        assertEquals(EventRegistration.Status.REGISTERED, reg.status());
        assertNull(reg.waitlistPosition());
        verify(notificationService).createNotification(eq(student), eq("EVENT_REGISTRATION"), anyString(), anyString(), eq("EVENT"), eq(eventId), anyString());
    }

    @Test
    void registrationRejectedWhenEventNotPublished() {
        event.setStatus(Event.Status.CANCELLED);
        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.registerForEvent(eventId, studentId, collegeId));
        assertTrue(ex.getMessage().contains("not open for registration"));
    }

    @Test
    void registrationRejectedAfterDeadline() {
        event.setRegistrationClosesAt(Instant.now().minus(1, ChronoUnit.HOURS));
        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.registerForEvent(eventId, studentId, collegeId));
        assertTrue(ex.getMessage().contains("deadline has passed"));
    }

    @Test
    void duplicateRegistrationRejected() {
        EventRegistration existing = EventRegistration.builder()
                .event(event)
                .user(student)
                .status(EventRegistration.Status.REGISTERED)
                .build();

        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(registrationRepository.findByEventIdAndUserId(eventId, studentId)).thenReturn(Optional.of(existing));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.registerForEvent(eventId, studentId, collegeId));
        assertTrue(ex.getMessage().contains("already registered"));
    }

    @Test
    void capacityFullAddsToWaitlist() {
        event.setCapacity(2);
        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(registrationRepository.findByEventIdAndUserId(eventId, studentId)).thenReturn(Optional.empty());
        when(registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.REGISTERED)).thenReturn(2L);
        when(registrationRepository.findMaxWaitlistPositionByEventId(eventId)).thenReturn(0);
        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(inv -> {
            EventRegistration r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        EventRegistrationDto reg = service.registerForEvent(eventId, studentId, collegeId);

        assertNotNull(reg);
        assertEquals(EventRegistration.Status.WAITLISTED, reg.status());
        assertEquals(1, reg.waitlistPosition());
    }

    @Test
    void cancellingRegisteredPromotesNextWaitlisted() {
        EventRegistration studentReg = EventRegistration.builder()
                .id(UUID.randomUUID())
                .event(event)
                .user(student)
                .status(EventRegistration.Status.REGISTERED)
                .build();

        User waitlistedUser = User.builder().id(UUID.randomUUID()).displayName("Charlie Waitlist").build();
        EventRegistration waitlistedReg = EventRegistration.builder()
                .id(UUID.randomUUID())
                .event(event)
                .user(waitlistedUser)
                .status(EventRegistration.Status.WAITLISTED)
                .waitlistPosition(1)
                .build();

        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(registrationRepository.findByEventIdAndUserId(eventId, studentId)).thenReturn(Optional.of(studentReg));
        when(registrationRepository.findFirstByEventIdAndStatusOrderByWaitlistPositionAscRegisteredAtAsc(eventId, EventRegistration.Status.WAITLISTED))
                .thenReturn(Optional.of(waitlistedReg));

        service.cancelRegistration(eventId, studentId, collegeId);

        assertEquals(EventRegistration.Status.CANCELLED, studentReg.getStatus());
        assertEquals(EventRegistration.Status.REGISTERED, waitlistedReg.getStatus());
        assertNull(waitlistedReg.getWaitlistPosition());
        verify(notificationService).createNotification(eq(waitlistedUser), eq("WAITLIST_PROMOTED"), anyString(), anyString(), eq("EVENT"), eq(eventId), anyString());
    }

    @Test
    void unauthorizedUserCannotCheckIn() {
        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(studentId), eq(collegeId))).thenReturn(false);
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(membershipRepository.findByClubAndUser(eq(club), eq(student))).thenReturn(Optional.empty());

        CheckInRequest req = new CheckInRequest(studentId, null, null);

        assertThrows(AccessDeniedException.class, () ->
                service.checkIn(eventId, req, studentId, collegeId));
    }

    @Test
    void officerCanCheckInAttendee() {
        ClubRole officerRole = ClubRole.builder().name("OFFICER").permissions("[\"MANAGE_MEMBERS\"]").build();
        Membership m = Membership.builder().club(club).user(officer).status(Membership.Status.ACTIVE).role(officerRole).build();

        when(eventRepository.findByIdAndCollegeId(eventId, collegeId)).thenReturn(Optional.of(event));
        when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(officerId), eq(collegeId))).thenReturn(false);
        when(userRepository.findById(officerId)).thenReturn(Optional.of(officer));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(membershipRepository.findByClubAndUser(eq(club), eq(officer))).thenReturn(Optional.of(m));
        when(attendanceRepository.findByEventIdAndUserId(eventId, studentId)).thenReturn(Optional.empty());
        when(attendanceRepository.save(any(EventAttendance.class))).thenAnswer(inv -> {
            EventAttendance att = inv.getArgument(0);
            att.setId(UUID.randomUUID());
            return att;
        });

        CheckInRequest req = new CheckInRequest(studentId, null, null);
        EventAttendanceDto result = service.checkIn(eventId, req, officerId, collegeId);

        assertNotNull(result);
        assertEquals(studentId, result.userId());
        verify(attendanceRepository).save(any(EventAttendance.class));
    }
}

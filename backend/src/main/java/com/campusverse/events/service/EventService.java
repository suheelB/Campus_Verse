package com.campusverse.events.service;

import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.Membership;
import com.campusverse.clubs.repository.ClubRepository;
import com.campusverse.clubs.repository.MembershipRepository;
import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.events.domain.Event;
import com.campusverse.events.domain.EventAttendance;
import com.campusverse.events.domain.EventRegistration;
import com.campusverse.events.dto.*;
import com.campusverse.events.repository.EventAttendanceRepository;
import com.campusverse.events.repository.EventRegistrationRepository;
import com.campusverse.events.repository.EventRepository;
import com.campusverse.identity.domain.User;
import com.campusverse.identity.repository.UserRepository;
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
public class EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventAttendanceRepository attendanceRepository;
    private final ClubRepository clubRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public Page<EventDto> listEvents(UUID collegeId, UUID clubId, Event.Status status, String search, Boolean upcoming, UUID userId, Pageable pageable) {
        Instant now = Instant.now();
        // If not admin/officer, only PUBLISHED events are discovered
        Event.Status queryStatus = status != null ? status : Event.Status.PUBLISHED;
        Page<Event> page = eventRepository.findEvents(collegeId, clubId, queryStatus, search, upcoming, now, pageable);
        return page.map(e -> toDto(e, userId));
    }

    @Transactional(readOnly = true)
    public EventDto getEvent(UUID eventId, UUID collegeId, UUID userId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        return toDto(event, userId);
    }

    public EventDto createEvent(EventCreateRequest request, UUID actorId, UUID collegeId) {
        User creator = activeUser(actorId, collegeId);
        College college = college(collegeId);
        Club club = clubRepository.findById(request.primaryClubId())
                .orElseThrow(() -> new EntityNotFoundException("Club not found"));

        if (!club.getCollege().getId().equals(collegeId)) {
            throw new EntityNotFoundException("Club not found");
        }

        requireOfficerOrAdmin(club, actorId, collegeId);

        Event.Status status = Event.Status.PENDING_APPROVAL;
        if (request.publishNow() && isCollegeAdmin(actorId, collegeId)) {
            status = Event.Status.PUBLISHED;
        } else if (request.publishNow()) {
            status = Event.Status.PUBLISHED;
        }

        Event event = Event.builder()
                .college(college)
                .primaryClub(club)
                .title(request.title().trim())
                .description(request.description().trim())
                .status(status)
                .startsAt(request.startsAt())
                .endsAt(request.endsAt())
                .venue(request.venue() != null ? request.venue().trim() : null)
                .capacity(request.capacity())
                .registrationOpensAt(request.registrationOpensAt())
                .registrationClosesAt(request.registrationClosesAt())
                .createdBy(creator)
                .build();

        event = eventRepository.save(event);
        return toDto(event, actorId);
    }

    public EventDto updateEvent(UUID eventId, EventUpdateRequest request, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);

        event.setTitle(request.title().trim());
        event.setDescription(request.description().trim());
        event.setStartsAt(request.startsAt());
        event.setEndsAt(request.endsAt());
        event.setVenue(request.venue() != null ? request.venue().trim() : null);
        event.setCapacity(request.capacity());
        event.setRegistrationOpensAt(request.registrationOpensAt());
        event.setRegistrationClosesAt(request.registrationClosesAt());

        return toDto(eventRepository.save(event), actorId);
    }

    public EventDto publishEvent(UUID eventId, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);

        event.setStatus(Event.Status.PUBLISHED);
        return toDto(eventRepository.save(event), actorId);
    }

    public EventDto approveEvent(UUID eventId, UUID actorId, UUID collegeId) {
        if (!isCollegeAdmin(actorId, collegeId)) {
            throw new AccessDeniedException("Only college administrators can approve event proposals");
        }
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        User admin = activeUser(actorId, collegeId);

        event.setStatus(Event.Status.PUBLISHED);
        event.setApprovedBy(admin);
        event.setApprovedAt(Instant.now());

        notificationService.createNotification(
                event.getCreatedBy(),
                "EVENT_APPROVED",
                "Event Approved",
                "Your event \"" + event.getTitle() + "\" has been approved and published.",
                "EVENT",
                event.getId(),
                "event_approved_" + event.getId()
        );

        return toDto(eventRepository.save(event), actorId);
    }

    public EventDto rejectEvent(UUID eventId, String reason, UUID actorId, UUID collegeId) {
        if (!isCollegeAdmin(actorId, collegeId)) {
            throw new AccessDeniedException("Only college administrators can reject event proposals");
        }
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        event.setStatus(Event.Status.REJECTED);

        notificationService.createNotification(
                event.getCreatedBy(),
                "EVENT_REJECTED",
                "Event Proposal Rejected",
                "Your event proposal \"" + event.getTitle() + "\" was rejected: " + (reason != null ? reason : "No reason provided"),
                "EVENT",
                event.getId(),
                "event_rejected_" + event.getId()
        );

        return toDto(eventRepository.save(event), actorId);
    }

    public EventDto cancelEvent(UUID eventId, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);

        event.setStatus(Event.Status.CANCELLED);
        event.setCancelledAt(Instant.now());
        event = eventRepository.save(event);

        // Notify registered participants
        List<EventRegistration> regList = registrationRepository.findByEventIdOrderByWaitlistPositionAscRegisteredAtAsc(eventId);
        for (EventRegistration reg : regList) {
            if (reg.getStatus() == EventRegistration.Status.REGISTERED || reg.getStatus() == EventRegistration.Status.WAITLISTED) {
                notificationService.createNotification(
                        reg.getUser(),
                        "EVENT_CANCELLED",
                        "Event Cancelled",
                        "The event \"" + event.getTitle() + "\" has been cancelled.",
                        "EVENT",
                        event.getId(),
                        "event_cancelled_" + event.getId() + "_" + reg.getUser().getId()
                );
            }
        }

        return toDto(event, actorId);
    }

    public EventRegistrationDto registerForEvent(UUID eventId, UUID userId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        User user = activeUser(userId, collegeId);

        if (event.getStatus() != Event.Status.PUBLISHED) {
            throw new IllegalStateException("Event is not open for registration");
        }

        Instant now = Instant.now();
        if (event.getRegistrationOpensAt() != null && now.isBefore(event.getRegistrationOpensAt())) {
            throw new IllegalStateException("Registration has not opened yet");
        }
        if (event.getRegistrationClosesAt() != null && now.isAfter(event.getRegistrationClosesAt())) {
            throw new IllegalStateException("Registration deadline has passed");
        }

        Optional<EventRegistration> existing = registrationRepository.findByEventIdAndUserId(eventId, userId);
        if (existing.isPresent()) {
            EventRegistration.Status curStatus = existing.get().getStatus();
            if (curStatus == EventRegistration.Status.REGISTERED || curStatus == EventRegistration.Status.WAITLISTED) {
                throw new IllegalStateException("You are already registered or waitlisted for this event");
            }
        }

        long registeredCount = registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.REGISTERED);
        boolean isFull = event.getCapacity() != null && registeredCount >= event.getCapacity();

        EventRegistration reg;
        if (existing.isPresent()) {
            reg = existing.get();
            reg.setCancelledAt(null);
            reg.setRegisteredAt(Instant.now());
        } else {
            reg = EventRegistration.builder()
                    .event(event)
                    .user(user)
                    .build();
        }

        if (isFull) {
            int maxPos = registrationRepository.findMaxWaitlistPositionByEventId(eventId);
            reg.setStatus(EventRegistration.Status.WAITLISTED);
            reg.setWaitlistPosition(maxPos + 1);
        } else {
            reg.setStatus(EventRegistration.Status.REGISTERED);
            reg.setWaitlistPosition(null);
        }

        reg = registrationRepository.save(reg);

        String title = isFull ? "Added to Waitlist" : "Registration Confirmed";
        String msg = isFull
                ? "You are on the waitlist (Position #" + reg.getWaitlistPosition() + ") for \"" + event.getTitle() + "\"."
                : "You are registered for \"" + event.getTitle() + "\"!";

        notificationService.createNotification(
                user,
                "EVENT_REGISTRATION",
                title,
                msg,
                "EVENT",
                event.getId(),
                "event_reg_" + event.getId() + "_" + user.getId() + "_" + System.currentTimeMillis()
        );

        return toRegistrationDto(reg);
    }

    public void cancelRegistration(UUID eventId, UUID userId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        EventRegistration reg = registrationRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));

        if (reg.getStatus() != EventRegistration.Status.REGISTERED && reg.getStatus() != EventRegistration.Status.WAITLISTED) {
            throw new IllegalStateException("Registration is not active");
        }

        boolean wasRegistered = (reg.getStatus() == EventRegistration.Status.REGISTERED);
        reg.setStatus(EventRegistration.Status.CANCELLED);
        reg.setCancelledAt(Instant.now());
        reg.setWaitlistPosition(null);
        registrationRepository.save(reg);

        // Safe Waitlist Promotion
        if (wasRegistered) {
            Optional<EventRegistration> nextWaitlisted = registrationRepository
                    .findFirstByEventIdAndStatusOrderByWaitlistPositionAscRegisteredAtAsc(eventId, EventRegistration.Status.WAITLISTED);
            if (nextWaitlisted.isPresent()) {
                EventRegistration promoted = nextWaitlisted.get();
                promoted.setStatus(EventRegistration.Status.REGISTERED);
                promoted.setWaitlistPosition(null);
                promoted.setRegisteredAt(Instant.now());
                registrationRepository.save(promoted);

                notificationService.createNotification(
                        promoted.getUser(),
                        "WAITLIST_PROMOTED",
                        "Waitlist Promotion!",
                        "A spot opened up! You are now registered for \"" + event.getTitle() + "\".",
                        "EVENT",
                        event.getId(),
                        "waitlist_promoted_" + event.getId() + "_" + promoted.getUser().getId()
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationDto> getMyRegistrations(UUID userId, UUID collegeId) {
        activeUser(userId, collegeId);
        return registrationRepository.findByUserIdOrderByRegisteredAtDesc(userId).stream()
                .filter(r -> r.getEvent().getCollege().getId().equals(collegeId))
                .map(this::toRegistrationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationDto> getEventRegistrations(UUID eventId, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);

        return registrationRepository.findByEventIdOrderByWaitlistPositionAscRegisteredAtAsc(eventId).stream()
                .map(this::toRegistrationDto)
                .toList();
    }

    public EventAttendanceDto checkIn(UUID eventId, CheckInRequest request, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);
        User officer = activeUser(actorId, collegeId);

        User attendee;
        if (request.userId() != null) {
            attendee = activeUser(request.userId(), collegeId);
        } else if (request.userEmail() != null && !request.userEmail().isBlank()) {
            attendee = userRepository.findByEmail(request.userEmail().trim().toLowerCase())
                    .orElseThrow(() -> new EntityNotFoundException("User with email " + request.userEmail() + " not found"));
            if (!attendee.getCollegeId().equals(collegeId)) {
                throw new EntityNotFoundException("User not found in this college");
            }
        } else {
            throw new IllegalArgumentException("Either userId or userEmail is required for check-in");
        }

        // Idempotency: check if already checked in
        Optional<EventAttendance> existingAttendance = attendanceRepository.findByEventIdAndUserId(eventId, attendee.getId());
        if (existingAttendance.isPresent()) {
            return toAttendanceDto(existingAttendance.get());
        }

        EventAttendance attendance = EventAttendance.builder()
                .event(event)
                .user(attendee)
                .checkedInBy(officer)
                .method(request.method() != null ? request.method() : EventAttendance.Method.MANUAL)
                .checkedInAt(Instant.now())
                .build();
        attendance = attendanceRepository.save(attendance);

        // Update registration record if present
        Optional<EventRegistration> regOpt = registrationRepository.findByEventIdAndUserId(eventId, attendee.getId());
        if (regOpt.isPresent()) {
            EventRegistration reg = regOpt.get();
            reg.setStatus(EventRegistration.Status.ATTENDED);
            registrationRepository.save(reg);
        } else {
            EventRegistration reg = EventRegistration.builder()
                    .event(event)
                    .user(attendee)
                    .status(EventRegistration.Status.ATTENDED)
                    .registeredAt(Instant.now())
                    .build();
            registrationRepository.save(reg);
        }

        notificationService.createNotification(
                attendee,
                "ATTENDANCE_RECORDED",
                "Check-in Confirmed",
                "You have been checked in to \"" + event.getTitle() + "\".",
                "EVENT",
                event.getId(),
                "attendance_" + event.getId() + "_" + attendee.getId()
        );

        return toAttendanceDto(attendance);
    }

    @Transactional(readOnly = true)
    public List<EventAttendanceDto> getEventAttendance(UUID eventId, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);

        return attendanceRepository.findByEventIdOrderByCheckedInAtDesc(eventId).stream()
                .map(this::toAttendanceDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceReportDto getAttendanceReport(UUID eventId, UUID actorId, UUID collegeId) {
        Event event = eventRepository.findByIdAndCollegeId(eventId, collegeId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        requireOfficerOrAdmin(event.getPrimaryClub(), actorId, collegeId);

        long registered = registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.REGISTERED);
        long waitlisted = registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.WAITLISTED);
        long attended = attendanceRepository.countByEventId(eventId);
        long baseCount = Math.max(1, registered + attended);
        double rate = Math.min(100.0, Math.round((attended / (double) baseCount) * 1000.0) / 10.0);

        return new AttendanceReportDto(
                event.getId(),
                event.getTitle(),
                event.getCapacity(),
                registered,
                waitlisted,
                attended,
                rate
        );
    }

    private EventDto toDto(Event event, UUID userId) {
        long regCount = registrationRepository.countByEventIdAndStatus(event.getId(), EventRegistration.Status.REGISTERED);
        long waitCount = registrationRepository.countByEventIdAndStatus(event.getId(), EventRegistration.Status.WAITLISTED);

        boolean isRegistered = false;
        EventRegistration.Status userStatus = null;
        if (userId != null) {
            Optional<EventRegistration> userReg = registrationRepository.findByEventIdAndUserId(event.getId(), userId);
            if (userReg.isPresent()) {
                userStatus = userReg.get().getStatus();
                isRegistered = (userStatus == EventRegistration.Status.REGISTERED || userStatus == EventRegistration.Status.WAITLISTED);
            }
        }

        return new EventDto(
                event.getId(),
                event.getCollege().getId(),
                event.getPrimaryClub().getId(),
                event.getPrimaryClub().getName(),
                event.getTitle(),
                event.getDescription(),
                event.getStatus(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.getVenue(),
                event.getCapacity(),
                event.getRegistrationOpensAt(),
                event.getRegistrationClosesAt(),
                regCount,
                waitCount,
                isRegistered,
                userStatus,
                event.getCreatedBy().getId(),
                event.getCreatedBy().getDisplayName(),
                event.getCreatedAt()
        );
    }

    private EventRegistrationDto toRegistrationDto(EventRegistration reg) {
        return new EventRegistrationDto(
                reg.getId(),
                reg.getEvent().getId(),
                reg.getEvent().getTitle(),
                reg.getUser().getId(),
                reg.getUser().getDisplayName(),
                reg.getUser().getEmail(),
                reg.getStatus(),
                reg.getRegisteredAt(),
                reg.getCancelledAt(),
                reg.getWaitlistPosition()
        );
    }

    private EventAttendanceDto toAttendanceDto(EventAttendance att) {
        return new EventAttendanceDto(
                att.getId(),
                att.getEvent().getId(),
                att.getUser().getId(),
                att.getUser().getDisplayName(),
                att.getUser().getEmail(),
                att.getCheckedInAt(),
                att.getCheckedInBy() != null ? att.getCheckedInBy().getDisplayName() : "Self / Automated",
                att.getMethod()
        );
    }

    private void requireOfficerOrAdmin(Club club, UUID actorId, UUID collegeId) {
        if (isCollegeAdmin(actorId, collegeId)) return;
        User actor = activeUser(actorId, collegeId);
        Membership m = membershipRepository.findByClubAndUser(club, actor).orElse(null);
        if (m == null || m.getStatus() != Membership.Status.ACTIVE || m.getRole() == null ||
                (!m.getRole().getPermissions().contains("MANAGE_MEMBERS") && !m.getRole().getPermissions().contains("MANAGE_EVENTS"))) {
            throw new AccessDeniedException("Club officer or event organizer permission required");
        }
    }

    private boolean isCollegeAdmin(UUID userId, UUID collegeId) {
        Boolean authorized = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM platform_role_assignments WHERE user_id = ? AND ((role = 'COLLEGE_ADMIN' AND college_id = ?) OR role = 'PLATFORM_ADMIN'))",
                Boolean.class, userId, collegeId);
        return Boolean.TRUE.equals(authorized);
    }

    private User activeUser(UUID userId, UUID collegeId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (!user.getCollegeId().equals(collegeId) || user.getStatus() != User.Status.ACTIVE) {
            throw new AccessDeniedException("Active membership in this college is required");
        }
        return user;
    }

    private College college(UUID id) {
        return collegeRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("College not found"));
    }
}

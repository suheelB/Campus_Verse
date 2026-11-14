package com.campusverse.events.controller;

import com.campusverse.events.domain.Event;
import com.campusverse.events.dto.*;
import com.campusverse.events.service.EventService;
import com.campusverse.identity.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public Page<EventDto> listEvents(
            @RequestParam(required = false) UUID clubId,
            @RequestParam(required = false) Event.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean upcoming,
            @AuthenticationPrincipal CustomUserDetails user,
            Pageable pageable) {
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50));
        return eventService.listEvents(user.getCollegeId(), clubId, status, search, upcoming, user.getUserId(), bounded);
    }

    @GetMapping("/{id}")
    public EventDto getEvent(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.getEvent(id, user.getCollegeId(), user.getUserId());
    }

    @PostMapping
    public ResponseEntity<EventDto> createEvent(
            @Valid @RequestBody EventCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        EventDto created = eventService.createEvent(request, user.getUserId(), user.getCollegeId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public EventDto updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody EventUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.updateEvent(id, request, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/publish")
    public EventDto publishEvent(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.publishEvent(id, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/cancel")
    public EventDto cancelEvent(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.cancelEvent(id, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/approve")
    public EventDto approveEvent(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.approveEvent(id, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/reject")
    public EventDto rejectEvent(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails user) {
        String reason = body != null ? body.get("reason") : null;
        return eventService.rejectEvent(id, reason, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<EventRegistrationDto> register(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        EventRegistrationDto reg = eventService.registerForEvent(id, user.getUserId(), user.getCollegeId());
        return ResponseEntity.status(HttpStatus.CREATED).body(reg);
    }

    @DeleteMapping("/{id}/register")
    public ResponseEntity<Void> cancelRegistration(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        eventService.cancelRegistration(id, user.getUserId(), user.getCollegeId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/registrations/me")
    public List<EventRegistrationDto> myRegistrations(
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.getMyRegistrations(user.getUserId(), user.getCollegeId());
    }

    @GetMapping("/{id}/registrations")
    public List<EventRegistrationDto> eventRegistrations(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.getEventRegistrations(id, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/check-in")
    public ResponseEntity<EventAttendanceDto> checkIn(
            @PathVariable UUID id,
            @Valid @RequestBody CheckInRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        EventAttendanceDto attendance = eventService.checkIn(id, request, user.getUserId(), user.getCollegeId());
        return ResponseEntity.status(HttpStatus.CREATED).body(attendance);
    }

    @GetMapping("/{id}/attendance")
    public List<EventAttendanceDto> eventAttendance(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.getEventAttendance(id, user.getUserId(), user.getCollegeId());
    }

    @GetMapping("/{id}/attendance/report")
    public AttendanceReportDto attendanceReport(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return eventService.getAttendanceReport(id, user.getUserId(), user.getCollegeId());
    }
}

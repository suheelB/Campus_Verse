package com.campusverse.events.dto;

import com.campusverse.events.domain.Event;
import com.campusverse.events.domain.EventRegistration;

import java.time.Instant;
import java.util.UUID;

public record EventDto(
        UUID id,
        UUID collegeId,
        UUID primaryClubId,
        String clubName,
        String title,
        String description,
        Event.Status status,
        Instant startsAt,
        Instant endsAt,
        String venue,
        Integer capacity,
        Instant registrationOpensAt,
        Instant registrationClosesAt,
        long registeredCount,
        long waitlistedCount,
        boolean isUserRegistered,
        EventRegistration.Status userRegistrationStatus,
        UUID createdBy,
        String createdByName,
        Instant createdAt
) {}

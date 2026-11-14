package com.campusverse.events.dto;

import com.campusverse.events.domain.EventRegistration;

import java.time.Instant;
import java.util.UUID;

public record EventRegistrationDto(
        UUID id,
        UUID eventId,
        String eventTitle,
        UUID userId,
        String userDisplayName,
        String userEmail,
        EventRegistration.Status status,
        Instant registeredAt,
        Instant cancelledAt,
        Integer waitlistPosition
) {}

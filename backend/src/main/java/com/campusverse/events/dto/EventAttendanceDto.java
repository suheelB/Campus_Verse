package com.campusverse.events.dto;

import com.campusverse.events.domain.EventAttendance;

import java.time.Instant;
import java.util.UUID;

public record EventAttendanceDto(
        UUID id,
        UUID eventId,
        UUID userId,
        String userDisplayName,
        String userEmail,
        Instant checkedInAt,
        String checkedInByName,
        EventAttendance.Method method
) {}

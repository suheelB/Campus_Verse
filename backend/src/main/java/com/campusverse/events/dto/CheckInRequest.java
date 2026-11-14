package com.campusverse.events.dto;

import com.campusverse.events.domain.EventAttendance;

import java.util.UUID;

public record CheckInRequest(
        UUID userId,
        String userEmail,
        EventAttendance.Method method
) {}

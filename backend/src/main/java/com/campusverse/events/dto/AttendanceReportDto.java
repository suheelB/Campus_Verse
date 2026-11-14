package com.campusverse.events.dto;

import java.util.UUID;

public record AttendanceReportDto(
        UUID eventId,
        String eventTitle,
        Integer capacity,
        long totalRegistered,
        long totalWaitlisted,
        long totalAttended,
        double attendanceRatePercent
) {}

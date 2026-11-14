package com.campusverse.events.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record EventCreateRequest(
        @NotNull UUID primaryClubId,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull Instant startsAt,
        @NotNull Instant endsAt,
        String venue,
        @Min(1) Integer capacity,
        Instant registrationOpensAt,
        Instant registrationClosesAt,
        boolean publishNow
) {}

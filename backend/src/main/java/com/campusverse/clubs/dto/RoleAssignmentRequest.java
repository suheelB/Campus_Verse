package com.campusverse.clubs.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class RoleAssignmentRequest {
    @NotNull
    private UUID roleId;
}

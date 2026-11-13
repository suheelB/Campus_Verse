package com.campusverse.clubs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class MembershipDto {
    private UUID id;
    private UUID clubId;
    private String clubName;
    private UUID userId;
    private String displayName;
    private String roleName;
    private UUID roleId;
    private String status;
    private Instant appliedAt;
    private String rejectionReason;
}

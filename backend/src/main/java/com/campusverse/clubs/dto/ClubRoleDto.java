package com.campusverse.clubs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ClubRoleDto {
    private UUID id;
    private String name;
    private String displayName;
    private String description;
}

package com.campusverse.clubs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ClubDto {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;
    private String categoryName;
    private String categorySlug;
    private String status;
    private String visibility;
    private String contactEmail;
    private long memberCount;
    private Instant createdAt;
    private String rejectionReason;
}

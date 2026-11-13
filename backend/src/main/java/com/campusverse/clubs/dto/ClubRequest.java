package com.campusverse.clubs.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClubRequest {
    @NotBlank @Size(max = 255)
    private String name;
    @NotBlank @Size(max = 10000)
    private String description;
    private String categorySlug;
    @Email @Size(max = 255)
    private String contactEmail;
}

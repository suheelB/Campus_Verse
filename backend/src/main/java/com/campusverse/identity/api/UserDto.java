package com.campusverse.identity.api;

import lombok.Data;

@Data
public class UserDto {
    private String id;
    private String email;
    private String displayName;
    private String collegeId;
    private String collegeSlug;
    private String status;
}
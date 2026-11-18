package com.campusverse.shared.security;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Centralized college-administrator authorization check for new administrative
 * surfaces. Role assignments live in the database, so a stale JWT never grants
 * or preserves privilege.
 */
@Component
@RequiredArgsConstructor
public class CollegeAdminGuard {

    private final JdbcTemplate jdbc;

    public boolean isCollegeAdmin(UUID userId, UUID collegeId) {
        if (userId == null || collegeId == null) {
            return false;
        }
        Boolean authorized = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM platform_role_assignments WHERE user_id = ? AND ((role = 'COLLEGE_ADMIN' AND college_id = ?) OR role = 'PLATFORM_ADMIN'))",
                Boolean.class, userId, collegeId);
        return Boolean.TRUE.equals(authorized);
    }

    public void require(UUID userId, UUID collegeId) {
        if (!isCollegeAdmin(userId, collegeId)) {
            throw new AccessDeniedException("College administrator permission required");
        }
    }
}

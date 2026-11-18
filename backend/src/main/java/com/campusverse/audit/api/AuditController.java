package com.campusverse.audit.api;

import com.campusverse.audit.service.AuditService;
import com.campusverse.identity.security.CustomUserDetails;
import com.campusverse.shared.security.CollegeAdminGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/admin/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final CollegeAdminGuard adminGuard;

    @GetMapping
    public Page<AuditLogDto> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails user) {
        adminGuard.require(user.getUserId(), user.getCollegeId());
        Pageable bounded = PageRequest.of(
                Math.max(0, pageable.getPageNumber()),
                Math.min(Math.max(1, pageable.getPageSize()), 100));
        return auditService.search(user.getCollegeId(), action, entityType, entityId, bounded);
    }
}

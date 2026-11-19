package com.campusverse.volunteer;

import com.campusverse.audit.service.AuditService;
import com.campusverse.clubs.service.ClubService;
import com.campusverse.colleges.service.CollegeService;
import com.campusverse.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/volunteer")
@RequiredArgsConstructor
@Slf4j
public class VolunteerOpportunityController {

    private final VolunteerOpportunityRepository repository;
    private final VolunteerOpportunityService service;
    private final CollegeService collegeService;
    private final UserService userService;
    private final ClubService clubService;
    private final AuditService audit;

    @PostMapping
    public ResponseEntity<VolunteerOpportunity> create(
            @RequestParam(required = false) UUID clubId,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam Map<String, Object> details,
            @AuthenticationPrincipal(expression = "volunteerId") UUID volunteerId) {
        UUID collegeId = collegeService.getCurrentCollegeId();
        var opp = service.create(collegeId, clubId, volunteerId, title, description, details);
        return ResponseEntity.ok(opp);
    }

    @GetMapping("/pending/{collegeId}")
    public ResponseEntity<List<VolunteerOpportunity>> findPendingByCollege(@PathVariable UUID collegeId) {
        return ResponseEntity.ok(service.findPendingByCollege(collegeId));
    }

    @PostMapping("/{opportunityId}/approve")
    public ResponseEntity<VolunteerOpportunity> approve(@PathVariable UUID opportunityId, @AuthenticationPrincipal(expression = "adminId") UUID adminId) {
        return service.approve(opportunityId, adminId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{opportunityId}/reject")
    public ResponseEntity<VolunteerOpportunity> reject(@PathVariable UUID opportunityId, @AuthenticationPrincipal(expression = "adminId") UUID adminId, @RequestParam String reason) {
        return service.reject(opportunityId, adminId, reason)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/has-applied/{clubId}")
    public ResponseEntity<Boolean> hasApplied(@PathVariable UUID clubId, @AuthenticationPrincipal(expression = "volunteerId") UUID volunteerId) {
        return ResponseEntity.ok(service.hasApplied(volunteerId, clubId));
    }
}
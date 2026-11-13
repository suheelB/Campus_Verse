package com.campusverse.clubs.controller;

import com.campusverse.clubs.domain.Membership;
import com.campusverse.clubs.dto.ClubDto;
import com.campusverse.clubs.dto.ClubRequest;
import com.campusverse.clubs.dto.DecisionRequest;
import com.campusverse.clubs.service.ClubService;
import com.campusverse.identity.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/clubs")
@RequiredArgsConstructor
public class ClubController {
    private final ClubService service;

    @GetMapping
    public Page<ClubDto> directory(@AuthenticationPrincipal CustomUserDetails user,
                                   @RequestParam(required = false) String search,
                                   @RequestParam(required = false) String category,
                                   Pageable pageable) {
        return service.directory(user.getCollegeId(), user.getUserId(), search, category, bounded(pageable));
    }

    @GetMapping("/categories")
    public List<Map<String, Object>> categories() {
        return service.categories().stream().map(c -> Map.<String, Object>of(
                "id", c.getId(), "name", c.getName(), "slug", c.getSlug(),
                "description", c.getDescription() == null ? "" : c.getDescription(),
                "icon", c.getIcon() == null ? "" : c.getIcon())).toList();
    }

    @GetMapping("/mine")
    public List<ClubDto> myRequests(@AuthenticationPrincipal CustomUserDetails user) {
        return service.myClubRequests(user.getUserId(), user.getCollegeId());
    }

    @GetMapping("/requests")
    public List<ClubDto> pendingRequests(@AuthenticationPrincipal CustomUserDetails user) {
        return service.pendingClubRequests(user.getUserId(), user.getCollegeId());
    }

    @PostMapping
    public ResponseEntity<ClubDto> requestClub(@AuthenticationPrincipal CustomUserDetails user,
                                               @Valid @RequestBody ClubRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.requestClub(request, user.getUserId(), user.getCollegeId()));
    }

    @GetMapping("/{clubId}")
    public ClubDto detail(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user) {
        return service.detail(clubId, user.getCollegeId(), user.getUserId());
    }

    @PostMapping("/{clubId}/approve")
    public ClubDto approve(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user) {
        return service.decideClub(clubId, user.getUserId(), user.getCollegeId(), true, null);
    }

    @PostMapping("/{clubId}/reject")
    public ClubDto reject(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user,
                          @RequestBody(required = false) @Valid DecisionRequest request) {
        return service.decideClub(clubId, user.getUserId(), user.getCollegeId(), false,
                request == null ? null : request.getReason());
    }

    @GetMapping("/{clubId}/roles")
    public List<com.campusverse.clubs.dto.ClubRoleDto> roles(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user) {
        return service.rolesForClub(clubId, user.getUserId(), user.getCollegeId());
    }

    @GetMapping("/{clubId}/members")
    public List<?> members(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user,
                           @RequestParam(defaultValue = "ACTIVE") Membership.Status status) {
        return service.members(clubId, user.getUserId(), user.getCollegeId(), status);
    }

    @GetMapping("/{clubId}/membership-requests")
    public List<?> membershipRequests(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user) {
        return service.members(clubId, user.getUserId(), user.getCollegeId(), Membership.Status.PENDING);
    }

    private Pageable bounded(Pageable pageable) {
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50), Sort.by("name").ascending());
    }
}

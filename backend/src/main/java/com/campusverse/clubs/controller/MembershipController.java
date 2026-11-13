package com.campusverse.clubs.controller;

import com.campusverse.clubs.dto.DecisionRequest;
import com.campusverse.clubs.dto.MembershipDto;
import com.campusverse.clubs.dto.RoleAssignmentRequest;
import com.campusverse.clubs.service.ClubService;
import com.campusverse.identity.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/memberships")
@RequiredArgsConstructor
public class MembershipController {
    private final ClubService service;

    @GetMapping("/me")
    public List<MembershipDto> mine(@AuthenticationPrincipal CustomUserDetails user) {
        return service.myMemberships(user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/clubs/{clubId}")
    public MembershipDto apply(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user) {
        return service.apply(clubId, user.getUserId(), user.getCollegeId());
    }

    @DeleteMapping("/clubs/{clubId}")
    public void leave(@PathVariable UUID clubId, @AuthenticationPrincipal CustomUserDetails user) {
        service.leave(clubId, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{membershipId}/approve")
    public MembershipDto approve(@PathVariable UUID membershipId, @AuthenticationPrincipal CustomUserDetails user) {
        return service.decideMembership(membershipId, user.getUserId(), user.getCollegeId(), true, null);
    }

    @PostMapping("/{membershipId}/reject")
    public MembershipDto reject(@PathVariable UUID membershipId, @AuthenticationPrincipal CustomUserDetails user,
                                @RequestBody(required = false) @Valid DecisionRequest request) {
        return service.decideMembership(membershipId, user.getUserId(), user.getCollegeId(), false,
                request == null ? null : request.getReason());
    }

    @PutMapping("/{membershipId}/role")
    public MembershipDto assignRole(@PathVariable UUID membershipId,
                                    @Valid @RequestBody RoleAssignmentRequest request,
                                    @AuthenticationPrincipal CustomUserDetails user) {
        return service.assignRole(membershipId, request.getRoleId(), user.getUserId(), user.getCollegeId());
    }
}

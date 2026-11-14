package com.campusverse.announcements.controller;

import com.campusverse.announcements.dto.AnnouncementDto;
import com.campusverse.announcements.dto.AnnouncementRequest;
import com.campusverse.announcements.service.AnnouncementService;
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
import java.util.UUID;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping("/feed")
    public Page<AnnouncementDto> feed(
            @AuthenticationPrincipal CustomUserDetails user,
            Pageable pageable) {
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50), Sort.by("publishAt").descending());
        return announcementService.feed(user.getCollegeId(), user.getUserId(), bounded);
    }

    @GetMapping("/{id}")
    public AnnouncementDto get(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return announcementService.get(id, user.getCollegeId(), user.getUserId());
    }

    @PostMapping
    public ResponseEntity<AnnouncementDto> create(
            @Valid @RequestBody AnnouncementRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(announcementService.create(request, user.getUserId(), user.getCollegeId()));
    }

    @PutMapping("/{id}")
    public AnnouncementDto update(
            @PathVariable UUID id,
            @Valid @RequestBody AnnouncementRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return announcementService.update(id, request, user.getUserId(), user.getCollegeId());
    }

    @PostMapping("/{id}/acknowledge")
    public AnnouncementDto acknowledge(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return announcementService.acknowledge(id, user.getCollegeId(), user.getUserId());
    }

    @PostMapping("/{id}/read")
    public void markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        announcementService.markRead(id, user.getCollegeId(), user.getUserId());
    }

    @GetMapping("/club/{clubId}")
    public Page<AnnouncementDto> clubAnnouncements(
            @PathVariable UUID clubId,
            @AuthenticationPrincipal CustomUserDetails user,
            Pageable pageable) {
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50), Sort.by("createdAt").descending());
        return announcementService.clubAnnouncements(clubId, user.getUserId(), user.getCollegeId(), bounded);
    }

    @GetMapping("/mine")
    public List<AnnouncementDto> myCreated(
            @AuthenticationPrincipal CustomUserDetails user) {
        return announcementService.myCreated(user.getUserId(), user.getCollegeId());
    }
}

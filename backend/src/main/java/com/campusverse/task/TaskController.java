package com.campusverse.task;

import com.campusverse.audit.service.AuditService;
import com.campusverse.clubs.service.ClubService;
import com.campusverse.colleges.service.CollegeService;
import com.campusverse.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskRepository repository;
    private final TaskService service;
    private final CollegeService collegeService;
    private final UserService userService;
    private final ClubService clubService;
    private final AuditService audit;

    @PostMapping
    public ResponseEntity<Task> create(
            @RequestParam(required = false) UUID clubId,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String priority,
            @AuthenticationPrincipal(expression = "userId") UUID userId) {
        UUID collegeId = collegeService.getCurrentCollegeId();
        var task = service.create(collegeId, clubId, userId, title, description, priority);
        return ResponseEntity.ok(task);
    }

    @GetMapping
    public ResponseEntity<List<Task>> findAll(@AuthenticationPrincipal(expression = "userId") UUID userId) {
        UUID collegeId = collegeService.getCurrentCollegeId();
        return ResponseEntity.ok(service.findAllByCollege(collegeId));
    }

    @GetMapping("/todo")
    public ResponseEntity<List<Task>> findTodo(@AuthenticationPrincipal(expression = "userId") UUID userId) {
        UUID collegeId = collegeService.getCurrentCollegeId();
        return ResponseEntity.ok(service.findTodoByCollege(collegeId));
    }

    @GetMapping("/in-progress")
    public ResponseEntity<List<Task>> findInProgress(@AuthenticationPrincipal(expression = "userId") UUID userId) {
        UUID collegeId = collegeService.getCurrentCollegeId();
        return ResponseEntity.ok(service.findInProgressByCollege(collegeId));
    }

    @GetMapping("/completed")
    public ResponseEntity<List<Task>> findCompleted(@AuthenticationPrincipal(expression = "userId") UUID userId) {
        UUID collegeId = collegeService.getCurrentCollegeId();
        return ResponseEntity.ok(service.findCompletedByCollege(collegeId));
    }

    @PostMapping("/{taskId}/assign")
    public ResponseEntity<Task> assign(@PathVariable UUID taskId, @RequestParam UUID userId, @AuthenticationPrincipal(expression = "operatorId") UUID operatorId) {
        return ResponseEntity.ok(service.assignTo(taskId, userId, operatorId));
    }

    @PostMapping("/{taskId}/status")
    public ResponseEntity<Task> updateStatus(@PathVariable UUID taskId, @RequestParam String newStatus, @AuthenticationPrincipal(expression = "operatorId") UUID operatorId) {
        return ResponseEntity.ok(service.updateStatus(taskId, newStatus, operatorId));
    }
}
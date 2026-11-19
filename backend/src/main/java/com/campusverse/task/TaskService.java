package com.campusverse.task;

import com.campusverse.audit.service.AuditService;
import com.campusverse.clubs.service.ClubService;
import com.campusverse.colleges.service.CollegeService;
import com.campusverse.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository repository;
    private final CollegeService collegeService;
    private final UserService userService;
    private final ClubService clubService;
    private final AuditService audit;

    @Transactional
    public Task create(UUID collegeId, UUID clubId, UUID assignedTo, String title, String description, String priority) {
        var college = collegeService.findById(collegeId).orElseThrow();
        var task = Task.builder()
                .title(title)
                .description(description)
                .college(college)
                .club(clubId != null ? clubService.findById(clubId).orElse(null) : null)
                .assignedTo(assignedTo != null ? userService.findById(assignedTo).orElse(null) : null)
                .status("TODO")
                .priority(priority)
                .build();

        var saved = repository.save(task);
        audit.record(collegeId, saved.getAssignedTo().getId(), "TASK_CREATE", "TASK", saved.getId(),
                Map.of("title", saved.getTitle(), "priority", saved.getPriority(), "assignedTo", saved.getAssignedTo().getId()));
        return saved;
    }

    @Transactional
    public Task updateStatus(UUID taskId, String newStatus, UUID operatorId) {
        var task = repository.findById(taskId).orElseThrow();
        var oldStatus = task.getStatus();
        task.setStatus(newStatus);
        if (newStatus.equals("COMPLETED")) {
            task.setCompletedAt(java.time.Instant.now().getEpochSecond()); // simplified
        }
        var saved = repository.save(task);
        audit.record(task.getCollege().getId(), operatorId, "TASK_STATUS_UPDATE", "TASK", saved.getId(),
                Map.of("title", saved.getTitle(), "oldStatus", oldStatus, "newStatus", newStatus));
        return saved;
    }

    @Transactional
    public Task assignTo(UUID taskId, UUID userId, UUID operatorId) {
        var task = repository.findById(taskId).orElseThrow();
        var user = userService.findById(userId).orElseThrow();
        task.setAssignedTo(user);
        var saved = repository.save(task);
        audit.record(task.getCollege().getId(), operatorId, "TASK_ASSIGN", "TASK", saved.getId(),
                Map.of("title", saved.getTitle(), "assignedTo", saved.getAssignedTo().getId()));
        return saved;
    }

    public List<Task> findAllByCollege(UUID collegeId) {
        return repository.findAllByCollegeIdOrderByPriorityDueDate(collegeId);
    }

    public List<Task> findTodoByCollege(UUID collegeId) {
        return repository.findTodoByCollege(collegeId);
    }

    public List<Task> findInProgressByCollege(UUID collegeId) {
        return repository.findInProgressByCollege(collegeId);
    }

    public List<Task> findCompletedByCollege(UUID collegeId) {
        return repository.findCompletedByCollege(collegeId);
    }
}
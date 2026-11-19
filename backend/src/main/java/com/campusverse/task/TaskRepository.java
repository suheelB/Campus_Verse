package com.campusverse.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("SELECT t FROM Task t WHERE t.college.id = :collegeId ORDER BY t.priority ASC, t.dueDate ASC")
    List<Task> findAllByCollegeIdOrderByPriorityDueDate(@Param("collegeId") UUID collegeId);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.college.id = :collegeId ORDER BY t.priority ASC, t.dueDate ASC")
    List<Task> findAllAssignedToUser(@Param("userId") UUID userId, @Param("collegeId") UUID collegeId);

    @Query("SELECT t FROM Task t WHERE t.club.id = :clubId ORDER BY t.priority ASC, t.dueDate ASC")
    List<Task> findAllByClub(@Param("clubId") UUID clubId);

    @Query("SELECT t FROM Task t WHERE t.status = 'TODO' AND t.college.id = :collegeId")
    List<Task> findTodoByCollege(@Param("collegeId") UUID collegeId);

    @Query("SELECT t FROM Task t WHERE t.status = 'IN_PROGRESS' AND t.college.id = :collegeId")
    List<Task> findInProgressByCollege(@Param("collegeId") UUID collegeId);

    @Query("SELECT t FROM Task t WHERE t.status = 'COMPLETED' AND t.college.id = :collegeId")
    List<Task> findCompletedByCollege(@Param("collegeId") UUID collegeId);
}
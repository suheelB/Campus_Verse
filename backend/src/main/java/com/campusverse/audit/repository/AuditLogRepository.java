package com.campusverse.audit.repository;

import com.campusverse.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByCollegeIdOrderByCreatedAtDesc(UUID collegeId, Pageable pageable);

    Page<AuditLog> findByCollegeIdAndActionOrderByCreatedAtDesc(UUID collegeId, String action, Pageable pageable);

    Page<AuditLog> findByCollegeIdAndEntityTypeOrderByCreatedAtDesc(UUID collegeId, String entityType, Pageable pageable);

    Page<AuditLog> findByCollegeIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
            UUID collegeId, String entityType, UUID entityId, Pageable pageable);
}

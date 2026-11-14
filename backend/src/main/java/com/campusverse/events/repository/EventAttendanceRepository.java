package com.campusverse.events.repository;

import com.campusverse.events.domain.EventAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventAttendanceRepository extends JpaRepository<EventAttendance, UUID> {

    Optional<EventAttendance> findByEventIdAndUserId(UUID eventId, UUID userId);

    List<EventAttendance> findByEventIdOrderByCheckedInAtDesc(UUID eventId);

    long countByEventId(UUID eventId);
}

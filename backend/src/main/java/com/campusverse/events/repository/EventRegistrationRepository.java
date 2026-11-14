package com.campusverse.events.repository;

import com.campusverse.events.domain.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, UUID> {

    Optional<EventRegistration> findByEventIdAndUserId(UUID eventId, UUID userId);

    List<EventRegistration> findByUserIdOrderByRegisteredAtDesc(UUID userId);

    List<EventRegistration> findByEventIdOrderByWaitlistPositionAscRegisteredAtAsc(UUID eventId);

    long countByEventIdAndStatus(UUID eventId, EventRegistration.Status status);

    Optional<EventRegistration> findFirstByEventIdAndStatusOrderByWaitlistPositionAscRegisteredAtAsc(
            UUID eventId,
            EventRegistration.Status status
    );

    @Query("SELECT COALESCE(MAX(r.waitlistPosition), 0) FROM EventRegistration r WHERE r.event.id = :eventId")
    int findMaxWaitlistPositionByEventId(@Param("eventId") UUID eventId);
}

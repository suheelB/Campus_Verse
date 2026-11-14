package com.campusverse.events.repository;

import com.campusverse.events.domain.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    Optional<Event> findByIdAndCollegeId(UUID id, UUID collegeId);

    @Query("""
        SELECT e FROM Event e
        WHERE e.college.id = :collegeId
          AND (:status IS NULL OR e.status = :status)
          AND (:upcoming IS NULL
               OR (:upcoming = true AND e.endsAt >= :now)
               OR (:upcoming = false AND e.endsAt < :now))
        ORDER BY e.startsAt ASC
    """)
    Page<Event> findEventsAllClubs(
            @Param("collegeId") UUID collegeId,
            @Param("status") Event.Status status,
            @Param("upcoming") Boolean upcoming,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Query("""
        SELECT e FROM Event e
        WHERE e.college.id = :collegeId
          AND e.primaryClub.id = :clubId
          AND (:status IS NULL OR e.status = :status)
          AND (:upcoming IS NULL
               OR (:upcoming = true AND e.endsAt >= :now)
               OR (:upcoming = false AND e.endsAt < :now))
        ORDER BY e.startsAt ASC
    """)
    Page<Event> findEventsByClub(
            @Param("collegeId") UUID collegeId,
            @Param("clubId") UUID clubId,
            @Param("status") Event.Status status,
            @Param("upcoming") Boolean upcoming,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Query("""
        SELECT e FROM Event e
        WHERE e.college.id = :collegeId
          AND (:status IS NULL OR e.status = :status)
          AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:upcoming IS NULL
               OR (:upcoming = true AND e.endsAt >= :now)
               OR (:upcoming = false AND e.endsAt < :now))
        ORDER BY e.startsAt ASC
    """)
    Page<Event> searchEventsAllClubs(
            @Param("collegeId") UUID collegeId,
            @Param("status") Event.Status status,
            @Param("search") String search,
            @Param("upcoming") Boolean upcoming,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Query("""
        SELECT e FROM Event e
        WHERE e.college.id = :collegeId
          AND e.primaryClub.id = :clubId
          AND (:status IS NULL OR e.status = :status)
          AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:upcoming IS NULL
               OR (:upcoming = true AND e.endsAt >= :now)
               OR (:upcoming = false AND e.endsAt < :now))
        ORDER BY e.startsAt ASC
    """)
    Page<Event> searchEventsByClub(
            @Param("collegeId") UUID collegeId,
            @Param("clubId") UUID clubId,
            @Param("status") Event.Status status,
            @Param("search") String search,
            @Param("upcoming") Boolean upcoming,
            @Param("now") Instant now,
            Pageable pageable
    );

    Page<Event> findByPrimaryClubIdOrderByStartsAtDesc(UUID primaryClubId, Pageable pageable);
}

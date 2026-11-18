package com.campusverse.events.service;

import com.campusverse.events.domain.EventRegistration;
import com.campusverse.events.dto.EventRegistrationDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Verifies the database row lock that protects event capacity. Two students race
 * for the final seat; exactly one must be registered and one waitlisted.
 *
 * This test needs a disposable PostgreSQL database. Run it with:
 *
 * <pre>
 * docker compose exec postgres createdb -U campusverse campusverse_it
 * mvn -Dtest=EventRegistrationConcurrencyTest -Dcampusverse.it.enabled=true test
 * </pre>
 *
 * The URL, user, and password can be overridden with CAMPUSVERSE_IT_DB_URL,
 * CAMPUSVERSE_IT_DB_USER, and CAMPUSVERSE_IT_DB_PASSWORD. Testcontainers could
 * not attach to the local Docker 29 desktop socket in this environment, so the
 * disposable-database path is explicit and opt-in.
 */
@SpringBootTest
@EnabledIfSystemProperty(named = "campusverse.it.enabled", matches = "true")
class EventRegistrationConcurrencyTest {

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> env(
                "CAMPUSVERSE_IT_DB_URL", "jdbc:postgresql://localhost:5432/campusverse_it"));
        registry.add("spring.datasource.username", () -> env("CAMPUSVERSE_IT_DB_USER", "campusverse"));
        registry.add("spring.datasource.password", () -> env("CAMPUSVERSE_IT_DB_PASSWORD", "change-me-locally"));
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    @Autowired
    EventService eventService;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void concurrentRegistrationsCannotExceedCapacity() throws Exception {
        UUID collegeId = UUID.randomUUID();
        UUID organizerId = UUID.randomUUID();
        UUID studentOne = UUID.randomUUID();
        UUID studentTwo = UUID.randomUUID();
        UUID clubId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        jdbc.update("INSERT INTO colleges (id, name, slug) VALUES (?, ?, ?)",
                collegeId, "Concurrency College", "concurrency-" + suffix);
        insertUser(organizerId, collegeId, "organizer-" + suffix + "@test.edu", "Organizer");
        insertUser(studentOne, collegeId, "student-one-" + suffix + "@test.edu", "Student One");
        insertUser(studentTwo, collegeId, "student-two-" + suffix + "@test.edu", "Student Two");
        jdbc.update("""
                INSERT INTO clubs (id, college_id, name, slug, description, status, visibility,
                                   require_approval, created_by)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', 'PUBLIC', TRUE, ?)
                """, clubId, collegeId, "Race Club", "race-club-" + suffix,
                "A club used to verify event capacity.", organizerId);
        jdbc.update("""
                INSERT INTO events (id, college_id, primary_club_id, title, description, status,
                                    starts_at, ends_at, capacity, created_by)
                VALUES (?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, 1, ?)
                """, eventId, collegeId, clubId, "One Seat Only",
                "Capacity race test event.", java.sql.Timestamp.from(Instant.now().plus(2, ChronoUnit.DAYS)),
                java.sql.Timestamp.from(Instant.now().plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS)), organizerId);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Callable<EventRegistrationDto> first = registrationAttempt(studentOne, eventId, collegeId, ready, start);
            Callable<EventRegistrationDto> second = registrationAttempt(studentTwo, eventId, collegeId, ready, start);
            Future<EventRegistrationDto> firstResult = executor.submit(first);
            Future<EventRegistrationDto> secondResult = executor.submit(second);
            ready.await();
            start.countDown();

            List<EventRegistration.Status> statuses = List.of(
                    firstResult.get().status(),
                    secondResult.get().status());
            assertEquals(1, statuses.stream().filter(s -> s == EventRegistration.Status.REGISTERED).count(),
                    "Exactly one student must get the seat");
            assertEquals(1, statuses.stream().filter(s -> s == EventRegistration.Status.WAITLISTED).count(),
                    "Exactly one student must be waitlisted");
        } finally {
            executor.shutdownNow();
        }

        Integer registered = jdbc.queryForObject(
                "SELECT COUNT(*) FROM event_registrations WHERE event_id = ? AND status = 'REGISTERED'",
                Integer.class, eventId);
        Integer waitlisted = jdbc.queryForObject(
                "SELECT COUNT(*) FROM event_registrations WHERE event_id = ? AND status = 'WAITLISTED'",
                Integer.class, eventId);
        assertEquals(1, registered);
        assertEquals(1, waitlisted);
    }

    private Callable<EventRegistrationDto> registrationAttempt(
            UUID userId, UUID eventId, UUID collegeId, CountDownLatch ready, CountDownLatch start) {
        return () -> {
            ready.countDown();
            start.await();
            return eventService.registerForEvent(eventId, userId, collegeId);
        };
    }

    private void insertUser(UUID id, UUID collegeId, String email, String displayName) {
        jdbc.update("""
                INSERT INTO users (id, college_id, email, password_hash, display_name, status)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE')
                """, id, collegeId, email, "not-used-in-this-test", displayName);
    }
}

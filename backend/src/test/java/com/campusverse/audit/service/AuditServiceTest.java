package com.campusverse.audit.service;

import com.campusverse.audit.domain.AuditLog;
import com.campusverse.audit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    AuditLogRepository logs;

    AuditService service;

    @BeforeEach
    void setUp() {
        service = new AuditService(logs, new ObjectMapper());
    }

    @Test
    void persistsEntryWithCollegeScopeAndDetails() {
        UUID collegeId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID entityId = UUID.randomUUID();

        service.record(collegeId, actorId, "CLUB_APPROVE", "CLUB", entityId, Map.of("name", "Robotics Club"));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(logs).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals(collegeId, saved.getCollegeId());
        assertEquals(actorId, saved.getActorUserId());
        assertEquals("CLUB_APPROVE", saved.getAction());
        assertEquals("CLUB", saved.getEntityType());
        assertEquals(entityId, saved.getEntityId());
        assertTrue(saved.getDetails().contains("Robotics Club"));
    }

    @Test
    void skipsWritesWithoutCollegeScope() {
        service.record(null, UUID.randomUUID(), "CLUB_APPROVE", "CLUB", UUID.randomUUID(), Map.of());

        verify(logs, never()).save(any());
    }

    @Test
    void persistenceFailureDoesNotBreakCaller() {
        when(logs.save(any(AuditLog.class))).thenThrow(new RuntimeException("database unavailable"));

        assertDoesNotThrow(() -> service.record(
                UUID.randomUUID(), UUID.randomUUID(), "AUTH_LOGIN", "USER", UUID.randomUUID(), Map.of()));
    }
}

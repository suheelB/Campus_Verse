package com.campusverse.shared.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @PersistenceContext
    private EntityManager entityManager;

    private final JdbcTemplate jdbcTemplate;
    private final BuildProperties buildProperties;
    private final String appName;

    public HealthController(JdbcTemplate jdbcTemplate, BuildProperties buildProperties,
                           @Value("${spring.application.name:campusverse}") String appName) {
        this.jdbcTemplate = jdbcTemplate;
        this.buildProperties = buildProperties;
        this.appName = appName;
    }

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", appName);
        response.put("timestamp", Instant.now().toString());

        // Database connectivity check
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("database", "CONNECTED");
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("database", "DISCONNECTED");
            response.put("databaseError", e.getMessage());
        }

        // Version info
        if (buildProperties != null) {
            response.put("version", buildProperties.getVersion());
            response.put("buildTime", buildProperties.getTime());
        }

        return response;
    }

    @GetMapping("/liveness")
    public Map<String, String> liveness() {
        return Map.of("status", "ALIVE");
    }

    @GetMapping("/readiness")
    public Map<String, Object> readiness() {
        Map<String, Object> response = new HashMap<>();
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("status", "READY");
            response.put("database", "READY");
        } catch (Exception e) {
            response.put("status", "NOT_READY");
            response.put("database", "NOT_READY");
        }
        return response;
    }
}
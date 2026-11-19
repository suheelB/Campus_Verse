package com.campusverse.volunteer;

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
public class VolunteerOpportunityService {

    private final VolunteerOpportunityRepository repository;
    private final CollegeService collegeService;
    private final UserService userService;
    private final ClubService clubService;
    private final AuditService audit;

    public VolunteerOpportunity create(UUID collegeId, UUID clubId, UUID volunteerId, String title, String description, Map<String, Object> details) {
        var college = collegeService.findById(collegeId).orElseThrow();
        var volunteer = userService.findById(volunteerId).orElseThrow();
        var club = clubId != null ? clubService.findById(clubId).orElse(null) : null;

        var opportunity = VolunteerOpportunity.builder()
                .title(title)
                .description(description)
                .college(college)
                .club(club)
                .volunteer(volunteer)
                .role("VOLUNTEER")
                .status("PENDING")
                .requiredSkills(details != null ? (details.get("skills") != null ? details.get("skills").toString() : "") : "")
                .hoursCommitted(0)
                .build();

        var saved = repository.save(opportunity);
        audit.record(collegeId, volunteerId, "VOLUNTEER_REQUEST", "VOLUNTEER_OPPORTUNITY", saved.getId(),
                Map.of("title", saved.getTitle(), "clubId", club != null ? club.getId().toString() : "null"));
        return saved;
    }

    public Optional<VolunteerOpportunity> approve(UUID opportunityId, UUID adminId) {
        var opp = repository.findById(opportunityId).orElseThrow();
        opp.setStatus("APPROVED");
        var saved = repository.save(opp);
        audit.record(opp.getCollege().getId(), adminId, "VOLUNTEER_APPROVE", "VOLUNTEER_OPPORTUNITY", saved.getId(),
                Map.of("title", saved.getTitle()));
        return Optional.of(saved);
    }

    public Optional<VolunteerOpportunity> reject(UUID opportunityId, UUID adminId, String reason) {
        var opp = repository.findById(opportunityId).orElseThrow();
        opp.setStatus("REJECTED");
        opp.setRejectionReason(reason);
        var saved = repository.save(opp);
        audit.record(opp.getCollege().getId(), adminId, "VOLUNTEER_REJECT", "VOLUNTEER_OPPORTUNITY", saved.getId(),
                Map.of("title", saved.getTitle(), "reason", reason));
        return Optional.of(saved);
    }

    public List<VolunteerOpportunity> findPendingByCollege(UUID collegeId) {
        return repository.findPendingByCollegeId(collegeId).stream()
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    public boolean hasApplied(UUID volunteerId, UUID clubId) {
        return repository.findByVolunteerAndClub(volunteerId, clubId).isPresent();
    }
}
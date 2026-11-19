package com.campusverse.volunteer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VolunteerOpportunityRepository extends JpaRepository<VolunteerOpportunity, UUID> {

    @Query("SELECT vo FROM VolunteerOpportunity vo WHERE vo.college.id = :collegeId AND vo.status = 'PENDING'")
    Optional<VolunteerOpportunity> findPendingByCollegeId(@Param("collegeId") UUID collegeId);

    @Query("SELECT vo FROM VolunteerOpportunity vo WHERE vo.volunteer.id = :volunteerId AND vo.club.id = :clubId")
    Optional<VolunteerOpportunity> findByVolunteerAndClub(@Param("volunteerId") UUID volunteerId, @Param("clubId") UUID clubId);

    @Query("SELECT vo FROM VolunteerOpportunity vo WHERE vo.college.id = :collegeId ORDER BY vo.created_at DESC")
    java.util.List<VolunteerOpportunity> findAllByCollegeIdOrderByCreatedAtDesc(@Param("collegeId") UUID collegeId);
}
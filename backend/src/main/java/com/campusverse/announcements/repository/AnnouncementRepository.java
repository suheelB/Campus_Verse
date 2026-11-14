package com.campusverse.announcements.repository;

import com.campusverse.announcements.domain.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    Optional<Announcement> findByIdAndCollegeId(UUID id, UUID collegeId);

    @Query("""
        SELECT a FROM Announcement a
        WHERE a.college.id = :collegeId
          AND a.status = 'PUBLISHED'
          AND a.publishAt <= :now
          AND (a.expiresAt IS NULL OR a.expiresAt > :now)
          AND (
            (a.club IS NULL AND a.audienceType = 'ALL_COLLEGE')
            OR (a.club.id IN :memberClubIds AND a.audienceType = 'CLUB_MEMBERS')
            OR (a.club.id IN :officerClubIds AND a.audienceType = 'CLUB_OFFICERS')
            OR a.author.id = :userId
          )
        ORDER BY a.publishAt DESC
    """)
    Page<Announcement> findFeed(
            @Param("collegeId") UUID collegeId,
            @Param("userId") UUID userId,
            @Param("memberClubIds") Collection<UUID> memberClubIds,
            @Param("officerClubIds") Collection<UUID> officerClubIds,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Query("""
        SELECT a FROM Announcement a
        WHERE a.club.id = :clubId
        ORDER BY a.createdAt DESC
    """)
    Page<Announcement> findByClubIdOrderByCreatedAtDesc(@Param("clubId") UUID clubId, Pageable pageable);

    @Query("""
        SELECT a FROM Announcement a
        WHERE a.author.id = :authorId AND a.college.id = :collegeId
        ORDER BY a.createdAt DESC
    """)
    List<Announcement> findByAuthorIdAndCollegeIdOrderByCreatedAtDesc(
            @Param("authorId") UUID authorId,
            @Param("collegeId") UUID collegeId
    );
}

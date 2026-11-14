package com.campusverse.announcements.repository;

import com.campusverse.announcements.domain.AnnouncementReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementReceiptRepository extends JpaRepository<AnnouncementReceipt, UUID> {
    Optional<AnnouncementReceipt> findByAnnouncementIdAndUserId(UUID announcementId, UUID userId);
    List<AnnouncementReceipt> findAllByUserIdAndAnnouncementIdIn(UUID userId, Collection<UUID> announcementIds);
    long countByAnnouncementIdAndReadAtIsNotNull(UUID announcementId);
    long countByAnnouncementIdAndAcknowledgedAtIsNotNull(UUID announcementId);
}

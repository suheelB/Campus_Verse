/*
 * Copyright 2024 CampusVerse Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.campusverse.clubs.repository;

import com.campusverse.clubs.domain.Club;
import com.campusverse.clubs.domain.Membership;
import com.campusverse.identity.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, UUID> {
    Optional<Membership> findByClubAndUser(Club club, User user);

    List<Membership> findByClubAndStatus(Club club, Membership.Status status);

    @Query("SELECT m FROM Membership m WHERE m.club = :club AND m.status = :status ORDER BY m.appliedAt ASC")
    Page<Membership> findByClubAndStatus(Club club, Membership.Status status, Pageable pageable);

    List<Membership> findByUserAndStatusIn(User user, List<Membership.Status> statuses);

    List<Membership> findByUserAndStatus(User user, Membership.Status status);

    @Query("SELECT m FROM Membership m WHERE m.user = :user AND m.status IN :statuses ORDER BY m.createdAt DESC")
    Page<Membership> findByUserAndStatusIn(User user, List<Membership.Status> statuses, Pageable pageable);

    boolean existsByClubAndUser(Club club, User user);

    long countByClubAndStatus(Club club, Membership.Status status);

    List<Membership> findByClubAndStatusOrderByAppliedAtAsc(Club club, Membership.Status status);

    List<Membership> findByUserOrderByAppliedAtDesc(User user);

    boolean existsByClubAndUserAndStatus(Club club, User user, Membership.Status status);
}
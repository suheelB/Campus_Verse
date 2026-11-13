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
import com.campusverse.clubs.domain.ClubCategory;
import com.campusverse.colleges.domain.College;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClubRepository extends JpaRepository<Club, UUID> {
    Optional<Club> findByCollegeAndSlug(College college, String slug);

    List<Club> findByCollegeAndStatus(College college, Club.Status status);

    @Query("SELECT c FROM Club c WHERE c.college = :college AND c.status = :status ORDER BY c.name ASC")
    Page<Club> findByCollegeAndStatus(College college, Club.Status status, Pageable pageable);

    @Query("SELECT c FROM Club c WHERE c.college = :college AND c.category = :category AND c.status = :status ORDER BY c.name ASC")
    Page<Club> findByCollegeAndCategoryAndStatus(College college, ClubCategory category, Club.Status status, Pageable pageable);

    @Query("SELECT c FROM Club c WHERE c.college = :college AND c.status = :status AND LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY c.name ASC")
    Page<Club> searchByName(College college, Club.Status status, String search, Pageable pageable);

    @Query("SELECT c FROM Club c WHERE c.college = :college AND c.status = :status " +
            "AND (:search IS NULL OR :search = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:categorySlug IS NULL OR c.category.slug = :categorySlug) ORDER BY c.name ASC")
    Page<Club> searchDirectory(College college, Club.Status status, String search, String categorySlug, Pageable pageable);

    List<Club> findByCollegeAndStatusOrderByCreatedAtDesc(College college, Club.Status status);

    List<Club> findByCreatedByAndCollegeOrderByCreatedAtDesc(com.campusverse.identity.domain.User createdBy, College college);

    boolean existsByCollegeAndSlug(College college, String slug);
}
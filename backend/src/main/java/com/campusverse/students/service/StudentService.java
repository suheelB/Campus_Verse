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

package com.campusverse.students.service;

import com.campusverse.students.api.StudentProfileDto;
import com.campusverse.students.api.UpdateStudentProfileRequest;
import com.campusverse.students.domain.StudentProfile;
import com.campusverse.students.repository.StudentProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentService {

    private final StudentProfileRepository studentProfileRepository;

    public void createEmptyProfile(UUID userId) {
        StudentProfile profile = StudentProfile.builder()
                .userId(userId)
                .profileVisibility(StudentProfile.Visibility.PUBLIC)
                .build();
        studentProfileRepository.save(profile);
    }

    public StudentProfileDto getProfile(UUID userId) {
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Student profile not found"));
        return toDto(profile);
    }

    public StudentProfileDto updateProfile(UUID userId, UpdateStudentProfileRequest request) {
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Student profile not found"));

        if (request.getProgram() != null) profile.setProgram(request.getProgram());
        if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
        if (request.getAcademicYear() != null) profile.setAcademicYear(request.getAcademicYear());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getProfileVisibility() != null) {
            profile.setProfileVisibility(StudentProfile.Visibility.valueOf(request.getProfileVisibility()));
        }

        profile = studentProfileRepository.save(profile);
        return toDto(profile);
    }

    private StudentProfileDto toDto(StudentProfile profile) {
        StudentProfileDto dto = new StudentProfileDto();
        dto.setProgram(profile.getProgram());
        dto.setDepartment(profile.getDepartment());
        dto.setAcademicYear(profile.getAcademicYear());
        dto.setBio(profile.getBio());
        dto.setProfileVisibility(profile.getProfileVisibility().name());
        return dto;
    }
}
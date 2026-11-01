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

package com.campusverse.students.api;

import com.campusverse.identity.security.CustomUserDetails;
import com.campusverse.shared.api.ApiResponse;
import com.campusverse.students.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<StudentProfileDto>> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        StudentProfileDto profile = studentService.getProfile(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<StudentProfileDto>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateStudentProfileRequest request) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        StudentProfileDto profile = studentService.updateProfile(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }
}
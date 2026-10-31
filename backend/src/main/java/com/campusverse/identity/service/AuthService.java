package com.campusverse.identity.service;

import com.campusverse.colleges.domain.College;
import com.campusverse.colleges.repository.CollegeRepository;
import com.campusverse.identity.api.AuthResponse;
import com.campusverse.identity.api.LoginRequest;
import com.campusverse.identity.api.RegisterRequest;
import com.campusverse.identity.api.UserDto;
import com.campusverse.identity.domain.User;
import com.campusverse.identity.repository.UserRepository;
import com.campusverse.identity.security.JwtTokenProvider;
import com.campusverse.shared.errors.ApiError;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(RegisterRequest request) {
        College college = collegeRepository.findBySlug(request.getCollegeSlug())
                .orElseThrow(() -> new IllegalArgumentException("Invalid college"));

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .collegeId(college.getId())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .status(User.Status.ACTIVE)
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getCollegeId().toString()
        );

        return new AuthResponse(token, toUserDto(user, college.getSlug()));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");
        }

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new IllegalArgumentException("Account is not active");
        }

        // Update last login
        user.setLastLoginAt(java.time.Instant.now());
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getCollegeId().toString()
        );

        College college = collegeRepository.findById(user.getCollegeId())
                .orElseThrow(() -> new IllegalArgumentException("College not found"));

        return new AuthResponse(token, toUserDto(user, college.getSlug()));
    }

    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        College college = collegeRepository.findById(user.getCollegeId())
                .orElseThrow(() -> new IllegalArgumentException("College not found"));

        return toUserDto(user, college.getSlug());
    }

    private UserDto toUserDto(User user, String collegeSlug) {
        UserDto dto = new UserDto();
        dto.setId(user.getId().toString());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setCollegeId(user.getCollegeId().toString());
        dto.setCollegeSlug(collegeSlug);
        dto.setStatus(user.getStatus().name());
        return dto;
    }
}
package com.campusverse.identity.api;

import com.campusverse.audit.service.AuditService;
import com.campusverse.identity.security.CustomUserDetails;
import com.campusverse.identity.security.JwtTokenProvider;
import com.campusverse.identity.service.AuthService;
import com.campusverse.identity.service.TokenRevocationService;
import com.campusverse.shared.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenRevocationService tokenRevocationService;
    private final AuditService audit;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request,
                                                    @AuthenticationPrincipal CustomUserDetails user) {
        String token = bearerToken(request);
        if (token != null && user != null) {
            tokenRevocationService.revoke(token, user.getUserId());
            audit.record("AUTH_LOGOUT", "USER", user.getUserId(), Map.of("email", user.getEmail()));
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        UserDto user = authService.getCurrentUser(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    private String bearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7);
    }
}
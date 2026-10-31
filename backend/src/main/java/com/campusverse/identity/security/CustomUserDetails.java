package com.campusverse.identity.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

public class CustomUserDetails implements UserDetails {
    private final UUID userId;
    private final String email;
    private final String password;
    private final UUID collegeId;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(UUID userId, String email, String password, UUID collegeId, Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.collegeId = collegeId;
        this.authorities = authorities;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getCollegeId() {
        return collegeId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
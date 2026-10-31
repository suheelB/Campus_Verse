-- CampusVerse Initial Schema Migration
-- Version 1.0.0
-- Creates core tables for colleges, users, roles, and basic identity

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colleges table
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email_domain VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_object_key VARCHAR(500),
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform role assignments
CREATE TABLE platform_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('STUDENT', 'COLLEGE_ADMIN', 'PLATFORM_ADMIN', 'FACULTY_COORDINATOR')),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role, college_id)
);

-- Student profiles
CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    program VARCHAR(255),
    department VARCHAR(255),
    academic_year VARCHAR(50),
    bio TEXT,
    profile_visibility VARCHAR(50) DEFAULT 'PUBLIC' NOT NULL CHECK (profile_visibility IN ('PUBLIC', 'CLUB_MEMBERS', 'PRIVATE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_users_college_id ON users(college_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_platform_role_assignments_user_id ON platform_role_assignments(user_id);
CREATE INDEX idx_platform_role_assignments_college_id ON platform_role_assignments(college_id);
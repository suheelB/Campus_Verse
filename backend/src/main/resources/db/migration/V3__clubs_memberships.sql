-- CampusVerse Clubs & Memberships Migration
-- Version 3.0.0
-- Creates tables for clubs, memberships, roles, and categories

-- Clean up any existing tables from failed migration attempts
DROP TABLE IF EXISTS membership_invitations CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS club_roles CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS club_categories CASCADE;

-- Club categories
CREATE TABLE club_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    category_id UUID REFERENCES club_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    logo_object_key VARCHAR(500),
    banner_object_key VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'REJECTED')),
    visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'INVITE_ONLY')),
    require_approval BOOLEAN NOT NULL DEFAULT TRUE,
    max_members INT,
    contact_email VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    founded_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (college_id, slug)
);

-- Club roles
CREATE TABLE club_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    display_order INT DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, name)
);

-- Memberships table
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES club_roles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED', 'LEFT', 'INVITED')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, user_id)
);

-- Membership invitations
CREATE TABLE membership_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES club_roles(id) ON DELETE SET NULL,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clubs_college_id ON clubs(college_id);
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_clubs_category_id ON clubs(category_id);
CREATE INDEX idx_club_roles_club_id ON club_roles(club_id);
CREATE INDEX idx_memberships_club_id ON memberships(club_id);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_role_id ON memberships(role_id);
CREATE INDEX idx_membership_invitations_club_id ON membership_invitations(club_id);
CREATE INDEX idx_membership_invitations_token ON membership_invitations(token);
CREATE INDEX idx_membership_invitations_email ON membership_invitations(email);

-- Seed default club categories
INSERT INTO club_categories (name, slug, description, icon, display_order) VALUES
('Academic & Research', 'academic-research', 'Academic societies, research groups, and study circles', 'book-open', 1),
('Arts & Culture', 'arts-culture', 'Music, dance, theater, literature, and visual arts', 'palette', 2),
('Sports & Recreation', 'sports-recreation', 'Athletic clubs, fitness groups, and recreational sports', 'dumbbell', 3),
('Technology & Innovation', 'technology-innovation', 'Coding, robotics, AI, hackathons, and tech communities', 'cpu', 4),
('Social Impact & Volunteering', 'social-impact', 'Community service, volunteering, and social causes', 'heart-handshake', 5),
('Professional Development', 'professional-development', 'Career clubs, entrepreneurship, and skill building', 'briefcase', 6),
('Cultural & Identity', 'cultural-identity', 'Cultural associations, identity-based groups', 'users', 7),
('Gaming & Esports', 'gaming-esports', 'Video games, board games, and competitive gaming', 'gamepad2', 8),
('Other', 'other', 'Miscellaneous clubs and interest groups', 'folder', 99);
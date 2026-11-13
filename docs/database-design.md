# CampusVerse — Database Design

## 1. Overview

CampusVerse uses PostgreSQL as the relational data store. All primary keys are UUIDs (`uuid`), timestamps are stored in UTC (`timestamptz`), and schema changes are managed exclusively through Flyway migrations.

## 2. Entity-Relationship Model (Logical)

### `colleges`
- `id` UUID PK
- `name` VARCHAR(255) NOT NULL
- `slug` VARCHAR(100) UNIQUE NOT NULL
- `email_domain` VARCHAR(100)
- `timezone` VARCHAR(50) DEFAULT 'UTC' NOT NULL
- `status` VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

### `users`
- `id` UUID PK
- `college_id` UUID FK NOT NULL REFERENCES colleges(id)
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password_hash` VARCHAR(255) NOT NULL
- `display_name` VARCHAR(255) NOT NULL
- `avatar_object_key` VARCHAR(500)
- `status` VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL
- `email_verified_at` TIMESTAMPTZ
- `last_login_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

### `platform_role_assignments`
- `id` UUID PK
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `role` VARCHAR(50) NOT NULL (`STUDENT`, `COLLEGE_ADMIN`, `PLATFORM_ADMIN`, `FACULTY_COORDINATOR`)
- `college_id` UUID FK REFERENCES colleges(id)
- `created_at` TIMESTAMPTZ NOT NULL
- UNIQUE (`user_id`, `role`, `college_id`)

### `student_profiles`
- `user_id` UUID PK/FK REFERENCES users(id) ON DELETE CASCADE
- `program` VARCHAR(255)
- `department` VARCHAR(255)
- `academic_year` VARCHAR(50)
- `bio` TEXT
- `profile_visibility` VARCHAR(50) DEFAULT 'PUBLIC' NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

### `club_categories`
- `id` UUID PK
- `name` VARCHAR(100) UNIQUE NOT NULL
- `slug` VARCHAR(100) UNIQUE NOT NULL
- `description` TEXT, `icon` VARCHAR(50), `display_order` INT
- `created_at`, `updated_at` TIMESTAMPTZ NOT NULL

### `clubs`
- `id` UUID PK; `college_id` FK NOT NULL; `category_id` nullable FK
- `name` VARCHAR(255), `slug` VARCHAR(100), `description` TEXT, `short_description` VARCHAR(500)
- `status`: `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`, or `REJECTED`
- `visibility`: `PUBLIC`, `PRIVATE`, or `INVITE_ONLY`; `require_approval` BOOLEAN; `max_members` INT nullable
- `contact_email`, `social_links` JSONB, logo/banner object keys, `founded_at`
- `created_by` nullable FK to users (Flyway V4); `approved_by` nullable FK; `approved_at`; `rejection_reason`
- `created_at`, `updated_at`; UNIQUE (`college_id`, `slug`)

### `club_roles`
- `id` UUID PK; `club_id` FK NOT NULL
- `name`, `display_name`, `description`, `permissions` JSONB
- `display_order`, `is_default`, timestamps; UNIQUE (`club_id`, `name`)
- Approval creates `MEMBER` and `OFFICER`; the requester is assigned `OFFICER` with `MANAGE_MEMBERS` permission.

### `memberships`
- `id` UUID PK; `club_id` FK NOT NULL; `user_id` FK NOT NULL; `role_id` nullable FK
- `status`: `PENDING`, `ACTIVE`, `REJECTED`, `REVOKED`, `LEFT`, or `INVITED`
- `applied_at`, `approved_at`, `approved_by`, `rejection_reason`, invitation fields, `left_at`, timestamps
- UNIQUE (`club_id`, `user_id`); repeated applications after rejection/leave reuse the row.

### `membership_invitations`
- `id` UUID PK; `club_id` FK; `email`; optional `role_id`; `invited_by`; unique token
- `status`, `expires_at`, `accepted_at`, timestamps

### `announcements`
- `id` UUID PK
- `college_id` UUID FK NOT NULL REFERENCES colleges(id)
- `club_id` UUID FK REFERENCES clubs(id) ON DELETE CASCADE
- `author_id` UUID FK NOT NULL REFERENCES users(id)
- `title` VARCHAR(255) NOT NULL
- `body` TEXT NOT NULL
- `priority` VARCHAR(50) DEFAULT 'NORMAL' NOT NULL (`NORMAL`, `IMPORTANT`, `URGENT`)
- `audience_type` VARCHAR(50) NOT NULL
- `status` VARCHAR(50) DEFAULT 'DRAFT' NOT NULL (`DRAFT`, `SCHEDULED`, `PUBLISHED`, `EXPIRED`, `ARCHIVED`)
- `publish_at` TIMESTAMPTZ NOT NULL
- `expires_at` TIMESTAMPTZ
- `requires_acknowledgement` BOOLEAN DEFAULT FALSE NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

### `announcement_receipts`
- `id` UUID PK
- `announcement_id` UUID FK NOT NULL REFERENCES announcements(id) ON DELETE CASCADE
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `read_at` TIMESTAMPTZ
- `acknowledged_at` TIMESTAMPTZ
- UNIQUE (`announcement_id`, `user_id`)

### `events`
- `id` UUID PK
- `college_id` UUID FK NOT NULL REFERENCES colleges(id)
- `primary_club_id` UUID FK NOT NULL REFERENCES clubs(id) ON DELETE CASCADE
- `title` VARCHAR(255) NOT NULL
- `description` TEXT NOT NULL
- `status` VARCHAR(50) DEFAULT 'DRAFT' NOT NULL (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `PUBLISHED`, `REJECTED`, `CANCELLED`, `COMPLETED`, `ARCHIVED`)
- `starts_at` TIMESTAMPTZ NOT NULL
- `ends_at` TIMESTAMPTZ NOT NULL
- `venue` VARCHAR(255)
- `capacity` INTEGER
- `registration_opens_at` TIMESTAMPTZ
- `registration_closes_at` TIMESTAMPTZ
- `created_by` UUID FK NOT NULL REFERENCES users(id)
- `approved_by` UUID FK REFERENCES users(id)
- `approved_at` TIMESTAMPTZ
- `cancelled_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

### `event_registrations`
- `id` UUID PK
- `event_id` UUID FK NOT NULL REFERENCES events(id) ON DELETE CASCADE
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `status` VARCHAR(50) DEFAULT 'REGISTERED' NOT NULL (`REGISTERED`, `WAITLISTED`, `CANCELLED`, `ATTENDED`, `NO_SHOW`)
- `registered_at` TIMESTAMPTZ NOT NULL
- `cancelled_at` TIMESTAMPTZ
- `waitlist_position` INTEGER
- UNIQUE (`event_id`, `user_id`)

### `event_attendance`
- `id` UUID PK
- `event_id` UUID FK NOT NULL REFERENCES events(id) ON DELETE CASCADE
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `checked_in_at` TIMESTAMPTZ NOT NULL
- `checked_in_by` UUID FK REFERENCES users(id)
- `method` VARCHAR(50) DEFAULT 'MANUAL' NOT NULL (`MANUAL`, `QR`)
- UNIQUE (`event_id`, `user_id`)

### `notifications`
- `id` UUID PK
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `type` VARCHAR(100) NOT NULL
- `title` VARCHAR(255) NOT NULL
- `body` TEXT NOT NULL
- `resource_type` VARCHAR(100)
- `resource_id` UUID
- `created_at` TIMESTAMPTZ NOT NULL
- `read_at` TIMESTAMPTZ
- `deduplication_key` VARCHAR(255)

### `audit_logs`
- `id` UUID PK
- `college_id` UUID FK REFERENCES colleges(id)
- `actor_user_id` UUID FK REFERENCES users(id)
- `action` VARCHAR(100) NOT NULL
- `resource_type` VARCHAR(100) NOT NULL
- `resource_id` UUID
- `occurred_at` TIMESTAMPTZ NOT NULL
- `correlation_id` VARCHAR(100)
- `metadata_json` TEXT

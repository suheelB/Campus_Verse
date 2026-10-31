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

### `clubs`
- `id` UUID PK
- `college_id` UUID FK NOT NULL REFERENCES colleges(id)
- `name` VARCHAR(255) NOT NULL
- `slug` VARCHAR(100) NOT NULL
- `description` TEXT NOT NULL
- `category` VARCHAR(100) NOT NULL
- `status` VARCHAR(50) DEFAULT 'DRAFT' NOT NULL (`DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, `SUSPENDED`, `ARCHIVED`)
- `membership_policy` VARCHAR(50) DEFAULT 'OPEN' NOT NULL
- `beginner_friendly` BOOLEAN DEFAULT TRUE NOT NULL
- `meeting_information` TEXT
- `created_by` UUID FK NOT NULL REFERENCES users(id)
- `approved_by` UUID FK REFERENCES users(id)
- `approved_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL
- UNIQUE (`college_id`, `slug`)

### `club_memberships`
- `id` UUID PK
- `club_id` UUID FK NOT NULL REFERENCES clubs(id) ON DELETE CASCADE
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `status` VARCHAR(50) DEFAULT 'PENDING' NOT NULL (`PENDING`, `ACTIVE`, `REJECTED`, `LEFT`, `REMOVED`, `INVITED`, `SUSPENDED`)
- `applied_at` TIMESTAMPTZ NOT NULL
- `decided_at` TIMESTAMPTZ
- `decided_by` UUID FK REFERENCES users(id)
- `joined_at` TIMESTAMPTZ
- `left_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL
- UNIQUE (`club_id`, `user_id`)

### `club_role_assignments`
- `id` UUID PK
- `club_id` UUID FK NOT NULL REFERENCES clubs(id) ON DELETE CASCADE
- `user_id` UUID FK NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `role_key` VARCHAR(50) NOT NULL (`PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `EVENT_COORDINATOR`, `TREASURER`, `MEDIA_LEAD`, `TECHNICAL_LEAD`)
- `assigned_by` UUID FK NOT NULL REFERENCES users(id)
- `assigned_at` TIMESTAMPTZ NOT NULL
- `revoked_at` TIMESTAMPTZ
- UNIQUE (`club_id`, `user_id`, `role_key`)

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

ALTER TABLE clubs ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_clubs_created_by ON clubs(created_by);
CREATE INDEX idx_clubs_college_status_name ON clubs(college_id, status, name);
CREATE INDEX idx_memberships_club_status_applied ON memberships(club_id, status, applied_at);

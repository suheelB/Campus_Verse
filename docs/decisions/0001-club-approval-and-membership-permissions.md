# ADR 0001: Club approval and membership permissions

## Decision
Club requests start in `PENDING_APPROVAL` and are hidden from the student directory until a same-college administrator approves them. Club approval creates the `MEMBER` and `OFFICER` roles and enrolls the requester as an officer. Membership applications are persisted in `memberships`; only an active club officer with the `MANAGE_MEMBERS` permission or a college/platform administrator can decide them or assign an existing role.

Administrator authorization reads `platform_role_assignments` on the server. The college identifier is taken from the authenticated principal, then club/user records are checked against that college. Registration never accepts a requested platform role.

## Consequences
- Club creation requests and membership decisions are reviewable, persisted operations rather than frontend state.
- The database uniqueness constraint on `(club_id, user_id)` prevents duplicate membership records; rejected/left rows can be resubmitted by transitioning that same row.
- A trusted operator must provision college/platform administrators because no public role-grant workflow exists.
- Audit log writes and dedicated admin provisioning UI remain future work.
